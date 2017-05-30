/*jslint sub: true, regexp: true */
/*global _, document, navigator, location, Class, Browser */

/**
 * Класс управления куками.
 *
 * Класс не подходит для полноценного хранилища данных, поскольку в заголовке
 * можно передавать небольшое количество данных и многие веб-серверы могут
 * отказываться принимать запросы. Но класс обладает гибкостью, может работать
 * не только со строковыми данными, но и с любыми произвольными объектами,
 * например, в куки можно положить объект или массив, а потом в томже виде его
 * получить. Внутри класс происходит сериализация данных при сохранении и
 * десериализация при извлечении, поэтому, есть возможность хранить данные
 * любых типов. Для данных сохраненных не этим классом предусмотрена простая
 * проверка типов, например, могут быть разобраны булевы данные и числа.
 *
 * @class
 * @name Cookies
 * @extends Class
 */
var Cookies = Class.$extend({

    /*
     todo: Зарефакторить.
     Сменить на properties,
     Сделать один метод-свойство prop в стиле jQuery.
     Удалять через установку null.
     Если много переменных устанавливаются, то передаётся коллекция вторым параметром.
     Сделать глобальный объект над Application.
     */

    /**
     * Домен для сохрания значений.
     *
     * @private
     * @field
     * @name Cookies#domain
     * @see Cookies#getDomain
     * @type {String}
     */
    domain : null,

    /**
     * Путь для сохрания значений.
     *
     * @private
     * @field
     * @name Cookies#path
     * @see Cookies#getPath
     * @type {String}
     */
    path : null,

    /**
     * Признак безопасного режима.
     *
     * @private
     * @field
     * @name Cookies#secure
     * @see Cookies#isSecure
     * @type {Boolean}
     */
    secure : null,

    /**
     * Конструктор.
     *
     * @public
     * @function
     * @name Cookies#$init
     * @param {String} [domain] Домен для сохрания значений.
     * @param {String} [path="/"] Путь для сохрания значений.
     * @param {Boolean} [secure=false] Признак безопасного режима, если он
     *        включен, то куки будут работать только при https.
     * @return {void}
     */
    $init : function (domain, path, secure) {
        'use strict';
        var root = '.' + String(Browser.$create().getPunycode() || '').split('.').slice(-2).join('.');
        // Путь для сохрания значений.
        if (typeof path === 'string' && /^\//.test(path)) {
            this.path = String(path);
        } else {
            this.path = '/';
        }
        // Домен для сохрания значений.
        /*
            if (typeof domain !== 'string' || domain.split('.').slice(-2).join('.') !== root.slice(1)) {
                domain = root;
            }
        */
        this.domain = domain;
        // Признак безопасного режима.
        this.secure = !!secure;
    },

    /**
     * Получить домен для сохрания значений.
     *
     * @public
     * @function
     * @name Cookies#getDomain
     * @see Cookies#domain
     * @return {String}
     */
    getDomain : function () {
        'use strict';
        return this.domain;
    },

    /**
     * Получить путь для сохрания значений.
     *
     * @public
     * @function
     * @name Cookies#getPath
     * @see Cookies#path
     * @return {String}
     */
    getPath : function () {
        'use strict';
        return this.path;
    },

    /**
     * Признак безопасного режима, если он включен, то куки будут работать
     * только при https.
     *
     * @public
     * @function
     * @name Cookies#isSecure
     * @see Cookies#secure
     * @return {Boolean}
     */
    isSecure : function () {
        'use strict';
        return this.secure;
    },

    /**
     * Признак, что куки включены.
     *
     * @public
     * @function
     * @name Cookies#isEnabled
     * @return {Boolean}
     */
    isEnabled : function () {
        'use strict';
        var enable = false;
        if (navigator.cookieEnabled === true) {
            enable = true;
        } else {
            this.setItem('test', true);
            enable = this.getItem('test', false) === true;
            this.removeItem('test');
        }
        return enable;
    },

    /**
     * Установить значение переменной.
     *
     * @public
     * @function
     * @name Cookies#setItem
     * @param {String} name Название переменной.
     * @param {*} value Значение переменной, может быть произвольного типа, при
     *        сохранении производится сериализация данных.
     * @param {Number|Date} [ttl] Время жизни в секундах (сокращение от time
     *        to live) или объект даты, до которой должна жить кука. В первом
     *        случае, если передается число, будет использоваться заголовок
     *        max-age, а во втором случае, если передается дата,
     *        будет использоваться заголовок expires.
     * @return {void}
     */
    setItem : function (name, value, ttl) {
        'use strict';
        var query = [];
        if (typeof name !== 'string' || !/^[a-z_]\w*$/i.test(name)) {
            throw new TypeError('Название переменной задано не верно, ожидается строка формата /^[a-z_]\\w*$/i.');
        }
        // Записываем само значение куки.
        query.push(name + '=' + encodeURIComponent(JSON.stringify(value)));
        if (typeof ttl === 'number' && ttl >= 0) {
            // Время жизни в секундах переменной куки.
            query.push('max-age=' + ttl);
        } else if (ttl instanceof Date && Number(ttl) >= Number(new Date())) {
            // Время жизни до указанной даты переменной куки.
            query.push('expires=' + ttl.toUTCString());
        }
        // Путь от которого будут работать куки.
        query.push('path=' + this.getPath());
        // Домен для которого будут сохранены куки.
        query.push('domain=' + this.getDomain());
        // Признак, что куки должны
        // работать только при https.
        if (this.isSecure()) {
            query.push('secure');
        }
        // Делаем запрос на запись куки.
        document.cookie = query.join('; ');
    },

    /**
     * Проверить существование переменной.
     *
     * @public
     * @function
     * @name Cookies#hasItem
     * @param {String} name Название переменной.
     * @return {Boolean}
     */
    hasItem : function (name) {
        'use strict';
        var exists = false,
            cookies = String(document.cookie || '').
                split('; ');
        _.each(cookies, function (element) {
            var cookie = element.substring(0, element.indexOf('='));
            if (!exists && /^[a-z_]\w*$/i.test(cookie) && cookie === name) {
                exists = true;
            }
        })
        return exists;
    },

    /**
     * Получить значение переменной.
     *
     * @public
     * @function
     * @name Cookies#getItem
     * @param {String} name Название переменной.
     * @param {*} defaults Значение, при отсутствии значения в куках.
     * @return {*}
     */
    getItem : function (name, defaults) {
        'use strict';
        var items, type;
        if (typeof name !== 'string' || !/^[a-z_]\w*$/i.test(name)) {
            throw new TypeError('Название переменной задано не верно, ожидается строка формата /^[a-z_]\\w*$/i.');
        }
        items = this.getItems();
        type  = typeof items[name];
        return type === 'undefined' ? defaults : items[name];
    },

    /**
     * Установить переменные пачкой.
     *
     * @public
     * @function
     * @name Cookies#setItems
     * @param {Object} items Объект свойств для установки.
     * @param {Number|Date} [ttl] Время жизни в секундах (сокращение от time
     *        to live) или объект даты, до которой должна жить кука. В первом
     *        случае, если передается число, будет использоваться заголовок
     *        max-age, а во втором случае, если передается дата,
     *        будет использоваться заголовок expires.
     * @return {void}
     */
    setItems : function (items, ttl) {
        'use strict';
        var self = this;
        if (typeof items === 'object' && items !== null) {
            _.each(items, function (value, name) {
                if (/^[a-z_]\w*$/i.test(name)) {
                    self.setItem(name, items[name], ttl);
                }
            });
        }
    },

    /**
     * Получить все значения куки.
     *
     * @public
     * @function
     * @name Cookies#getItems
     * @return {Object}
     */
    getItems : function () {
        'use strict';
        var items = {},
            cookies = String(document.cookie || '').
                split('; ');
        _.each(cookies, function (element) {
            var index = element.indexOf('='),
                name  = element.substring(0, index),
                value,
                rawValue = element.substring(index + 1);
            // Пытаемся декодировать сырое значение.
            try {
                value = decodeURIComponent(rawValue);
            } catch (error) {
                value = rawValue;
            }
            try {
                // Пытаемся распарсить сохраненный JSON объект, для того
                // чтобы правильно восстановить типы данных.
                value = JSON.parse(value);
            } catch (error) {
                // Пытаемся вручную распознать типы, если
                // значения сохранялись не этой библиотекой.
                if (/^\s*(?:true|false|yes|no|on|off)\s*$/.test(value.toLowerCase())) {
                    // Определяем булево значение.
                    value = value.
                        replace(/^\s+/, '').
                        replace(/\s+$/, '').
                        toLowerCase();
                    value = _.indexOf(['true', 'yes', 'on'], value) !== -1;
                } else if (/^\s*\d+(?:\.\d+)?\s*$/.test(value)) {
                    // Определяем числовое значение.
                    value = parseFloat(value);
                }
            }
            if (/^[a-z_]\w*$/i.test(name)) {
                items[name] = value;
            }
        });
        return items;
    },

    /**
     * Удалить переменную куки.
     *
     * @public
     * @function
     * @name Cookies#removeItem
     * @param {String} name Название переменной.
     * @return {void}
     */
    removeItem : function (name) {
        'use strict';
        this.setItem(name, null, 0);
    },

    /**
     * Очищает все хранилище куки.
     *
     * @public
     * @function
     * @name Cookies#clear
     * @return {void}
     */
    clear : function () {
        'use strict';
        var self = this,
            cookies = String(document.cookie || '').
                split('; ');
        _.each(cookies, function (element) {
            var name = element.substring(0, element.indexOf('='));
            if (/^[a-z_]\w*$/i.test(name)) {
                self.removeItem(name);
            }
        });
    }

});