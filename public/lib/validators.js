/* jslint todo : true, sub : true*/
/* globals */

var validators = {

    comvarTestReg : /^[01]{32}$/,

    isValidComvar32BitWord : function (comvar) {
        if (this.comvarTestReg.test(comvar)) {
            return true;
        } else {
            return false;
        }
    },

    isValidNeighborIndex : function (index) {
        if (index > 8 || index < 0 || index === 4) {
            return false;
        } else {
            return true;
        }
    },

    isValidShootResult : function (result) {
        if (!(result instanceof Array)) {
            return false;
        }
        if (result.length !== 4) {
            return false;
        }
        if (!this.isValidComvar32BitWord(result[3])) {
            return false;
        }
        if (!this.isValidNeighborIndex(result[0])) {
            return false;
        }
        if (!this.isValidNeighborIndex(result[1])) {
            return false;
        }
        if (!this.isValidNeighborIndex(result[2])) {
            return false;
        }
        return true;
    }
};

try {
    if (module && module.exports) {
        module.exports = validators;
    }
} catch (err) {}

