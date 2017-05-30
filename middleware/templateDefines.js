/* jslint todo : true, sub : true*/
/* globals */
var config = require('config');

module.exports = function (req, res, next) {

    function getNowTime () {
        var d = new Date();
        var loc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
        return loc;
    }
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + s4();
    }

    res.locals.symbolSets    = require('public/lib/symbolSets');
    res.locals.fieldLengths  = require('public/lib/fieldLengths');
    res.locals.ttl           = require('public/lib/ttl');
    res.locals.dbLimits      = require('public/lib/dbLimits');
    res.locals.battleOptions = require('public/lib/battleOptions');
    res.locals.currentYear   = (new Date()).getFullYear();
    res.locals.isMenuOpened  = true;
    res.locals.serverNow     = getNowTime();
    res.locals.currentUrl    = config.get('host') + req.originalUrl;
    res.locals.siteHost      = config.get('host');
    res.locals.PAGE_GUID     = guid();
    res.locals.isCommentPage = false;

    next();
};