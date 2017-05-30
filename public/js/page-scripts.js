$(function () {
    var leftAnimation,
        rightAnimation;

    (function () {
        var logoBar = $('.logo-bar'),
            position = 0,
            fps = 33,
            timeout = 1000 / fps,
            speed = 3,
            delta = speed/timeout,
            cssRule = 'background-position-x';

        if (parseInt(Math.random() * 2, 10)) {
            delta *= -1;
        }
        if (parseInt(Math.random() * 2, 10)) {
            cssRule = 'background-position-y';
        }

        function animateHeader () {
            position += delta;
            logoBar.css(cssRule, parseInt(position, 10) + "px");
            setTimeout(animateHeader, timeout);
        }
        animateHeader();
    }());

    (function () {
        var options = {
            'cellSpeed' : 0.45,
            'fps' : 30,
            'speed' : 9,
            'container' : $('.slide-animation-left'),
            'subContainer' :$('.slide-animation-left-sub'),
            'from' : 'left',
            'to' : 'right',
            'size' : 15,
            'padding' : 4,
            'lineFrom' : 0.5,
            'lineTo' : 1,
            'align' : 'bottom'
        };
        leftAnimation = $cube.lineStream(options);

        options = {
            'cellSpeed' : 0.45,
            'fps' : 30,
            'speed' : 9,
            'container' : $('.slide-animation-right'),
            'subContainer' : $('.slide-animation-right-sub'),
            'from' : 'right',
            'to' : 'left',
            'size' : 15,
            'padding' : 4,
            'lineFrom' : 0.5,
            'lineTo' : 1,
            'align' : 'bottom'
        };
        rightAnimation = $cube.lineStream(options);

        var options = {
            'cellSpeed'             : 0.7,
            'possibleCountOfBubble' : 20,
            'bubbleSpawnIteration'  : 0.3,
            'fps'                   : 30,
            'container'             : $(".footer-animation"),
            'size'                  : 10,
            'padding'               : 4,
            'lineFrom'              : 0.7,
            'lineTo'                : 1
        };
        $cube.bubbling(options);

    }());

    function switchFloat (box) {
        var float = box.css('float');
        if (float === 'right') {
            box.css('float', 'left');
        } else {
            box.css('float', 'right');
        }
    }

    function switchAnimationDirections () {
        var leftAnimationBox,
            leftAnimationBoxParent,
            rightAnimationBox,
            rightAnimationBoxParent;
        if (parseInt(Math.random() * 2, 10)) {
            leftAnimationBox        = $('.slide-animation-left');
            rightAnimationBox       = $('.slide-animation-right');
            leftAnimationBoxParent  = leftAnimationBox.parent();
            rightAnimationBoxParent = rightAnimationBox.parent();
            leftAnimationBoxParent.append(rightAnimationBox);
            rightAnimationBoxParent.append(leftAnimationBox);
            switchFloat(rightAnimationBox);
            switchFloat(leftAnimationBox);
        }
    }

    function stopMenuAnimations () {
        leftAnimation.stop();
        rightAnimation.stop();
        leftAnimation.switchColor();
        rightAnimation.switchColor();
    }

    $(document).click(function (event) {
        var target   = $(event.target),
            logoItem = target.closest('.logo');

        if (logoItem.length) {
            if (logoItem.is('.closed')) { // Если закрыт, то предстоит открытие.
                switchAnimationDirections();
                leftAnimation.start();
                rightAnimation.start();
            } else {
                stopMenuAnimations();
            }
            logoItem.toggleClass("closed");
            $('.main-menu').toggleClass("opened");
            $('.logo-bar').toggleClass("opened");
        }

    });

    switchAnimationDirections();

    if ($('.logo').is('.closed')) {
        stopMenuAnimations();
    }

});