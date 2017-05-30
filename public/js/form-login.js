/*jslint todo : true, sub : true*/
/*globals $, toPage, __global */

(function () {
    var form                      = $(document.forms['form-login']),
        formPrefix                = "form-login__",
        passwordErrorClass        = "form-login__password-error",
        usernameErrorClass        = "form-login__username-error",
        formErrorClass            = "form-login__form-error",
        getErrorElement           = function (name) {
            var elements = {
                'username'         : usernameErrorClass,
                'password'         : passwordErrorClass,
                'form'             : formErrorClass
            };
            return form.find("." + elements[name]);
        },
        defaultExistenceChecker = function (value, name) {
            return !!value;
        },
        existenceCheckers = {
            'username' : defaultExistenceChecker,
            'password' : defaultExistenceChecker
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
                .add("input[name='username']", form);

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

    form.on('submit', function (event) {
        var form = $(this);

        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        if (!checkAllFieldsAndShowErrors()) {
            return false;
        }

        form.find('input, button').each(function () {
            $(this).prop('disable', true);
        });

        function enableForm () {
            form.find('input, button').each(function () {
                $(this).prop('disable', false);
            });
        }

        $.ajax({
            url: "/login",
            method: "POST",
            data: form.serialize(),
            // Здесь и ошибки и удачное завершение. Все по textStatus определяется.
            complete: function (jqXHR, textStatus) {
                if (textStatus === "nocontent" || // Разного рода ошибки.
                    textStatus === "error" ||
                    textStatus === "abort" ||
                    textStatus === "parsererror" ||
                    textStatus === "timeout") {
                    showError("form", textStatus);
                    enableForm();
                }
            },
            statusCode : {
                200 : function () {
                    $(".form-login__success-message", form).show();
                    setTimeout(function () {
                        $(".form-login__success-message", form).hide();
                        form.find('input').each(function () {
                            $(this).val('');
                        });
                        enableForm();
                        window.location = __global.evaluatePath('/');
                    }, 2000);
                },
                401 : function () {
                    showError("form", "forbidden");
                    enableForm();
                },
                500 : function (data) {
                    showError("form", "server");
                    enableForm();
                }
            }
        });

        return false;
    });
}());


