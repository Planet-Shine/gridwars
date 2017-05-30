/*jslint todo : true, sub : true */
/*globals $, document, history */


var toPage;

$(function () {
    'use strict';
    var loader          = $('.page-loader'),
        blockName       = 'page-content',
        relativeLinkReg = /^\/\w/,
        isHistoryExists = history && history.pushState !== undefined,
        pageContent     = $('.' + blockName),
        currentLoads    = [],
        pageContentBox  = pageContent.parent();

    function clearArray (arr) {
        _.each(arr, function (item, index, array) {
            if (!item) {
                arr.splice(index, 1);
            }
        });
        return arr;
    }

    function loadPartialPage(href, dontUseHistory) {
        loader.show();
        $('.' + blockName).hide();
        if (currentLoads.indexOf(href) === -1) {
            currentLoads.push(href);
            $.ajax({
                method   : "GET",
                url      : "/partial/" + clearArray(href.split('/')).join('/')
            }).done(function (data) {
                if ($.isPlainObject(data)) {
                    loader.hide();
                    if (data['refresh']) {
                        location.href = data['href'] || href;
                    }
                } else {
                    var newPage = $(data);
                    loader.hide();
                    $(newPage).appendTo(pageContentBox); // Кидаем на уровень страниц.
                    $('.' + blockName).hide();
                    showPartialPage(newPage, href, dontUseHistory);
                    __global.newPartialPage(newPage);
                }
                currentLoads.splice(currentLoads.indexOf(href), 1);
            }).fail(function () {
                console.log("Block : " + blockName + ". loadPartialPage error.");
                currentLoads.splice(currentLoads.indexOf(href), 1);
            });
            return false;
        }
    }

    function getPartialPageImmediate(href) {
        href = href.replace(/\/$/, "");
        return $(document).find('.' + blockName + '[data-href="/partial' + href + '"]');
    }

    function showPartialPage(partialPage, href, dontUseHistory) {
        var pageInfo  = partialPage.find('.page-data').data('page-info');
        $('title').html(pageInfo.title ? pageInfo.title + ' — Gridwars' : 'Gridwars');
        partialPage.show();
        if (!dontUseHistory) {
            history.pushState(null, null, href);
        }
    }

    window.onpopstate = function (event) {
        if (!event.state) {
            if (/battle\/?$/.test(window.location.pathname)) {
                window.location.reload();
            } else {
                // history changed because of pushState/replaceState
                toPage(window.location.pathname, true, true);
            }
        }
    }

    function comparePaths (path1, path2) {
        return path1.split('/').join('/') === path2.split('/').join('/');
    }

    // global
    toPage = function (href, dontUseHistory, isPathAlreadyChange) {
        var partialPage = getPartialPageImmediate(href);
        if (/\/battle\/[\S]+/.test(href)) {
            window.location.href = href;
        } else if (!comparePaths(href, location.pathname) || isPathAlreadyChange) {
            if (partialPage.length) {
                loader.hide();
                $('.' + blockName).hide();
                showPartialPage(partialPage, href, dontUseHistory);
            } else {
                return loadPartialPage(href, dontUseHistory);
            }
        }
    }

    if (isHistoryExists && pageContent.length) {
        $(document).click(function (event) {
            var target = $(event.target),
                href;

            if (target.is('a')) {
                href = target.attr('href');
                if (relativeLinkReg.test(href)) {

                    // ---
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    // ---
                    toPage(href);

                }
            }
        });
    }

});