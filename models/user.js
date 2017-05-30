var crypto = require('crypto');
var async = require('async');
var util = require('util');
var config = require('config');
var validateRegs = require('public/lib/validateRegulars');
var path = require('path');
var mailRobot = require('lib/mailRobot');
var extend = require('extend');
var ttl = require('public/lib/ttl');
var lib = require('public/js/lib');

var mongoose = require('lib/mongoose'),
    Schema   = mongoose.Schema;


var schema = new Schema({
    banned : {
        type : Boolean,
        default : false
    },
    _emailVerifyHash : {
        type : String,
        default : ''
    },
    emailVerified : {
        type : Boolean,
        default : false
    },
    email : {
        type : String,
        unique : true, // background : true // Создание индекса ассинхронное. Ожидать ensureIndexes(callback).
        required : true
    },
    username : {
        type : String,
        unique : true, // background : true // Создание индекса ассинхронное. Ожидать ensureIndexes(callback).
        required : true
    },
    hashedPassword : {
        type : String,
        required : true
    },
    _passwordRecoveryHash : {
        default : '',
        type : String
    },
    _passwordRecoveryHashTimestamp : {
        type : Number
    },
    salt : {
        type : String,
        required : true
    },
    created : {
        type : Date,
        default : Date.now
    }
});

schema.methods.encrypt = function (password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('emailVerifyHash')
    .set(function (emailVerifyHash) {
        this._emailVerifyHash = emailVerifyHash;
    })
    .get(function () {
        if (!this._emailVerifyHash) {
            this._emailVerifyHash = this.encrypt(config.get("emailVerifyHashSalt"));
        }
        return this._emailVerifyHash;
    });

schema.virtual('passwordRecoveryHash')
    .set(function (passwordRecoveryHash) {
        this._passwordRecoveryHash = passwordRecoveryHash;
    })
    .get(function () {
        if (!this._passwordRecoveryHash) {
            this._passwordRecoveryHashTimestamp = (new Date()).getTime();
            this._passwordRecoveryHash          = this.encrypt(config.get("passwordRecoveryHashSalt") + (Math.random() + ''));
        }
        return this._passwordRecoveryHash;
    });

schema.virtual('password')
    .set(function (password) {
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encrypt(password);
    })
    .get(function () {
        return this._plainPassword;
    });


schema.methods.checkPassword = function (password) {
    return this.encrypt(password) === this.hashedPassword;
}

schema.statics.sendPasswordRecovery = function (email, callback) {
    var User = this;
    User.findOne({
        email : email
    }, function (err, user) {
        if (err) callback(err);
        if (user) {
            User.sendPasswordRecoveryLetter(user, callback);
        } else {
            callback(new PasswordRecoveryError('Пользователь с таким e-mail не найден', 'no-such-user'));
        }
    });
}

schema.statics.sendPasswordRecoveryLetter = function (user, callback) {
    var passwordRecoveryHash,
        email                = user.email,
        username             = user.username;
    // Обнуляем, чтобы на следующем вызове get создать новый.
    user.set('passwordRecoveryHash', '');
    passwordRecoveryHash = user.get('passwordRecoveryHash'); // Получаем новый и сохраняем пользователя в БД.
    user.save(function (err) {
        if (err) return callback(err);

        mailRobot.extractMailOptions('password-recovery', {
            'email'     : config.get("broadcastEmail:email"),
            'username'  : username,
            'sitename'  : config.get('sitename'),
            'targetUrl' : config.get("host") + config.get("passwordRecoveryPath") + passwordRecoveryHash
        }, function (err, mailOptions) {
            if (err) {
                callback(new PasswordRecoveryError('Ошибка во время создания письма email.', 'mail-creation-fail'));
            } else {
                mailOptions = extend({}, mailOptions, {
                    to : email
                });
                mailRobot.send(mailOptions, callback);
            }
        });

    });

}

schema.statics.getUsersByIds = function (userIds, callback) {
    var User = this;
    User.find({'_id' : { '$in' : userIds}}, callback);
}


schema.statics.isValidEmail = function (email) {
    return validateRegs['email'].test(email);
}

schema.statics.isValidPassword = function (password) {
    return validateRegs['password'].test(password);
}

schema.statics.isValidUsername = function (username) {
    return validateRegs['username'].test(username);
}

schema.statics.authorize = function (username, password, callback) {
    var User = this;
    async.waterfall([
        function (callback) {
            User.findOne({username: username}, callback);
        },
        function (user, callback) {
            if (user) {
                if  (user.emailVerified) { // Если email подтвержден.
                    if (user.banned) { // Если не забанен.
                        callback(new AuthError("В авторизации отказано."));
                    } else {
                        if (user.checkPassword(password)) {
                            callback(null, user);
                        } else {
                            callback(new AuthError("В авторизации отказано."));
                        }
                    }
                } else {
                    callback(new AuthError("В авторизации отказано."));
                }
            } else {
                callback(new AuthError("В авторизации отказано."));
            }
        }
    ], callback);
}


schema.statics.verifyEmail = function (emailHash, callback) {
    var User = this;
    async.waterfall([
        function (callback) {
            if (emailHash !== '') {
                User.findOne({emailVerifyHash : emailHash}, callback);
            } else {
                return callback(new EmailVerifyError("Проверка email не удачна."));
            }
        },
        function (user, callback) {
            if (user) {
                if (!user.emailVerified) {
                    user.emailVerified = true;
                    return callback(null, user);
                } else {
                    return callback(new EmailVerifyError("Этот email уже подтвержден."));
                }
            } else {
                return callback(new EmailVerifyError("В авторизации отказано."));
            }
        }
    ], callback);
}

schema.statics.changePassword = function (username, currentPassword, password, callback) {
    var User = this;
    async.waterfall([
        function (callback) {
            if (!User.isValidPassword(password)) {
                return callback(new PasswordChangeError("Новый пароль не валиден.", "not-valid"));
            }
            User.findOne({username : username}, callback);
        },
        function (user, callback) {
            if (user.checkPassword(currentPassword)) {
                user.set('password', password);
                user.save(callback);
            } else {
                callback(new PasswordChangeError("Пароль не верен.", "wrong-password"));
            }
        }
    ], callback);
}

schema.statics.passwordRecover = function (passwordRecoveryHash, password, callback) {
    var User = this;
    passwordRecoveryHash = passwordRecoveryHash || '';
    async.waterfall([
        function (callback) {
            if (!User.isValidPassword(password)) {
                return callback(new PasswordChangeError("Новый пароль не валиден.", "not-valid")); // Сделать вывод на клиенте.
            }
            if (passwordRecoveryHash !== '') {
                User.findOne({_passwordRecoveryHash : passwordRecoveryHash}, callback);
            } else {
                return callback(new PasswordRecoveryError("Востановление пароля не удачно. Хэш восстановления отсутсвует.", "no-recover-id"));
            }
        },
        function (user, callback) {
            if (user &&
                    (user._passwordRecoveryHashTimestamp + lib.getMilliseconds({
                        'hour' : ttl.passwordRecoveryHour
                    })) >= (new Date()).getTime()) {
                user.set('password', password);
                user.set('passwordRecoveryHash', '');
                user.save(callback);
            } else {
                return callback(new PasswordRecoveryError("Не найдено запрашиваемого пользователя.", "recover-id-is-outdated"));
            }
        }
    ], callback);
}

schema.statics.sendVerifyToEmail = function (user, callback) {
    var emailVerifyHash = user.get('emailVerifyHash');
    user.save(function (err) { // После извлечения хэша email мы должны сохранить новые данные в пользователе.
        if (err) return callback(err);
        mailRobot.extractMailOptions('email-verification', {
            'email'     : config.get("broadcastEmail:email"),
            'username'  : user.username,
            'sitename'  : config.get('sitename'),
            'targetUrl' : config.get("host") + config.get("emailVerifyPath") + emailVerifyHash
        }, function (err, mailOptions) {
            if (err) {
                callback(new RegisterError('Ошибка во время создания письма email.', 'mail-creation-fail'));
            } else {
                mailOptions = extend({}, mailOptions, {
                    to : user.email
                });
                mailRobot.send(mailOptions, callback);
            }
        });
    });

}

schema.statics.register = function (username, password, email, callback) {
    var User = this;
    async.waterfall([
        function (callback) {
            if (!User.isValidUsername(username)) {
                return callback(new RegisterError("Имя пользователя не валидно.", 'username-not-valid'));
            }
            if (!User.isValidPassword(password)) {
                return callback(new RegisterError("Пароль пользователя не валиден.", 'password-not-valid'));
            }
            if (!User.isValidEmail(email)) {
                return callback(new RegisterError("Email пользователя не валиден.", 'email-not-valid'));
            }
            User.findOne({username: username}, callback);
        },
        function (user, callback) {
            if (user) {
                return callback(new RegisterError("Пользователь с таким именем уже есть.", 'username-already-exists'));
            }
            User.findOne({email: email}, callback);
        },
        function (user, callback) {
            if (user) {
                return callback(new RegisterError("Пользователь с таким e-mail уже есть.", 'email-already-exists'));
            }
            var user = new User({
                email    : email,
                username : username,
                password : password
            });
            user.save(function (err) {
                if (err) return callback(err);
                callback(null, user);
            });
        },
        function (user, callback) {
            // Отправка письма на ящик пользователя.
            User.sendVerifyToEmail(user, function (err, response) {
                if (err) {
                    User.remove({ _id : user._id }, function (err1) { // Удаляем пользователя из базы, т.к. регистрация прошла неудачно.
                        if (err1) return callback(new RegisterError("Учетная запись не смогла быть удалена во время ошибки сознания.", 'remove-record-fail'));
                        if (err instanceof RegisterError) {
                            callback(RegisterError);
                        } else {
                            callback(new RegisterError("Ошибка во время отправки письма с подтверждением.", 'mail-send-fail'));
                        }
                    });
                } else { // Удача.
                    callback(null, user);
                }
            });
        }
    ], callback);
}

exports.User = mongoose.model('User', schema);

function AuthError(message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message || "Error";
}

util.inherits(AuthError, Error);

AuthError.prototype.name = "HttpError";

exports.AuthError = AuthError;

function RegisterError(message, status) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message || "Error";
    this.status = status || "none";
}

util.inherits(RegisterError, Error);

RegisterError.prototype.name = "RegisterError";

exports.RegisterError = RegisterError;

function EmailVerifyError(message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message || "Error";
}

util.inherits(EmailVerifyError, Error);

EmailVerifyError.prototype.name = "EmailVerifyError";

exports.EmailVerifyError = EmailVerifyError;


function PasswordRecoveryError(message, status) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message || "Error";
    this.status = status || "none";
}

util.inherits(PasswordRecoveryError, Error);

PasswordRecoveryError.prototype.name = "PasswordRecoveryError";

exports.PasswordRecoveryError = PasswordRecoveryError;


function PasswordChangeError(message, status) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message || "Error";
    this.status = status || "none";
}

util.inherits(PasswordChangeError, Error);

PasswordChangeError.prototype.name = "PasswordChangeError";

exports.PasswordChangeError = PasswordChangeError;


