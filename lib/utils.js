module.exports = {
    isEmpty : function(obj) {
        return Object.keys(obj).length === 0;
    },

    getFormattedDate : function(date) {
        date = date || new Date();
        date = date.getUTCDate() + ' ' + date.getUTCMonth() + ' ' +
            date.getUTCFullYear();
        return date;
    },

    handleCallback : function(callback) {
        return function(err,res) {
            if (callback) return callback(err,res);
        };
    },

};

