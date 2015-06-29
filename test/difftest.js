var MongoDBHelper = require('../lib/mongodbhelper'),
    filtergen = require('../lib/filter_gen'),
    diff_filter = require('../lib/filter_diff'),
    assert = require('assert'),
    fs = require('fs');

var testurl = 'mongodb://localhost:27017/testcrlfilter';

var datastore = new MongoDBHelper(testurl,function(err) {
    if (err) {
        console.err("Cannot connect to mongodb, error:" + err);
        process.exit(1);
    }
    exec_test();
});

var generateFilterDummy = filtergen.generateFilterDummy;
function exec_test() {
    var dates = ['test1','test2'];
    generateFilterDummy(datastore,dates[0],'./test/serials_1',function (err,data) {
        if (err) return console.log(err);
        console.log(data);
        var oldfilters = data.filters;
        generateFilterDummy(datastore,dates[1],'./test/serials_2',function(err,data) {
            var newfilters = data.filters;
            diff_filter.generateDiff(datastore,'test1','1',function(err,result) {
                if (err) return console.log(err);
                console.log(result);
                datastore.clearDiffs(function(err) {
                    if (err) return console.log(err);
                    datastore.cleanFilterDB(function(err) {
                        if (err) return console.log(err);
                        console.log('Done with testing!');
                    });
                });
            });
        });
    });
}
