var express = require('express');
var languageRouter = require('./language');
var universalRouter = require('./universal');

function routerFactory (app) {

    app.use('/ru', languageRouter);
    app.use('/eng', languageRouter);
    app.use('/partial/ru', languageRouter);
    app.use('/partial/eng', languageRouter);
    app.use('/', universalRouter);
    app.use('/ru/email-verification', require('./email-verification'));
    app.use('/eng/email-verification', require('./email-verification'));

    return false;
}

module.exports = routerFactory;

