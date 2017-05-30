
var WarriorTextValidError,
    validators = require('public/lib/validators'),
    WarriorValidError,
    warriorValidator,
    process       = require('process'),
    child_process = require('child_process');

function initValidator (warriorModule) {
    WarriorTextValidError = warriorModule.WarriorTextValidError;
    WarriorValidError     = warriorModule.WarriorValidError;
    return warriorValidator;
}

warriorValidator = {

    shootTestPlayerCount : 4,

    oneShootPossibleTime : 300, // todo : выправить для реал сервера.

    defaultTestCountOfShoots : 10,

    textRegs : {

        // Не долдно давать true.
        // eval
        // new Function /Function[\s]*\(/
        // call /(\.|\['|\[")[\s]*call/i
        // apply /(\.|\['|\[")[\s]*apply/i
        // constructor /(\.|\['|\[")[\s]*constructor/i
        // caller /(\.|\['|\[")[\s]*caller/i
        // prototype /(\.|\['|\[")[\s]*prototype/i
        // Вызов без контекста.
        // /([\w\s\.\[\]\'\"]+)\(/gi
        // Ищем любые вызовы или намеки на вызовы функции.
        // Ищем в них открывающую часть. /(?:\['|\["|\.)/
        // Если хоть в одном наборе не находим его, то скрипт не валиден.

        EVAL                 : /eval[\s]*\(/i,
        FUNCTION             : /Function[\s]*\(/, // - без игнорирования регистра, чтобы позволить function.
        WINDOW               : /(\.|\['|\[")[\s]*window/i,
        DOCUMENT             : /(\.|\['|\[")[\s]*document/i,
        PARENT               : /(\.|\['|\[")[\s]*parent/i,
        TOP                  : /(\.|\['|\[")[\s]*top/i,
        CALL                 : /(\.|\['|\[")[\s]*call/i,
        APPLY                : /(\.|\['|\[")[\s]*apply/i,
        CONSTRUCTOR          : /(\.|\['|\[")[\s]*constructor/i,
        CALLER               : /(\.|\['|\[")[\s]*caller/i,
        PROTOTYPE            : /(\.|\['|\[")[\s]*prototype/i,
        FUNCTION_CALL        : /([\w\s\.\[\]\'\"]+)\(/gi,
        NAME_TAKING          : /(?:(?:\[')|(?:\[")|\.)/,
        NAME_TAKING_PERMIT   : /(:?isNaN[\s]*\()|(:?^[\s]+\()|(:?return[\s]*\()|(:?switch[\s]*\()|(:?case[\s]*\()|(:?for[\s]*\()|(:?function[\s]*\()|(:?if[\s]*\()|(:?parseInt(?:(?:\'])|(?:\"]))?\()|(:?Number(?:(?:\'])|(?:\"]))?\()|(:?String(?:(?:\'])|(?:\"]))?\()|(:?parseFloat(?:(?:\'])|(?:\"]))?\()|(:?Object(?:(?:\'])|(?:\"]))?\()|(:?Array(?:(?:\'])|(?:\"])))|(:?Boolean(?:(?:\'])|(?:\"]))?\()/,
        ALL_FILE             : /^global.register\([\S\s]*\);$/
    },

    isValidText : function (programText, callback) {
        var textRegs = this.textRegs,
            error    = null,
            errors   = [];

        if (!textRegs.ALL_FILE.test(programText.trim())) {
            error = new WarriorTextValidError("Текст не соответсвует /^global.register\([\S\s]*\);$/.", "file-format-detected");
            errors.push(error);
        }

        if (textRegs.EVAL.test(programText)) {
            error = new WarriorTextValidError("Текст содержит eval.", "eval-detected");
            errors.push(error);
        }

        if (textRegs.FUNCTION.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов Function.", "new-function-detected");
            errors.push(error);
        }

        if (textRegs.WINDOW.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов window.", "window-detected");
            errors.push(error);
        }

        if (textRegs.DOCUMENT.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов document.", "document-detected");
            errors.push(error);
        }

        if (textRegs.PARENT.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов parent.", "parent-detected");
            errors.push(error);
        }

        if (textRegs.TOP.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов top.", "top-detected");
            errors.push(error);
        }

        if (textRegs.CALL.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов call.", "call-detected");
            errors.push(error);
        }

        if (textRegs.APPLY.test(programText)) {
            error = new WarriorTextValidError("Текст содержит вызов apply.", "apply-detected");
            errors.push(error);
        }

        if (textRegs.CONSTRUCTOR.test(programText)) {
            error = new WarriorTextValidError("Текст содержит обращение к constructor.", "name-constructor-detected");
            errors.push(error);
        }

        if (textRegs.CALLER.test(programText)) {
            error = new WarriorTextValidError("Текст содержит обращение к caller.", "name-caller-detected");
            errors.push(error);
        }

        if (textRegs.PROTOTYPE.test(programText)) {
            error = new WarriorTextValidError("Текст содержит обращение к prototype.", "name-prototype-detected");
            errors.push(error);
        }

        (function () {
            var mathces = programText.match(textRegs.FUNCTION_CALL),
                index;

            for (index = 0; index < mathces.length; index += 1) {
                if (!textRegs.NAME_TAKING.test(mathces[index])) {
                    if (textRegs.NAME_TAKING_PERMIT.test(mathces[index])) {
                        continue;
                    }
                    error = new WarriorTextValidError("Текст содержит вызовы функций без указания контекста.", "not-context-function-call");
                    errors.push(error);
                    break;
                }
            }

        }());

        if (errors.length) {
            callback(errors);
        } else {
            callback(null);
        }

    },

    getTestShootsTime : function () {
        return this.oneShootPossibleTime * this.defaultTestCountOfShoots;
    },

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

        startTime = (new Date()).getTime();

        for (index = 0; index < countOfShoots; index += 1) {
            randomComvarSet.push(this.generateRandomComvarSet());
        }

        index = -1;
        function nextStep() {
            index += 1;
            warriorModule.send({
                'command' : "test",
                'input'   : randomComvarSet[index]
            });
            killProcessDescriptor = setTimeout(function () {
                failFinish();
            }, self.oneShootPossibleTime * 2);
        }


        warriorModule = child_process.fork(warriorPath,
            ["--shootTest=true"],
            {execArgv: /debug/.test(process.execArgv.join('')) ? ['--debug=5859'] : []}); // todo : Доделать. Сделать, через проверку режима текущего запуска процесса, ессли нет дебага, ничего не ставить.

        warriorModule.on('message', function(message) {
            if (!isFinished) {
                if (message.command === 'ready') {
                    isChildReady = true;
                    nextStep();
                } else if (message.command === 'result') {
                    clearInterval(killProcessDescriptor);
                    shootResults.push(message.output);
                    if (index + 1 < countOfShoots) {
                        nextStep();
                    } else {
                        successFinish();
                    }
                }
            }
        });
        warriorModule.on('close', function(code) {
            if (!isFinished) {
                isFinished = true;
                clearTimeout(killProcessDescriptor);
                callback(new WarriorValidError("Превышено время тестирования каждый выстрел вычисляется дольше " + self.oneShootPossibleTime + " мс в среднем.",  'too-long-shoot-time-result'));
            }
        });
        function killProcess () {
            var signal = 'SIGKILL';
            isFinished = true;
            process.kill(warriorModule.pid, signal);
        }
        function failFinish () {
            if (!isFinished) {
                isFinished = true;
                clearTimeout(killProcessDescriptor);
                callback(new WarriorValidError("Превышено время тестирования каждый выстрел вычисляется дольше " + self.oneShootPossibleTime + " мс в среднем.",  'too-long-shoot-time-result'));
                killProcess();
            }
        }

        function successFinish () {
            killProcess();
            finishProcess();
        }

        function finishProcess () {
            var isCallbackCalled = false;

            time = (new Date().getTime()) - startTime;

            results.time    = time;
            results.name    = name;

            if (time > self.getTestShootsTime()) {
                return callback(new WarriorValidError("Превышено время тестирования каждый выстрел вычисляется дольше " + self.oneShootPossibleTime + " мс в среднем.", 'too-long-shoot-time-result'), results);
            } else {
                shootResults.forEach(function (result, index) {
                    if (!validators.isValidShootResult(result) && !isCallbackCalled) {
                        isError = true;
                        isCallbackCalled = true;
                        callback(new WarriorValidError("Вызов shot c параметрами " + JSON.stringify(randomComvarSet[index]) + " вернул не валидный ответ.", 'not-valid-shoot-result'), results);
                    }
                });
                if (!isError) {
                    return callback(null, results);
                }
            }
        }

    }

};

module.exports = initValidator;