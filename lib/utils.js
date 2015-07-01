module.exports.isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
};

module.exports.getFormattedDate = function(date) {
    var date = date || new Date();
    date = date.getUTCDate() + ' ' + date.getUTCMonth() + ' ' +
        date.getUTCFullYear();
    return date;
};

module.exports.handleCallback = function(callback) {
    return function(err,res) {
        if (callback) return callback(err,res);
    }
};
