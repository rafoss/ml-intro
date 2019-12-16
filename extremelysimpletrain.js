const Network = require(`./network`);

let dataset = [];
for (let i = 0; i < 1000; i++) {
    let value = Math.random();
    dataset.push([[value], Number(value >= 0.5)]);
}

let slicePoint = Math.floor(dataset.length * 0.9);
let trainingData = dataset.slice(0, slicePoint);
let testData = dataset.slice(slicePoint);

let network = new Network([1, 2]);

network.stochasticGradientDescent(trainingData, 10, 1, 0.01, testData);
console.log(JSON.stringify(network.biases));
console.log(JSON.stringify(network.weights));

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const argMax = array => array.indexOf(Math.max(...array));

function readInputAndGuess() {
    rl.question(`Enter input: `, input => {
        input = parseFloat(input);
        let answer = input >= 0.5;
        let guess = !!argMax(network.feedForward([input]));
        if (guess === answer) {
            process.stdout.write(`\x1b[32mGuessed correctly\x1b[0m\n`);
        } else {
            process.stdout.write(`\x1b[31mGuessed wrong\x1b[0m\n`);
        }
        readInputAndGuess();
    });
}

readInputAndGuess();