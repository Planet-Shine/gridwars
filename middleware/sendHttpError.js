module.exports = function (req, res, next) {
    res.sendHttpError = function (error) {
        res.status(error.status);
        if (res.req.headers['x-requested-with'] == 'XMLHttpRequest') { // AJAX
            res.json(error);
        } else {    // Обычный.
            res.render("error", {error : error});
        }
    }

    next();

}