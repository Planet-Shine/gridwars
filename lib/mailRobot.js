var ejs = require('ejs');
var nodemailer = require('nodemailer');
var config = require('config');
var async = require('async');
var path = require('path');


module.exports.extractMailOptions = function (letterName, options, callback) {
    async.series([
        function (callback) {
            ejs.renderFile(path.join(config.get('templateDirName'), 'ru/email/from.ejs'),
                options,
                function (err, from) {
                    callback(null, from);
                });
        },
        function (callback) {
            ejs.renderFile(path.join(config.get('templateDirName'), 'ru/email/' + letterName + '/subject.ejs'),
                options,
                function (err, subject) {
                    callback(null, subject);
                });
        },
        function (callback) {
            ejs.renderFile(path.join(config.get('templateDirName'), 'ru/email/' + letterName + '/text.ejs'),
                options,
                function(err, text) {
                    callback(null, text);
                });
        }
    ], function (err, results) {
        if (err) {
            callback(err);
        } else {
            var mailOpts = {
                from    : results[0],
                subject : results[1],
                html    : results[2]
            };
            callback(null, mailOpts);
        }
    });
}

module.exports.send = function (mailOptions, callback) {
    var transporter = nodemailer.createTransport({
            host : config.get('broadcastEmail:host'),
            port : config.get('broadcastEmail:port'),
            secure : config.get('broadcastEmail:secure'),
            auth: {
                user : config.get('broadcastEmail:user'),
                pass : config.get('broadcastEmail:password')
            },
            tls: {
                rejectUnauthorized: false
            }
        });

    transporter.sendMail(mailOptions, callback);

}