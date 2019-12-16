/**
 * Returns a mappable iterator of the two arrays zipped together
 * @param {Array} a
 * @param {Array} b
 */
function zip(a, b) {
    return {
        [Symbol.iterator]() {
            let iterA = a[Symbol.iterator]();
            let iterB = b[Symbol.iterator]();
            return {
                next() {
                    let nextA = iterA.next();
                    let nextB = iterB.next();
                    if (nextA.done || nextB.done)
                        return { done: true };
                    return { value: [nextA.value, nextB.value], done: false };
                }
            };
        },
        map(...args) {
            return [...this].map(...args);
        }
    };
}

module.exports = zip;