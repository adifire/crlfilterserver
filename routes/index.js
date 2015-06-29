var express = require('express'),
    utils = require('../lib/utils'),
    mongodbclient = require('../lib/mongodbhelper'),
    router = express.Router(),
    datastoreurl = 'mongodb://localhost:27017/crlfilter';

router.get('/',function(req,res){
    res.end('Welcome to CRLFilter app!');
});

router.get('/filter',function(req,res){
    var q = req.query;
    console.log(q);
    if (utils.isEmpty(q)) {
        dbconnector(function(store) {
            store.getCurrentFilter(function(err,result) {
                if (err) return res.end('Error');
                console.log(result);
                res.json(result[0].filters['1']);
            });
        });
    }

    if (!('date' in q) && 'type' in q) {
        var type = '' + q.type;
        console.log(type);
        dbconnector(function(store) {
            store.getCurrentFilter(function(err,result) {
                if (err) return;
                res.json(result[0].filters[type]);
            });
        });
    }

    if ('date' in q && 'type' in q) {
        var date = '' + q.date,
            type = '' + q.type;
        dbconnector(function(store) {
            store.getDiff(date,type,function(err,result) {
                if (err) return;
                res.json(result[0].diff);
            });
        });
    }
    throw new Error('Required page not found');
    //res.end('Nothing here');
});

var dbconnector = function(callback) {
    var store = new mongodbclient(datastoreurl,function(err) {
        if (err) return;
        callback(store);
    });
};

module.exports = router;
