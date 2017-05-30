var express = require('express');
var router = express.Router();

function simpleHandler (req, res, next) {
    var reqInfo = req.reqInfo;
    res.render(reqInfo.template, {
        page           : reqInfo.page,
        path           : reqInfo.path,
        partialOptions : reqInfo.partialOptions || {}
    });
}

router.get('/', simpleHandler);

router.get('/register', simpleHandler);

router.get('/login', simpleHandler);

router.get('/profile', require('./profile')(simpleHandler));

router.use('/battle', require('./battle')(simpleHandler));

router.use('/email-verification', require('./email-verification')(simpleHandler));

router.use('/password-recovery', require('./password-recovery')(simpleHandler));

router.use('/password-recovery-order', simpleHandler);

router.use('/rules', simpleHandler);

router.use('/about', simpleHandler);

router.use('/article', simpleHandler);

router.use('/article/ai-check', simpleHandler);

router.use('/article/faq', simpleHandler);

router.use('/article/how-to-create-warrior', simpleHandler);

router.use('/article/typical-task-resolves', simpleHandler);

module.exports = router;