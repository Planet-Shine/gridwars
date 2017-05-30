var crypto = require('crypto');
var fileNameLength = 8;

function getPartOfRandomHash(length) {
    var hash = getRandomHash();
    if (length > hash.length) {
        return hash;
    } else if (length <= 0) {
        return null;
    } else {
        return hash.slice(0, length);
    }
}

function getFileName () {
    return getPartOfRandomHash(fileNameLength);
}

function getRandomHash () {
    var salt = Math.random() + '';
    return crypto.createHmac('sha1', salt).digest('hex');
}

module.exports.getRandomHash = getRandomHash;

module.exports.getFileName   = getFileName;