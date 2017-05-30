
global = undefined;


}());

// footer begin

}());

/*
for (var index1 = 0; index1 < 1000000000; index1 += 1) {
    var index2 = index1 + index1 * index1;
    for (var index3 = 0; index3 < 1000000000; index3 += 1) {
        var index4 = index1 + index1 * index1;
        for (var index5 = 0; index5 < 1000000000; index5 += 1) {
            var index6 = index1 + index1 * index1;
        }
    }
}
*/


var exportsObject = {};
exportsObject.warrior = getWarrior();
exportsObject.name = getName();
var isWarriorUndefined = typeof exportsObject.warrior === 'undefined';
var isWarriorSuccess = typeof exportsObject.warrior === 'function';
var isNameSuccess = typeof exportsObject.name === 'string';
var name = exportsObject.name;
if (process.argv[2] === "--shootTest=true") {
    // Слушаем команды.

    function onMessageHandler (message) {
        var newMessage = {},
            output;
        if (message.command === 'test') {
            output = exportsObject.warrior(message.input);
            newMessage.output = output;
            newMessage.command = 'result';
            process.send(newMessage);
        }
    }

    process.on('message', onMessageHandler);
    // Шлем ответ.

    // Говорим, что мы готовы.
    process.send({
        'command' : 'ready'
    });

} else {
    // Проверки.
    console.log(JSON.stringify({
        isNameSuccess      : isNameSuccess,
        isWarriorUndefined : isWarriorUndefined,
        warrior            : isWarriorSuccess,
        name               : String(name)
    }));
}