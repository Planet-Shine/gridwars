/* jslint todo : true, sub : true*/
/* globals $ */
var $cube = (function () {
    var result = {},
        colors = [
            '#42435a',
            '#f26522',
            '#fff200',
            '#39b54a',
            '#00aeef',
            '#92278f',
            '#ec008c'
        ];

    function getRendomColor () {
        return colors[parseInt(Math.random() * colors.length)];
    }

    result.lineStream = function (options) {
        var interf = {},
            subBlockXPos = 0,
            animationTime = 0,
            passDistanceCounter = 0,
            cellTimeout,
            cellTimeoutCounter = 0,
            isReverce = false,
            reverceMult = 1,
            cellSpeed,
            subBlockSpeed,
            animationDescriptor,
            container,
            subContainer,
            from,
            to,
            size,
            padding,
            lineFrom,
            lineTo,
            align,
            color,
            speed,
            grid,
            fullSize,
            width,
            height,
            cols,
            rows,
            fps,
            animationTimeout;


        cellSpeed        = options['cellSpeed'] || 2; // count per second
        cellTimeout      = 1000 / cellSpeed;
        fps              = options['fps'] || 30;
        speed            = options['speed'] || 20; // pixels per second
        animationTimeout = parseInt(1000  / fps, 10);
        subBlockSpeed    = speed / fps;
        container        = options['container'];
        subContainer     = options['subContainer'];
        from             = options['from'];
        to               = options['to'];
        size             = options['size'];
        padding          = options['padding'];
        lineFrom         = options['lineFrom'] || 0.5;
        lineTo           = options['lineTo'] || 0.75;
        align            = options['align'] || 'bottom';
        color            = options['color'] || getRendomColor();

        grid         = [];
        fullSize     = size + padding;
        width        = parseInt(container.width(), 10);
        height       = parseInt(container.height(), 10);
        cols         = parseInt(width  / fullSize, 10);
        rows         = parseInt(height / fullSize, 10);

        if (from === 'right' && to === 'left') {
            isReverce = true;
            reverceMult = -1;
        }

        var getPositionX;

       if (isReverce) {
           getPositionX = function (value) {
               return width - (value * fullSize + ((passDistanceCounter + 1) * fullSize));
           }
       } else {
           getPositionX = function (value) {
               return value * fullSize + padding + (passDistanceCounter * fullSize);
           }
       }

        function getPositionY (value) {
            return value * fullSize + padding;
        }

        function createCube (x, y) {
            return $("<div style='position:absolute;background : " + color + "; width : " + size + "px;height: " + size + "px;top: " + getPositionY(y) +"px;left:" + getPositionX(x) + "px;'></div>");
        }

        function gridInicialize () {
            var cube,
                index1,
                index2,
                additionalCells,
                lineFromIndex = Math.round(cols * lineFrom),
                lineToIndex   = Math.round(cols * lineTo),
                cellDelta     = lineToIndex - lineFromIndex;

            grid = (new Array(cols));

            for (index1 = 0; index1 < cols; index1 += 1) {
                grid[index1] = (new Array(rows));
            }

            for (index1 = 0; index1 < rows; index1 += 1) {
                additionalCells = parseInt(Math.random() * (cellDelta + 1), 10);
                for (index2 = 0; index2 < cols; index2 += 1) {
                    if (index2 < lineFromIndex + additionalCells) {
                        cube = createCube(index2, index1);
                        grid[index2][index1] = cube;
                        subContainer.append(cube);
                    } else if (index1 < lineToIndex) {
                        grid[index2][index1] = null;
                    }
                }
            }

        }

        function addCells () {
            var cube,
                index1,
                index2,
                additionalCells,
                lineFromIndex = Math.round(cols * lineFrom),
                lineToIndex   = Math.round(cols * lineTo),
                cellDelta     = lineToIndex - lineFromIndex;

            for (index1 = 0; index1 < rows; index1 += 1) {
                additionalCells = parseInt((1 - (Math.random() /* Math.random()*/)) * (cellDelta + 1), 10);
                for (index2 = 0; index2 < cols; index2 += 1) {
                    if (index2 < lineFromIndex + additionalCells && !grid[index2][index1]) {
                        cube = createCube(index2, index1);
                        grid[index2][index1] = cube;
                        subContainer.append(cube);
                    }
                }
            }
        }

        function replaceCell (count) {
            var sliceItem,
                index1,
                index2,
                length;

            sliceItem = grid.splice(0, count);
            length    = sliceItem.length;
            for (index1 = 0; index1 < length; index1 += 1) {
                for (index2 = 0; index2 < rows; index2 += 1) {
                    if (sliceItem[index1][index2]) {
                        sliceItem[index1][index2].remove();
                    }
                    sliceItem[index1][index2] = null;
                }
            }
            grid = grid.concat(sliceItem);
        }

        function nextAnimation () {
            animationDescriptor = setTimeout(function () {
                var newCellTimeCounter,
                    index,
                    addCount,
                    cellReplaceCount,
                    newDistanceCounter;

                animationTime += animationTimeout;
                newCellTimeCounter = parseInt(animationTime / cellTimeout, 10);
                subBlockXPos += subBlockSpeed * reverceMult;
                subContainer.css("left", parseInt(-subBlockXPos, 10) + "px");
                newDistanceCounter = parseInt(subBlockXPos / fullSize, 10) * reverceMult;

                if (newDistanceCounter > passDistanceCounter) {
                    cellReplaceCount    = newDistanceCounter - passDistanceCounter;
                    passDistanceCounter = newDistanceCounter;
                    replaceCell(cellReplaceCount);
                }

                if (newCellTimeCounter > cellTimeoutCounter) {
                    addCount = newCellTimeCounter - cellTimeoutCounter;
                    cellTimeoutCounter = newCellTimeCounter;
                    for (index = 0; index < addCount; index += 1) {
                        addCells();
                    }
                }
                nextAnimation();
            }, animationTimeout);
        }

        function stopAnimation () {
            clearTimeout(animationDescriptor);
        }


        function initialize () {
            gridInicialize();
            nextAnimation();
        }

        initialize();

        interf.start = nextAnimation;
        interf.stop = stopAnimation;
        interf.switchColor = function () {
            color = getRendomColor();
            subContainer.find('div').each(function () {
                $(this).css('background', color);
            });
        };

        return interf;
    };

    result.bubbling = function (options) {
        var interf = {},
            animationTime = 0,
            cellTimeout,
            cellTimeoutCounter = 0,
            spawnCounter = 0,
            cellSpeed,
            animationDescriptor,
            container,
            size,
            padding,
            lineFrom,
            lineTo,
            align,
            speed,
            fullSize,
            width,
            height,
            cols,
            rows,
            fps,
            animationTimeout,
            possibleCountOfBubble,
            bubbleSpawnIteration,
            lineFromIndex,
            newSpawnCounter,
            spawnTimeout,
            lineToIndex;


        cellSpeed             = options['cellSpeed'] || 2; // count per second
        cellTimeout           = 1000 / cellSpeed;
        fps                   = options['fps'] || 30;
        speed                 = options['speed'] || 20; // pixels per second
        animationTimeout      = parseInt(1000  / fps, 10);
        container             = options['container'];
        size                  = options['size'];
        padding               = options['padding'];
        lineFrom              = options['lineFrom'] || 0.5;
        lineTo                = options['lineTo'] || 0.75;
        align                 = options['align'] || 'bottom';
        possibleCountOfBubble = options['possibleCountOfBubble'];
        bubbleSpawnIteration  = options['bubbleSpawnIteration'];
        spawnTimeout          = 1000 / bubbleSpawnIteration;

        fullSize      = size + padding;
        width         = parseInt(container.width(), 10);
        height        = parseInt(container.height(), 10);
        cols          = parseInt(width  / fullSize, 10);
        rows          = parseInt(height / fullSize, 10);
        lineFromIndex = rows - Math.round(rows * lineFrom);
        lineToIndex   = rows - Math.round(rows * lineTo);

        function getPositionX (value) {
            return value * fullSize + padding;
        }

        function getPositionY (value) {
            return value * fullSize + padding;
        }

        function createCube (x, y, color) {
            return $("<div data-y='" + y + "' style='position:absolute;background : " + color + "; width : " + size + "px;height: " + size + "px;top: " + getPositionY(y) +"px;left:" + getPositionX(x) + "px;'></div>");
        }

        function nextAnimation () {
            animationDescriptor = setTimeout(function () {
                var index,
                    countOfUpBubbles,
                    countOfSpawn,
                    newCellTimeCounter,
                    newSpawnCounter;

                animationTime      += animationTimeout;
                newCellTimeCounter = parseInt(animationTime / cellTimeout, 10);
                newSpawnCounter    = parseInt(animationTime / spawnTimeout, 10);

                if (newCellTimeCounter > cellTimeoutCounter) {
                    countOfUpBubbles = newCellTimeCounter - cellTimeoutCounter;
                    cellTimeoutCounter = newCellTimeCounter;
                    for (index = 0; index < countOfUpBubbles; index += 1) {
                        upBubles();
                    }
                    if (newSpawnCounter > spawnCounter) {
                        countOfSpawn = newSpawnCounter - spawnCounter;
                        spawnCounter = newSpawnCounter;
                        for (index = 0; index < countOfSpawn; index += 1) {
                            spawnBubbles();
                        }
                    }
                }

                nextAnimation();
            }, animationTimeout);
        }

        function upBubles () {
            var bubbles = container.find('div');
            bubbles.each(function () {
                var bubble = $(this),
                    y      = parseInt(bubble.data('y'), 10) - 1;
                if (y > 0) {
                    bubble.css('top', getPositionY(y) + 'px');
                    bubble.data('y', y);
                    if (lineFromIndex > y && lineToIndex < y) {
                        bubble.css('opacity',  ((1 / (lineFromIndex - lineToIndex)) * ((lineFromIndex - lineToIndex)-(lineFromIndex - y))));
                    } else if (y  < lineToIndex) {
                        bubble.css('opacity', 0);
                    }
                } else {
                    bubble.remove();
                }
            });
        }

        function spawnBubbles () {
            var index,
                cube,
                y,
                x,
                countToSpawn = parseInt(Math.random() * possibleCountOfBubble, 10);

            for (index = 0; index < countToSpawn; index++) {
                x = parseInt(Math.random() * cols, 10);
                y = rows - 1;
                cube = createCube(x, y, getRendomColor());
                container.append(cube);
            }
        }

        function initialize () {
            nextAnimation();
        }

        initialize();

        return interf;
    };

    return result;

}());
