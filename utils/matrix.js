const range = require('./range');
const deepMap = require('./deepMap');

function broadcastable(shapeA, shapeB) {
    for (let i = 0; i < Math.min(shapeA.length, shapeB.length); i++) {
        let a = shapeA[shapeA.length - 1 - i];
        let b = shapeB[shapeB.length - 1 - i];
        if (a !== b && a !== 1 && b !== 1)
            return false;
    }
    return true;
}

function NotAlignedError(shapeA, shapeB) {
    throw new Error(`Shapes ${
        '(' + shapeA.join(' x ') + ')'
        } and ${
        '(' + shapeB.join(' x ') + ')'
        } are not aligned`);
}

class Matrix {
    constructor(dimensions, fill = 0) {
        return Array.from(Array(dimensions[0]),
            () => dimensions.length > 1 ?
                new Matrix(dimensions.slice(1), fill) : fill);
    }

    static getShape(matrix) {
        let shape = [matrix.length];
        if (Array.isArray(matrix[matrix.length - 1]))
            shape.push(...Matrix.getShape(matrix[matrix.length - 1]));

        shape.equals = otherShape =>
            !shape.find((value, i) => value !== otherShape[i]);
        shape.broadcastableTo = otherShape => broadcastable(shape, otherShape);
        return shape;
    }

    static is1D(matrix) {
        return !Array.isArray(matrix[matrix.length - 1]);
    }

    static map(matrix, callback, indices = []) {
        return matrix.map((value, index) => {
            let currentIndices = [...indices, index];
            if (Array.isArray(value))
                return Matrix.map(value, callback, currentIndices);
            return callback(value, currentIndices);
        });
    }

    static forEach(matrix, callback, indices = []) {
        matrix.forEach((value, index) => {
            let currentIndices = [...indices, index];
            if (Array.isArray(value)) {
                Matrix.forEach(value, callback, currentIndices);
            } else {
                callback(value, currentIndices);
            }
        });
    }

    // Get value at specified indices (array or spread)
    static get(matrix, indices) {
        // Check if array was passed
        if (indices.length === 1)
            return matrix[indices[0]];
        return Matrix.get(matrix[indices[0]], indices.slice(1));
    }

    // Set value at specified indices (array or spread)
    static set(matrix, indices, value) {
        // Check if array was passed
        if (indices.length === 1) {
            matrix[indices[0]] = value;
        } else {
            Matrix.set(matrix[indices[0]], indices.slice(1), value);
        }
        return matrix;
    }

    // Perform generic operation with broadcasting element-wise
    static operation(a, b, operation) {
        let scalarA = typeof a === `number`;
        let scalarB = typeof b === `number`;
        if (scalarA && scalarB)
            return operation(a, b);
        if (scalarA || scalarB) {
            if (scalarA)
                ([a, b] = [b, a]); // Swap around
            return a.map(value => Matrix.operation(value, b, operation));
        }

        let aDim = Matrix.getShape(a);
        let bDim = Matrix.getShape(b);
        if (!aDim.broadcastableTo(bDim))
            throw new NotAlignedError(aDim, bDim);

        // Perform operation element-wise with broadcasting
        // Loop through all possible indices of the resulting matrix
        // and for each of those, determine whether the dimension
        // should be broadcasted in either of the arrays

        // If bDim is longer than aDim, swap around
        if (bDim.length > aDim.length)
            ([a, aDim, b, bDim] = [b, bDim, a, aDim]);

        let bOffset = aDim.length - bDim.length;
        let dimensions = aDim.map((size, i) =>
            bOffset > i ? size : Math.max(size, bDim[i - bOffset]));

        // console.log(`a: ` + JSON.stringify(a));
        // console.log(`b: ` + JSON.stringify(b));
        // console.log(`result: ` + JSON.stringify(new Matrix(dimensions)));

        return Matrix.map(new Matrix(dimensions), (_, indices) => {
            // console.log('aDim: ' + JSON.stringify(aDim));
            let aIndices = indices.map((i, dimIndex) => Math.min(i, aDim[dimIndex] - 1));
            let bIndices = indices.slice(bOffset).map((i, dimIndex) => Math.min(i, bDim[dimIndex] - 1));
            // console.log(`indices: ${indices}, a: ${aIndices}, b: ${bIndices}`);
            return operation(Matrix.get(a, aIndices), Matrix.get(b, bIndices));
        });

        // return Matrix.map(a, (value, indices) => {
        //     let correspondingIndices = indices;
        //     if (indices.length > bDim.length)
        //         correspondingIndices = indices.slice(-bDim.length);
        //     else if (indices.length < bDim.length)
        //         correspondingIndices = [...Array(bDim.length - indices.length).fill(1), ...indices];
        //     return operation(value, Matrix.get(b, correspondingIndices));
        // });
    }

    // Add values in matrices A and B element-wise
    static add(a, b) {
        if (a === 0)
            return b;
        if (b === 0)
            return a;
        return Matrix.operation(a, b, (x, y) => x + y);
    }

    // Subtract values in matrices B from A element-wise
    static subtract(a, b) {
        if (a === 0)
            return b;
        if (b === 0)
            return a;
        return Matrix.operation(a, b, (x, y) => x - y);
    }

    /**
     * Multiply values in matrices A and B element-wise
     * Not to be confused with actual matrix multiplication
     * @param {*} a 
     * @param {*} b 
     */
    static multiply(a, b) {
        if (a === 1)
            return b;
        if (b === 1)
            return a;
        return Matrix.operation(a, b, (x, y) => x * y);
    }

    // Divide values in matrices A and B
    static divide(a, b) {
        if (a === 1)
            return b;
        if (b === 1)
            return a;
        return Matrix.operation(a, b, (x, y) => x / y);
    }

    /**
     * Calculate the dot product of matrices, vectors and/or scalars.
     * @param {Array|Number} a Matrix, vector or scalar
     * @param {Array|Number} b Matrix, vector or scalar
     */
    static dot(a, b) {
        let scalarA = typeof a === `number`;
        let scalarB = typeof b === `number`;
        if (scalarA && scalarB)
            return a * b;
        if (scalarA || scalarB)
            return Matrix.multiply(a, b);

        let aDim = Matrix.getShape(a);
        let bDim = Matrix.getShape(b);
        if (bDim.length === 1) {
            if (bDim[0] !== aDim[aDim.length - 1])
                throw new NotAlignedError(aDim, bDim);
            if (aDim.length === 1)
                return a.reduce((sum, value, i) =>
                    sum + value * b[i], 0);
            return deepMap(a, aDim.length - 1, row =>
                row.reduce((sum, value, i) => sum + value * b[i], 0));
        }

        if (aDim.length === 2 && bDim.length === 2) {
            if (aDim[1] !== bDim[0])
                throw new NotAlignedError(aDim, bDim);

            return a.map(row =>
                range(bDim[1]).map(i =>
                    row.reduce((sum, value, j) =>
                        sum + value * b[j][i], 0)));
        }

        if (bDim.length < 2)
            throw new Error(`Can't take dot product of N-D and M-D where M < 2`);
        if (aDim[aDim.length - 1] !== bDim[bDim.length - 2])
            throw new NotAlignedError(aDim, bDim);

        if (aDim.length === 1 && bDim.length === 2) {
            return range(bDim[1]).map(i =>
                a.reduce((sum, value, j) =>
                    sum + value * b[j][i], 0));
        }

        return deepMap(a, aDim.length - 1, row =>
            deepMap(b, bDim.length - 2, matrix =>
                Matrix.dot(row, matrix)));
    }

    static transpose(matrix) {
        if (Matrix.is1D(matrix))
            return matrix;
        let shape = Matrix.getShape(matrix);
        return Matrix.map(new Matrix(shape.reverse()), (_, indices) =>
            Matrix.get(matrix, indices.slice(0).reverse()));
    }
}

module.exports = Matrix;