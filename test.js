var MongoDBHelper = require('./lib/mongodbhelper'),
    fs = require('fs'),
    bloem = require('bloem'),
    expect = require('chai').expect,
    utils = require('./lib/utils'),
    config = require('./config');

var filter = bloem.SafeBloem.destringify(JSON.parse(fs.readFileSync('./test_serials/filters_type4','utf8')));
console.log(filter.capacity);
var datastore = new MongoDBHelper('mongodb://localhost:27017/crlfilter',function(err) {
    if (err) return console.log(err);
    //datastore.storeFilters(utils.getFormattedDate(),{'1':JSON.parse(JSON.stringify(filter))},true, function(err,res) {
        //if (err) return console.log(err);

        datastore.getFilter(utils.getFormattedDate(),'4',function(err,res) {
            if (err) return console.log(err);
            console.log(filter);
            var filter2 = bloem.SafeBloem.destringify(JSON.parse(res));
            console.log(filter2);
            expect(filter).to.deep.equal(filter2);
        });
    //});
});
