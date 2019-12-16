const Matrix = require(`./utils/matrix`);
const zip = require(`./utils/zip`);

const X2PI = Math.PI * 2;
function generateGaussian(mean, std) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(X2PI * u2);
    return z0 * std + mean;
}

const sigmoid = z => Matrix.map(z, x => 1 / (1 + Math.E ** -x));
// Takes sigmoid value(s) as input
const sigmoidPrime = z => Matrix.map(z, x => x * (1 - x));
const shuffle = array => array.sort(() => .5 - Math.random());
const argMax = array => array.indexOf(Math.max(...array));

function range(start, stop, step = 1) {
    ([start, stop] = [stop ? start : 0, stop || start]);
    return [...Array(Math.ceil((stop - start) / step))]
        .map((_, i) => start + i * step);
}

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
        if (input.length !== this.sizes[0])
            throw new Error(`Input length doesn't match the number of input nodes (${input.length} !== ${this.sizes[0]})`);
        // Feed input through the neural network
        for (let [w, b] of zip(this.weights, this.biases))
            input = sigmoid(Matrix.add(Matrix.dot(w, input), b));
        return input;
    }

    stochasticGradientDescent(trainingData, epochs, miniBatchSize, eta, testData, callback) {
        // Train the neural network using mini-batch stochastic gradient descent.
        // The training data is an array of pairs representing training inputs
        // and their desired outputs. If testData is provided, the network will
        // be evaluated against the test data after each epoch, and partial progress
        // will be printed out. This is useful for tracking progress, but slows
        // things down substantially.

        let nTest = testData && testData.length;
        let n = trainingData.length;
        for (let epoch of range(epochs)) {
            shuffle(trainingData);
            // this.updateMiniBatch(trainingData.slice(0, 1), eta);
            for (let i of range(0, n, miniBatchSize))
                this.updateMiniBatch(trainingData.slice(i, i + miniBatchSize), eta);
            console.log(`Epoch ${epoch}` + (testData ?
                `: ${this.evaluate(testData)} / ${nTest}` : ` complete`));
            if (typeof callback === 'function')
                callback(epoch);
        }
    }

    updateMiniBatch(batch, eta) {
        // Update the network's weights and biases by applying gradient descent
        // using backpropagation to a single mini-batch. The batch is an array of
        // paired inputs and expected outputs and the eta is the learning rate.
        let nablaB = this.biases.map(layer => Array(layer.length).fill(0));
        let nablaW = this.weights.map(layer => Array.from(Array(layer.length),
            () => Array(layer[0].length).fill(0)));
        for (let [input, desiredOutput] of batch) {
            let [deltaNablaB, deltaNablaW] = this.backpropagate(input, desiredOutput);
            nablaB = zip(nablaB, deltaNablaB).map(([nb, dnb]) => Matrix.add(nb, dnb));
            nablaW = zip(nablaW, deltaNablaW).map(([nw, dnw]) => Matrix.add(nw, dnw));
        }
        this.biases = zip(this.biases, nablaB).map(([b, nb]) =>
            Matrix.subtract(b, Matrix.multiply(nb, eta / batch.length)));
        this.weights = zip(this.weights, nablaW).map(([w, nw]) =>
            Matrix.subtract(w, Matrix.multiply(nw, eta / batch.length)));
    }

    backpropagate(input, desiredOutput) {
        // Return a pair consisting of nabla biases and nabla weights
        // representing the cost function. They are layers of biases
        // and weights like this.biases and this.weights.

        let nablaB = this.biases.map(layer => Array(layer.length).fill(0));
        let nablaW = this.weights.map(layer => Array.from(Array(layer.length),
            () => Array(layer[0].length).fill(0)));

        // Feed forward
        let activation = input;
        let activations = [input]; // Stores all activations, layer by layer
        for (let [w, b] of zip(this.weights, this.biases)) {
            activation = sigmoid(Matrix.add(Matrix.dot(w, activation), b));
            activations.push(activation);
        }

        // Backward pass
        // Cost(a) = (a - y)^2
        // d Cost / d a = 2(a - y)
        let costPrime = activation.map((value, i) => 2 * (i === desiredOutput ? value - 1 : value));
        // let costPrime = activation.map((value, i) => i === desiredOutput ? value - 1 : value);
        let delta = Matrix.multiply(costPrime, sigmoidPrime(activation));
        nablaB[nablaB.length - 1] = delta;
        nablaW[nablaW.length - 1] = Matrix.multiply(Matrix.transpose([delta]), activations[activations.length - 2]);

        for (let l = 2; l < this.numLayers; l++) {
            let sp = sigmoidPrime(activations[activations.length - l]);
            delta = Matrix.multiply(Matrix.dot(Matrix.transpose(this.weights[this.weights.length - l + 1]), delta), sp);
            nablaB[nablaB.length - l] = delta;
            nablaW[nablaW.length - l] = Matrix.multiply(Matrix.transpose([delta]), activations[activations.length - l - 1]);
        }
        return [nablaB, nablaW];
    }

    evaluate(testData) {
        // Return the number of test inputs for which the neural
        // network outputs the correct result. Note that the neural
        // network's output is assumed to be the index of whichever
        // neuron in the final layer has the highest activation.
        let testResults = testData.map(([x, y]) => [argMax(this.feedForward(x)), y]);
        return testResults.reduce((sum, [x, y]) => sum + (x === y), 0);
    }
}

module.exports = Network;