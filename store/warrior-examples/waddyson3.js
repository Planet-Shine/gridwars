global.register(function (comvarSet) {
    var warrior = {
            countOfOurs : null,
            justComvarValue : "00000000000000000000000000000000",
            getSomeNearCell : function (comvarSet) {
                var result,
                    mycontext = {
                        temp : function (item, index) {
                            if (typeof item === 'string' && index !== 4 && !result) {
                                result = index - 1;
                                if (result === 4) {
                                    result = 3;
                                }
                                if (result === -1) {
                                    result = 8;
                                }
                            }
                        }
                    };

                comvarSet.forEach(mycontext.temp);
                if (result === undefined) {
                    result = 0;
                }

                return result;
            },
            getRandomInt : function (integerVal) {
                return parseInt(Math.random() * integerVal, 10);
            },
            getHelpForOurs : function (comvarSet) {
                var mycontext = {
                        temp : function (item, index) {
                            if (typeof item === 'string' && index !== 4) {
                                indexes.push(index);
                            }
                        }
                    },
                    indexes = [],
                    result  = [];

                comvarSet.forEach(mycontext.temp);

                result.push(indexes[this.getRandomInt(indexes.length)], indexes[this.getRandomInt(indexes.length)], indexes[this.getRandomInt(indexes.length)]);

                return result;
            },
            getCountOfOurs : function (comvarSet) {
                var result = 0,
                    mycontext = {
                        temp : function (item, index) {
                            if (typeof item === 'string' && index !== 4) { // Не текущая и с комаром.
                                result += 1;
                            }
                        }
                    };

                comvarSet.forEach(mycontext.temp);
                return result;
            },
            shoot : function (comvarSet) {
                var countOfOurs = this.getCountOfOurs(comvarSet),
                    helpForOurs,
                    someNearSell,
                    result;

                if (countOfOurs < 6) {
                    someNearSell = this.getSomeNearCell(comvarSet);
                    result       = [someNearSell, someNearSell, someNearSell, this.justComvarValue];
                } else {
                    helpForOurs = this.getHelpForOurs(comvarSet);
                    helpForOurs.push(this.justComvarValue);
                    result      = helpForOurs;
                }

                return result;
            }
        };
    return warrior.shoot(comvarSet);
}, "maddyson3");