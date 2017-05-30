/*jslint todo : true, sub : true*/
/*globals EventEmitter, _, validators*/



var CGridWarPlayer = EventEmitter.$extend({

    defaultTimeToNextStep : 500,

    minimumStepTimePeriod : 50,

    timeToNextStep : null,

    stepTimeoutDescriptor : null,

    model : null,

    view : null,

    warriors : null,

    workers : null,

    isFullSpeedMode : false,

    lastStepTime : null,

    setFullSpeed : function () {
        this.isFullSpeedMode = true;
    },

    setSimpleSpeed : function () {
        this.isFullSpeedMode = false;
        this.timeToNextStep = this.defaultTimeToNextStep;
    },

    setQuadrupleSpeed : function () {
        this.isFullSpeedMode = false;
        this.timeToNextStep = parseInt(this.defaultTimeToNextStep / 4, 10);
    },

    setDoubleSpeed : function () {
        this.isFullSpeedMode = false;
        this.timeToNextStep = parseInt(this.defaultTimeToNextStep / 2, 10);
    },

    getTimeToNextStep : function () {
        'use strict';
        if (this.isFullSpeedMode) {
            return this.lastStepTime + this.minimumStepTimePeriod;
        } else {
            return this.timeToNextStep;
        }
    },

    afterForWorkEnd : function (callback) {
        'use strict';
        var counter = 0,
            hardwareConcurrency = navigator.hardwareConcurrency;
        _.each(this.workers, function (worker) {
            worker.onmessage = function(event) {
                counter++;
                if (counter === hardwareConcurrency) {
                    callback();
                }
            }
        });
    },

    getWarriorByIndex : function (index) {
        'use strict';
        return this.warriors[index - 1];
    },

    culcShoot : function (indexX, indexY, warriorIndex) {
        'use strict';
        var model     = this.model,
            grid      = this.model.getData(),
            cell      = grid[indexX][indexY],
            warrior   = this.getWarriorByIndex(warriorIndex),
            shootResult,
            comvarSet = model.getComvarSet(indexX, indexY, warriorIndex);

        try {
            shootResult = warrior.shoot(comvarSet);
        } catch (error) {
            console.log("} catch (error) {");
            return model.disqualifyByWarriorIndex(warriorIndex);
        }
        if (!validators.isValidShootResult(shootResult)) {
            console.log("if (!validators.isValidShootResult(shootResult)) {");
            return model.disqualifyByWarriorIndex(warriorIndex);
        } else {
            model.setShoots(indexX, indexY, warriorIndex, shootResult, cell);
        }
    },

    createCulcStepWorkerIfNeeded : function () {
        'use strict';
        var hardwareConcurrency,
            workers,
            index;
        if (!this.workers) {
            hardwareConcurrency = navigator.hardwareConcurrency;
            workers             = [];
            for (index = 0; index < hardwareConcurrency; index += 1) {
                workers[index] = new Worker("/js/culcStepWorker.js");
            }
            this.workers = workers;
        }
    },

    culcStepByWorker : function (callback) {
        'use strict';
        var self   = this,
            model  = this.model,
            length = this.workers.length;
        this.afterForWorkEnd(callback);
        _.each(this.workers, function (worker, index) {
            var cols = model.cols,
                from = parseInt((cols * index) / length, 10),
                to   = parseInt((cols * (index + 1)) / length, 10);
            worker.postMessage({
                'command'      : 'culc',
                'colsData'     : model.data.slice(from, to),
                'from'         : from,
                'to'           : to,
                'warriorNames' : __global.warriorNames
            });
        });
    },

    culcStepWithWorkers : function (callback) {
        'use strict';
        this.createCulcStepWorkerIfNeeded();
        this.culcStepByWorker(callback);
    },

    culcStep : function () {
        'use strict';
        var self  = this,
            model = this.model,
            now = new Date(),
            timeStart,
            result;

        this.iterationNumber++;

        model.clearRedrawCellIndexes();
        model.clearShootsGrid();

        timeStart = (new Date()).getTime();

        /* todo : Доделать параллельное выполнение.

            if (typeof(Worker) !== "undefined" &&
                    navigator.hardwareConcurrency &&
                    navigator.hardwareConcurrency > 1) {
                this.culcStepWithWorkers(finishProcess);
            } else { // Обычное выполнение.

        */

        model.forEach(function (cell) {
            if (cell[2]) {
                self.culcShoot(cell[0], cell[1], cell[2]);
            }
        });

        // }

        finishProcess();

        function finishProcess () {
            result = (new Date()).getTime() - timeStart;

            model.applyShoots();
            model.culcLoseWarriorIndexes();
            self.view.redrawDelta();
            self.emitState();
            if (!model.isBattleFinished()) {
                self.nextStep();
            } else {
                console.log();
                self.view.redrawGrid();
            }
            self.lastStepTime = (now.getTime() - (new Date()).getTime());
        }

    },

    emitState : function () {
        'use strict';
        var model    = this.model;
        if (model.isStateChanged()) {
            this.emit('newState', this.model.getState());
        }
        model.refreshLastState();
        this.emit('stepEnd', {
            'model'           : model,
            'iterationNumber' : this.iterationNumber
        });
    },

    prebindOfHandlers : function () {
        'use strict';
        this.culcStep = _.bind(this.culcStep, this);
    },

    nextStep : function () {
        'use strict';
        this.stepTimeoutDescriptor = setTimeout(this.culcStep, this.getTimeToNextStep());
    },

    startBattle : function () {
        'use strict';
        this.iterationNumber = 0;
        this.nextStep();
    },

    $init : function (options) {
        'use strict';
        var model    = options['model'],
            view     = options['view'],
            warriors = options['warriors'];

        this.model          = model;
        this.view           = view;
        this.warriors       = warriors;
        this.timeToNextStep = this.defaultTimeToNextStep;
        this.prebindOfHandlers();


        window.gridModel = model;
        // this.startBattle();
    }

});