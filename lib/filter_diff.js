var exports = module.exports;
function generateDiff(oldfilter,newfilter) {

    if (oldfilter.error_rate !== newfilter.error_rate) {
        return console.error('Files not supposed to have different error rate');
    }

    var changes = {};
    if (oldfilter.capacity !== newfilter.capacity) {
        changes.capacity = newfilter.capacity;
    }

    if (oldfilter.count !== newfilter.count) {
        changes.count = newfilter.count;
    }

    if (oldfilter.filter.size !== newfilter.filter.size) {
        changes.filter_size = newfilter.filter.size;
    }

    if (oldfilter.filter.slices !== newfilter.filter.slices) {
        changes.filter_slices = newfilter.filter.slices;
    }

    var oldbuffer = oldfilter.filter.bitfield.buffer.data,
        newbuffer = newfilter.filter.bitfield.buffer.data;

    changes.buffer = {};
    for (var i = 0; i < oldbuffer.length; i++) {
        if (oldbuffer[i] !== newbuffer[i]) {
            //console.log(i);
            changes.buffer[i] = newbuffer[i];
        }
    }

    if (oldbuffer.length < newbuffer.length) {
        for (var i = oldbuffer.length; i < newbuffer.length; i++)
            changes.buffer[i] = newbuffer[i];
    }

    return (changes.length === 0) ? null : changes;
}

exports.generateDiff = generateDiff;
exports.generateDiffAlt = function(oldfilter,newfilter) {
    return generateDiff(JSON.parse(oldfilter),JSON.parse(newfilter));
};

