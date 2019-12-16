const fs = require(`fs`);
const tf = require('@tensorflow/tfjs');

// require('@tensorflow/tfjs-node'); // CPU training in NodeJS environment
require('@tensorflow/tfjs-node-gpu'); // Requires tensorflow compiled with GPU support

const epochs = 200;
const batchSize = 1000;
const sizes = [784, 100, 30, 10];

const modelName = `${sizes.join('x')}-bs${batchSize}-` +
    Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
const dir = `./tfmodels/${modelName}`;

if (fs.existsSync(dir)) {
    console.log(`Directory ${dir} already exists`);
    process.exit(1);
}
fs.mkdirSync(dir);

console.log(`Training model with name: ${modelName}`);

let trainingData = JSON.parse(fs.readFileSync(`./MNIST_JSON_FLOAT/trainingData.json`));
let testData = JSON.parse(fs.readFileSync(`./MNIST_JSON_FLOAT/testingData.json`));

function indexToResultArray(i) {
    return [...Array(10)].map((_, j) => i === j ? 1 : 0);
}

trainingData = trainingData.map(([x, y]) => [x.flat(), indexToResultArray(y)]);
testData = testData.map(([x, y]) => [x.flat(), indexToResultArray(y)]);

let trainXs = [], trainYs = [];
for (let [x, y] of trainingData) {
    trainXs.push(x);
    trainYs.push(y);
}
trainXs = tf.tensor(trainXs);
trainYs = tf.tensor(trainYs);

let testXs = [], testYs = [];
for (let [x, y] of testData) {
    testXs.push(x);
    testYs.push(y);
}
testXs = tf.tensor(testXs);
testYs = tf.tensor(testYs);

const model = tf.sequential();
for (let [i, layer] of sizes.slice(1).entries())
    model.add(tf.layers.dense({
        inputShape: i === 0 ? sizes.slice(0, 1) : undefined,
        units: layer,
        activation: 'sigmoid',
        kernelInitializer: tf.initializers.randomNormal({ stddev: 1 / sizes[i] }),
        kernelRegularizer: tf.regularizers.l2({ l2: 0.00001 })
    }));

model.compile({
    optimizer: tf.train.sgd(30),
    loss: tf.losses.softmaxCrossEntropy,
    metrics: ['accuracy']
})

model.fit(trainXs, trainYs, {
    epochs,
    batchSize,
    validationData: [testXs, testYs],
    shuffle: true,
    callbacks: {
        onEpochEnd: async epoch =>
            await model.save(`file://${dir}/epoch-${epoch}`)
    }
});