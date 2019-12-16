const fs = require(`fs`);
const sharp = require('sharp');
const Matrix = require('./utils/matrix');

let trainingData = JSON.parse(fs.readFileSync(`./MNIST_JSON_FLOAT/trainingData.json`));
// let testData = JSON.parse(fs.readFileSync(`./MNIST_JSON_FLOAT/testingData.json`));

let sampleIndex = Math.floor(Math.random() * trainingData.length);
console.log(`Checking index: ${sampleIndex}`);

let samp = trainingData[sampleIndex][0].flat().map(pixel => pixel * 255);

// Print ASCII representation of the image
// let samp = trainingData[sampleIndex][0].map(v => v > 0.5 ? 1 : 0);
// for (let y = 0; y < 28; y++) {
//     console.log(samp.slice(28 * y, 28 * y + 28).join(''));
// }

console.log(Matrix.getShape(samp));

sharp(Buffer.from(samp), {
    raw: {
        width: 28,
        height: 28,
        channels: 1
    }
})
    .png()
    .toFile('test.png', (err, info) => {
        if (err) console.error(err);
        else console.log(info);
        console.log(`Should be a ${trainingData[sampleIndex][1]}`)
    })