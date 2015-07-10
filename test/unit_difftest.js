var fs = require('fs'),
    bloem = require('bloem'),
    expect = require('chai').expect,
    filterdiff = require('../lib/filter_diff');

var readAndCreateFilter = function(filename,capacity) {
    var data = fs.readFileSync(filename,'utf-8');
    data = data.split('\n');
    var filter = new bloem.SafeBloem(capacity,0.1);
    for (var i in data) {
        filter.add(data[i]);
    }
    return filter;
};

var f1 = readAndCreateFilter('test/serials_1',5000),
    f2 = readAndCreateFilter('test/serials_2',5000);

var diff = filterdiff.generateDiffAlt(JSON.stringify(f1),JSON.stringify(f2));

expect(diff).to.have.ownProperty('count');
expect(diff).to.have.ownProperty('buffer');

f1.count = diff.count;
var f1buf = f1.filter.bitfield.buffer;
var n;
for (var i in diff.buffer) {
    n = parseInt(i,10);
    if (f1buf[n] !== diff.buffer[i]) {
        f1buf[n] = diff.buffer[i];    
    }
}

expect(f1).to.deep.equal(f2);

console.log('TEST PASS');

