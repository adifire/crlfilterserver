/*
 * Helper for generating filters, it will be dummy here for now
 */
var fs = require('fs'),
    bloem = require('bloem');

exports.generateFilterDummy = function() {
    if (arguments.length < 3) return console.log('need two arguments');
    console.log(arguments);
    var store_client = arguments[0],
        serials = arguments[1],
        callback = arguments[2];
    fs.readFile(serials,'utf-8',function(err,data) {
        if (err) return callback(err);
        data = data.split('\n');
        var filter_1 = new bloem.SafeBloem(data.length,0.1);
        var filter_2 = new bloem.SafeBloem(data.length,0.01);
        var filter_3 = new bloem.SafeBloem(data.length,0.001);
        for (var i in data) {
            filter_1.add(data[i]);
            filter_2.add(data[i]);
            filter_3.add(data[i]);
        }
        store_client.store_filters({'1':filter_1,'01':filter_2,'001':filter_3},callback);
    });
};
