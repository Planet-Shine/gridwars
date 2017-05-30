

var lib = {};

(function () {

    var extr = {};

    try {
        extr._ = _;
    } catch (err) {
        extr._ = require('public/vendor/bower_components/underscore/underscore');
    }

    /**
     * Получить милисекунды.
     *
     * @function
     * @name lib#getMilliseconds
     * @param {Object} options Настройки.
     * @returns {jQuery}
     */
    lib.getMilliseconds = (function () {
        var source = {};
        source['second'] = 1000;
        source['minute'] = 60  * source['second'];
        source['hour']   = 60  * source['minute'];
        source['day']    = 24  * source['hour'];
        source['week']   = 7   * source['day'];
        source['year']   = 365 * source['day']; // Не высокосный. =)
        return function (options) {
            var result = 0;
            extr._.map(options, function (value, key) {
                result += source[key] * value;
            });
            return result;
        }
    }());

    try {
        if (module && module.exports) {
            module.exports = lib;
        }
    } catch(err) {}

}());
