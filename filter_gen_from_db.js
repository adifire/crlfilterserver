/*
 * Author: Aditya Rao.
 * This is a POC of generating filters from Prof. Mislove's certs db.
 * To run - node <executable file name> <certs db location> 
 */

var sqlite = require('sqlite3'),
    fs = require('fs'),
    bloem = require('bloem');

var db = new sqlite.Database(process.argv[2]);

var getNextTenThousand = function(num) {
    if (num < 10000) return 10000;
    var temp = '' + num;
    return (parseInt(temp.slice(0,temp.length - 4)) + 1) * 10000;
}

var gen_filter = function (query,filterfilename) {
    console.log(query);
    db.get('SELECT COUNT(*) FROM (' + query + ')', function(err,row) {
        if (err) {
            return console.log('Error while counting: ' + err);
        }
        var count = row[Object.keys(row)[0]],
            size = getNextTenThousand(count),
            filter = new bloem.SafeBloem(size,0.1);
        console.log('Building filter of size ' + size + ' for count: ' + count);
        var i = 0;
        db.each(query, function(err,row) {
            if (err) return console.log('Error while fetch:' + err);
            try {
                filter.add(row['serial']);
                i += 1;
            } catch(err) {
                console.log('error fetching for ' + JSON.stringify(row) + ' at ' + i + ' error: ' + err);
                throw err;
            }
        }, function(err,numrows) {
            if (err) return console.log(err);
            console.log('Added ' + numrows + ' items to filter ' + filterfilename);
            fs.writeFile(filterfilename,JSON.stringify(filter),'utf-8',function(err) {
                if (err) console.log(err); 
                console.log('done writing serials');
            });
        });
    });
};

/*
 * (WIP) Combined query for revoked ev certs and alexa top 100
 */

var queries = {
    alexa: function (n) { 
        return "SELECT DISTINCT serial FROM crlentries ce WHERE ce.crlid IN (SELECT cr.crlid FROM crls cr JOIN certcrls cc ON cr.crlid = cc.crlid JOIN certdomains cd ON cd.certid = cc.certid JOIN domains d ON d.domainid = cd.domainid WHERE d.alexa != '' AND d.alexa <= " + n + " GROUP BY cr.crlid)";
    },
    caKnown: "SELECT DISTINCT c3.serial AS 'serial' FROM certs c3 WHERE c3.ca = 1 AND c3.revoked NOT NULL",
    evKnown: "SELECT DISTINCT c2.serial AS 'serial' FROM certs c2 JOIN certoids co on c2.certid = co.certid JOIN oids o on co.oidid = o.oidid where o.ev = 1 and c2.revoked not null",
    keyCompr: "SELECT DISTINCT ce1.serial AS 'serial' FROM crlentries ce1 WHERE ce1.reason = 1",
    everything: "SELECT DISTINCT serial FROM crlentries",
    revokedKnown: "SELECT DISTINCT serial FROM certs WHERE revoked NOT NULL",
    evcaFromCrl: "SELECT DISTINCT serial FROM crlentries ce JOIN crls c ON c.crlid = ce.crlid WHERE crl LIKE '%EV%' OR crl LIKE '%CA'"
};

var fQ = {
    type0: queries.evcaFromCrl
}
fQ.type1 = fQ.type0 + ' UNION ' + queries.keyCompr;
fQ.type2 = fQ.type1 + ' UNION ' + queries.alexa(1000);
fQ.type3 = fQ.type1 + ' UNION ' + queries.alexa(100000);
fQ.type4 = queries.everything;

db.serialize(function () {

    for (var type in fQ) {
        gen_filter(fQ[type],'filters2_'+type);
    }
    /*
    serials = []
    //fs.writeFile('serials_only','',function(err) { if (err) throw err; });
    db.each('SELECT serial FROM crlentries limit 8000', function(err,row) {
        if (err) return console.log(err);
        serials.push(row.serial);
    },function(err,result) {
        if (err) throw err;
        fs.writeFile('serials_only',serials.join('\n'),function(err) { if (err) throw err; });
    });*/
});

//
// Junk for reference
/*
db.get("SELECT count(distinct serial) FROM crlentries", function(err,row) {
        if (err) return console.log(err);
        for (var i in row) {
            console.log(row[i]);
            filter_all = new bloem.SafeBloem(row[i],0.1);
        }
        db.each("SELECT DISTINCT serial FROM crlentries", function(err,row) {
            if (err) return console.log(err);
            filter_all.add(row['serial']);
        }, function(err,numrows) {
            if (err) return console.log(err);
            console.log(numrows);
            fs.writeFile('serialsfilter',JSON.stringify(filter_all),'utf-8',function(err) {if (err) console.log(err); console.log('done writing serials');});
        });
    });
*/


