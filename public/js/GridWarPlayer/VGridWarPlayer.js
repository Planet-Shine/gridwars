/*jslint todo : true, sub : true*/
/*globals EventEmitter, _*/



var VGridWarPlayer = EventEmitter.$extend({

    PIXEL_OFFSET : 0.5,

    cnv_cntx : null,

    DEFAULT_BACKGROUND_COLOR : "#11133e",

    backgroundColor : null,

    warriorColors : null,

    model : null,

    borderSize : 0,

    cellSideLength : null,

    cellHeight : null,

    win : null,

    container : null,

    canvas : null,

    width : null,

    height : null,

    rows : null,

    colls : null,

    resizeTarget : null,

    maxCellSide : 15,

    redrawDelta : function () {
        'use strict';
        var self               = this,
            model              = this.model,
            newIndexesToRedraw = model.redrawCellIndexes;
        _.each(newIndexesToRedraw, function (item) {
            self.drawCell(model.getCell(item[0], item[1]));
        });
    },

    getColorByWarrior : function (warriorNumber) {
        'use strict';
        return this.warriorColors[warriorNumber];
    },

    drawCell : function (cellModel) {
        'use strict';
        var PIXEL_OFFSET   = this.PIXEL_OFFSET,
            cnv_cntx       = this.cnv_cntx,
            col            = cellModel[0],
            row            = cellModel[1],
            borderSize     = this.borderSize,
            cellSideLength = this.cellSideLength,
            color          = this.getColorByWarrior(cellModel[2]),
            x              = (cellSideLength + borderSize) * col + borderSize,
            y              = (cellSideLength + borderSize) * row + borderSize;

        cnv_cntx.beginPath();
        cnv_cntx.fillStyle = color;
        cnv_cntx.rect(x - PIXEL_OFFSET, y - PIXEL_OFFSET, cellSideLength - PIXEL_OFFSET, cellSideLength - PIXEL_OFFSET);
        cnv_cntx.fill();
    },

    clearCanvas : function () {
        'use strict';
        var PIXEL_OFFSET = this.PIXEL_OFFSET,
            canvas       = this.canvas,
            cnv_cntx     = this.cnv_cntx,
            width        = canvas.width() + 1,
            height       = canvas.height() + 1;

        cnv_cntx.beginPath();
        cnv_cntx.fillStyle = this.backgroundColor;
        cnv_cntx.rect(0 - PIXEL_OFFSET, 0 - PIXEL_OFFSET, width - PIXEL_OFFSET, height - PIXEL_OFFSET);
        cnv_cntx.fill();
    },

    redrawCells : function (cells) {
        'use strict';
        var index,
            length = cells.length;
        for (index = 0; index < length; index += 1) {
            this.drawCell(cells[index]);
        }
    },

    redrawGrid : function () {
        'use strict';
        var data    = this.model.getData(),
            indexX,
            indexY,
            lengthX = data.length,
            lengthY = data[0].length;
        this.clearCanvas();
        for (indexX = 0; indexX < lengthX; indexX += 1) {
            for (indexY = 0; indexY < lengthY; indexY += 1) {
                this.drawCell(data[indexX][indexY]);
            }
        }
    },

    setColls : function (colls) {
        'use strict';
        this.colls = colls;
    },

    setRows : function (rows) {
        'use strict';
        this.rows = rows;
    },

    refreshSize : function () {
        'use strict';
        var self = this,
            cellSideLength,
            height,
            borderSize,
            canvas   = this.canvas,
            rows     = this.rows,
            colls    = this.colls,
            resizeTarget      = this.resizeTarget,
            resizeTargetWidth = resizeTarget.width(),
            width             = resizeTargetWidth;

        function culcCellSizeLength (cellSideLength) {
            if (cellSideLength > 40) {
                borderSize = 3;
            } else if (cellSideLength > 15) {
                borderSize = 2;
            } else if (cellSideLength > 5) {
                borderSize = 1;
            } else {
                borderSize = 0;
            }
            self.borderSize = borderSize;
            cellSideLength = cellSideLength - borderSize;
            width = ((cellSideLength + borderSize) * colls) + borderSize;
            if (width > resizeTargetWidth) {
                return culcCellSizeLength(cellSideLength - 1);
            } else {
                return cellSideLength;
            }
        }

        cellSideLength = Math.min(culcCellSizeLength(parseInt(width / this.colls, 10)), this.maxCellSide);
        this.cellSideLength = cellSideLength;

        height = ((cellSideLength + self.borderSize) * rows) + borderSize;
        width = ((cellSideLength + self.borderSize) * colls) + borderSize;;

        canvas.attr('width', width);
        canvas.attr('height', height);
        this.redrawGrid();
        // Встраиваем по ширине.
    },

    initBindOfHandlers : function () {
        'use strict';
        var win = this.win;
        $(win).resize(this.refreshSize);
    },

    prebindOfHandlers : function () {
        'use strict';
        this.refreshSize = _.bind(this.refreshSize, this);
    },

    shakeColors : function () {
        'use strict';
        var warriorColors = this.warriorColors,
            length = warriorColors.length,
            fullLength = length - 1,
            index1,
            index2,
            index;

        function replaceColors (index1, index2) {
            var color1 = warriorColors[index1];
            warriorColors[index1] = warriorColors[index2];
            warriorColors[index2] = color1;
        }

        for (index = 0; index < fullLength; index += 1) {
            index1 = parseInt(Math.random() * fullLength, 10) + 1;
            index2 = parseInt(Math.random() * fullLength, 10) + 1;
            replaceColors(index1, index2);
        }

    },

    $init : function (options) {
        'use strict';
        var self            = this,
            container       = options['container'],
            win             = options['win'],
            colls           = options['colls'],
            rows            = options['rows'],
            model           = options['model'],
            backgroundColor = options['backgroundColor'],
            resizeTarget    = options['resizeTarget'] || window,
            canvas          = $('<canvas></canvas>');

        container.append(canvas);

        this.canvas          = canvas;
        this.cnv_cntx        = canvas.get(0).getContext("2d");
        this.container       = $(container);
        this.win             = $(win);
        this.backgroundColor = backgroundColor || this.DEFAULT_BACKGROUND_COLOR;
        this.resizeTarget    = resizeTarget;

        this.setColls(colls);
        this.setRows(rows);
        this.model = model;


        this.warriorColors = [
            '#42435a',
            '#ed1c24',
            '#ff8400',
            '#fff200',
            '#39b54a',
            '#00aeef',
            '#92278f',
            '#ec008c',
            '#ca9764',
            '#afafaf',
            '#1ecfd5',
            '#ff60d8',
            '#8e70fe',
            '#61dbff',
            '#51ff76',
            '#ff7e5c'
            // repeats
            /*'#ed1c24',
            '#f26522',
            '#fff200',
            '#39b54a',
            '#00aeef',
            '#92278f',
            '#ec008c',
            '#a67c52',
            '#cccccc',
            '#1ecfd5',
            '#fec5f0',
            '#d1c5fe',
            '#c5f1fe',
            '#c5fed1',
            '#fed1c5',
            '#ed1c24',
            '#f26522',
            '#fff200',
            '#39b54a',
            '#00aeef',
            '#92278f',
            '#ec008c',
            '#a67c52',
            '#cccccc',
            '#1ecfd5',
            '#fec5f0',
            '#d1c5fe',
            '#c5f1fe',
            '#c5fed1',
            '#fed1c5',
            '#ed1c24',
            '#f26522',
            '#fff200',
            '#39b54a',
            '#00aeef',
            '#92278f',
            '#ec008c',
            '#a67c52',
            '#cccccc',
            '#1ecfd5',
            '#fec5f0',
            '#d1c5fe',
            '#c5f1fe',
            '#c5fed1',
            '#fed1c5'
            */
        ];

        this.shakeColors();
        this.prebindOfHandlers();
        this.initBindOfHandlers();
        this.refreshSize();
        setTimeout(function () {
            self.refreshSize()
        }, 1000);

    }
});