module.exports = {
    isEmpty : function(obj) {
        return Object.keys(obj).length === 0;
    },

    getFormattedDate : function(date) {
        date = date || new Date();
        date = date.getUTCFullYear() + '' + 
               ((date.getUTCMonth() < 10) ? '0' : '') + date.getUTCMonth() +
               ((date.getUTCDate() < 10) ? '0' : '') + date.getUTCDate();
        return parseInt(date);
    },

    handleCallback : function(callback) {
        return function(err,res) {
            if (callback) return callback(err,res);
        };
    },

};

