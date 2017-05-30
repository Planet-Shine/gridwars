/*jslint todo : true, sub : true*/
/*globals $, toPage, __global, battleOptions */

(function () {
    var form              = $(document.forms['form-battle-options']),
        fieldSize         = form.find("[name='field-size']"),
        warrior           = form.find("[name='warrior']"),
        warriorSelectHtml = $('.form-battle-options__warriors').get(0).outerHTML,
        submitButton      = form.find("button[type='submit']");

    function addNewWarriorSelect () {
        form.find('.form-battle-options__warriors:last').after(warriorSelectHtml);
    }

    function removeNewWarriorSelect () {
        form.find('.form-battle-options__warriors:last').remove();
    }

    function tryToRemoveLast () {
        var warriors = form.find('[name="warrior"]');
        if (warriors.length > 1 &&
            !$(warriors.get(warriors.length - 1)).val() &&
            !$(warriors.get(warriors.length - 2)).val()) {
            removeNewWarriorSelect();
            tryToRemoveLast();
        }
    }

    function isAnyoneWarriorHaveVal () {
        var result = false;
        form.find('[name="warrior"]').each(function () {
            var item = $(this);
            if (item.val()) {
                result = true;
            }
        });
        return result;
    }

    form.keydown(function (event) {
        var target = $(event.target),
            name = $(target).attr('name');

        if (name === 'warrior-text') {
            setTimeout(function () {
                var value = target.val(),
                    relatedSelect = target.closest('.form-battle-options__warriors').find('select');
                if (value) {
                    relatedSelect.find('option').hide();
                    relatedSelect.find('option[value*="' + value +'"]').show();
                } else {
                    relatedSelect.find('option').show();
                }
            }, 0);
        }
    });

    form.change(function (event) {
        var target = $(event.target),
            name   = target.attr('name'),
            value  = target.val();

        if (name === 'warrior') {
            if (target.is(form.find('[name="warrior"]:last')) &&
                    form.find('[name="warrior"]').length < battleOptions.maximumWarriorCount) {
                if (value) {
                    addNewWarriorSelect();
                }
            }
            tryToRemoveLast();
        }

        if (fieldSize.val() && isAnyoneWarriorHaveVal()) {
            submitButton.removeAttr('disabled');
        } else {
            submitButton.attr('disabled', 'disabled');
        }

    });


    form.on('submit', function (event) {
        var form = $(this),
            warriors = _.map(form.find('[name="warrior"]'), function (item) {
                return $(item).val();
            }).filter(function (item) {
                return item;
            }).sort().join(battleOptions.battleOptionsDelimiter),
            additionalString = fieldSize.val() + battleOptions.battleOptionsDelimiter + warriors,
            action = form.attr('action') + '/' + additionalString;

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        window.location.href = __global.evaluatePath(action);
        return false;
    });


}());