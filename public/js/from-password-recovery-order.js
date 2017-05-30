/* todo : true, sub : true*/
/* global history, $ */

(function () {
    var form            = $("form[name=form-password-recovery-order]"),
        formPrefix      = "form-password-recovery-order__",
        emailClass      = "form-password-recovery-order__email-error",
        formErrorClass  = "form-password-recovery-order__form-error",
        getErrorElement = function (name) {
            var elements = {
                'email'   : emailClass,
                'form'    : formErrorClass
            };
            return form.find("." + elements[name]);
        },
        defaultExistenceChecker = function (value) {
            return !!value;
        },
        existenceCheckers = {
            'email' : defaultExistenceChecker
        },
        defaultValidator   = function (value, name) {
            return validateRegulars[name].test(value);
        },
        validators = {
            'email' : defaultValidator
        },
        defaultLongChecker = function (value, name) {
            return value.length <= fieldLengths[name].max;
        },
        longChackers = {
            'email' : defaultLongChecker
        },
        defaultShortChecker = function (value, name) {
            return value.length >= fieldLengths[name].min;
        },
        shortCheckers = {
            'email' : defaultShortChecker
        };

    function checkFieldAndShowErrors(target) {
        var value = target.val(),
            name  = target.attr('name');

        if (existenceCheckers[name]) {
            if (!existenceCheckers[name](value, name)) {
                showError(name, 'required');
                return false;
            }
        }

        if (shortCheckers[name]) {
            if (!shortCheckers[name](value, name)) {
                showError(name, 'too-short');
                return false;
            }
        }

        if (longChackers[name]) {
            if (!longChackers[name](value, name)) {
                showError(name, 'too-long');
                return false;
            }
        }

        if (validators[name]) {
            if (!validators[name](value, name)) {
                showError(name, 'not-valid');
                return false;
            }
        }
        hideErrors(name);
        return true;
    }

    function hideErrors(name) {
        var errorElement = getErrorElement(name);
        errorElement.children("*")
            .hide(); // Скрываем все ошибки
    }

    function showError (name, classEnd) {
        var errorElement = getErrorElement(name);
        errorElement.children("*")
            .hide(); // Скрываем все ошибки.
        errorElement.children("." + formPrefix + name + "-error-" + classEnd)
            .show(); // Показываем ошибку.
    }

    function checkAllFieldsAndShowErrors () {
        var result = true,
            fields = $("input[name='email']", form);

        fields.each(function () {
            result = checkFieldAndShowErrors($(this)) && result; // Если хоть 1 - false, будет false.
        });

        return result;
    }

    $(document).on('change', function (event) {
        var target = $(event.target);
        if (target.closest(form)) {
            checkFieldAndShowErrors(target);
        }
    });

    $(document).on('keydown', function (event) {
        var target = $(event.target),
            name;
        if (target.closest(form) && target.is('input')) {
            name = target.prop('name');
            if (name) {
                showError(name, null);
                showError("form", null);
            }
        }
    });


    form.submit(function (event) {

        if (!checkAllFieldsAndShowErrors()) {
            return false;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        $.ajax({
            method : form.prop('method'),
            url : form.prop('action'),
            data: form.serialize(),
            complete: function (jqXHR, textStatus) {
                if (textStatus === "nocontent" || // Разного рода ошибки.
                    textStatus === "error" ||
                    textStatus === "abort" ||
                    textStatus === "parsererror" ||
                    textStatus === "timeout") {
                    showError("form", textStatus);
                    form.find('input').prop("disable", false); // Активируем поля формы.
                }
            },
            statusCode : {
                200 : function (data) {
                    if (data.status === 'fail') {
                        if (data.error.status === 'wrong-password') {
                            showError("form", data.error.status);
                        } else if (data.error.status === 'no-such-user') {
                            showError("email", data.error.status);
                        }
                    } else {
                        form.find('input').prop("disable", false); // Активируем поля формы.
                        $(".form-password-recovery-order__success-message", form).show();
                        setTimeout(function () {
                            toPage(__global.evaluatePath('/'));
                        }, 2000);
                    }
                },
                401 : function () {
                    showError("form", "forbidden");
                },
                500 : function (data) {
                    showError("form", "server");
                }
            }
        });
        return false;
    });

}());