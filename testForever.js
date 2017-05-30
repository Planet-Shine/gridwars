var util = require('util');

setTimeout(function () {
    console.log('Throwing error now.');
    throw new Error('User generated fault.');
}, 200);