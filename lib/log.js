var winston = require('winston');
var ENV = process.env.NODE_ENV;

function getLogger (module) {
    var path = module.filename.split('\\').slice(-2).join('/');
    return new winston.Logger({
        transports : [
            new winston.transports.Console({
                colorize: true,
                level: ENV == 'development' ? 'debug' : 'error',
                label: path
            }),
            new winston.transports.File({
                maxsize : 50000000, // Около 50 мб
                maxFiles : 5, // 5 файлов
                name: 'error-file',
                filename: 'filelog-error.log',
                level: ENV == 'development' ? 'debug' : 'error',
                label: path
            })
        ]
    });
}

module.exports = getLogger;