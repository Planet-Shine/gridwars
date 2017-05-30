
function getRequestInfo (path, isPartial) {
    var pathItems = path.split('/'),
        language  = pathItems[1],
        page,
        template,
        partialTemplate;

    function fixTemplatePath (templatePath) {
        if (/\/$/.test(templatePath)) { // Если оканчивается на /, то добавляем index для .ejs
            templatePath += 'index';
        }
        return templatePath;
    }

    template = pathItems.slice(2);
    // Здесь откинуто partial, если он был, откинуто язык.
    page = './' + template.join('/');
    page = fixTemplatePath(page);

    template = './' + language + '/' + template.join('/');
    template = fixTemplatePath(template);
    partialTemplate = './' + language + '/partial/partial-page';

    return {
        'isPartial' : isPartial,
        'language'  : language,
        'template'  : isPartial ? partialTemplate : template,
        'page'      : page,
        'path'      : path
    }
}

module.exports = function (req, res, next) {
    var isPartial = res.req.headers['x-requested-with'] == 'XMLHttpRequest',
        reqInfo,
        tempUrl;
    if (isPartial) {
        tempUrl = req._parsedUrl.path.split('/');
        tempUrl.splice(1, 1);
        reqInfo = getRequestInfo(tempUrl.join('/'), isPartial);
    } else {
        reqInfo = getRequestInfo(req._parsedUrl.path, isPartial);
    }

    req.reqInfo         = reqInfo;
    res.locals.language = reqInfo['language'];
    next();
}