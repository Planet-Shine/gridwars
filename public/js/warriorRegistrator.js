/* jslint todo: true, sub : true*/
/* global __global */

var __global__ = {};
__global.warriors = [];
(function () {
    var names,
        uniqNames;

    function shakeArraysSynchronously (arr1, arr2, arr3) {
        var index,
            index1,
            index2,
            length = arr1.length;

        function replaceItems (arr, index1, index2) {
            var temp = arr[index1];
            arr[index1] = arr[index2];
            arr[index2] = temp;
        }

        for (index = 0; index < length; index += 1) {
            index1       = parseInt(Math.random() * length, 10);
            index2       = parseInt(Math.random() * length, 10);
            replaceItems(arr1, index1, index2);
            replaceItems(arr2, index1, index2);
            replaceItems(arr3, index1, index2);
        }
    }

    function getWarriorUrl(name) {
        return '/warrior/' + name + '.js'
    }
    function insertWarriorScript (url) {
        $("#warriorRegistrator").after("<script src='" + url + "' type='text/javascript'></script>");
    }
    function loadWarriors () {
        names = _.map(__global.battleOptions.warriors, function (item) {
            return item.warriorName;
        });
        uniqNames = _.uniq(names);
        _.each(uniqNames, function (name) {
            var url  = getWarriorUrl(name);
            insertWarriorScript(url);
        });
        __global.warriorNames = names;
    }
    __global__.register = function (warrior, name) {
        _.each(names, function (nameItem, index) {
            var warriorObject = {};
            warriorObject.name = name;
            warriorObject.shoot = warrior;
            if (nameItem === name) {
                __global.warriors[index] = warriorObject;
            }
        });
    }
    loadWarriors();
    shakeArraysSynchronously(__global.warriors, __global.warriorNames, __global.battleOptions.warriors);
}());