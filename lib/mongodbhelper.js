var mongoclient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID,
    async = require('async'),
    assert = require('assert'),
    utils = require('./utils');

function StoreClient(url,callback) {
    var self = this;
    self.url = (url) ? url : 'mongodb://localhost:27017/crlfilter';

    var output = outputgen(callback);    

    // Check for mongodb connection
    mongoclient.connect(self.url,function(err,db) {
        if (err) return output(db,err);
        self.connected = true;
        console.log('DB connection working');
        output(db);
    });
}

StoreClient.prototype.storeFilters = function(date,filters,current,callback) {
    if (!filters) {
        return;
    }
    if (!date || date === 'current') {
        date = utils.getFormattedDate();    
    }

    var output = outputgen(callback);

    mongoclient.connect(this.url,function(err,db) {
        if (err) {
            return output(db,err);
        }

        var filterc = db.collection('filters');

        console.log('HEHREH');
        async.forEachOf(filters,function(filter,type,callback) {
           return filterc.update({
               'type':type,
               'lastUpdated':date
           },{'type':type,
               'filter':JSON.stringify(filter),
               'lastUpdated':date
           },{'upsert':true
           },function(err,result) {
                if (err) {
                    return callback(err);
                } if (result.result.ok !== 1 || 
                      result.result.n !== 1) {
                    return callback(new Error('Update not done'));    
                }
                console.log(result.result);
                callback();
            });
        }, function(err) {
            if (err) {
                return output(db,err);    
            }
            
            output(db);
        });

    });
};

StoreClient.prototype.getFilter = function(olddate,type,callback) {
    var output = outputgen(callback);
    olddate = (!olddate || olddate === 'current') ? 
              utils.getFormattedDate() : parseInt(olddate);
    type = (!type) ? '1' : type;

    mongoclient.connect(this.url, function(err,db) {
        if (err) {
            return output(db,err);
        }
        var filterc = db.collection('filters');
        console.log(olddate);
        //TODO Handle possible edge cases 
        filterc.find({'type':type,'lastUpdated':olddate}).toArray(function(err,res) {
            output(db,err,(!err && res && res.length > 0) ? res[0].filter : res);
        });
    });
};

StoreClient.prototype.getCurrentFilter = function(callback) {
    this.getFilter('current',callback);
};

//TODO Need to be fixed
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
    var output = outputgen(callback);

    mongoclient.connect(this.url,function(err,db) {
        if (err) {
            return output(db,err);
        }
        var collection = db.collection('filters');
        collection.remove({},function(err,result) {
            output(db,err,result);
        });
    });
};

StoreClient.prototype.storeDiff = function(date,type,difffilter,callback) {
    var output = outputgen(callback);

    if (!date && !type) {
        return output(undefined,new Error('Wrong arguments provided'));
    }

    mongoclient.connect(this.url,function(err,db) {
        if (err) {
            return output(db,err);
        }
        var collection = db.collection('diffs');
        collection.insert({'date':date,'type':type,'diff':difffilter},function(err,result) {
            output(db,err,result);
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

function outputgen(callback) {
    return function(db,err,res) {
        if (db) {
            db.close();
        }
        if (err && err instanceof Error) {
            console.log(err);
            return callback(err);
        }
        callback(err,res);
    };    
}

module.exports = StoreClient;
