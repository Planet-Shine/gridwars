/* todo : true, sub : true*/
/* global history, $ */

(function () {

    var form = $("form[name=form-change-password]"),
        formPrefix                = "form-change-password__",
        passwordErrorClass        = "form-change-password__password-error",
        passwordConfirmErrorClass = "form-change-password__password-confirm-error",
        passwordGroupClass        = "form-change-password__password-group-error",
        formErrorClass            = "form-change-password__form-error",
        currentPasswordClass      = 'form-change-password__current-password-error',
        defaultValidator          = function (value, name) {
            return validateRegulars[name].test(value);
        },
        validators = {
            'password'         : defaultValidator,
            'password-confirm' : defaultValidator
        },
        getErrorElement           = function (name) {
            var elements = {
                'current-password' : currentPasswordClass,
                'password-group'   : passwordGroupClass,
                'password'         : passwordErrorClass,
                'password-confirm' : passwordConfirmErrorClass,
                'form'             : formErrorClass
            };
            return form.find("." + elements[name]);
        },
        defaultExistenceChecker = function (value) {
            return !!value;
        },
        existenceCheckers = {
            'current-password' : defaultExistenceChecker,
            'password'         : defaultExistenceChecker,
            'password-confirm' : defaultExistenceChecker
        },
        defaultShortChecker = function (value, name) {
            return value.length >= fieldLengths[name].min;
        },
        shortCheckers = {
            'password'         : defaultShortChecker,
            'password-confirm' : defaultShortChecker
        },
        defaultLongChecker = function (value, name) {
            return value.length <= fieldLengths[name].max;
        },
        longChackers = {
            'password'         : defaultLongChecker,
            'password-confirm' : defaultLongChecker
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
        errorElement.find("." + formPrefix + name + "-error-" + classEnd)
            .show(); // Показываем ошибку.
    }

    function checkAllFieldsAndShowErrors () {
        var result = true,
            fields = $("input[name='password']", form)
                .add("input[name='password-confirm']", form);

        fields.each(function () {
            result = checkFieldAndShowErrors($(this)) && result; // Если хоть 1 - false, будет false.
        });

        return result;
    }

    function checkBeforeSubmitAndShowErrors () {
        var password1 = form.find('[name=password]').val(),
            password2 = form.find('[name=password-confirm]').val();

        if (password1 !== password2) {
            showError("password-group", "do-not-match");
            return false;
        }

        return true;
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
            if (/password/.test(name)) {
                showError("password-group", null);
            }
        }
    });


    form.submit(function (event) {
        var checkAllFieldsResult    = checkAllFieldsAndShowErrors(),
            checkBeforeSubmitResult = checkBeforeSubmitAndShowErrors();

        if (!checkAllFieldsResult || !checkBeforeSubmitResult) {
            return false;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        $.ajax({
            method : form.prop('method'),
            url    : form.prop('action'),
            data   : form.serialize(),
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
                    if (data.status === 'success') {
                        $(".form-password-recovery__success-message", form).show();
                    } else if (data.status === 'fail') {
                        showError("form", data.error.status);
                    }
                },
                401 : function () {
                    showError("form", "forbidden");
                },
                500 : function (data) {
                    showError("form", "server");
                    form.find('input').prop("disable", false); // Активируем поля формы.
                }
            }
        });

        return false;
    });

}());