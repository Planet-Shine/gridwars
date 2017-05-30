var express = require('express');
var router = express.Router();
var HttpError = require('error').HttpError;
var path = require('path');
var fs = require('fs');
var config = require('config');
var randomGenerator = require('lib/randomGenerator');
var ttl = require('public/lib/ttl');
var lib = require('public/js/lib');
var Warrior = require('models/warrior').Warrior;
var async = require('async');

var EmailVerifyError = require('models/user').EmailVerifyError;
var RegisterError = require('models/user').RegisterError;
var AuthError = require('models/user').AuthError;
var PasswordRecoveryError = require('models/user').PasswordRecoveryError;
var PasswordChangeError = require('models/user').PasswordChangeError;
var WarriorValidError = require('models/warrior').WarriorValidError;
var WarriorDatabaseError = require('models/warrior').WarriorDatabaseError;

var User = require('models/user').User;
var warriorStore = require('models/warrior/warriorStore');
var dbLimits = require('public/lib/dbLimits');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.redirect('/ru/');
});

router.post('/register', function (req, res, next) {

    var username = req.body.username,
        email    = req.body.email,
        password = req.body.password;

    User.register(username, password, email, function (err, user) {

        if (err) {
            if (err instanceof RegisterError) {
                res.statusCode = 500;
                return res.json({
                    'operation' : 'registration',
                    'status'    : 'fail',
                    'error'     : {
                        'message' : err.message,
                        'status'  : err.status
                    }
                });
            } else {
                return next(err);
            }
        }

        if (user) {
            return res.json({
                'operation' : 'registration',
                'status'    : 'success',
                'username'  : user.username
            });
        } else {
            return next(new HttpError(500, "Ошибка во время регистрации пользователь не создан."));
        }

    });

});

router.post('/login', function (req, res, next) {
    var username = req.body.username,
        password = req.body.password;

    User.authorize(username, password, function (err, user) {

        if (err) {
            if (err instanceof AuthError) {
                return next(new HttpError(403, err.message));
            } else {
                return next(err);
            }
        }
        req.session.user = user;
        res.send({});
    });

});

router.post("/logout", function (req, res, next) {
    var reqInfo = req.reqInfo;
    var sid = req.session.id;
    var io = req.app.get('io');

    req.session.destroy(function (err) {
        var referer = req.headers.referer,
            language = referer.split('/')[3] || "ru";
        req.app.emit("session:reload", sid);
        if (err) next(err);
        res.redirect('/' + language + '/');
    });

});

router.post("/password-recovery", function (req, res, next) {
    var recoveryHash = req.body['recovery-hash'],
        password     = req.body.password;

    User.passwordRecover(recoveryHash, password, function (err, user) {
        if (err) {
            if (err instanceof PasswordRecoveryError) {
                return res.json({
                    'status' : 'fail',
                    'error'  : {
                        'status'  : err.status,
                        'message' : err.message
                    }
                });
            } else {
                return next(err);
            }
        }
        return res.json({
            'status' : 'success'
        });
    });

});

router.post("/password-recovery-order", function (req, res, next) {
    var email = req.body.email;

    User.sendPasswordRecovery(email, function (err, response) {
        if (err) {
            if (err instanceof PasswordRecoveryError) {
                return res.json({
                    'operation' : 'password-recovery-order',
                    'status'    : 'fail',
                    'error'     : {
                        'status'  : err.status,
                        'message' : err.message
                    }
                });
            } else {
                return next(err);
            }
        }
        return res.json({
            'operation' : 'password-recovery-order',
            'status'    : 'success'
        });
    });

});

router.post('/password-change', function (req, res, next) {
    var currentPassword = req.body['current-password'],
        password        = req.body['password'],
        username        = req.body['username'];

    User.changePassword(username, currentPassword, password, function (err) {
        if (err) {
            if (err instanceof PasswordChangeError) {
                return res.json({
                    'operation' : 'password-change',
                    'status'    : 'fail',
                    'error'     : {
                        'status'  : err.status,
                        'message' : err.message
                    }
                });
            } else {
                return next(err);
            }
        }
        return res.json({
            'operation' : 'password-change',
            'status'    : 'success'
        });
    });
});

router.post('/add-warrior/:slot', function (req, res, next) {
    var slot = parseInt(req.params.slot, 10),
        maxFileSize;

    if (isNaN(slot) || slot < 0 || slot > dbLimits.userWarriorMaxCount - 1) {
        return res.end(JSON.stringify({
            'status' : 'fail',
            'error'  : {
                'reason' : 'Слот бойца не валиден.',
                'status' : 'slot-is-not-valid'
            }
        }));
    }

    maxFileSize = Math.ceil(req.headers['content-length'] / 1024);
    if (maxFileSize > config.get('maxWarriorSize')) {
        return res.end(JSON.stringify({
            'status' : 'fail',
            'error'  : {
                'reason' : 'Файл не смог быть записан во временном хранилище, т.к. был слишком большой.',
                'status' : 'file-save-fail-too-long'
            }
        }));
    }

    req.pipe(req.busboy);
    req.on('error', function (err) {
        next(err);
    });

    req.busboy.on('file', function (fieldname, file, filename) {
        var warrior = warriorStore.saveWarriorToStore(file);

        // Проверка покаждому этапу прокачки, чтобы не привысил лимит веса.
        warrior.stream.on('close', closeHandler);

        file.on('data', function (err, data) {
            if (err && err instanceof Error) return closeHandler(err);
            var bytesWritten = file._readableState.pipes.bytesWritten,
                written = Math.ceil(bytesWritten / 1024);
            if (written > config.get('maxWarriorSize')) {
                // Заканчиваем текущие процессы, отвязываемся.
                warrior.stream.removeAllListeners('close');
                file.unpipe(warrior.stream);
                req.unpipe(req.busboy);

                warrior.stream.destroy();
                req.busboy.end();
                res.header('Connection', 'close'); // with the Connection: close header set, node will automatically close the socket...
                res.send(413, 'Upload too large');
                return res.end();
            }
        });

        function closeHandler (err) {
            if (err) {
                return res.end(JSON.stringify({
                    'status' : 'fail',
                    'error'  : {
                        'reason' : 'Файл не смог быть записан во временном хранилище.',
                        'status' : 'file-save-fail'
                    }
                }));
            }
            Warrior.isWarriorValid(warrior.filename, function (err, validateResults) {
                var error,
                    errors = [];
                if (err) {
                    if (err instanceof Array) {
                        err.forEach(function (err) {
                            errors.push({
                                'status'  : err.status,
                                'message' : err.message
                            });
                        });
                    }
                    error = (errors.length ? errors : {
                        'status'  : err.status,
                        'message' : err.message
                    });
                    return res.end(JSON.stringify({
                        'status' : 'fail',
                        'error'  : error
                    }));
                }
                async.series([
                    function (callback) {
                        // Боец валиден. Создаем бойца в БД.
                        Warrior.addWarrior(validateResults.name, req.user, slot, callback);
                    },
                    function (callback) {
                        // Боец валиден. Создаем бойца в песочнице в публичном хранилище.
                        warriorStore.publishSandWarrior(warrior.filename, validateResults.name, callback);
                    }
                ], function (err, result) {
                    var newWarrior;
                    if (err) {
                        return res.end(JSON.stringify({
                            'status' : 'fail',
                            'error'  : {
                                'status'  : err.status,
                                'message' : err.message
                            }
                        }));
                    } else {
                        newWarrior = result[0];
                        res.end(JSON.stringify({
                            'warrior' : {
                                name            : newWarrior.name,
                                createTimeStamp : newWarrior.createTimeStamp
                            },
                            'status'  : 'success'
                        }));
                    }
                });

            });
        }



    });

});



module.exports = router;
