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

router.get('/filter',function(req,res) {
    var q = req.query;
    console.log(q);
    var date = testDate(q.date) ? parseInt(q.date) : curDate(),
        type = testType(q.type) ? '1' : q.type,
        curdate = curDate();

    console.log('Date to check: ' + date);
    /*
     * If old date, check if diff exists. If not generate 
     * and store diff also
     */
    if (date >= curdate) {
        console.log('Return latest filter');
        // Return current filter
        date = curdate;
        return getLatestFilter(res,date,type);
    }

    console.log('Fetch the diff if exists');
    /*
     * Try to fetch the diff, if not present in redis store 
     * then generate, store and send diff
     */
    redis.getDiff(curdate,date,type,function(err,result) {
        if (err || !result || result === 0) {
            return genDiff(curdate,date,type,res);
        }
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

function dbconnector(callback) {
    var store = new mongodb(datastoreurl,function(err) {
        if (err) {
            return callback(err);
        }

        return callback(undefined,store);
    });
}

function genDiff(curdate,olddate,type,response) {
    dbconnector(function(err,mongodb) {
        if (err) {
            throw err;
        }

        mongodb.getFilter(olddate,type,function(err1,oldfilter) {
            mongodb.getFilter(curdate,type,function(err2,newfilter) {
                if (err1 || !oldfilter || oldfilter.length === 0) {
                    if (err2) {
                        throw err2;
                    }
                    return getLatestFilter(response,curdate,type);
                }
                if (err2) {
                    throw err2;
                }
                var diff = filterdiff.generateDiff(oldfilter,newfilter);
                if (!diff) {
                    return getLatestFilter(response,curdate,type);
                }
                redis.storeDiff(curdate,olddate,type,diff);
                response.json({
                    'date': curdate,
                    'type': type,
                    'diff': diff
                });
            });
        });
    });
}

function getLatestFilter(response,date,type) {
    redis.getFilter(date,type,function(err,result) {
        if (err || !result || result === 0) {
            return dbconnector(function(err,store) {
                if (err) {
                    throw err;
                }

                store.getFilter(date,type,function(err,result) {
                    if (err) {
                        return response.end('Error');
                    }

                    redis.storeFilter(date,type,result);
                    returnFilter(response,date,type,result);
                });
            });
        }
        console.log('Fetching from redis');
        return returnFilter(response,date,type,result);
    });
}

function returnFilter(res,date,type,filter) {
    return res.json({
        'date': date,
        'type': type,
        'filter': filter
    });
}

function curDate() {
    return utils.getFormattedDate();
}

// Returns true if date matches requirements
function testDate(date) {
    return (/^\d{8}$/.test(date));
}

// Returns true if type does not match requirements
function testType(type) {
    return !type || isNaN(parseInt(type)) || 
           parseInt(type) < 0 || parseInt(type) > 4;
}

module.exports = router;
