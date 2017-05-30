var express = require('express');
var router = express.Router();
var User = require('models/user').User;

module.exports = function (simpleHandler) {

    router.get('/:hash', function (req, res, next) {
        var reqInfo  = req.reqInfo,
            path     = reqInfo.path,
            page     = reqInfo.page,
            template = reqInfo.template,
            hash     = req.params.hash;

        path     = path.replace('/' + hash, '');
        page     = page.replace('/' + hash, '');
        template = template.replace('/' + hash, '');

        reqInfo['path']           = path;
        reqInfo['page']           = page;
        reqInfo['template']       = template;
        reqInfo['partialOptions'] = {
            'noHash' : false
        };

        simpleHandler(req, res, next);
    });

    router.get('/', function (req, res, next) {
        req.reqInfo['partialOptions'] = {
            'noHash' : true
        };
        simpleHandler(req, res, next);
    });

    return router;
}