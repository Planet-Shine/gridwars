/*jslint sub: true, regexp: true, sloppy: true, white: true, extend */
/*globals  _ */

/**
 * Обертка для создания классов.
 *
 * @class
 * @name Class
 */
var Class = (function () {

    var init  = false,
        Class = function () {
            // Реализация базового класса,
            // конструктор ничего не делает.
        };

    /**
     * Сылка на родительский класс.
     *
     * Особое внимание, не путать данный метод с методом {@link Class#$self},
     * этот метод возращает не экземпляр, а ссылку на класс.
     *
     * @public
     * @field
     * @name Class#$parent
     * @see Class#$self
     * @type {Class}
     */

    /**
     * Сылка на родительский класс.
     *
     * Особое внимание, не путать данный метод с методом {@link Class#$self},
     * этот метод возращает не экземпляр, а ссылку на класс.
     *
     * @public
     * @field
     * @name Class.$parent
     * @see Class#$self
     * @type {Class}
     */

    /**
     * Ссылка на текущий класс внутри экземпляра.
     *
     * Это ссылка внутри экземпляра на класс, экземпляр которого был создан,
     * это бывает очень полезным при использовании унаследованых статических
     * свойств и методов.
     *
     * @public
     * @field
     * @name Class#$self
     * @type {Class}
     */

    /**
     * Ссылка на этотже метод только родительского класса.
     *
     * При наследовании и переопределении методов есть необходимость иметь
     * достут к переопределяемому родительскому методу, такой доступ
     * осуществляется через такой метод. Есть особенность, метод работает
     * только внутри класса, т.е. если попытаться вызвать $super снаружи, то
     * будет ошибка.
     *
     * @public
     * @function
     * @name Class#$super
     * @return {*}
     */

    /**
     * Объект статических свойств и методов.
     *
     * Основное отличие от прямого объявления статических свойств и методов -
     * это наследование. Каждый метод или свойство объявленное таким способом
     * будет наследоваться другим классом и будет появлятся в его встатическом
     * окружении.
     *
     * @public
     * @field
     * @name Class#$static
     * @type {Object}
     */

    /**
     * Функция создания нового экземпляра.
     *
     * @inner
     * @return {this}
     */
    function $create() {
        init = true;  // Включаем инициализацию.
        var instance = new this();
        init = false; // Отключаем инициализацию.
        // Если задан конструктор, то выполняем
        // его в контексте созданного объекта.
        if (typeof instance['$init'] === 'function') {
            instance['$init'].apply(instance, arguments);
        }
        return instance;
    }

    /**
     * Метод создания нового экземпляра.
     *
     * Этот метод облегчает создание экземпляра класса, позволяет избавиться от
     * оператора new и принимает теже параметры, что и конструктор класса.
     *
     * @public
     * @function
     * @name Class.$create
     */
    Class['$create'] = $create;

    /**
     * Метод создания нового класса,
     * который будет унаследован от этого.
     *
     * @public
     * @function
     * @name Class.$extend
     * @param {Object} prop Новые свойства класса.
     * @return {Class}
     */
    Class['$extend'] = function (prop) {
        var prototype,
            $super = this.prototype;
        init = true;  // Включаем инициализацию.
        prototype = new this();
        init = false; // Отключаем инициализацию.
        // Конструктор нового класса.
        function Class() {
            // Если вызывается новый экземпляр и задан конструктор, то
            // конструктор выполняется в контексте созданного объекта.
            if (!init && typeof this['$init'] === 'function') {
                this['$init'].apply(this, arguments);
            }
        }
        // Статические свойства класса.
        // Создаем новый объект, чтобы не перезаписывать статику родителя.
        prototype['$static'] = $.extend({}, typeof prototype['$static'] === 'object' &&
            prototype['$static'] !== null ? prototype['$static'] : {});
        // Копируем свойства между прототипами.
        _.each(prop || {}, function ($function, name) {
            if (name === '$static') {
                // Копируем статические свойства.
                _.each($function || {}, function (value, name) {
                    prototype['$static'][name] = $function[name];
                });
            } else if (typeof $function === 'function' &&
                typeof $super[name] === 'function') {
                prototype[name] = function () {
                    var $return,
                        tmp = this['$super'];
                    this['$super'] = $super[name];
                    $return = $function.apply(this, arguments);
                    this['$super'] = tmp;
                    return $return;
                };
            } else {
                prototype[name] = $function;
            }
        });
        // Расставляем статические свойства.
        _.each(prototype['$static'], function (value, name) {
            Class[name] = prototype['$static'][name];
        });
        // Заполняем прототип данного класса.
        Class.prototype = prototype;
        // Конструктор данного класса.
        Class.prototype.constructor = Class;
        // Ссылка на текущий класс внутри экземпляра
        Class.prototype['$self'] = Class;
        // Добавляем к классу метод наследования.
        Class['$extend'] = arguments['callee'];
        // Добавление статического метода create.
        // Теперь экземпляры можно создавать не только при помощи ключевого
        // слова new, но и при помощи метода create. Этот метод принимает
        // параметры конструктора.
        Class['$create'] = $create;
        // Ссылка на родительский класс.
        Class['$parent'] = this;
        Class.prototype['$parent'] = this;
        // Возращаем созданный класс.
        return Class;
    };

    return Class;

}());
