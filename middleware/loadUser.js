var User = require('models/user').User;

module.exports = function (req, res, next) {
    req.user = res.locals.user = null;
    if (!req.session.user || !req.session.user._id) return next();

    User.findById(req.session.user._id, function (err, user) {
        if (err) return next(err);

        // res.locals - доступен всем шаблонам.
        req.user = res.locals.user = user;
        next();
    });
}