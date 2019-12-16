function deepMap(array, depth, callback, indices = []) {
    if (depth-- <= 0)
        return callback(array, indices);
    return array.map((value, i) => deepMap(value, depth, callback, [...indices, i]));
}

module.exports = deepMap;