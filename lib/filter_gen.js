/*
 * Helper for generating filters, it will be dummy here for now
 */
var fs = require('fs'),
    bloem = require('bloem');

module.exports.generateFilterDummy = function() {
    if (arguments.length < 4) return console.log('need four arguments');
    console.log(arguments);
    var datastore = arguments[0],
        date = arguments[1],
        serials = arguments[2],
        capacity = arguments[3],
        callback = arguments[4];
    fs.readFile(serials,'utf-8',function(err,data) {
        if (err) return callback(err);
        data = data.split('\n');
        var filter_1 = new bloem.SafeBloem(capacity,0.1);
        var filter_2 = new bloem.SafeBloem(capacity,0.01);
        var filter_3 = new bloem.SafeBloem(capacity,0.001);
        var length = data.length;
        for (var i in data) {
            filter_1.add(data[i]);
            filter_2.add(data[i]);
            filter_3.add(data[i]);
        }
        datastore.storeFilters(date,{'1':filter_1,'01':filter_2,'001':filter_3,'total':length},callback);
    });
};
