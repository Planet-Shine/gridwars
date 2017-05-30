/* jslint todo : true, sub : true*/
/* globals */

var battleOptions = {
    fieldSizes : [
        '10x10',
        '20x10',
        '20x20',
        '40x20',
        '40x40',
        '60x40',
        '60x60'
    ],
    maximumWarriorCount : 10,
    battleOptionsDelimiter : '-'
};


try {
    if (module && module.exports) {
        module.exports = battleOptions;
    }
} catch (err) {}