/* jslint todo : true, sub : true*/
/* globals */

var fieldLengths = {
    'email'    : {
        'min' : 0,
        'max' : 50
    },
    'password' : {
        'min' : 5,
        'max' : 50
    },
    'username' : {
        'min' : 2,
        'max' : 50
    }
};

fieldLengths['password-confirm'] = fieldLengths['password'];


try {
    if (module && module.exports) {
        module.exports = fieldLengths;
    }
} catch (err) {}