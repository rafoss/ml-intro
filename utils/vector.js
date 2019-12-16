class Vector {
    // Perform generic operation element-wise
    static operation(a, b, operation) {
        let scalarA = typeof a === `number`;
        let scalarB = typeof b === `number`;
        if (scalarA && scalarB)
            return operation(a, b);
        if (scalarA || scalarB) {
            if (scalarA)
                ([a, b] = [b, a]); // Swap around
            return a.map(value => operation(value, b));
        }
        return a.map((value, i) => operation(value, b[i]));
    }

    // Add values in vectors a and b
    static add(a, b) {
        return Vector.operation(a, b, (x, y) => x + y);
    }

    // Subtract values in b from values in a
    static subtract(a, b) {
        return Vector.operation(a, b, (x, y) => x - y);
    }

    // Multiply values in a by b or values in b
    static multiply(a, b) {
        return Vector.operation(a, b, (x, y) => x * y);
    }

    // Divide values in a by b or values in b
    static divide(a, b) {
        return Vector.operation(a, b, (x, y) => x / y);
    }
}

module.exports = Vector;