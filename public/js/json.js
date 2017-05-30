/*jslint evil: true, regexp: true, todo: true */
/*global eval */

// TODO: переписать методы !!!

/**
 * @namespace
 * @name JSON
 */
var JSON = (function () {
    'use strict';

    var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g,
        meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        quoteString = function (string) {
            if (string.match(escapeable)) {
                return '"' + string.replace(escapeable, function (a) {
                    var c = meta[a];
                    if (typeof c === 'string') {
                        return c;
                    }
                    c = a.charCodeAt();
                    return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
                }) + '"';
            }
            return '"' + string + '"';
        };

    return {

        /**
         * Десериализация строки в объект.
         *
         * @public
         * @function
         * @name JSON.parse
         * @param {String} source Строка, которую необходимо десериализовать.
         * @return {*}
         */
        parse : function (source) {
            var returnValue,
                filtered = source
                    .replace(/\\["\\\/bfnrtu]/g, '@')
                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                    .replace(/(?:^|:|,)(?:\s*\[)+/g, '');

            if (/^[\],:{}\s]*$/.test(filtered)) {
                returnValue = eval('(' + source + ')');
            } else {
                throw new SyntaxError('Error parsing JSON, source is not valid.');
            }
            return returnValue;
        },

        /**
         * Сериализация объекта в строку.
         *
         * @public
         * @function
         * @name JSON.stringify
         * @param {*} object Объект, который необходимо сериализовать.
         * @param {Boolean} [useMagic=false] Признак, что стоит учитывать
         *        магический метод <code>Object.toJSON</code> при сериализации.
         * @return {String}
         */
        stringify : function (object, useMagic) {

            if (object === null) {
                return 'null';
            }

            var type = typeof object,
                ret = [],
                index,
                month,
                day,
                year,
                hours,
                minutes,
                seconds,
                milli;

            if (type === 'undefined') {
                return '';
            }
            if (type === 'number' || type === 'boolean') {
                return String(object);
            }
            if (type === 'string') {
                return quoteString(object);
            }
            if (type === 'object') {

                if (typeof object.toJSON === 'function' && useMagic) {
                    return JSON.stringify(object.toJSON());
                }

                if (object instanceof Date) {
                    month   = object.getUTCMonth() + 1;
                    day     = object.getUTCDate();
                    year    = object.getUTCFullYear();
                    hours   = object.getUTCHours();
                    minutes = object.getUTCMinutes();
                    seconds = object.getUTCSeconds();
                    milli   = object.getUTCMilliseconds();

                    if (month < 10) {
                        month = '0' + month;
                    }
                    if (day < 10) {
                        day = '0' + day;
                    }
                    if (hours < 10) {
                        hours = '0' + hours;
                    }
                    if (minutes < 10) {
                        minutes = '0' + minutes;
                    }
                    if (seconds < 10) {
                        seconds = '0' + seconds;
                    }
                    if (milli < 100) {
                        milli = '0' + milli;
                    }
                    if (milli < 10) {
                        milli = '0' + milli;
                    }
                    return '"' + year + '-' + month + '-' + day + 'T' +
                        hours + ':' + minutes + ':' + seconds +
                        '.' + milli + 'Z"';
                }
                if (object instanceof Array) {
                    for (index = 0; index < object.length; index += 1) {
                        ret.push(JSON.stringify(object[index]) || 'null');
                    }
                    return '[' + ret.join(',') + ']';
                }
                var	name,
                    val,
                    pairs = [];
                for ( var k in object ) {
                    type = typeof k;
                    if ( type === 'number' ) {
                        name = '"' + k + '"';
                    } else if (type === 'string') {
                        name = quoteString(k);
                    } else {
                        // Keys must be numerical or string. Skip others
                        continue;
                    }
                    type = typeof object[k];

                    if ( type === 'function' || type === 'undefined' ) {
                        // Invalid values like these return undefined
                        // from toJSON, however those object members
                        // shouldn't be included in the JSON string at all.
                        continue;
                    }
                    val = JSON.stringify( object[k] );
                    pairs.push( name + ':' + val );
                }
                return '{' + pairs.join( ',' ) + '}';
            }
        }
    };

}());