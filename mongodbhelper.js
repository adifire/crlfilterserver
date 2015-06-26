var mongoclient = require('mongodb').MongoClient;

function StoreClient() {
    var self = this;
    self.url = (arguments.length < 1) ? 'mongodb://localhost:27017/crlfilter' 
                                      : arguments[0];
    // Check for mongodb connection
    mongoclient.connect(self.url,function(err,db) {
        if (err) throw new Error('Cannot connect to db. Error: ' + err);
        self.connected = true;
        console.log('DB connection working');
        db.close();
    });
}

StoreClient.prototype.store_filters = function() {
    if (arguments.length < 1) {
        return ;
    }
    var filters = arguments[0],
        callback = (arguments[1]) ? arguments[1] : undefined;
    mongoclient.connect(this.url,function(err,db) {
        if (err) return callback(err);
        var collection = db.collection('filters'),
            date = new Date(),
            passed = false,
            utc_date = date.getUTCDate() + ' ' + 
                       date.getUTCMonth() + ' ' + date.getUTCFullYear();
        var update_current = function() {
            collection.update({'date':'current'},{'filters':filters}, function(err,result) {
                passed = false;
                if (err) callback(new Error('Updating current filters error: ' + err));
                passed = true;
                console.log('Updated current filter');
                db.close();
                console.log('Done inserting');
                if (passed && callback) 
                    callback(undefined,'Success');
            });
        };

        collection.insert({'date':utc_date,'filters':filters},function(err,result) {
            if (err) return callback(err);
            if (result.result.n !== 1)
                return callback(new Error('Insert error: inserted ' + result.resut.n + 'should be 1'));
            passed = true;
            console.log('Inserted new filters');
            update_current();
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
