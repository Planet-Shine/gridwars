var __warrior,
    global = {},
    env;

global.register = function (warrior, name) {
    __warrior = warrior;
};

(function () {


    env = {

        shootTestPlayerCount : 15,

        defaultTestCountOfShoots : 10,

        getComvar : function () {
            var comvar = (Math.random() * 1E17).toString(2).slice(0, 32);
            return comvar;
        },

        getComvarSetVector : function () {
            var comvar = this.getComvar(),
                result = [];
            comvar = comvar.slice(0, 9);
            for (var index = 0; index < comvar.length; index += 1) {
                if (index === 4) {
                    result.push(true);
                } else {
                    result.push(!!parseInt(comvar[index], 10));
                }
            }
            return result;
        },

        getRandomPlayerNumber : function () {
            var count = this.shootTestPlayerCount + 1;
            return parseInt(Math.random() * count, 10);
        },

        generateRandomComvarSet : function () {
            var self            = this,
                result          = [],
                сomvarSetVector = this.getComvarSetVector();

            сomvarSetVector.forEach(function (isSetComvar) {
                if (isSetComvar) {
                    result.push(self.getComvar());
                } else {
                    result.push(self.getRandomPlayerNumber());
                }
            });
            return result;
        },

        callShootTest : function (name, warriorPath, callback) {
            var self                  = this,
                shootResults          = [],
                results               = {},
                countOfShoots         = this.defaultTestCountOfShoots,
                randomComvarSet       = [],
                isError               = false,
                killProcessDescriptor,
                index,
                result,
                comvarSet,
                startTime,
                isFinished = false,
                warriorModule,
                time,
                isChildReady = false;


            for (index = 0; index < countOfShoots; index += 1) {
                randomComvarSet.push(this.generateRandomComvarSet());
            }

            for (index = 0; index < countOfShoots; index += 1) {
                shootResults.push(__warrior(randomComvarSet[index]));
            }
            console.log(shootResults);

        }
    }


}());