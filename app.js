var express = require('express');
var path = require('path');
var connect = require('connect');
var logger = require('morgan');
var log = require('lib/log')(module);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var HttpError = require('error').HttpError;
var favicon = require('serve-favicon');
var mongoose = require('lib/mongoose');
var config = require('config');
var app = express();
var busboy = require('connect-busboy');

config.set('rootDirName', __dirname);
config.set('templateDirName', path.join(__dirname, 'templates'));

// view engine setup
app.use(busboy());
app.engine('ejs', require('ejs-locals')); // layout partial block
app.set('views', config.get('templateDirName'));
app.set('view engine', 'ejs');

// Сохраняем рут, чтобы удобно привязываться было.
// Ставим определения шаблонов.
app.use(require('middleware/templateDefines'));

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') === 'development') {
    app.use(logger('dev'));
} else {
    app.use(logger('default'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var sessionStore = require('lib/sessionStore');

// username: Petya.SHA256(Petya + secret)
app.use(connect.session({
    'secret' : config.get('session:secret'),
    // ASDAS3425223DQWQW4562365.SHA256(на основе идентификатора и нашей секретной строки).
    // Буквенно-цифровой идентификатор. Будет автоматически сгенерированн.
    // SHA256 нужно для сохранения на стороне пользователя данных, которые он не сможет подделать.
    'key'    : config.get('session:key'),
    'cookie' : config.get('session:cookie'),
    'store'  : sessionStore
})); // connect.sid - специальная кука, что ставится пользователю по входу.

app.use(require('middleware/sendHttpError'));
app.use(require('middleware/loadUser'));

// Мидлвер, разбирающий урлу на состовляющие, значимые:
// путь, частичный, язык.
app.use(require('lib/urlSplitter'));
app.use(require('middleware/authRedirect'));

require('routes')(app);

app.use(express.static(path.join(__dirname, 'public')));


// app.use('/users', users);

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
*/

// Middleware // Конечный обработчик ошибок.
app.use(function (err, req, res, next) {
    // length = 4, следовательно express может понять,
    // что это обработчик ошибок
    // NODE_ENV=production
    if (typeof err == 'number') { // next(404);
        err = new HttpError(err);
    }

    if (err instanceof HttpError) {
        log.error(err);
        res.sendHttpError(err);
    } else {
        if (app.get('env') == 'development') {
            log.error(err);
            var errorHandler = connect.errorHandler();
            errorHandler(err, req, res, next);
        } else {
            log.error(err);
            err = new HttpError(500);
            res.sendHttpError(err);
        }
    }
});


module.exports = app;
