global.register(function (comvarSet) {
    var warrior = {
        shoot : function (comvarSet) {
            // ....
            var shoot1 = parseInt(Math.random() * 8, 10),
                result;

            if (shoot1 === 4) {
                shoot1++;
            }

            var myLib = {
                generateNewComvar : function () {
                    var index,
                        result = '';
                    for (index = 0; index < 32; index++) {
                        result += String(parseInt(Math.random() * 2, 10));
                    }
                    return result;
                }
            }
            result = [shoot1, shoot1, shoot1, myLib.generateNewComvar()];
            return result;
        }
    };
    return warrior.shoot(comvarSet);
}, "warrior");