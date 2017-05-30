/*jslint todo : true, sub : true */
/*globals self, this */

var warriors = null,
    disqualifedWarriors = [],
    __global = {};

__global.warriors = [];

__global.register = function (warrior, name) {
    var name = __global.warriorNames;
    _.each(names, function (nameItem, index) {
        if (nameItem === name) {
            __global.warriors[index] = $.extend({}, warrior);
        }
    });
}

importScripts("/lib/validators.js");

function initializeWarriors (names, callback) {
    __global.warriorNames = name;
    if (!names) {
        names.forEach(function (name) {
            importScripts("/warrior/" + name + ".js");
        });
        // Асинхронная инициализация.
    } else {
        callback();
    }
}

function getWarriorByIndex(warriorIndex) {
    return __global.warriors[warriorIndex];
}

function applyCell (gridCell, shootCell) {
    'use strict';
    var shoots    = shootCell[0],
        newComvar = shootCell[1],
        firstIndex,
        lastIndex,
        max;

    shoots = _.map(shoots, function (shoot) {
        return shoot || 0;
    });
    max = Math.max.apply(null, shoots);
    firstIndex = shoots.indexOf(max);
    lastIndex  = shoots.indexOf(max);
    if (firstIndex  && lastIndex) {
        // Если есть 2 максимальных - то победителя нет. Остается как прежде.
        // Или если не набрал 3 выстрелов.
        if (firstIndex !== lastIndex || max < 3) {
            gridCell[3] = newComvar;
            return;
        } else { // Если попали, то устанавливаем этого бойца. И ставим ему пустой комвар.
            gridCell[2] = firstIndex;
            gridCell[3] = this.EMPTY_COMVAR;
            this.redrawCellIndexes.push([
                gridCell[0],
                gridCell[1]
            ]);
            return;
        }
    }
}

function culcShoot (data, indexX, indexY, warriorIndex) {
    'use strict';
    var cell      = grid[indexX][indexY],
        warrior   = getWarriorByIndex(warriorIndex),
        shootResult,
        comvarSet = model.getComvarSet(indexX, indexY, warriorIndex);

    try {
        shootResult = warrior.shoot(comvarSet);
    } catch (error) {
        disqualifedWarriors.push(warriorIndex);
    }
    if (!validators.isValidShootResult(shootResult)) {
        disqualifedWarriors.push(warriorIndex);
    } else {
        model.setShoots(indexX, indexY, warriorIndex, shootResult, cell);
    }
}

addEventListener('message', function(event) {
    var data         = event.data,
        command      = data['command'],
        colsData     = data['colsData'],
        from         = data['from'],
        to           = data['to'],
        warriorNames = data['warriorNames'];

    disqualifedWarriors = [];

    initializeWarriors(warriorNames, function () {


        postMessage('work complete');
    });


/*
    if (data.command === 'culc') {
        model.forEach(function (cell) {
            if (cell[2]) {
                controller.culcShoot(cell[0], cell[1], cell[2]);
            }
        }, from, to);
        postMessage('work complete');
    }
    */
}, false);


