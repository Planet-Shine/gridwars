/* jslint todo : true, sub : true*/
/* globals */

var symbolSets = {
    'password'     : "(A-Z), (a-z), (0-9), (._)",
    'username'     : "(A-Z), (a-z), (0-9), (._)",
    'warrior_name' : "(A-Z), (a-z), (0-9), (._)"
};

symbolSets['password-confirm'] = symbolSets['password'];

try {
    if (module && module.exports) {
        module.exports = symbolSets;
    }
} catch (err) {}
