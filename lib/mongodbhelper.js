var mongoclient = require('mongodb').MongoClient;

function StoreClient(url,callback) {
    var self = this;
    self.url = (url) ? url : 'mongodb://localhost:27017/crlfilter';

    var output = function(err,result) {
        if (!callback) return;
        return callback(err,result);
    };
    
    // Check for mongodb connection
    mongoclient.connect(self.url,function(err,db) {
        if (err) return output(err);
        self.connected = true;
        console.log('DB connection working');
        db.close();
        output();
    });
}

StoreClient.prototype.storeFilters = function(date,filters,callback) {
    if (!filters) {
        return;
    }

    var output = function(err,result) {
        if (!callback) return;
        console.log(callback);
        return callback(err,result);
    };

    mongoclient.connect(this.url,function(err,db) {
        if (err) return output(err);
        filters = JSON.stringify(filters);
        var collection = db.collection('filters'),
            data = {'date':date,'filters':filters},
            curdata = {'date':'current','filters':filters};

        collection.update({'date':date},data,{'upsert':true}, function(err,result) {
            if (err) {
                db.close();
                return output(err);
            }
            collection.update({'date':'current'},curdata,{'upsert':true},function(err,result) {
                db.close();
                if (err) {
                    return output(err);
                }
                console.log("Inserted filters for " + date);
                output(undefined,result.length);
            });
        });
    });
};

StoreClient.prototype.getFilter = function(olddate,callback) {
    var output = function(err,result) {
        if (!callback) return;
        console.log(callback);
        return callback(err,result);
    };

    mongoclient.connect(this.url, function(err,db) {
        if (err) return callback(new Error('Cannot connect to db. Error:' + err));
        var collection = db.collection('filters');
        collection.find({'date':olddate}).toArray(function(err,result) {
            db.close();
            output(err,result);
        });
    });
};

StoreClient.prototype.getCurrentFilter = function(callback) {
    this.getFilter('current',callback);
};

StoreClient.prototype.removeFilter = function(date,callback) {
    if (!date) return;
    mongoclient.connect(this.url,function(err,db) {
        if (err) return callback(new Error('Cannot connect to db. Error:' + err));
        db.collection('filters').remove({'date':date},function(err,result) {
            db.close();
            if (err) return callback(err);
            callback(undefined,result);
        });
    });
};

StoreClient.prototype.cleanFilterDB = function(callback) {
    var output = function(err,result) {
        if (!callback) return;
        return callback(err,result);
    };

    mongoclient.connect(this.url,function(err,db) {
        if (err) return callback(new Error('Cannot connect to db. Error:' + err));
        var collection = db.collection('filters');
        collection.remove({},function(err,result) {
            db.close();
            output(err,result);
        });
    });
};

StoreClient.prototype.storeDiff = function(date,type,difffilter,callback) {
    var output = function(err,result) {
        if (!callback) return;
        return callback(err,result);
    };

    if (!date && !type)
        return output(new Error('Wrong arguments provided'));
    mongoclient.connect(this.url,function(err,db) {
        if (err) return callback(new Error('Error connecting to db: ' + err));
        var collection = db.collection('diffs');
        collection.insert({'date':date,'type':type,'diff':difffilter},function(err,result) {
            db.close();
            if (err) return output(err);
            output(undefined,result);
        });
    });
};

StoreClient.prototype.getDiff = function(date,type,callback) {
    var output = function(err,result) {
        if (!callback) return;
        return callback(err,result);
    };

    if (!date && !type)
        return output(new Error('Wrong arguments provided'));

    mongoclient.connect(this.url,function(err,db) {
        if (err) return callback(new Error('Error connecting to db: ' + err));
        var collection = db.collection('diffs');
        collection.find({'date':date,'type':type}).toArray(function(err,results) {
            db.close();
            if (err) return output(err);
            if (results.length < 1) return output(new Error('No rows fetched'));
            callback(undefined,results);
        });
    });
};
    
StoreClient.prototype.clearDiffs = function(callback) {
    var output = function(err,result) {
        if (!callback) return;
        return callback(err,result);
    };

    mongoclient.connect(this.url,function(err,db) {
        if (err) return output(new Error('Error connecting to db: ' + err));
        var collection = db.collection('diffs');
        collection.remove({},function(err,result) {
            db.close();
            output(err,result);
        });
    });
};

module.exports = StoreClient;
