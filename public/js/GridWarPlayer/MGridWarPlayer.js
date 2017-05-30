/*jslint todo : true, sub : true*/
/*globals EventEmitter, _*/


var MGridWarPlayer = EventEmitter.$extend({

    EMPTY_COMVAR : '00000000000000000000000000000000', // length : 32

    warriors : null,

    cols : null,

    rows : null,

    warriorCount : null,

    data : null,

    shootsGrid : null,

    redrawCellIndexes : null,

    disqualifiedWarriors : null,

    loseWarriorIndexes : null,

    lastState : null,

    cellCounts : null,

    culcCellCountForAllWarriors : function () {
        'use strict';
        var data       = this.data,
            cols       = this.cols,
            rows       = this.rows,
            cellCounts = [],
            warriorIndex,
            index1,
            index2;

        for (index1 = 0; index1 < cols; index1 += 1) {
            for (index2 = 0; index2 < rows; index2 += 1) {
                warriorIndex = data[index1][index2][2];
                cellCounts[warriorIndex] = cellCounts[warriorIndex] || 0;
                cellCounts[warriorIndex] += 1;
            }
        }

        this.cellCounts = cellCounts;
    },

    getCellCountByWarriorId : function (warriorIndex) {
        'use strict';
        return this.cellCounts[warriorIndex];
    },

    refreshLastState : function () {
        'use strict';
        this.lastState = this.getState();
    },

    isStateChanged : function () {
        'use strict';
        return !this.isEqualToLastState(this.getState());
    },

    isEqualToLastState : function (newState) {
        'use strict';
        var lastState = this.lastState;
        if (lastState) {
            return _.isEqual(newState['disqualifiedWarriors'], this.lastState['disqualifiedWarriors'])
                && _.isEqual(newState['loseWarriors'], this.lastState['loseWarriors'])
                && newState['winner'] === this.lastState['winner'];
        } else {
            return false;
        }
    },

    getState : function () {
        'use strict';
        var newState = {
            'disqualifiedWarriors' : this.getDisqualifiedWarriors(),
            'loseWarriors'         : this.getLoseWarriors(),
            'winner'               : this.getWinner()
        };
        return newState;
    },

    getAllFailWarriorIndexes : function () {
        'use strict';
        /*
            var disqualifiedWarriorIndexes = this.disqualifiedWarriorIndexes,
                loseWarriorIndexes         = this.loseWarriorIndexes,
                allFailIndexes             = disqualifiedWarriorIndexes.concat(loseWarriorIndexes);
        */
        return this.loseWarriorIndexes;
    },

    isBattleFinished : function () {
        'use strict';
        var allFailIndexes = this.getAllFailWarriorIndexes();
        if (allFailIndexes.length >= this.warriors.length - 1) {
            return true;
        } else {
            return false;
        }
    },

    getWinner : function () {
        'use strict';
        var index,
            result         = null,
            warriorCount   = this.warriorCount,
            allFailIndexes = this.getAllFailWarriorIndexes();

        if (allFailIndexes.length === this.warriors.length - 1) {
            for (index = 1; index <= warriorCount; index += 1) {
                if (allFailIndexes.indexOf(index) === -1) {
                    result = index;
                }
            }
        }

        return this.warriors[result - 1];
    },

    getDisqualifiedWarriors : function () {
        'use strict';
        var result                     = [],
            disqualifiedWarriorIndexes = this.disqualifiedWarriorIndexes,
            warriors                   = this.warriors;
        _.each(disqualifiedWarriorIndexes, function (index) {
            result.push(warriors[index - 1]);
        });
        return result;
    },

    getLoseWarriors : function  () {
        'use strict';
        var result             = [],
            model              = this.model,
            warriors           = this.warriors,
            loseWarriorIndexes = this.loseWarriorIndexes;

        _.each(loseWarriorIndexes, function (index) {
            result.push(warriors[index - 1]);
        });

        return result;
    },

    culcLoseWarriorIndexes : function () {
        'use strict';
        var data                  = this.data,
            uniqWarriorIndexes    = [],
            warriorCount          = this.warriorCount,
            newLoseWarriorIndexes = [],
            warriorIndex,
            indexX,
            indexY,
            index;

        for (indexX = 0; indexX < this.cols; indexX += 1) {
            for (indexY = 0; indexY < this.rows; indexY += 1) {
                warriorIndex = data[indexX][indexY][2];
                if (uniqWarriorIndexes.indexOf(warriorIndex) === -1) {
                    uniqWarriorIndexes.push(warriorIndex);
                }
            }
        }

        for (index = 1; index <= warriorCount; index += 1) {
            if (uniqWarriorIndexes.indexOf(index) === -1) {
                newLoseWarriorIndexes.push(index);
            }
        }

        this.loseWarriorIndexes = newLoseWarriorIndexes;
    },

    disqualifyByWarriorIndex : function (warriorIndex) {
        'use strict';
        var data              = this.data,
            shootsGrid        = this.shootsGrid,
            redrawCellIndexes = this.redrawCellIndexes,
            cell,
            shootCell,
            indexX,
            indexY;
        this.disqualifiedWarriorIndexes.push(warriorIndex);
        for (indexX = 0; indexX < this.cols; indexX += 1) {
            for (indexY = 0; indexY < this.rows; indexY += 1) {
                cell = data[indexX][indexY];
                if (cell[2] === warriorIndex) {
                    cell[2] = 0;
                    cell[3] = null;
                    redrawCellIndexes.push([
                        indexX,
                        indexY
                    ]);
                }
                shootCell = shootsGrid[indexX][indexY];
                if (shootCell[0][warriorIndex] !== undefined) {
                    shootCell[0][warriorIndex] = undefined;
                }
            }
        }
    },

    forEach : function (callback, from, to) {
        'use strict';
        var indexX,
            indexY;
        if (from === undefined) {
            from = 0;
        }
        if (to === undefined) {
            to = this.cols;
        }
        for (indexX = from; indexX < to; indexX += 1) {
            for (indexY = 0; indexY < this.rows; indexY += 1) {
                callback(this.data[indexX][indexY]);
            }
        }
    },

    clearShootsGrid : function () {
        'use strict';
        var indexX,
            indexY,
            shootsGrid = new Array(this.cols);
        for (indexX = 0; indexX < this.cols; indexX += 1) {
            shootsGrid[indexX] = new Array(this.rows);
            for (indexY = 0; indexY < this.rows; indexY += 1) {
                shootsGrid[indexX][indexY] = [[],[]];
            }
        }
        this.shootsGrid = shootsGrid;
    },

    applyCell : function (gridCell, shootCell) {
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
        lastIndex  = shoots.lastIndexOf(max);
        // console.log("x = " + shootCell[0] + ", y = " + shootCell[1] + ", shoots = " + shoots + ", firtsIndex = " + firstIndex + ", lastIndex = " + lastIndex + ", max = " + max);
        if (firstIndex  && lastIndex) {
            // Если есть 2 максимальных - то победителя нет. Остается как прежде.
            // Или если не набрал 3 выстрелов.
            if (firstIndex !== lastIndex || max < 3 || gridCell[2] === firstIndex) {
                // console.log("new Comvar = " + newComvar);
                gridCell[3] = newComvar;
                return;
            } else { // Если попали, то устанавливаем этого бойца. И ставим ему пустой комвар.
                gridCell[2] = firstIndex;
                gridCell[3] = this.EMPTY_COMVAR;
                this.redrawCellIndexes.push([
                    gridCell[0],
                    gridCell[1]
                ]);
                // console.log("captured!");
                return;
            }
        }
    },

    clearRedrawCellIndexes : function () {
        'use strict';
        this.redrawCellIndexes = [];
    },

    applyShoots : function () {
        'use strict';
        var indexX,
            indexY,
            cols       = this.cols,
            rows       = this.rows,
            grid       = this.data,
            shootsGrid = this.shootsGrid;

        for (indexX = 0; indexX < cols; indexX += 1) {
            for (indexY = 0; indexY < rows; indexY += 1) {
                this.applyCell(grid[indexX][indexY], shootsGrid[indexX][indexY]);
            }
        }

    },

    getShootCell : function (indexX, indexY, shootIndex) {
        'use strict';
        if (shootIndex < 3) {
            indexY -= 1;
        } else if (shootIndex > 5) {
            indexY += 1;
        }
        if ([0, 3, 6].indexOf(shootIndex) !== -1) {
            indexX -= 1;
        }
        if ([2, 5, 8].indexOf(shootIndex) !== -1) {
            indexX += 1;
        }
        if (indexY > this.rows - 1) {
            indexY = 0;
        } else if (indexY < 0) {
            indexY = this.rows - 1;
        }
        if (indexX > this.cols - 1) {
            indexX = 0;
        } else if (indexX < 0) {
            indexX = this.cols - 1;
        }
        return this.shootsGrid[indexX][indexY];
    },

    setShoots : function (indexX, indexY, warriorIndex, shoots) {
        'use strict';
        var shootsGrid  = this.shootsGrid,
            cell        = shootsGrid[indexX][indexY],
            shoot1      = shoots[0],
            shoot2      = shoots[1],
            shoot3      = shoots[2],
            shootCell1  = this.getShootCell(indexX, indexY, shoot1),
            shootCell2  = this.getShootCell(indexX, indexY, shoot2),
            shootCell3  = this.getShootCell(indexX, indexY, shoot3),
            newComvar   = shoots[3],
            temp;

        cell[1] = newComvar;

        temp = shootCell1[0][warriorIndex] || 0;
        shootCell1[0][warriorIndex] = temp + 1;

        temp = shootCell2[0][warriorIndex] || 0;
        shootCell2[0][warriorIndex] = temp + 1;

        temp = shootCell3[0][warriorIndex] || 0;
        shootCell3[0][warriorIndex] = temp + 1;

    },

    getComvarSet : function (indexX, indexY, targetWarriorIndex) {
        'use strict';
        var grid = this.data,
            x_m1 = indexX - 1,
            x_p1 = indexX + 1,
            x    = indexX,
            y_m1 = indexY - 1,
            y_p1 = indexY + 1,
            y    = indexY,
            comvarSet;

        if (x_m1 < 0) {
            x_m1 = this.cols - 1;
        }
        if (x_p1 > this.cols - 1) {
            x_p1 = 0;
        }
        if (y_m1 < 0) {
            y_m1 = this.rows - 1;
        }
        if (y_p1 > this.rows - 1) {
            y_p1 = 0;
        }

        comvarSet = [
            grid[x_m1][y_m1],
            grid[x][y_m1],
            grid[x_p1][y_m1],
            grid[x_m1][y],
            grid[x][y],
            grid[x_p1][y],
            grid[x_m1][y_p1],
            grid[x][y_p1],
            grid[x_p1][y_p1]
        ];

        comvarSet = _.map(comvarSet, function (item) {
            var warriorIndex = item[2];
            if (warriorIndex > 0 && targetWarriorIndex === warriorIndex) {
                return item[3];
            }
            return warriorIndex;
        });
        return comvarSet;
    },

    getData : function () {
        'use strict';
        return this.data;
    },

    getCell : function (indexX, indexY) {
        'use strict';
        return this.data[indexX][indexY];
    },

    initializeFirstWarriorCell : function () {
        'use strict';
        var data               = this.data,
            cols               = this.cols,
            rows               = this.rows,
            warriorCount       = this.warriorCount,
            totalCellCount     = cols * rows,
            cellCountAtWarrior = parseInt(totalCellCount / warriorCount, 10),
            warriorSide        = parseInt(Math.sqrt(cellCountAtWarrior), 10),
            xCount             = parseInt(cols / warriorSide, 10),
            yCount             = parseInt(rows / warriorSide, 10),
            totalSlotCount     = xCount * yCount,
            tempWarriorIndex   = 0,
            indexX,
            indexY,
            warriorSideX,
            warriorSideY,
            halfWarriorSideX,
            halfWarriorSideY,
            cellXLeft,
            cellYLeft,
            x,
            y;

        // Количество клеток на бойца.
        // Берем из этого квадрат.
        // Это будет расстояние между бойцами.
        // Округляем так, чтобы влезло все.
        // Отсчитываем конкретные ячейки.
        if (totalSlotCount < warriorCount) {
            yCount += 1;
        }
        totalSlotCount = xCount * yCount;
        if (totalSlotCount < warriorCount) {
            xCount += 1;
        }
        totalSlotCount = xCount * yCount;

        warriorSideX     = parseInt(cols / xCount, 10);
        warriorSideY     = parseInt(rows / yCount, 10);
        halfWarriorSideX = parseInt(warriorSideX / 2, 10);
        halfWarriorSideY = parseInt(warriorSideY / 2, 10);
        cellXLeft        = cols - (warriorSideX * xCount);
        cellYLeft        = rows - (warriorSideY * yCount);

        // Растовляем бойцов.
        for (indexX = 0; indexX < xCount; indexX += 1) {
            for (indexY = 0; indexY < yCount; indexY += 1) {
                tempWarriorIndex++;
                if (tempWarriorIndex <= warriorCount) {
                    x = halfWarriorSideX + (indexX * warriorSideX) + (indexX < cellXLeft ? 1 : 0);
                    y = halfWarriorSideY + (indexY * warriorSideY) + (indexY < cellYLeft ? 1 : 0);
                    data[x][y][2] = tempWarriorIndex;
                    data[x][y][3] = this.EMPTY_COMVAR;
                }
            }
        }
    },

    initializeGrid : function () {
        'use strict';
        var data,
            index,
            indexX,
            indexY,
            rows = this.rows,
            cols = this.cols;

        // Создаем канвас.
        data = new Array(cols);
        for (indexX = 0; indexX < cols; indexX += 1) {
            data[indexX] = new Array(rows);
        }

        // Забиваем канвас пустыми ячейками.
        for (indexX = 0; indexX < cols; indexX += 1) {
            for (indexY = 0; indexY < rows; indexY += 1) {
                data[indexX][indexY] = [
                    indexX, // col
                    indexY, // row
                    0,      // warriorNumber  0 - пустая
                    null    // comvar
                ];
            }
        }
        this.data = data;
    },

    $init : function (options) {
        'use strict';
        var warriors     = options['warriors'],
            cols         = options['cols'],
            rows         = options['rows'],
            warriorCount = options['warriorCount'];

        this.cols                       = cols;
        this.rows                       = rows;
        this.warriorCount               = warriorCount;
        this.warriors                   = warriors;
        this.disqualifiedWarriorIndexes = [];
        this.loseWarriorIndexes         = [];

        this.initializeGrid();
        this.initializeFirstWarriorCell();
    }

});



