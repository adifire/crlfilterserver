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
    var date = q.date || 'current',
        type = q.type || '1';
    dbconnector(function(store) {
        store.getFilter(date,type,function(err,result) {
            if (err) return res.end('Error');
            console.log(result);
            return res.json(result[0].filters[type]);
        });
    });
});

var dbconnector = function(callback) {
    var store = new mongodbclient(datastoreurl,function(err) {
        if (err) return;
        callback(store);
    });
};

module.exports = router;
