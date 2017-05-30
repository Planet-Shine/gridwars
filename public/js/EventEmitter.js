/*jslint todo : true, sub : true*/
/*globals _, setTimeout, Class, $ */

/**
 * Источник событий.
 *
 * @class
 * @name EventEmitter
 * @extends Class
 */
var EventEmitter = Class.$extend({

    /**
     * Обработчики событий, которые должны быть вызваны один раз.
     *
     * @private
     * @field
     * @name EventEmitter#onceListeners
     * @type {Array}
     */
    onceListeners : null,

    /**
     * Обработчики событий.
     *
     * @private
     * @field
     * @name EventEmitter#listeners
     * @type {Object|null}
     */
    listeners : null,

    /**
     * Получить всех подписчиков на события.
     *
     * @public
     * @function
     * @name EventEmitter#getListeners
     * @return {Object}
     */
    getListeners : function () {
        'use strict';
        if (!this.listeners) {
            this.listeners = {};
        }
        return this.listeners;
    },

    /**
     * Получить массив обработчиков, которые должны быть выполнены один раз после вызова события.
     *
     * @public
     * @function
     * @name EventEmitter#getOnceHandlers
     * @returns {Array}
     */
    getOnceHandlers : function () {
        'use strict';
        var listeners = this.onceListeners;
        if (!(listeners instanceof Array)) {
            this.onceListeners = listeners = [];
        }
        return listeners;
    },

    /**
     * Получить обработчики по типу события.
     *
     * @public
     * @function
     * @name EventEmitter#getHandlers
     * @param {String} eventType Тип события.
     * @return {Function[]}
     */
    getHandlers : function (eventType) {
        'use strict';
        var listeners = this.getListeners();
        eventType = String(eventType || '');
        if (!listeners[eventType]) {
            listeners[eventType] = [];
        }
        return listeners[eventType];
    },

    /**
     * Подписаться на события.
     *
     * @public
     * @function
     * @name EventEmitter#bind
     * @param {String} eventType Тип события.
     * @param {Function} handler Обработчик события.
     * @see EventEmitter#unbind
     * @return {EventEmitter}
     */
    bind : function (eventType, handler) {
        'use strict';
        var self = this,
            eventTypes = String(eventType).split(/\s+/);
        // Пилим строку, если она задает сразу несколько событий.
        _.each(eventTypes, function (eventTypeItem) {
            if (self.$self.TEST_EVENT_TYPE_REGULAR.test(eventTypeItem)) {
                (function (eventType) {
                    var handlers          = self.getHandlers(eventType),
                        allEventsHandlers = self.getHandlers("*");
                    // Добавляем нового подписчика, если такого ещё нет в списке.
                    if (typeof handler === 'function' && _.indexOf(handlers, handler) === -1) {
                        handlers.push(handler);
                        allEventsHandlers.push(handler); // Вставляем все обработчики сюда, т.к. эти обработчики должны вызываться если есть подписка на все события сразу.
                    }
                }(eventTypeItem));
            }
        });
        return this;
    },

    /**
     * Отписаться от событий.
     *
     * @public
     * @function
     * @name EventEmitter#unbind
     * @param {String} [eventType] Тип события, если не указан, то
     *        отписывает все обработчики от всех событий.
     * @param {Function} [handler] Обработчик, если не указан, то
     *        отписывает все обработчики от указанного события.
     * @see EventEmitter#bind
     * @return {EventEmitter}
     */
    unbind : function (eventType, handler) {
        'use strict';
        var self = this,
            eventTypes;
        if (!eventType) {
            // Очищаем всех подписчиков.
            this.listeners = {};
        } else if (typeof eventType === 'string') {
            // Пилим строку, если она задает сразу несколько событий.
            eventTypes = String(eventType).split(/\s+/);
            _.each(eventTypes, function (eventTypeItem) {
                if (self.$self.TEST_EVENT_TYPE_REGULAR.test(eventTypeItem)) {
                    (function (eventType) {
                        var handlers         = self.getHandlers(eventType),
                            allEventHandlers = self.getHandlers("*"),
                            allEventIndex    = _.indexOf(allEventHandlers, handler),
                            index            = _.indexOf(handlers, handler),
                            length           = handlers.length;
                        if (length !== 0 && typeof handler === 'function' && index !== -1) {
                            // Очищаем конкретный элемент подписки.
                            handlers.splice(index, 1);
                            allEventHandlers.splice(allEventIndex, 1);
                        } else if (length !== 0 && !handler) {
                            // Убираем все обработчики из обработчиков для всех событий.
                            _.each(handlers, function (handler) {
                                allEventIndex    = _.indexOf(allEventHandlers, handler);
                                allEventHandlers.splice(allEventIndex, 1);
                            });
                            // Очищаем элементы текущего массива подписчиков.
                            handlers.splice(0, length);
                        }
                    }(eventTypeItem));
                }
            });
        }
        return this;
    },

    /**
     * Подписаться на событие, так, что обработчик выполнится лишь один раз по выполнению события.
     * Вне зависимости от того сколько раз произойдет событие.
     *
     * @public
     * @function
     * @name EventEmitter#once
     * @see EventEmitter#unbind
     * @param {String} eventType Тип события.
     * @param {Function} handler Обработчик события.
     * @return {EventEmitter}
     */
    once : function (eventType, handler) {
        'use strict';
        this.bind.apply(this, arguments);
        this.getOnceHandlers().push(handler);
        return this;
    },

    /**
     * Удалить обработчик событий, если он подписан к выпонению на один раз.
     *
     * @public
     * @function
     * @name EventEmitter#removeFromOnceIfExist
     * @param {String} eventType Тип события.
     * @param {Function} handler Обработчик события.
     * @return {Boolean}
     */
    unbindOnceIfExist : function (eventType, handler) {
        'use strict';
        var onceHandlers   = this.getOnceHandlers(),
            indexOfHandler = _.indexOf(onceHandlers, handler);
        if (indexOfHandler !== -1) {
            this.unbind(eventType, handler);
            onceHandlers.splice(indexOfHandler, 1); // Удаляем обработчик и из этого списка, чтобы очистить память.
            return true;
        }
        return false;
    },

    /**
     * Вызвать события синхронно.
     *
     * @public
     * @function
     * @name EventEmitter#syncEmit
     * @param {String} eventType Тип события, или типы событий строкой
     *        разделенных пробелами.
     * @param {Object} [data] Параметры для передачи в обработчик.
     * @return {EventEmitter}
     */
    syncEmit : function (eventType, data) {
        'use strict';
        var argumentsClone;
        if (!data) {
            data = {};
        }
        argumentsClone = [eventType, data, true];
        this.emit.apply(this, argumentsClone);
        return this;
    },

    /**
     * Вызвать события.
     *
     * @public
     * @function
     * @name EventEmitter#emit
     * @param {String} eventType Тип события, или типы событий строкой
     *        разделенных пробелами.
     * @param {Object} [data] Параметры для передачи в обработчик.
     * @param {Boolean} [isSyncCall] Признак того, что вызов синхронный.
     * @return {EventEmitter}
     */
    emit : function (eventType, data, isSyncCall) {
        'use strict';
        var eventTypes,
            handlers = [],
            self = this; // Ссылка на текущий объект.
        isSyncCall = !!isSyncCall;
        // Пилим строку, если она задает сразу несколько событий.
        // Выбираем все обработчики зарание, чтобы в момент вызова они все были готовы.
        // Если запуск асинхронный, то за время ожидания выполнения может произойти отписка от событий, поэтому заранее.
        eventTypes = String(eventType).split(/\s+/);
        _.each(eventTypes, function (eventType) {
            if (self.$self.TEST_EVENT_TYPE_REGULAR.test(eventType)) {
                handlers.push({
                    'handlers' : self.getHandlers(eventType),
                    'eventType' : eventType
                });
            }
        });

        function emitEvents() {
            var isBlockAtherHandler = false;
            _.each(handlers, function (handler) {
                var result,
                    eventType    = handler['eventType'],
                    subHandlers  = [].concat(handler['handlers']);
                _.each(subHandlers, function (handler) {
                    if (!isBlockAtherHandler) {
                        /*
                             Удаляем обработчик из массива обработчиков, которые должны сработать лишь один раз
                             до того, как производим вызов, т.к. вызов может инициировать выполнение текущего обработчика,
                             который к тому времени должен быть удалён.
                         */
                        self.unbindOnceIfExist(eventType, handler);

                        result = handler.call(self, {
                            'type' : String(eventType),
                            'data' : data || {}
                        });
                        if (result === false) {
                            isBlockAtherHandler = true;
                        }
                    }
                });
            });
        }
        if (isSyncCall) {
            // Если синхронно то вызываем тут же.
            emitEvents();
        } else {
            // Откладываем вызов, если не синхронно.
            setTimeout(emitEvents, 10);
        }
        return this;
    },

    /**
     * Привязать выполнение функции к определенному контексту.
     *
     * @public
     * @function
     * @name EventEmitter#bindAll
     * @param {Function} func Функция для привязки к контексту.
     * @param {Object} [context=this] Контекст к которому привязывается функция.
     * @return {Function}
     */
    bindAll : function (func, context/* args */) {
        'use strict';
        var bindArgs = [].slice.call(arguments, 2);
        if (!context) {
            context = this;
        }
        function wrapper() {
            var args = [].slice.call(arguments),
                unshiftArgs = bindArgs.concat(args);
            return func.apply(context, unshiftArgs);
        }
        return wrapper;
    },

    $static : {

        /**
         * Регулярное выражение для тестирования имени события.
         * Или camelCase или * (все события).
         *
         * @const
         * @public
         * @name EventEmitter.TEST_EVENT_TYPE_REGULAR
         * @type {RegExp}
         */
        TEST_EVENT_TYPE_REGULAR : /^(?:[a-z][0-9a-zA-Z]*)|\*$/
    }

});

