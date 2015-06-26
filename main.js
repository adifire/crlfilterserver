var express = require('express'),
    MongoDBHelper = require('./lib/mongodbhelper'),
    filtergen = require('./lib/filter_gen'),
    filter_diff = require('./lib/filter_diff');

//var app = express();

var datastore = new MongoDBHelper();


var date = new Date();
date = date.getUTCDate() + ' ' + date.getUTCMonth() + 
        ' ' + date.getUTCFullYear();

var testfun = function(err,data) {
    console.log('Entering test function');
    if (err) return console.log(err);
    console.log('Checking if filters were added');
    datastore.get_filter(date,'1',function(err,result) {
        if (err) return console.log(err);
        console.log(result);
    });
};

//filtergen.generateFilterDummy(datastore,'serials_1',testfun);
testfun();
