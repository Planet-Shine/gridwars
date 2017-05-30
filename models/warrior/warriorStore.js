/*

    Создает скрипты бойцов во временном хранилище.
    Генерирует бойцов для валидации в песочнице во временном хранилище.
    Генерирует бойцов в песочнице для их запуска на клиенте.
    Следит за очисткой хранилища. Раз в пол часа. Очищает по ttl лишнее.

*/
var Options    = require('obfuscator').Options;
var obfuscator = require('obfuscator').obfuscator;

var async                 = require('async');
var lib                   = require('public/js/lib');
var ttl                   = require('public/lib/ttl');
var fs                    = require('fs');
var config                = require('config');
var path                  = require('path');
var warriorTtl            = lib.getMilliseconds({
    'hour' : ttl.warriorStoreHour
});
var randomGenerator       = require('lib/randomGenerator');
var rootDirName           = config.get('rootDirName');
var projectStorePath      = '/store/warrior/';
var projectPublishPath    = '/public/warrior/';
var publishSandPath       = '/models/warrior/warrior_sandbox/';
var projectValidationPath = '/models/warrior/validation_template/';

var warriorStore = {
    defaultEncoding : 'utf-8',
    storePath : path.join(rootDirName, projectStorePath),
    defaultExtention : '.js',
    clearTimeout : warriorTtl,
    publishPath : path.join(rootDirName, projectPublishPath),
    publishSandPath : path.join(rootDirName, publishSandPath),
    validationPath : path.join(rootDirName, projectValidationPath),
    getProjectPath : function (filename) {
        return path.join(projectStorePath, filename);
    },
    getSandPublishHeaderReadable : function () {
        var fpath  = path.join(this.publishSandPath, '/header.js'),
            stream = fs.createReadStream(fpath);
        return stream;
    },
    getSandPublishFooterReadable : function () {
        var fpath  = path.join(this.publishSandPath, '/footer.js'),
            stream = fs.createReadStream(fpath);
        return stream;
    },
    getValidationHeaderReadable : function () {
        var fpath  = path.join(this.validationPath, '/header.js'),
            stream = fs.createReadStream(fpath);
        return stream;
    },
    getValidationFooterReadable : function () {
        var fpath  = path.join(this.validationPath, '/footer.js'),
            stream = fs.createReadStream(fpath);
        return stream;
    },
    getPublishPath : function (filename) {
        var result;
        filename = filename || this.getNewTempWarriorName();
        result = path.join(this.publishPath, filename);
        return result;
    },
    getNowTS : function () {
        return (new Date()).getTime();
    },
    getTempWarriorName : function () {
        var fileBegin = randomGenerator.getFileName(),
            endTime   = this.getNowTS() + warriorTtl,
            fileName  = fileBegin + '.' + String(endTime) + this.defaultExtention;
        return fileName;
    },
    getTempWarriorPath : function (filename) {
        var result;
        filename = filename || this.getNewTempWarriorName();
        result = path.join(this.storePath, filename);
        return result;
    },
    getTempWarriorReadable : function (filename) {
        var fpath  = this.getTempWarriorPath(filename),
            stream = fs.createReadStream(fpath);
        return stream;
    },
    saveWarriorToStore : function (file) {
        var filename  = this.getTempWarriorName(),
            fpath     = this.getTempWarriorPath(filename),
            storeFile = fs.createWriteStream(fpath);
        file.pipe(storeFile);
        return {
            'stream'   : storeFile,
            'filename' : filename,
            'path'     : fpath
        };
    },
    getTempWarriorProgramText : function (filename, callback) {
        var fpath = this.getTempWarriorPath(filename);
        fs.readFile(fpath, this.defaultEncoding, callback);
    },
    generateValidationSandboxWarrior : function (filename, callback) {
        var self          = this,
            readable      = this.getTempWarriorReadable(filename),
            storeFilename = this.getTempWarriorName(),
            storePath     = this.getTempWarriorPath(storeFilename),
            storeFile     = fs.createWriteStream(storePath),
            header        = this.getValidationHeaderReadable(),
            footer        = this.getValidationFooterReadable();

        async.waterfall([
            function (callback) { // Заголовок.
                header.pipe(storeFile, {end : false});
                header.on('error', function (err) {
                    callback(err);
                    storeFile.removeAllListeners('error');
                });
                header.on('end', callback);
            },
            function (callback) { // Содержимое.
                readable.pipe(storeFile, {end : false});
                readable.on('error', function (err) {
                    callback(err);
                    storeFile.removeAllListeners('error');
                });
                readable.on('end', callback);
            },
            function (callback) { // Футер.
                footer.pipe(storeFile);
                footer.on('error', function (err) {
                    callback(err);
                    storeFile.removeAllListeners('error');
                });
                storeFile.on('close', callback);
            }
        ], function (err) {
            if (err) callback(err);
            callback(null, {
                'filename'    : storeFilename,
                'stream'      : storeFile,
                'path'        : storePath,
                'projectPath' : self.getProjectPath(storeFilename)
            });
        });
    },
    publishSandWarrior : function (filename, warriorName, callback) {
        var self            = this,
            readable        = this.getTempWarriorReadable(filename),
            publishFilename = warriorName + this.defaultExtention,
            publishPath     = this.getPublishPath(publishFilename),
            publishFile     = fs.createWriteStream(publishPath),
            header          = this.getSandPublishHeaderReadable(),
            footer          = this.getSandPublishFooterReadable();

        async.waterfall([
            function (callback) { // Заголовок.
                header.pipe(publishFile, {end : false});
                header.on('error', function (err) {
                    callback(err);
                    publishFile.removeAllListeners('error');
                });
                header.on('end', callback);
            },
            function (callback) { // Содержимое.
                readable.pipe(publishFile, {end : false});
                readable.on('error', function (err) {
                    callback(err);
                    publishFile.removeAllListeners('error');
                });
                readable.on('end', callback);
            },
            function (callback) { // Футер.
                footer.pipe(publishFile);
                footer.on('error', function (err) {
                    callback(err);
                    publishFile.removeAllListeners('error');
                });
                publishFile.on('close', callback);
            }
        ], function (err) {
            if (err) callback(err);
            callback(null, {
                'filename'    : publishFilename,
                'stream'      : publishFile,
                'path'        : publishPath,
                'projectPath' : self.getProjectPath(publishFilename)
            });
        });
    },
    clearStoreByTtl : function (callback) {
        var self = this;
        fs.readdir(this.storePath, function(err, items) {
            if (err) callback(err);
            var now = self.getNowTS();
            items.forEach(function (item) {
                var timestamp = item.split('.')[1];
                timestamp = parseInt(timestamp, 10);
                function remove () {
                    // Когда все нормально, то удаляем.
                    fs.unlink(self.getTempWarriorPath(item), function () {
                        if (err) callback(err);
                    });
                }
                if (!isNaN(timestamp)) {
                    if (timestamp < now) {
                        remove();
                    }
                } else {
                    remove();
                }
            });
        });
    },
    $init : function () {
        // Сделать, чтобы не блочило завершения процесса.
        var timer = setInterval(this.clearStoreByTtl.bind(this), this.clearTimeout);
        timer.unref(); // Чтобы не блочил завершения основного процесса.
    }
};

warriorStore.$init();

module.exports = warriorStore;