var warriorLib = {
    comvarBitLength : 32,
    emptyComvar : "00000000000000000000000000000000",
    clockwiseSearch : [0,1,2,5,8,7,6,3],
    counterclockwiseSearch : [3,6,7,8,5,2,1,0],
    neighborOffsets : {
        0 : [-1,-1],
        1 : [0,-1],
        2 : [1,-1],
        3 : [-1,0],
        5 : [1,0],
        6 : [-1,1],
        7 : [0,1],
        8 : [1,1]
    },
    neighborSheet : {
        0 : [1,3],
        1 : [0,2],
        2 : [1,5],
        3 : [0,6],
        5 : [2,8],
        6 : [3,7],
        7 : [6,8],
        8 : [5,7]
    },
    getNeighborIndexes : function (index) {
        return [].concat(this.neighborSheet[String(index)]);
    },
    getOffsetOfNeighborByIndex : function (index) {
        return [].concat(this.neighborOffsets[String(index)]);
    },
    getIsStartCellOnFirstStep : function (comvarSet) {
        comvarSet = [].concat(comvarSet);
        if (comvarSet.splice(4, 1)[0] === this.emptyComvar) {
            comvarSet = comvarSet.join("");
            return comvarSet.length === 8 && !parseInt(comvarSet, 10);
        } else {
            return false;
        }
    },
    getBitNumber : function (boolean) {
        return Number(boolean);
    },
    getComvarCompletion : function (comvarPart) {
        return this.emptyComvar.slice(0, this.comvarBitLength - comvarPart.length);
    },
    completeComvar : function (comvarPart) {
        return this.getComvarCompletion(comvarPart) + comvarPart;
    },
    getIsEmptyComvar : function (testComvar) {
        return this.emptyComvar === testComvar;
    },
    getSignedNumberFromBinary : function (comvar, startIndex, countOfBits) {
        var num = parseInt(comvar.slice(startIndex, startIndex + 1), 10);
        return (num ? -1 : 1) * this.getNumberFromBinary(comvar, startIndex + 1, countOfBits - 1);
    },
    getNumberFromBinary : function (comvar, startIndex, countOfBits) {
        var num = comvar.slice(startIndex, startIndex + countOfBits);
        num = parseInt(num, 2);
        return num;
    },
    toSignedBinaryNumber : function (num, countOfBits) {
        var singBit;
        if (num < 0) {
            singBit = '1';
        } else {
            singBit = '0';
        }
        num = Math.abs(num);
        return singBit + this.toBinaryNumber(num, countOfBits - 1);
    },
    toBinaryNumber : function (num, countOfBits) {
        return Number(num + Math.pow(2, countOfBits + 1)).toString(2).slice(-countOfBits);
    }
};