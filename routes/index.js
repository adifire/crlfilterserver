var express = require('express'),
    config = require('../config'),
    utils = require('../lib/utils'),
    mongodb = require('../lib/mongodbhelper'),
    redis = new (require('../lib/redisstore')).RedisStore(config.redis),
    filterdiff = require('../lib/filter_diff'),
    router = express.Router(),
    datastoreurl = config.mongodb.url;

router.get('/',function(req,res){
    res.end('Welcome to CRLFilter app!');
});

router.get('/filter',function(req,res){
    var q = req.query;
    console.log(q);
    var date = (/^(?=.*\d)[\d ]+$/.test(date)) ? date : 'current',
        type = q.type || '1',
        curdate = utils.getFormattedDate();

    /*
     * If old date, check if diff exists. If not generate 
     * and store diff also
     */
    if (date === curdate || date === 'current') {
        // Return current filter
        date = 'current';
        return dbconnector(function(err,store) {
            if (err) {
                throw err;
            }

            store.getFilter(date,function(err,result) {
                if (err) {
                    return res.end('Error');
                }

                return res.json({
                    'date': curdate,
                    'type': type,
                    'filter': JSON.stringify(JSON.parse(result[0].filters)[type])
                });
            });
        });
    }

    /*
     * Try to fetch the diff, if not present in redis store 
     * then generate, store and send diff
     */
    redis.getDiff(curdate,date,type,function(err,result) {
        if (err || !result || result === 0) {
            return genDiff(curdate,date,type,res);
        }
        console.log(result);
        res.json({'date': curdate,'type': type,'diff': result});
    });
    
});

//TODO Implement certificate revocation check
router.get('/serial',function(req,res) {
    res.end('Not implemented yet');    
});

//TODO Implement config request
// Gives clients options for existing filter configurations
router.get('/config',function(req,res) {
    res.end('Not implemented yet');    
});

var dbconnector = function(callback) {
    var store = new mongodb(datastoreurl,function(err) {
        if (err) {
            return callback(err);
        }

        return callback(undefined,store);
    });
};

var genDiff = function(curdate,olddate,type,response) {
    dbconnector(function(err,mongodb) {
        if (err) {
            throw err;
        }

        filterdiff.generateDiff(mongodb,redis,olddate,curdate,type,
        function(err,res) {
            if (err) {
                return mongodb.getFilter('current',function(err,res) {
                    if (err) {
                        throw err;
                    }

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
