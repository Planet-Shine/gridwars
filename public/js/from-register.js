/*jslint todo : true, sub : true*/
/*globals $, toPage, __global, validateRegulars, fieldLengths */

(function () {
    var form                      = $(document.forms['form-register']),
        formPrefix                = "form-register__",
        passwordErrorClass        = "form-register__password-error",
        passwordConfirmErrorClass = "form-register__password-confirm-error",
        emailErrorClass           = "form-register__email-error",
        usernameErrorClass        = "form-register__username-error",
        passwordGroupErrorClass   = "form-register__password-group-error",
        formErrorClass            = "form-register__error",
        getErrorElement           = function (name) {
            var elements = {
                'password'         : passwordErrorClass,
                'password-confirm' : passwordConfirmErrorClass,
                'email'            : emailErrorClass,
                'password-group'   : passwordGroupErrorClass,
                'username'         : usernameErrorClass,
                'form'             : formErrorClass
            };
            return form.find("." + elements[name]);
        },
        defaultValidator   = function (value, name) {
            return validateRegulars[name].test(value);
        },
        validators = {
            'username'         : defaultValidator,
            'email'            : defaultValidator,
            'password'         : defaultValidator,
            'password-confirm' : defaultValidator
        },
        defaultExistenceChecker = function (value, name) {
            return !!value;
        },
        existenceCheckers = {
            'username'         : defaultExistenceChecker,
            'email'            : defaultExistenceChecker,
            'password'         : defaultExistenceChecker,
            'password-confirm' : defaultExistenceChecker
        },
        defaultShortChecker = function (value, name) {
            return value.length >= fieldLengths[name].min;
        },
        shortCheckers = {
            'username'         : defaultShortChecker,
            'password'         : defaultShortChecker,
            'password-confirm' : defaultShortChecker
        },
        defaultLongChecker = function (value, name) {
            return value.length <= fieldLengths[name].max;
        },
        longChackers = {
            'username'         : defaultLongChecker,
            'email'            : defaultLongChecker,
            'password'         : defaultLongChecker,
            'password-confirm' : defaultLongChecker
        };

    function hideErrors(name) {
        var errorElement = getErrorElement(name);
        errorElement.children("*")
            .hide(); // Скрываем все ошибки
    }

    function showError (name, classEnd) {
        var errorElement = getErrorElement(name);
        errorElement.children("*")
            .hide();                         // Скрываем все ошибки
        errorElement.children("." + formPrefix + name + "-error-" + classEnd)
                    .show(); // Показываем ошибку.
    }

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

    function checkBeforeSubmitAndShowErrors () {
        var password1 = form.find('[name=password]').val(),
            password2 = form.find('[name=password-confirm]').val();

        if (password1 !== password2) {
            showError("password-group", "do-not-match");
            return false;
        }

        return true;
    }

    function checkAllFieldsAndShowErrors () {
        var result = true,
            fields = $("input[name='password']", form)
            .add("input[name='password-confirm']", form)
            .add("input[name='username']", form)
            .add("input[name='email']", form);

        fields.each(function () {
            result = checkFieldAndShowErrors($(this)) && result; // Если хоть 1 - false, будет false.
        });

        return result;
    }

    function showServerError (status) {
        if (status === "username-not-valid" ||
                status === "password-not-valid" ||
                status === "email-not-valid" ||
                status === "username-already-exists" ||
                status === "email-already-exists" ||
                status === "remove-record-fail" ||
                status === "mail-send-fail") {
            showError("form", "server");
            getErrorElement("form")
                .children("*")
                .hide()
                .find('.form-register__form-error-server-' + status)
                .show();
        }
        if (status === "username-already-exists") {
            showError("username", "already-exists");
        }
        if (status === "email-already-exists") {
            showError("email", "already-exists");
        }
    }


    $(document).on('change', function (event) {
        var target = $(event.target),
            result;
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

    form.on('submit', function (event) {
        var data,
            checkAllFieldsResult    = checkAllFieldsAndShowErrors(),
            checkBeforeSubmitResult = checkBeforeSubmitAndShowErrors();

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        if (!checkAllFieldsResult || !checkBeforeSubmitResult) {
            return false;
        }

        // Деактивитуем все поля формы.
        form.find('input, button').each(function () {
            $(this).prop('disable', true);
        });

        function enableForm () {
            form.find('input, button').each(function () {
                $(this).prop('disable', false);
            });
        }
        data      = form.serialize();

        $.ajax({
            url : form.prop("action"),
            method : "POST",
            data : data,
            // Здесь и ошибки и удачное завершение. Все по textStatus определяется.
            complete: function (jqXHR, textStatus) {
                if (textStatus === "nocontent" || // Разного рода ошибки.
                        textStatus === "error" ||
                        textStatus === "abort" ||
                        textStatus === "parsererror" ||
                        textStatus === "timeout") {
                    showError("form", textStatus);
                    form.find('input').prop("disable", false); // Активируем поля формы.
                    enableForm();
                }
            },
            statusCode : {
                200 : function () {
                    $(".form-register__success-message", form).show();
                    setTimeout(function () {
                        toPage(__global.evaluatePath('/'));
                        $(".form-register__success-message", form).hide();
                        form.find("input").each(function () {
                            $(this).val("");
                        });
                        enableForm();
                    }, 6000);
                },
                500 : function (data) {
                    var responseText = data.responseText;
                    try {
                        responseText = JSON.parse(responseText);
                    } catch (err) {}
                    if (responseText) {
                        data = responseText || {};
                        if (data.status === 'fail') {
                            showServerError(data.error.status);
                        }
                    }
                    enableForm();
                    /*
                        Возможные статусы:

                        username-not-valid
                        password-not-valid
                        email-not-valid
                        username-already-exists
                        email-already-exists
                        remove-record-fail
                        mail-send-fail
                    */
                    form.find('input').prop("disable", false); // Активируем поля формы.
                }
            }
        });

        return false;
    });

}());

