global.register(function (comvarSet) {
    var result,
        warrior = {
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

    for (var index2 = 0; index2 < 1000; index2 += 1) {
        result = index2 * index2 + index2;
    }

    return warrior.shoot(comvarSet);
}, "example_33");