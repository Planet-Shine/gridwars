var express = require('express');
var router = express.Router();
var User = require('models/user').User;

module.exports = function (simpleHandler) {

    function getTemplate(reqInfo) {
        return './' + reqInfo.language + '/email-verification';
    }

    router.get('/:hash', function (req, res, next) {
        var hash    = req.params.hash,
            reqInfo = req.reqInfo;

        function errorIssue () {
            return res.render(getTemplate(reqInfo), {
                path                 : reqInfo.path,
                page                 : './email-verification',
                partialOptions       : {
                    emailAlreadyVerified : false,
                    isError              : true
                }
            });
        }

        // ...
        User.findOne({_emailVerifyHash : hash}, function (err, user) {
            if (err) {
                errorIssue();
            }
            if (user) {
                if (user.emailVerified) {
                    return res.render(getTemplate(reqInfo), {
                        path                 : reqInfo.path,
                        page                 : './email-verification',
                        partialOptions       : {
                            emailAlreadyVerified : true,
                            isError              : false
                        }
                    });
                } else {
                    user.emailVerified = true;
                    user.save(function (err) {
                        if (err) {
                            errorIssue();
                        }
                        return res.render(getTemplate(reqInfo), {
                            path                 : reqInfo.path,
                            page                 : './email-verification',
                            partialOptions       : {
                                emailAlreadyVerified : false,
                                isError              : false
                            }
                        });
                    });
                }
            } else {
                errorIssue();
            }
        });

    });

    return router;
}


