var express = require('express');
var router = express.Router();
var Warrior = require('models/warrior').Warrior;
var log = require('lib/log')(module);
var battleOptions = require('public/lib/battleOptions');
var _ = require('public/vendor/bower_components/underscore/underscore');

module.exports = function (simpleHandler) {

    router.get('/:options', function (req, res, next) {
        var options        = req.params.options,
            reqInfo        = req.reqInfo,
            partialOptions = reqInfo.partialOptions || {},
            isPartial,
            template,
            size,
            warriors,
            sortedWariors,
            uniqWarriors;
        options = options.split(battleOptions.battleOptionsDelimiter);
        size = options[0];
        warriors = options.slice(1, options.length);
        sortedWariors                    = warriors.concat([]).sort();
        partialOptions['fieldSize']      = size;
        partialOptions['isValidOptions'] = battleOptions.fieldSizes.indexOf(size) !== -1
            && sortedWariors.join("") === warriors.join("")
            && sortedWariors.length <= battleOptions.maximumWarriorCount; // Проверяем, что размер один из доступных.
        isPartial                        = reqInfo.isPartial;
        if (!isPartial) {
            template = './ru/battle-field';
        } else {
            template = reqInfo.template;
        }
        uniqWarriors = _.uniq(sortedWariors);
        Warrior.getWarriorsWithUserName(uniqWarriors, function (error, fullWarriors) {
            if (error) return next(error);

            function rebuildWarriors () {
                var result = [];
                warriors.forEach(function (item) {
                    result.push(_.findWhere(fullWarriors, {
                        warriorName : item
                    }));
                });
                return result;
            }
            fullWarriors                   = rebuildWarriors();
            partialOptions['warriors']     = JSON.stringify(fullWarriors);
            partialOptions['warriorNames'] = warriors;
            // Переопределяем откртость меню, чтобы свернуто было, чтобы удобно было смотреть бой.
            res.locals.isMenuOpened = false;
            res.locals.isCommentPage = true;

            return res.render(template, {
                page           : './battle-field',
                path           : reqInfo.path,
                partialOptions : partialOptions
            });
        });

    });

    router.get('/', function (req, res, next) {
        // Запрашиваем имена воинов.
        Warrior.getAllWarriors(null, function (err, result) {
            var reqInfo        = req.reqInfo,
                partialOptions = reqInfo.partialOptions || {};
            partialOptions.warriors = result;
            return res.render(reqInfo.template, {
                page           : reqInfo.page,
                path           : reqInfo.path,
                partialOptions : partialOptions
            });
        });
    });

    return router;
}


