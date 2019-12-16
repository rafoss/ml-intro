const math = require('mathjs');
const Matrix = require('./utils/matrix');
const range = require('./utils/range');
const zip = require(`./utils/zip`);

const X2PI = Math.PI * 2;
function generateGaussian(mean, std) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(X2PI * u2);
    return z0 * std + mean;
}

const sigmoid = z => math.map(z, x => 1 / (1 + Math.E ** -x));
// Takes sigmoid value(s) as input
const sigmoidPrime = z => math.map(z, x => x * (1 - x));
const shuffle = array => array.sort(() => .5 - Math.random());
const argMax = array => array.indexOf(Math.max(...array));

class Network {
    constructor(model) {
        if (Array.isArray(model))
            model = { sizes: model };

        let { sizes, biases, weights } = model;
        if (!sizes) {
            if (!weights)
                throw new Error(`No layer sizes given or possible to infer`);
            sizes = [
                ...weights.map(w => w[0].length),
                weights[weights.length - 1].length
            ];
        }

        this.numLayers = sizes.length;
        this.sizes = sizes;

        let slice = sizes.slice(1);
        // Layers of biases for each node (excluding input nodes)
        this.biases = biases || slice.map(layerSize =>
            Array(layerSize).fill(0).map(() => generateGaussian(0, 1)));
        // Layers of weights for each node connection (including from inputs)
        this.weights = weights || slice
            .map((layerSize, i) => [sizes[i], layerSize])
            .map(([fromLayerSize, toLayerSize]) =>
                Array.from(Array(toLayerSize),
                    () => Array.from(Array(fromLayerSize),
                        () => generateGaussian(0, 1))));
    }

    feedForward(input) {
        if (Array.isArray(input[0])) {
            let activations = math.transpose(input);
            for (let [w, b] of zip(this.weights, this.biases))
                activations = sigmoid(
                    math.multiply(w, activations).map((row, i) =>
                        row.map(col => col + b[i])));
            return math.transpose(activations);
        } else {
            if (input.length !== this.sizes[0])
                throw new Error(`Input length doesn't match the number of input nodes (${input.length} !== ${this.sizes[0]})`);
            // Feed input through the neural network
            for (let [w, b] of zip(this.weights, this.biases))
                input = sigmoid(math.add(math.multiply(w, input), b));
            return input;
        }
    }

    stochasticGradientDescent(trainingData, epochs, miniBatchSize, eta, testData, callback) {
        // Train the neural network using mini-batch stochastic gradient descent.
        // The training data is an array of pairs representing training inputs
        // and their desired outputs. If testData is provided, the network will
        // be evaluated against the test data after each epoch, and partial progress
        // will be printed out. This is useful for tracking progress, but slows
        // things down substantially.

        let rate = eta / miniBatchSize;
        let evalXs = [], evalYs = [];
        if (testData) {
            for (let [x, y] of testData) {
                evalXs.push(x);
                evalYs.push(y);
            }
        }

        for (let epoch of range(epochs)) {
            shuffle(trainingData);
            for (let i of range(0, trainingData.length, miniBatchSize)) {
                let Xs = [], Ys = [];
                for (let j = 0; j < i + miniBatchSize && i + j < trainingData.length; j++) {
                    Xs.push(trainingData[i + j][0]);
                    Ys.push(trainingData[i + j][1]);
                }

                let [nablaB, nablaW] = this.backpropagate(Xs, Ys);

                Matrix.forEach(this.biases, (v, indices) => {
                    Matrix.set(this.biases, indices, v - rate * Matrix.get(nablaB, indices));
                });
                Matrix.forEach(this.weights, (v, indices) => {
                    Matrix.set(this.weights, indices, v - rate * Matrix.get(nablaW, indices));
                });

                // this.biases = zip(this.biases, nablaB).map(([b, nb]) =>
                //     math.subtract(b, math.dotMultiply(nb, rate)));
                // this.weights = zip(this.weights, nablaW).map(([w, nw]) =>
                //     math.subtract(w, math.dotMultiply(nw, rate)));
            }
            console.log(`Epoch ${epoch}` + (testData ?
                `: ${this.evaluate(evalXs, evalYs)} / ${testData.length}` : ` complete`));
            if (typeof callback === 'function')
                callback(epoch);
        }
    }

    backpropagate(inputs, desiredOutputs) {
        // Return a pair consisting of nabla biases and nabla weights
        // representing the cost function. They are layers of biases
        // and weights like this.biases and this.weights.

        let nablaB = [], nablaW = []

        // Feed forward
        let activations = math.transpose(inputs);
        let layers = [activations]; // Stores all activations, layer by layer
        for (let [w, b] of zip(this.weights, this.biases)) {
            activations = sigmoid(
                math.multiply(w, activations).map((row, i) =>
                    row.map(col => col + b[i])));
            layers.push(activations);
        }

        // Backward pass
        // Cost(a) = (a - y)^2
        // d Cost / d a = 2(a - y)
        let costPrime = Matrix.map(activations, (a, indices) => {
            // 0: row, 1: column
            // columns are each activation
            // desiredOutputs are in a 1D array
            if (indices[1] === desiredOutputs[indices[0]])
                a = a - 1;
            return 2 * a;
        });
        let delta = math.dotMultiply(costPrime, sigmoidPrime(activations));
        nablaB.unshift(delta.map(row =>
            row.reduce((sum, value) => sum + value, 0)));
        nablaW.unshift(Matrix.map(
            new Matrix([delta.length, layers[layers.length - 2].length]),
            (_, [row, col]) =>
                math.dotMultiply(delta[row], layers[layers.length - 2][col])
                    .reduce((sum, v) => sum + v, 0)));

        for (let l = 2; l < this.numLayers; l++) {
            let sp = sigmoidPrime(layers[layers.length - l]);
            delta = math.dotMultiply(math.multiply(math.transpose(this.weights[this.weights.length - l + 1]), delta), sp);

            nablaB.unshift(delta.map(row =>
                row.reduce((sum, value) => sum + value, 0)));
            nablaW.unshift(Matrix.map(
                new Matrix([delta.length, layers[layers.length - l - 1].length]),
                (_, [row, col]) =>
                    math.dotMultiply(delta[row], layers[layers.length - l - 1][col])
                        .reduce((sum, v) => sum + v, 0)));
        }
        return [nablaB, nablaW];
    }

    evaluate(x, y) {
        // Return the number of test inputs for which the neural
        // network outputs the correct result. Note that the neural
        // network's output is assumed to be the index of whichever
        // neuron in the final layer has the highest activation.

        if (!y) {
            let Xs = [], Ys = [];
            for (let [a, b] of x) {
                Xs.push(a);
                Ys.push(b);
            }
            x = Xs;
            y = Ys;
        }

        return this.feedForward(x)
            .map((a, i) => Number(argMax(a) === y[i]))
            .reduce((sum, r) => sum + r, 0);
    }
}

module.exports = Network;