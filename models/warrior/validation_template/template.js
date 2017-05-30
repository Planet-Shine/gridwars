var __global__ = {},
    register,
    getWarrior;

(function () {
    var warrior;
    __global__.register = function (newWarrior) {
        warrior = newWarrior;
    }
    getWarrior = function () {
        return warrior;
    }
}());

(function () {
    var getWarrior     = undefined, // Залепляем подгруз модулей и переменных, чтоб не хакнули.
        require        = undefined,
        __dirname      = undefined,
        __filename     = undefined,
        clearImmediate = undefined,
        console        = undefined,
        exports        = undefined,
        global         = undefined,
        module         = undefined,
        setImmediate   = undefined;

    __global__.Number     = Number;
    __global__.String     = String;
    __global__.parseInt   = parseInt;
    __global__.parseFloat = parseFloat;
    __global__.Object     = Object;
    __global__.Array      = Array;

    // header end



    // footer begin

}());

module.exports.warrior = getWarrior();