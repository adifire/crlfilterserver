var assert = require('assert'),
    fs = require('fs'),
    async = require('async'),
    chai = require('chai'),
    expect = chai.expect,
    test_config = require('./diff_config'),
    MongoDBHelper = require('../lib/mongodbhelper'),
    RedisStore = require('../lib/redisstore.js').RedisStore,
    filtergen = require('../lib/filter_gen'),
    filter_diff = require('../lib/filter_diff');


var datastore = new MongoDBHelper(test_config.mongodb.url,function(err) {
    if (err) {
        console.err("Cannot connect to mongodb, error:" + err);
        process.exit(1);
    }
    var redisclient = new RedisStore(test_config.redis);
    exec_test(datastore,redisclient);
});

/*
 * Store 3 sets of filters for 3 days prior and then test for
 * corresponding diffs
 */
var exec_test = function(mongodb,redis) {
    var test_serials_list = test_config.filter.test_serials,
        capacity = test_config.filter.capacity;
    test_serials_list.forEach(function(info) {
        info.mongoclient = mongodb;
        info.capacity = capacity;
    });

    var cleanup = function() {
        // Test Done, close everything
        redis.cleanDB(true);
        mongodb.cleanFilterDB(function(err) {
            assert.equal(err,undefined,'TEST FAILED Error at cleaning filter DB:' + err);
            console.log('TEST SUCCESS');
        });
    };

    var olddate = test_serials_list[0].date,
        curdate = test_serials_list[2].date;
    console.log(olddate);
    console.log(curdate);
    var testDiffs = function() {
        async.waterfall([
            function(callback) {
                console.log('generating diff');
                return filter_diff.generateDiff(mongodb,redis,olddate,curdate,'1',callback);
            },
            function(res,callback) {
                //assert.equal(err,undefined,'Error while generating first diff: ' + err);
                expect(res).to.exist;
                console.log('Construct and check whether it creates the right filter');
                return checkConstructedFilter(mongodb,redis,olddate,curdate,'1',callback);
            },
            function(callback) {
                //assert(result,'Error while fetching first diff');
                console.log('All Done, now cleanup');
                callback();
            } 
        ], function(err,result) {
            if (err) {
                console.log("TEST FAILED");
            } else {
                console.log("TEST SUCCEEDED");
            }
            cleanup()
        });
    };

    async.eachSeries(test_serials_list,genfilterhelper,function(err) {
        assert.equal(err,undefined,'TEST FAILED Error at filter generation:' + err);
        /* 
         * Now test for diffs
         * Generate diffs, then get them from redis, reconstruct
         */
        console.log('Now test for diffs');
        return testDiffs();
    });
};

var genfilterhelper = function(info,callback) {
    filtergen.generateFilterDummy(info.mongoclient,info.date,
                            info.serial,info.capacity,callback);
};

var checkConstructedFilter = function(mongodb,redis,olddate,curdate,type,callback) {
    mongodb.getFilter(olddate,function(err1,results) {
        assert(!err1,'Error while fetching old filter: ' + err1);
        var oldfilter = JSON.parse(results[0].filters)[type];
        console.log(oldfilter);
        return mongodb.getCurrentFilter(function(err2,results_) {
            assert(!err2,'Error while fetching new filter');
            var newfilter = JSON.parse(results_[0].filters)[type];
            console.log(newfilter);
            return redis.getDiff(curdate,olddate,type,function(err3,diff) {
                assert(!err3,'Error while fetching diff');
                //console.log(diff);
                assert(diff,'Error while fetching diff, diff is empty/null');
                var reconstructedfilter = reconstructfilter(oldfilter,JSON.parse(diff));
                expect(reconstructedfilter).to.deep.equal(newfilter);//,'Error: Reconstructed filter not the same as current filter');
                callback();
            });
        });
    });
};
            

var reconstructfilter = function(oldfilter,diff) {
    assert(diff,'Diff not generated properly, no buffer changes');
    if (diff.hasOwnProperty('count')) {
        oldfilter.count = diff.count;
    }
    var oldbuffer = oldfilter.filter.bitfield.buffer.data;
    var diffbuffer = diff.buffer;
    for (var i in diffbuffer) {
        var j = parseInt(i,10);
        if (oldbuffer[j] !== diff.buffer[i]) {
            oldbuffer[j] = diff.buffer[i];
        }
    }
    return oldfilter;
};

var checkfilter = function(filter,filtertocheck) {
    var buffer = filter.filter.bitfield.buffer.buffer,
        buffertocheck = filtertocheck.filter.bitfield.buffer.buffer;
    console.log(buffer);
    for (var i in buffer) {
        if (buffer[i] !== buffertocheck[i]) {
            console.log(i);
            return false;
        }
    }
    return true;
};

