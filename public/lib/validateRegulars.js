/* jslint todo : true, sub : true*/
/* globals */

var validateRegulars = {
    'email'            : /^[a-zA-Z0-9\._\-]+@[a-zA-Z0-9\-]+\.(?:[a-zA-Z0-9\-\.]+)+$/i,
    'warrior_name'     : /^[a-zA-Z][a-zA-Z0-9\._\-]+$/i,
    'password'         : /^[a-zA-Z][a-zA-Z0-9\._\-]+$/i,
    'username'         : /^[a-zA-Z][a-zA-Z0-9\._\-]+$/i,
    'warriorname'      : /^[a-zA-Z][a-zA-Z0-9\._\-]+$/i,
    'description'      : /^[a-zA-Z0-9\._\-\ ]+$/i
};

validateRegulars['password-confirm'] = validateRegulars['password'];

try {
    if (module && module.exports) {
        module.exports = validateRegulars;
    }
} catch (err) {}









