/* jslint todo: true, sub : true*/
/* global __global */

var __global__ = {};
__global.warriors = [];
(function () {
    var names;
    function getWarriorUrl(name) {
        return '/warrior/' + name + '.js'
    }
    function insertWarriorScript (url) {
        document.write("<script src='" + url + "' type='text/javascript'></script>");
    }
    function loadWarriors () {
        var currentLocation = String(location),
            locationItems   = currentLocation.split('/'),
            lastItem;
        lastItem = locationItems[locationItems.length - 1];

        // !! Хардкод.
        names = [
            'chaos',
            'chaos',
            'peasant',
            'maddyson',
            'chaos',
            'peasant'/*,
            'maddyson',
            'chaos',
            'peasant',
            'maddyson',
            'chaos',
            'peasant'*/
        ];
        // !!! Хардкод.

        _.each(names, function (name) {
            var url  = getWarriorUrl(name);
            insertWarriorScript(url);
        });
        __global.warriorNames = names;
    }
    __global__.register = function (warrior) {
        var name = warrior.name;
        if (names.indexOf(name) !== -1) {
            __global.warriors.push(warrior);
        }
    }
    loadWarriors();
}());