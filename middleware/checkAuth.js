var HttpError = require('error').HttpError;

module.exports = function (req, res, next) {
    // Проверяем, что пользователь сменился, и перенаправляем на страницу с ее обновлением.
    if (!req.session.user) {
        return next(new HttpError(401, "Вы не авторизованы"));
    }

    next();
}