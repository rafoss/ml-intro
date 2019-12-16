// Same as matrixbatch, but using mathjs, also slower than regular
// const Network = require(`./network-matrixbatch-mathjs`);
// Would-be optimized if matrix math was faster
// const Network = require(`./network-matrixbatch`);
const fs = require(`fs`);
const Network = require(`./network`);

const batchSize = 10;
const learningRate = 3;
const sizes = [784, 100, 10];

const modelName = `${sizes.join('x')}-bs${batchSize}-lr${learningRate}-` +
    Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
const dir = `./models/${modelName}`;

if (fs.existsSync(dir)) {
    console.log(`Directory ${dir} already exists`);
    process.exit(1);
}
fs.mkdirSync(dir);

console.log(`Training model with name: ${modelName}`);

let trainingData = JSON.parse(fs.readFileSync(`./MNIST_JSON_FLOAT/trainingData.json`));
let testData = JSON.parse(fs.readFileSync(`./MNIST_JSON_FLOAT/testingData.json`));

trainingData = trainingData.map(([x, y]) => [x.flat(), y]);
testData = testData.map(([x, y]) => [x.flat(), y]);

let network = new Network(sizes);

console.log(`Starting point: ${network.evaluate(testData)} / ${testData.length}`);

network.stochasticGradientDescent(trainingData, 100, batchSize, learningRate, testData, epoch => {
    let model = {
        name: modelName,
        sizes: network.sizes,
        weights: network.weights,
        biases: network.biases
    };
    fs.writeFileSync(`${dir}/${epoch}.json`, JSON.stringify(model));
});