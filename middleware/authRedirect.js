var cookie = require('cookie');
var config = require('config');
var HttpError = require('error').HttpError;

module.exports = function (req, res, next) {
    var clientUserName = req.cookies.username;

    if (clientUserName !== undefined) {
        clientUserName = eval(clientUserName);
        // Если пятаемся динамическую загрузку сделать.
        if (res.req.method === "GET" &&
            res.req.headers['x-requested-with'] == 'XMLHttpRequest') { // AJAX
            // Если есть имя, которым подписали загрузку, то пытаемся проверить актуальность пользователя.
            if ((req.user && req.user.username !== clientUserName) ||
                (!req.user && clientUserName)) { // Если пользователь как-то сменился, по перенаправляем.
                res.json({
                    "refresh" : true,
                    "href"    : req.url
                });
                return;
            }
        }
    }

    next();
}