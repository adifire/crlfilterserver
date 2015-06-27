var mongoclient = require('mongodb').MongoClient;

function StoreClient(url,callback) {
    var self = this;
    self.url = (url) ? url : 'mongodb://localhost:27017/crlfilter';

    // Check for mongodb connection
    mongoclient.connect(self.url,function(err,db) {
        if (err) return callback(err);
        self.connected = true;
        console.log('DB connection working');
        db.close();
        callback();
    });
}

StoreClient.prototype.store_filters = function(filters,callback) {
    if (!filters) {
        return;
    }

    var output = function(err,result) {
        if (!callback) return;
        return callback(err,result);
    };

    mongoclient.connect(this.url,function(err,db) {
        if (err) return output(err);
        var collection = db.collection('filters'),
        date = new Date(),
        passed = false,
        utc_date = date.getUTCDate() + ' ' + 
        date.getUTCMonth() + ' ' + date.getUTCFullYear();
        collection.update({'date':utc_date},{'date':utc_date,'filters':filters},{'upsert':true}, function(err,result) {
            if (err) {
                db.close();
                return output(err);
            }
            collection.update({'date':'current'},{'date':'current','filters':filters},{'upsert':true},function(err,result) {
                db.close();
                if (err) {
                    return output(err);
                }
                console.log("Inserted filters for " + utc_date);
                output();
            });
        });
    });
};

StoreClient.prototype.get_filter = function() {
    if (arguments.length < 3) return;
    var args = Array.prototype.slice.call(arguments),
        olddate = args.shift(),
                typereq = args.shift(),
                callback = args.shift();
    mongoclient.connect(this.url, function(err,db) {
        if (err) return callback(new Error('Cannot connect to db. Error:' + err));
        var collection = db.collection('filters');
        collection.find({'date':olddate}).toArray(function(err,result) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            console.log(result.length);
            db.close();
            return callback(undefined,result);
        });
    });
};

StoreClient.prototype.get_current = function() {};

module.exports = StoreClient;
