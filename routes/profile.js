
var dbLimits = require('public/lib/dbLimits');
var Warrior = require('models/warrior').Warrior;
var config = require('config');

module.exports = function (simpleHandler) {
    return function (req, res, next) {
        var warriors = [],
            user     = req.user;
        if (user) {
            Warrior.find({
                'userId' : user._id
            }, function (error, results) {
                if (error) return next(error);
                results.forEach(function (warrior) {
                    warriors[warrior.slot] = {
                        name            : warrior.name,
                        createTimeStamp : warrior.createTimeStamp
                    };
                });
                render();
            });
        } else {
            render();
        }
        function render () {
            req.reqInfo.partialOptions = {
                'warriors'       : warriors,
                'maxWarriorSize' : config.get('maxWarriorSize')
            };
            simpleHandler(req, res, next);
        }
    }
}