var express = require('express');
var router = express.Router();
var pageRouter = require('./page');

/* GET users listing. */
router.use('/', pageRouter);

module.exports = router;
