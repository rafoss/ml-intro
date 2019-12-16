function range(start, stop, step = 1) {
    ([start, stop] = [stop ? start : 0, stop || start]);
    return [...Array(Math.ceil((stop - start) / step))]
        .map((_, i) => start + i * step);
}

module.exports = range;