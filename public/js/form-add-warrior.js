/* jslint todo : true, sub : true */
/* globals $, document, AjaxUpload, _ */

(function () {
    var forms              = $(".form-add-warrior"),
        messageHideTimeout = 1E4,
        timeoutDescriptor;

    (function () {
        $('.warrior-from-hint').each(function () {
            var dateDiv   = $(this).find('.warrior-from-hint-date'),
                timestamp = parseInt(dateDiv.html(), 10),
                date;
            if (!isNaN(timestamp) && timestamp) {
                date = __global.getLocalTime(new Date(timestamp));
                dateDiv.html(__global.getDateOutput(date));
                $(this).show();
            }
        });
    }());

    function parseResponse (input) {
        var result,
            firstIndex,
            lastIndex;

        input = String(input);
        firstIndex = input.indexOf("{");
        lastIndex = input.lastIndexOf("}") + 1;

        input = input.slice(firstIndex, lastIndex);
        result = JSON.parse(input);

        return result;
    }

    forms.each(handleForm);

    function handleForm () {
        var form       = $(this),
            btnUpload  = form.find('.btn-upload'),
            title      = form.find('.form-add-warrior__title').find('.warrior-name'),
            dateTitle  = form.find('.form-add-warrior__title').find('.warrior-from-hint-date'),
            fromHint   = form.find('.form-add-warrior__title').find('.warrior-from-hint'),
            errorBox   = form.find('.form-add-warrior__error'),
            successBox = form.find('.form-add-warrior__success-message');


        function delayHideMessages () {
            clearTimeout(timeoutDescriptor);
            timeoutDescriptor = setTimeout(hideMessages, messageHideTimeout);
        }

        function hideMessages () {
            errorBox.hide();
            errorBox.children().hide();
            successBox.hide();
        }

        function showFormSuccessStatus (warrior) {
            title.html(warrior.name);
            dateTitle.html(__global.getDateOutput(__global.getLocalTime(new Date(warrior.createTimeStamp))));
            fromHint.show();
            successBox.show();
            delayHideMessages();
        }

        function showFormError (status) {
            errorBox.show();
            errorBox.find(".form-add-warrior__error-" + status).show();
            delayHideMessages();
        }

        new AjaxUpload(btnUpload, {
            action : form.prop('action'),
            //Имя файлового поля ввода
            name : 'uploadfile',
            onSubmit : function (file, ext) {
                // show loader ...
            },
            onComplete : function(file, response) {
                response = parseResponse(response);
                if (response.status === "success") {
                    showFormSuccessStatus(response.warrior);
                } else if (response.status === "fail") {
                    if (response.error instanceof Array) {
                        _.each(response.error, function (error) {
                            showFormError(error.status);
                        });
                    } else {
                        showFormError(response.error.status);
                    }
                }
            }
        });

        form.submit(function  () {
            return false;
        });

    }

}());