var User = require('models/user').User;
var dbLimits = require('public/lib/dbLimits');
var warriorPath = '/warrior/';
var util = require('util');
var async = require('async');
var fs = require('fs');
var config = require('config');
var warriorStore = require('models/warrior/warriorStore');
var validateRegs = require('public/lib/validateRegulars');
var lib = require('lib/lib');
var ObjectID = require('mongodb').ObjectID;
var rootDirName = config.get('rootDirName');
var path = require('path');
var child_process = require('child_process');
var process = require('process');
var _ = require('public/vendor/bower_components/underscore/underscore');

var mongoose = require('lib/mongoose'),
    Schema   = mongoose.Schema;

var schema = new Schema({
    createTimeStamp : {
        type     : Number,
        required : true,
        default   : 0
    },
    slot : {
        type     : Number,
        required : true,
        default   : 0
    },
    userId : {
        type : Schema.ObjectId,
        required : true
    },
    name : {
        type : String,
        unique : true,
        required : true
    },
    winCount : { // Подсчитывать количество уникальных побед с другими бойцами, а не просто количество, которое можно накрутить.
        type : Number,
        default : 0
    },
    popularity : {
        type : Number,
        default : 0
    }
});


schema.statics.getWarriorsWithUserName = function (names, callback) {
    var User = require('models/user').User,
        Warrior = this;

    function merge (warriors, users) {
        var result = [];
        warriors.forEach(function (warriorItem) {
            var user;
            user = _.find(users, function (item) {
                return item._id.equals(warriorItem.userId);
            });
            result.push({
                warriorName            : warriorItem.name,
                userName               : user.username,
                warriorCreateTimeStamp : warriorItem.createTimeStamp
            });
        });
        callback(null, result);
    }

    Warrior.getWarriorsByNames(names, function (error, warriors) {
        if (error) return callback(error);
        var userIds = [];
        warriors.forEach(function (item) {
            userIds.push(item.userId);
        });
        User.getUsersByIds(userIds, function (error, users) {
            if (error) return callback(error);
            merge(warriors, users);
        });
    });
}

schema.methods.getJSUrl = function () {
    return warriorPath + this.name + '.js';
}

schema.statics.getAllWarriors = function (user, callback) {
    var Warrior = this;
    if (user) {
        Warrior.find({'userId' : user._id}, callback);
    } else {
        Warrior.find({}, callback);
    }
}

schema.statics.getWarriorsByNames = function (names, callback) {
    var Warrior = this;
    Warrior.find({'name' : { '$in' : names }}, callback);
}

schema.statics.addWarrior = function (warriorName, user, slot, callback) {
    var Warrior = this,
        pathToWarrior;

    Warrior.findOne({
        name : warriorName
    }, function (err, result) {
        if (result && !(result.userId.equals(user._id) && result.slot === slot)) {
            callback(new WarriorDatabaseError("Боец с таким именем уже существует.", "warrior-name-already-in-use"));
        } else {
            Warrior.findOne({ // Ищем сперва старого война с таким идентификатором.
                'userId' : user._id,
                'slot'   : slot
            }, function (err, warrior) {
                if (err) return callback(err);
                var newWarrior;
                if (warrior) {
                    if (warrior.name === warriorName) {
                        passProcess();
                        finishProcess();
                    } else  if (warrior) {
                        pathToWarrior = path.join(rootDirName, "/public/warrior/", warrior.name + ".js");
                        // Проверять есть ли такой файл перед удалением.
                        fs.exists(pathToWarrior, function (exists) {
                            if (exists) {
                                fs.unlink(pathToWarrior, function (err) {
                                    if (err) return callback(new WarriorDatabaseError("Не удалось сохранить бойца в БД.", "warrior-save-failed"));
                                    passProcess();
                                    finishProcess();
                                });
                            } else {
                                passProcess();
                                finishProcess();
                            }
                        });
                    }
                } else {
                    newWarrior = new Warrior({
                        'name'            : warriorName,
                        'userId'          : new ObjectID(user._id),
                        'slot'            : slot,
                        'createTimeStamp' : (new Date()).getTime()
                    });
                    finishProcess();
                }
                function passProcess () {
                    newWarrior                  = warrior;
                    newWarrior.name             = warriorName;
                    newWarrior.winCount         = 0;
                    newWarrior.popularity       = 0;
                    newWarrior.createTimeStamp  = (new Date()).getTime();
                }
                function finishProcess () {
                    newWarrior.save(function (err, result) {
                        if (err) return callback(new WarriorDatabaseError("Не удалось сохранить бойца в БД.", "warrior-save-failed"));
                        callback(null, result);
                    });
                }
            });
        }
    });

}

schema.statics.isNameValid = function (warriorName) {
    return validateRegs.warrior_name.test(warriorName);
}

schema.statics.isWarriorValid = function (filename, callback) {
    var scriptInitializeTimeout = 1500,
        scriptInitializeDescriptor,
        Warrior                 = this,
        warriorName             = null;

    async.waterfall([
        function (callback) {
            warriorStore.getTempWarriorProgramText(filename, callback);
        },
        function (programText, callback) { // Проверяем наличие вызовов без контекста. Через регулярки.
            warriorValidator.isValidText(programText, callback);
        },
        function (callback) {
            warriorStore.generateValidationSandboxWarrior(filename, callback);
        },
        function (sandFile, callback) { // Проверяем что модуль подключился.
            var warriorPath = lib.toRequirePath(sandFile.projectPath),
                isFinished = false,
                warrior,
                name,
                warriorModule;

            warriorModule = child_process.spawn("node", [warriorPath]);
            scriptInitializeDescriptor = setTimeout(function () {
                failFinish()
            }, scriptInitializeTimeout);
            warriorModule.stdout.on('data', function(data) {
                var result = JSON.parse(data);
                clearTimeout(scriptInitializeDescriptor);
                if (result.isWarriorUndefined) {
                    callback(new WarriorValidError('Боец не был передан в функцию register.', 'no-register-for-warrior'));
                    return failFinish();
                }
                if (!result.warrior) {
                    callback(new WarriorValidError('Боец не является функцией.', 'warrior-is-not-function'));
                    return failFinish();
                }
                if (!result.isNameSuccess) {
                    callback(new WarriorValidError('Имя бойца не является строкой.', 'warrior-has-not-name'));
                    return failFinish();
                }
                if (!Warrior.isNameValid(result.name)) {
                    callback(new WarriorValidError('Имя бойца не является строкой.', 'warrior-name-is-not-valid'));
                    return failFinish();
                }
                callback(null, result.name, warriorPath);
                successFinish();
            });
            warriorModule.stderr.on('data', function(data) {
                failFinish();
            });
            warriorModule.on('close', function(code) {
                failFinish();
            });
            function killProcess() {
                var signal = 'SIGKILL';
                try {
                    process.kill(warriorModule.pid, signal);
                } catch (err) {}
            }
            function successFinish () {
                if (!isFinished) {
                    isFinished = true;
                    clearTimeout(scriptInitializeDescriptor);
                }
            }
            function failFinish () {
                if (!isFinished) {
                    isFinished = true;
                    clearTimeout(scriptInitializeDescriptor);
                    callback(new WarriorValidError('Программа бойца не работает.', 'not-working-program-text'));
                    killProcess();
                }
            }
        },
        function (name, warriorPath, callback) { // Проверяем 100 вызовов shot. На время и на валидность ответа.
            warriorValidator.callShootTest(name, warriorPath, callback);
        }
    ], function (err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, results);
        }
    });

}

exports.Warrior = mongoose.model('Warrior', schema);

function WarriorValidError(message, status) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, WarriorValidError);

    this.message = message || "Error";
    this.status = status || "none";
}

util.inherits(WarriorValidError, Error);

WarriorValidError.prototype.name = "WarriorValidError";

exports.WarriorValidError = WarriorValidError;


function WarriorTextValidError(message, status) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, WarriorValidError);

    this.message = message || "Error";
    this.status = status || "none";
}

util.inherits(WarriorTextValidError, Error);

WarriorTextValidError.prototype.name = "WarriorTextValidError";

exports.WarriorTextValidError = WarriorTextValidError;


function WarriorDatabaseError(message, status) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, WarriorDatabaseError);

    this.message = message || "Error";
    this.status = status || "none";
}

util.inherits(WarriorDatabaseError, Error);

WarriorDatabaseError.prototype.name = "WarriorDatabaseError";

exports.WarriorDatabaseError = WarriorDatabaseError;

var warriorValidator = require('models/warrior/warriorValidator')(exports);