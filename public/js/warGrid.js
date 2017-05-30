/* jslint todo : true, sub : true4*/
/* globals _  */

var warGrid = {

    cols : null,

    rows : null,

    getWarriorColor : function (index) {
        var controller = this.controller,
            view       = controller.view;
        return view.getColorByWarrior(index + 1);
    },

    getIndexOfWarrior : function (warrior) {
        return __global.warriors.indexOf(warrior);
    },

    onNewStateHandler : function (event) {
        'use strict';
        var self = this,
            data = event['data'],
            list = $('ul.warrior-list li'),
            disqualifiedWarriors = data['disqualifiedWarriors'],
            loseWarriors = data['loseWarriors'],
            winner = data['winner'];

        function setStatus (index, status) {
            var item = $(list.get(index));
            $(list.get(index))
                .find('.warrior-status')
                .find(".warrior-status__" + status)
                .show();
            if (["lose", "disqualified"].indexOf(status) !== -1) {
                item.find('.cell-count').html("0");
            }
        }

        _.each(disqualifiedWarriors, function (item) {
            setStatus(self.getIndexOfWarrior(item), 'disqualified');
        });

        _.each(loseWarriors, function (item) {
            setStatus(self.getIndexOfWarrior(item), 'lose');
        });
        if (winner) {
            setStatus(this.getIndexOfWarrior(winner), 'win');
            this.showWinnerHint(this.getIndexOfWarrior(winner));
        }

    },

    onStepEndHandler : function (event) {
        'use strict';
        var model     = event.data.model,
            list      = $(".warrior-list"),
            listItems = list.find('li');
        model.culcCellCountForAllWarriors();
        _.each(__global.warriors, function (warrior, index) {
            var cellCount = model.getCellCountByWarriorId(index + 1);
            $(listItems.get(index)).find('.cell-count').html(cellCount);
        });
        this.setNewIterationNumber(event.data.iterationNumber);
    },

    showWinnerHint : function (warriorIndex) {
        'use strict';
        var view    = this.controller.view,
            color   = view.getColorByWarrior(warriorIndex + 1),
            warrior = this.controller.getWarriorByIndex(warriorIndex + 1);

        $(".winner-block__name").html(warrior.name).css("color", color);
        $(".winner-block").show();
    },

    extractColsAndRows : function () {
        'use strict';
        var size = __global.battleOptions.size.split('x'),
            cols = parseInt(size[0], 10),
            rows = parseInt(size[1], 10);
        this.cols = cols;
        this.rows = rows;
        return !!cols && !!rows;
    },

    isColsAndRowsExists : function () {
        'use strict';
        return this.extractColsAndRows();
    },

    isAllWarriorsRegister : function () {
        'use strict';
        var result,
            totalResult,
            warriorNames = __global.warriorNames,
            warriors     = __global.warriors,
            name,
            index,
            length       = warriorNames.length;

        totalResult = true;

        for (index = 0; index < length; index += 1) {
            name = warriorNames[index];
            result = false;
            _.each(warriors, function (warrior) {
                if (warrior) {
                    if (warrior.name === name) {
                        result = true;
                    }
                } else {
                    result = false;
                }
            });
            totalResult = result && totalResult;
        }

        return totalResult;
    },

    showRegisterWarriorError : function () {
        'use strict';
        $('.wrong-warrior-list-error').show();
    },

    showCollsRowsError : function () {
        'use strict';
        $('.wrong-size-error').show();
    },

    initializeGrid : function () {
        var self = this;
        function pageInit () {
            var cols  = self.cols,
                rows  = self.rows,
                model = MGridWarPlayer.$create({
                    'cols'         : cols,
                    'rows'         : rows,
                    'warriorCount' :  __global.warriors.length,
                    'warriors'     :  __global.warriors
                }),
                view = VGridWarPlayer.$create({
                    container    : $('.wargrid-container'),
                    win          : window,
                    colls        : cols,
                    rows         : rows,
                    model        : model,
                    resizeTarget : $('.resize-target')
                }),
                controller = CGridWarPlayer.$create({
                    'model'    : model,
                    'view'     : view,
                    'warriors' : __global.warriors
                });

            self.controller = controller;
            controller.bind('newState', self.onNewStateHandler);
            controller.bind('stepEnd',  self.onStepEndHandler);
            self.initializeList();

            $(".to-battle-button").click(function () {
                $(this).hide();
                controller.startBattle();
            });
            $('.full-speed-button').click(function () {
                controller.setFullSpeed();
            });
            $('.quadruple-speed-button').click(function () {
                controller.setQuadrupleSpeed();
            });
            $('.double-speed-button').click(function () {
                controller.setDoubleSpeed();
            });
            $('.simple-speed-button').click(function () {
                controller.setSimpleSpeed();
            });
            $(document).click(function (event) {
                var target = $(event.target);
                if (target.closest('.speed-button').length) {
                    $('.speed-button').removeClass('selected');
                    target.closest('.speed-button').addClass('selected');
                }
            });
        }
        $(pageInit);
    },

    setNewIterationNumber : function (newValue) {
        this.iterationValue.text(newValue);
    },

    initializeList : function () {
        var self     = this,
            warriors = __global.battleOptions.warriors,
            list     = $(".warrior-list"),
            item     = list.find('li'),
            newHtml  = item.get(0).outerHTML;
        item.remove();
        _.each(warriors, function (warrior, index) {
            var html              = $(newHtml),
                warriorCreateDate;

            html.css({
                'display' : 'block'
            });
            html.find('.warrior-name')
                .css({
                    'color' : self.getWarriorColor(index)
                })
                .text(warrior.warriorName);


            if (warrior.warriorCreateTimeStamp) {
                warriorCreateDate = new Date(warrior.warriorCreateTimeStamp);
                warriorCreateDate = __global.getLocalTime(warriorCreateDate);
                html.find('.warrior-create-date')
                    .text(__global.getDateOutput(warriorCreateDate));
            } else {
                html.find('.warrior-create-date-before').hide();
            }

            html.find('.user-name')
                .text(warrior.userName);

            html.find('.square-simbol').css({
                'color' : self.getWarriorColor(index)
            });
            list.append(html);
        });
    },

    prebindHandelrs : function () {
        'use strict'
        this.onNewStateHandler = _.bind(this.onNewStateHandler, this);
        this.onStepEndHandler  = _.bind(this.onStepEndHandler, this);
    },

    $init : function () {
        'use strict';
        this.iterationValue = $('.iteration-number-value');
        if (!this.isAllWarriorsRegister()) {
            return this.showRegisterWarriorError();
        }
        if (!this.isColsAndRowsExists()) {
            return this.showCollsRowsError();
        }
        this.prebindHandelrs();
        this.initializeGrid();
    }

};

warGrid.$init();