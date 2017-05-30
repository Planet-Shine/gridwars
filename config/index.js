var nconf = require('nconf');
var path = require('path');
var ENV = process.env.NODE_ENV;

var result = nconf.argv().env();

if (ENV === 'production') {
    result.file({ file: path.join(__dirname, 'prodconfig.json') });
} else {
    result.file({ file: path.join(__dirname, 'config.json') });
}

module.exports = nconf;