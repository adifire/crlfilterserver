var express = require('express'),
    MongoDBHelper = require('./lib/mongodbhelper'),
    filtergen = require('./lib/filter_gen'),
    filter_diff = require('./lib/filter_diff');

//var app = express();

var datastore = new MongoDBHelper(undefined,function(err) {
    if (err) {
        console.err("Cannot connect to mongodb, error:" + err);
        process.exit(1);
    }
    exec_server();
});


function exec_server() {
    var testfun = function(err,data) {
        console.log('Entering test function');
        if (err) return console.log(err);
        console.log('Checking if filters were added for date:' + date);
        datastore.get_filter(date,'1',function(err,result) {
            if (err) return console.log(err);
            console.log(result);
        });
    };

    var date = new Date();
    date = date.getUTCDate() + ' ' + date.getUTCMonth() + 
            ' ' + date.getUTCFullYear();
    filtergen.generateFilterDummy(datastore,'serials_1',testfun);
    testfun();
}
