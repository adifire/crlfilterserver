var express = require('express'),
    config = require('../config'),
    utils = require('../lib/utils'),
    mongodbclient = require('../lib/mongodbhelper'),
    redisclient = new require('../lib/redisstore').RedisStore(config.redis),
    filterdiff = require('../lib/filter_diff'),
    router = express.Router(),
    datastoreurl = config.mongodb.url;

router.get('/',function(req,res){
    res.end('Welcome to CRLFilter app!');
});

router.get('/filter',function(req,res){
    var q = req.query;
    console.log(q);
    var date = q.date || 'current',
        type = q.type || '1',
        curdate = utils.getFormattedDate();
    /*
     * If old date, check if diff exists. If not generate 
     * and store diff also
     */
    if (date == curdate || date === 'current') {
        // Return current filter
        date = 'current';
        return dbconnector(function(err,store) {
            if (err) throw err;
            store.getFilter(date,function(err,result) {
                if (err) return res.end('Error');
                console.log(result);
                return res.json({
                    'date': curdate,
                    'type': type,
                    'filter': result[0].filters[type]
                });
            });
        });
    }

    /*
     * Try to fetch the diff, if not present in redis store 
     * then generate, store and send diff
     */
    redisclient.getDiff(curdate,date,type,function(err,result) {
        if (err || !res || res == 0) return getDiffMongodb(curdate,date,type,res);
        res.json({
            'date': curdate,
            'type': type,
            'diff': result
        });
    });
    
});

var dbconnector = function(callback) {
    var store = new mongodbclient(datastoreurl,function(err) {
        if (err) callback(err);
        return callback(undefined,store);
    });
};

var getDiffMongodb = function(curdate,olddate,type,response) {
    dbconnector(function(err,mongodb) {
        if (err) throw err;
        filter_diff.generateDiff(mongodb,redisclient,olddate,type,function(err,res) {
            if (err) {
                store.getFilter('current',function(err,res) {
                    if (err) throw err;
                    return response.json({
                        'date': curdate,
                        'type': type,
                        'filter': res[0].filters[type]
                    });
                });
            }
            response.json({
                'date': curdate,
                'type': type,
                'diff': res
            });
        });
    });
};

module.exports = router;
