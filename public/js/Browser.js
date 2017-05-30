/*jslint sub: true, regexp: true, todo: true */
/*global _, window, setTimeout, extend, param, Class, $, jQuery, Hash, document,
 REVISION, USERNAME, ADDRESS, GLOBAL_NAMESPACE, punycode, decode, navigator */

/**
 * Класс дополнительной информации о браузере.
 *
 * @class
 * @name Browser
 * @extends Class
 */
var Browser = Class.$extend({  // todo: Зарефакторить. Переименовать в WindowWrapper, после всего рефакторинга.
    /*
        todo: Зарефактротить. После того, как в проекте станет возможным объявлять глобальные объекты зарефакторить.
        Разбить на WindowWrapper и DocumentWrapper. Browser - это общее. Интерфейс window - то чем мы пользуемся - часть.
        Логично класс назвать от window.
    */

    /**
     * Название браузера.
     *
     * @private
     * @field
     * @name Browser#browser
     * @type {String|null}
     */
    browser : null,

    /**
     * Версия браузера.
     *
     * @private
     * @field
     * @name Browser#version
     * @type {String|null}
     */
    version : null,

    /**
     * Название платформы.
     *
     * @private
     * @field
     * @name Browser#platform
     * @type {String|null}
     */
    platform : null,

    /**
     * Признак, что платформа мобильная.
     *
     * @private
     * @field
     * @name Browser#mobile
     * @type {Boolean|null}
     */
    mobile : null,

    /**
     * Протокол текущей страницы.
     *
     * @private
     * @field
     * @name Browser#protocol
     * @type {String|null}
     */
    protocol : null,

    /**
     * Название хоста текущей страницы.
     *
     * @private
     * @field
     * @name Browser#hostname
     * @type {String|null}
     */
    hostname : null,

    /**
     * Название хоста текущей страницы в ascii.
     *
     * @private
     * @field
     * @name Browser#punycode
     * @type {String|null}
     */
    punycode : null,            // todo: Зарефакторить. Поменять на punycodeHostname по проекту.

    /**
     * Номер порта текущей страницы.
     *
     * @private
     * @field
     * @name Browser#port
     * @type {String|null}
     */
    port : null,

    /**
     * Максимальное значение z-index в текущем {@link HTMLDocument}.
     *
     * @private
     * @field
     * @name Browser#maxZIndex
     * @type {Number|null}
     */
    maxZIndex : null,

    /**
     * Кодировка страницы.
     *
     * @private
     * @field
     * @name Browser#charset
     * @see Browser#getCharset
     * @type {String|null}
     */
    charset : null,

    /**
     * Признак того, что платформа - IOS.
     *
     * @private
     * @field
     * @name Browser#isIOS
     * @type {Boolean|null}
     */
    isIOS : null,

    /**
     * Получить признак того, что текущий браузер - это ie без анимации.
     *
     * @public
     * @function
     * @name Browser#getIsNoAnimationIE
     * @return {Boolean}
     */
    getIsNoAnimationIE : function () {
        'use strict';
        var version = this.getVersionInteger(),
            isIE    = this.isMsie();
        return isIE && (version <= 9);
    },

    /**
     * Преобразование строки с анализом содержащегося html.
     *
     * Метод работает на основании текущей dom-модели браузера, своих парсеров
     * контента не имеет, а анализирует содержимое через innerHtml элемента.
     * В методе замечены ошибки в работе, плохо работает с Internet Explorer
     * старых версий.
     *
     * @public
     * @function
     * @name Browser#contentValidate
     * @param {String} content Произвольный html-код, который подлежит
     *        проверке/валидации/трансформации.
     * @param {Object} [allows] Объект разрешений, каждый элемент которого - это
     *        разрешаемый к использованию тег в тексте. А значение свойства
     *        объекта должном массив списка разрешенных атрибутов. Если свойство
     *        другого типа, то ниодного атрибута к использованию допустаться
     *        не будет.
     * @return {String}
     */
    contentValidate : function (content, allows) {
        /* todo: Зарефакторить. Метод не относится к сущности Window. Вынести в DocumentWrapper.
        */
        'use strict';
        var index = 0, node,
            // Теги, которые должны быть выключены не зависимо от того, что
            // разрешены они или нет, т.е. даже если явно разрешаются к
            // использованию теги из этого списка, то метод их выпиливает из текста.
            disabling = ['script', 'applet', 'embed', 'noembed', 'object',
                'param', 'article', 'aside', 'body', 'footer', 'head', 'header',
                'html', 'link', 'meta', 'nav', 'section', 'style', 'title'],
            // Типы нод, которые разрешены к обработке вообще впринцыпе,
            // а остальные ноды должны удаляться.
            types = [window.document.ELEMENT_NODE, window.document.TEXT_NODE],
            // Элемент на котором строится dom-модель и
            // обрабатывается введенный контент.
            element = window.document.createElement('div'),
            // Функция для рекурсивного валидирования
            // контента вложенного друг в друга.
            validate = function (element) {
                var name       = String(element.nodeName).toLowerCase(),
                    nodes      = element.childNodes || [],
                    attributes = element.attributes || [],
                    parent     = element.parentNode,
                    previous   = element.previousSibling,
                    index      = 0,
                    node,
                    attrName;
                if (_.indexOf(disabling, name) !== -1) {
                    // Удаляем опасные элементы без анализа содержимого.
                    try {
                        // Безопастное удаление элемента.
                        parent.removeChild(element);
                    } catch (error1) {}
                } else if (!allows[name]) {
                    try {
                        // Безопастное удаление элемента.
                        parent.removeChild(element);
                        for (index = nodes.length - 1; index >= 0; index -= 1) {
                            // Удаляем не разрешенные элементы с анализом содержимого.
                            parent.insertBefore(nodes.item(index), previous ? previous.nextSibling : parent.firstChild);
                        }
                    } catch (error2) {}
                } else {
                    // Если элемент разрешен, то проверяем атрибуты.
                    while (attributes && attributes.length > 0 && index < attributes.length) {
                        attrName = String(attributes[index].name || '').toLowerCase();
                        // Если блок атрибутов не определен или атрибут не разрешен, то удаляем атрибут из элемента.
                        if (!(allows[name] instanceof Array) || _.indexOf(allows[name], attrName) === -1) {
                            try {
                                // Безопастное удаление атрибута.
                                element.removeAttribute(attrName);
                            } catch (error3) {}
                            continue;
                        }
                        index += 1;
                    }
                    index = 0;
                    // Просматриваем все вложенные теги и пытаемся анализировать.
                    while (element && element.childNodes && element.childNodes.length && index < element.childNodes.length) {
                        node = element.childNodes[index];
                        if (node) {
                            // Удаляем все ненужные ноды.
                            if (_.indexOf(types, node.nodeType) === -1) {
                                try {
                                    // Безопастное удаление элемента.
                                    element.removeChild(node);
                                } catch (error4) {}
                            }
                            // Рассматриваем только элементы тегов.
                            if (node.nodeType === window.document.ELEMENT_NODE) {
                                validate(node);
                            }
                            if (node === element.childNodes[index]) {
                                index += 1;
                            }
                        }
                    }
                }
            };
        try {
            // Добавляем контент к созданному элементу. При добавлении контента
            // в таком виде текст должен быть представлен в виде dom-модели и
            // элементы можно будет перебирать, т.е. решается задача парсинга
            // введенного контента.
            element.innerHTML = String(content || '');
            // Разрешения должны быть обязательно объектом, если это
            // что-то другое, то разрешения обязательно приводим к объекту.
            allows = extend({}, allows);
            if (!allows['noscript']) {
                try {
                    // Не правильно работает в Internet Explorer'е.
                    delete allows['noscript'];
                } catch (error1) {}
            }
            // Валидируем объект разрешений, перебираем каждое свойство объекта
            // разрешений и проверяем, что это обязательно массив, если нет, то
            // выставляем свойство как пустой массив.
            _.each(allows, function (value, key) {
                if (!(value instanceof Array)) {
                    allows[key] = [];
                }
            });
            // Просматриваем все вложенные элементы.
            if (element.childNodes && element.childNodes.length) {  // todo: Зарефакторить. В validate уже есть похожий участок кода. Вероятно можно здесть просто выполнить validate(element)
                while (index < element.childNodes.length) {
                    node = element.childNodes[index];
                    if (node) {
                        // Удаляем все ненужные ноды.
                        if (_.indexOf(types, node.nodeType) === -1) {
                            try {
                                // Безопастное удаление элемента.
                                element.removeChild(node);
                            } catch (error2) {}
                        }
                        // Рассматриваем только элементы тегов.
                        if (node.nodeType === window.document.ELEMENT_NODE) {
                            validate(node);
                        }
                        if (node === element.childNodes[index]) {
                            index += 1;
                        }
                    }
                }
            }
            return String(element.innerHTML || '');
        } catch (error3) {
            // Если у нас есть какие-то ошибки, а это связано с IE7-8,
            // то ничего не делаем, а просто отдаем пустую строку.
            return '';
        }
    },

    /**
     * Получить максимальное значение z-index в текущем {@link HTMLDocument}.
     *
     * @public
     * @function
     * @name Browser#getMaxZIndex
     * @return {Number}
     */
    getMaxZIndex : function () {
        // todo: Зарефакторить. Вынести в DocumentWrapper.
        'use strict';
        var self = this;
        if (this.maxZIndex === null) {
            this.maxZIndex = 0;
            $(window.document).find('*').each(function () {
                self.maxZIndex = Math.max(self.maxZIndex,
                    parseInt($(this).css('zIndex'), 10) || 0);
            });
        }
        return this.maxZIndex;
    },

    /**
     * Получить протокол текущей страницы.
     *
     * @public
     * @function
     * @name Browser#getProtocol
     * @return {String}
     */
    getProtocol : function () {
        'use strict';
        if (this.protocol === null) {
            this.protocol = window.location.protocol;
        }
        return this.protocol;
    },

    /**
     * Получить название хоста текущей страницы.
     *
     * @public
     * @function
     * @name Browser#getHostname
     * @return {String}
     */
    getHostname : function () {
        'use strict';
        if (this.hostname === null) {
            this.hostname = window.location.hostname;
        }
        return this.hostname;
    },

    /**
     * Получить название хоста текущей страницы в ascii.
     *
     * @public
     * @function
     * @name Browser#getPunycode
     * @return {String}
     */
    getPunycode : function () { // todo: Зарефакторить. Поменять на getPunycodeHostname по проекту.
        'use strict';
        if (this.punycode === null) {
            this.punycode = punycode.toASCII(this.getHostname());
        }
        return this.punycode;
    },

    /**
     * Получить номер порта текущей страницы.
     *
     * @public
     * @function
     * @name Browser#getPort
     * @return {Number}
     */
    getPort : function () {
        'use strict';
        if (this.port === null) {
            this.port = window.location.port || 80;  // todo: Не универсально. В старых браузерах может работать не правильно. Лучше вычлинять из String(window.location) при помощи регулярки /\/\/[^\/]+:(\d+)(?:\/|$)/ (регулярку не тестировал, приблизительная).
        }
        return this.port;
    },

    /**
     * Получить заголовок страницы браузера.
     *
     * @public
     * @function
     * @name Browser#getTitle
     * @return {String}
     */
    getTitle : function () {
        'use strict';
        if (window && window.document && typeof window.document.title === 'string') {
            return window.document.title;
        }
        return '';
    },

    /**
     * Установить заголовок страницы браузера.
     *
     * @public
     * @function
     * @name Browser#setTitle
     * @param {String} value Новый заголовок страницы.
     * @return {void}
     */
    setTitle : function (value) {
        'use strict';
        if (window && window.document && typeof window.document.title === 'string') {
            window.document.title = String(value || '');
        }
    },

    /**
     * Получить url родительской страницы.
     *
     * @public
     * @function
     * @name Browser#getReferrer
     * @return {String}
     */
    getReferrer : function () {
        'use strict';
        if (window.document && window.document.referrer) {
            return String(window.document.referrer) || 'http://localhost';
        }
        return 'http://localhost/';
    },

    /**
     * Получить расположение.
     *
     * Этот метод принимает первым параметром расположение ввиде строки и новые
     * переменные ввиде объекта. Методом делается приведение расположение к
     * виду без хеша и дополние/замена переменных.
     *
     * @public
     * @function
     * @name Browser#getLocation
     * @param {String} location Расположение. Это полный адрес страницы
     *        (включая протокол), над которым будет производится трансформация.
     * @param {Object|Boolean} [params] Набор переменных, которыми будет дополнена или
     *        заменена строка адреса страницы. Или false, если нужно удалить параметры.
     * @param {Boolean|Object} [hash=false] Признак того, удалять хэш из location или нет. Если это объект, то он
     *        хранит в себе параметры для установки норого хэша.
     * @return {String|Boolean} Новый адрес страницы или false в случае ошибки.
     */
    getLocation : function (location, params, hash) {
        'use strict';
        var options   = {},
            ascii     = punycode.toASCII,
            variables = {};
        // В ie8 {}.toString.call(undefined) вернет "[object Object]", поэтому проверяем еще на правдивость.
        if ({}.toString.call(hash) === "[object Object]" && hash) {
            hash = Hash.$create().makeString(hash);
        } else if (hash === true) {
            hash = location.replace(/^[^#]+(.*$)/, '$1');
        } else {
            hash = false;
        }
        location = String(location || '');
        if (/^https?:\/\//.test(location)) {
            // Обрезаем хеш страницы.
            location = location.replace(/^([^#]+).*$/, '$1');
            // Приводим название домена к виду ASCII.
            location = location.replace(/^(https?:\/\/)([^\/]+)(\/.*)?$/, '$1' +
                ascii(location.replace(/^https?:\/\/([^\/]+)(\/.*)?$/, '$1')) + '$3');
            // Анализируем существующие переменные.
            location.replace(/^(?:[^?]+)/, '').
                replace(/\??(?:([^=]+)=([^&]*)&?)/g, function (matches, key, value) {
                    // Заполняем объект уже существующими переменными.
                    options[decode(key || '')] = decode(value || '');
                });
            if (params !== false) {
                // Перемешиваем существующие и переданные переменные.
                params = extend(options, params);
                _.each(params, function (value, name) {
                    if (params[name] !== null) {
                        variables[name] = params[name];
                    }
                });
                params = param(variables);
            }
            // Формируем новый адрес с переменными.
            return location.replace(/^([^?]+).*$/, '$1') + (params ? '?' + params : '') + (hash || '');
        }
        return false;
    },

    /**
     * Получить полное название приложения.
     *
     * @private
     * @function
     * @name Browser#getAppName
     * @return {String}
     */
    getAppName : function () {
        'use strict';
        if (window && window.navigator && window.navigator.appName) {
            return String(window.navigator.appName);
        }
        return '';
    },

    /**
     * Получить значение поля User-Agent.
     *
     * @public
     * @function
     * @name Browser#getUserAgent
     * @return {String}
     */
    getUserAgent : function () {
        'use strict';
        if (window && window.navigator && window.navigator.userAgent) {
            return String(window.navigator.userAgent);
        }
        return '';
    },

    /**
     * Получить признак старого браузера.
     *
     * @public
     * @function
     * @name Browser#getIsOldBrowser
     * @return {Boolean}
     */
    getIsOldBrowser :  function () {
        'use strict';
        var result,
            browser                 = this.getBrowser(),
            version                 = this.getVersionInteger(),
            maxDistanceToOldBrowser = this.$self.MAX_DISTANCES_TO_OLD_BROWSER[browser],
            lastVersionOfBrowser    = this.$self.LATEST_VERSIONS_OF_BROWSERS[browser];
        if (browser !== 'unknown' && version < lastVersionOfBrowser - maxDistanceToOldBrowser) {
            result = true;
        } else {
            result = false;
        }
        return result;
    },

    /**
     * Получить признак неизвестного браузера.
     *
     * @public
     * @function
     * @name Browser#getIsUnknownBrowser
     * @return {Boolean}
     */
    getIsUnknownBrowser : function () {
        'use strict';
        return this.getBrowser() === 'unknown';
    },

    /**
     * Получить название браузера.
     *
     * Этот метод не делает сложных вычислений и название браузера вычисляет
     * приблизительно. Значения, которые может возращать метод:
     * <code>msie</code>, <code>webkit</code>, <code>opera</code>,
     * <code>mozilla</code>, <code>safari</code> и <code>unknown</code> (если
     * название определить не получилось).
     *
     * @public
     * @function
     * @name Browser#getBrowser
     * @return {String}
     */
    getBrowser : function () {
        'use strict';
        var userAgent   = this.getUserAgent().toLowerCase(),
            matchResult = userAgent.match(this.$self.REGULAR_TO_PARSE_USER_AGENT) || [],
            browserName = matchResult[1];
        if (this.browser === null) {
            if (/trident|msie/i.test(browserName)) {
                this.browser = 'msie';
            } else if (browserName === 'firefox') {
                this.browser = 'mozilla';
            } else if (window['chrome']) {
                this.browser = 'webkit';
            } else if (browserName === 'safari') {
                this.browser = 'safari';
            } else if (window['opera']) {
                this.browser = 'opera';
            } else {
                this.browser = 'unknown';
            }
        }
        return this.browser;
    },

    /**
     * Признак, что текущий браузер - Microsoft Internet Explorer.
     *
     * @public
     * @function
     * @name Browser#isMsie
     * @return {Boolean}
     */
    isMsie : function () {
        'use strict';
        return !!(this.getBrowser() === 'msie');
    },

    /**
     * Признак, что текущий браузер - Webkit.
     *
     * @public
     * @function
     * @name Browser#isWebkit
     * @return {Boolean}
     */
    isWebkit : function () {
        'use strict';
        return !!(this.getBrowser() === 'webkit');
    },

    /**
     * Признак, что текущий браузер - Opera.
     *
     * @public
     * @function
     * @name Browser#isOpera
     * @return {Boolean}
     */
    isOpera : function () {
        'use strict';
        return !!(this.getBrowser() === 'opera');
    },

    /**
     * Признак, что текущий браузер - Mozilla.
     *
     * @public
     * @function
     * @name Browser#isMozilla
     * @return {Boolean}
     */
    isMozilla : function () {
        'use strict';
        return !!(this.getBrowser() === 'mozilla');
    },

    /**
     * Признак, что текущий браузер - Safari.
     *
     * @public
     * @function
     * @name Browser#isSafari
     * @return {Boolean}
     */
    isSafari : function () {
        'use strict';
        return !!(this.getBrowser() === 'safari');
    },

    /**
     * Признак, что платформа мобильная.
     *
     * @public
     * @function
     * @name Browser#isMobile
     * @return {Boolean}
     */
    isMobile : function () {            // todo: Зарефакторить. Регулярка очень длинная - вынести ее в статику. Не видно что происходит.
        'use strict';
        var userAgent;
        if (this.mobile === null) {
            userAgent = this.getUserAgent();
            this.mobile = !!(/(android|bb\d+|meego|ipad|playbook|silk).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4)));
        }
        return this.mobile;
    },

    /**
     * Имеется ли метатег viewport в документе doc?
     *
     * @param {Object} doc document в котором проверяется наличие viewport'а
     * @returns {boolean}
     */
    hasViewportMetaTag : function (doc) {
        var mTags = doc.getElementsByTagName('meta');

        for (var i = 0; i < mTags.length; i += 1) {
            if (mTags[i].getAttribute('name') === 'viewport') {
                return true;
            }
        }

        return false;
    },

    /**
     * Получить признак того, что модуль запущен под ios
     *
     * @public
     * @function
     * @name Browser#getIsIOS
     * @returns {Boolean|null}
     */
    getIsIOS : function () {
        'use strict';
        var userAgent;
        if (this.isIOS === null) {
            userAgent = this.getUserAgent();
            this.isIOS = /iPad|iPhone|iPod/i.test(userAgent);
        }
        return this.isIOS;
    },

    /**
     * Получить версию браузера.
     *
     * Этот метод не делает сложных вычислений и версию вычисляет
     * приблизительно. При нахождении версии браузера возращается только
     * мажорная версия, все остальные подверсии не учитываются. Если версию
     * браузера опрелить не получилось, то возращается <code>unknown</code>.
     *
     * @public
     * @function
     * @name Browser#getVersion
     * @see Browser#getVersionInteger
     * @return {String}
     */
    getVersion : function () {
        'use strict';
        var userAgent,   // Информация User-Agent заголовка браузера.
            version,     // Версия браузера.
            additionalVersion,
            $self = this.$self,
            browserName,
            matchResult;
        if (this.version === null) {
            userAgent   = this.getUserAgent();
            matchResult = userAgent.match($self.REGULAR_TO_PARSE_USER_AGENT) || [];
            browserName = matchResult[1];
            version     = matchResult[2];
            if (/trident/i.test(browserName)) {
                version =  ($self.REGULAR_TO_PARSE_VERSION_OF_TRIDENT.exec(userAgent) || [])[1];
            } else {
                if (!version) {
                    version = (String(navigator.appVersion).match($self.REGULAR_TO_PARSE_APP_VERSION) || [])[0];
                }
                additionalVersion = (userAgent.match($self.REGULAR_TO_PARSE_ADDITIONAL_VERSION) || [])[1];
                if (additionalVersion) {
                    version = additionalVersion + ' ' + version;
                }
            }
            if (!version) {
                version = 'unknown';
            }
            this.version = version;
        }
        return this.version;
    },

    /**
     * Получить версию браузера.
     *
     * Этот метод работает точно также как <code>getVersion</code> за одним
     * исключением - версия возращается целым числом, а если версия не
     * определена, то возращается 0.
     *
     * @public
     * @function
     * @name Browser#getVersionInteger
     * @see Browser#getVersion
     * @return {Number}
     */
    getVersionInteger : function () {
        'use strict';
        var version = parseInt(this.getVersion(), 10);
        return isNaN(version) ? 0 : version;
    },

    /**
     * Получить название платформы.
     *
     * Этот метод не делает сложных вычислений и платформу вычисляет
     * приблизительно. Значения, которые может возращать метод:
     * <code>windows</code>, <code>macos</code>, <code>linux</code> и
     * <code>unknown</code> (если платформу определить не получилось).
     *
     * @public
     * @function
     * @name Browser#getPlatform
     * @return {String}
     */
    getPlatform: function () {
        'use strict';
        var currentPlatform = window.navigator.platform;
        if (this.platform === null) {
            if (currentPlatform.indexOf('Win') === 0) {
                this.platform = 'windows';
            } else if (currentPlatform.indexOf('Mac') === 0) {
                this.platform = 'macos';
            } else if (currentPlatform.indexOf('X11') === 0 || currentPlatform.indexOf('Linux') === 0) {
                this.platform = 'linux';
            } else if (currentPlatform.indexOf('iPad') || currentPlatform.indexOf('iPod')
                    || currentPlatform.indexOf('iPhone') || this.getIsIOS()) {
                this.platform = 'ios';
            } else {
                this.platform = 'unknown';
            }
        }
        return this.platform;
    },

    /**
     * Получить кодировку страницы.
     *
     * @public
     * @function
     * @name Browser#getCharset
     * @see Browser#charset
     * @return {String}
     */
    getCharset : function () {
        'use strict';
        if (this.charset === null && window && window.document) {
            this.charset = String(window.document['characterSet'] || window.document['charset'] || window.document['inputEncoding'] || window.document['defaultCharset'] || 'UTF-8').toUpperCase();
        }
        return this.charset;
    },

    /**
     * Получить ревизию проекта.
     *
     * @public
     * @function
     * @name Browser#getRevision
     * @return {Number}
     */
    getRevision : function () { // todo: Зарефакторить.После рефакторинга перенести в Configuration. Аналогично для getUsername и getAddress.
        'use strict';
        return parseInt(String(REVISION || ''), 10) || 0;
    },

    /**
     * Получить пользователя (логин), который выкладывал проект.
     *
     * @public
     * @function
     * @name Browser#getUsername
     * @return {String}
     */
    getUsername : function () {
        'use strict';
        return String(USERNAME || '');
    },

    /**
     * Получить полный адрес ветки выложенного проекта.
     *
     * @public
     * @function
     * @name Browser#getAddress
     * @return {String}
     */
    getAddress : function () {
        'use strict';
        return String(ADDRESS || '');
    },

    /**
     * Получить текущюю дату.
     *
     * @public
     * @function
     * @name Browser#getCurrentDate
     * @return {Date}
     */
    getCurrentDate : function () {          // todo: Зарефикторить. Перенести в статику DateWrapper.
        'use strict';
        var current = new Date();
        return new Date(current.getFullYear(), current.getMonth(), current.getDate());
    },

    /**
     * Получить значение cookie по ключу.
     *
     * @public
     * @function
     * @name Browser#getCookie
     * @param {String} key Ключ cookie которого нужно получить.
     * @return {String|null}
     */
    getCookie : function (key) {                // todo: Зарефикторить. У нас уже есть класс Cookie. Перенести в него, если требуется, если там еще нет. Аналогично с setCookie.
        'use strict';
        var result  = null,
            cookies = document.cookie ? document.cookie.split("; ") : [],
            length  = cookies.length,
            pair,
            i;
        if (key && typeof key === 'string') {
            for (i = 0; i < length; i += 1) {
                pair = cookies[i].split('=');
                if (pair[0] === key) {
                    result = pair[1];
                }
            }
        }
        return result;
    },

    /**
     * Установить значение cookie по значению переданного объекта.
     *
     * @public
     * @function
     * @name Browser#setCookie
     * @param {Object} params Значение cookie которе нужно установить.
     * @param {String} params.key     Ключ с которым устанавливается cookie.
     * @param {String} params.value   Значение с которым устанавливается cookie.
     * @param {String} params.expires Срок действия cookie.
     * @param {String} params.domain  Домен для cookie.
     * @param {String} params.path    Путь для cookie.
     * @return {void}
     */
    setCookie : function (params) {
        'use strict';
        if (params['key'] && params['value'] && params['expires'] && params['domain'] && params['path']) {
            document.cookie = [
                params['key'] + '=' + params['value'] + ';',
                'expires=' + params['expires'] + ';',
                'domain='  + params['domain']  + ';',
                'path='    + params['path']    + ';'
            ].join('');
        }
    },

    $static : {

        /**
         * Регулярка для того, чтобы разберать строку агента для определения версии и имени браузера.
         *
         * @public
         * @constant
         * @name Browser.REGULAR_TO_PARSE_USER_AGENT
         * @type {RegExp}
         */
        REGULAR_TO_PARSE_USER_AGENT : /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i,

        /**
         * Регулярка для того, чтобы разберать версию в браузере trident.
         *
         * @public
         * @constant
         * @name Browser.REGULAR_TO_PARSE_VERSION_OF_TRIDENT
         * @type {RegExp}
         */
        REGULAR_TO_PARSE_VERSION_OF_TRIDENT :  /\brv[ :]+(\d+(\.\d+)?)/,

        /**
         ** Регулярка для того, чтобы разберать дополнительную версию.
         *
         * @public
         * @constant
         * @name Browser.REGULAR_TO_PARSE_ADDITIONAL_VERSION
         * @type {RegExp}
         */
        REGULAR_TO_PARSE_ADDITIONAL_VERSION :  /version\/([\.\d]+)/i,


        /**
         * Регулярка для разбора версии приложения.
         *
         * @public
         * @constant
         * @name Browser.REGULAR_TO_PARSE_APP_VERSION
         * @type {RegExp}
         */
        REGULAR_TO_PARSE_APP_VERSION : /^(?:\d+\.?)+/,

        /**
         * Последнии версии браузеров.
         *
         * @public
         * @constant
         * @name Browser.LATEST_VERSIONS_OF_BROWSERS
         * @type {Object}
         */
        LATEST_VERSIONS_OF_BROWSERS : {
            'msie'    : 11,
            'webkit'  : 46,
            'mozilla' : 42,
            'opera'   : 33,
            'safari'  : 9
        },

        /**
         * Максимальное растояние до дого, чтобы опредилить, что браузер старый.
         *
         * @public
         * @constant
         * @name Browser.MAX_DISTANCES_TO_OLD_BROWSER
         * @type {Object}
         */
        MAX_DISTANCES_TO_OLD_BROWSER : {
            'msie'    : 1,
            'webkit'  : 25,
            'mozilla' : 21,
            'opera'   : 22,
            'safari'  : 1
        }

    }
});
