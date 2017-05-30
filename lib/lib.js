


function toRequirePath(fpath) {
    fpath = fpath.replace('\\', '/');
    fpath = fpath.replace(/^\//, '');
    return fpath;
}

module.exports.toRequirePath = toRequirePath;