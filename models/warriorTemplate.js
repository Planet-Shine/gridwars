
var warrior = {

    'name' : 'warrior-name', // Имя валидное, уникальное, для создания бойца и идентификации.

    'shoot' : function (neighbors) {
        var neighborShootIndex1,
            neighborShootIndex2,
            neighborShootIndex3,
            newComvar,
            currentComvar = this.comvar;

        // ... вычисления.

        return [neighborShootIndex1, neighborShootIndex2, neighborShootIndex3, newComvar];
    }

    // other custom methods

};

// Регистрация для отработки на клиенте.
register(warrior);

