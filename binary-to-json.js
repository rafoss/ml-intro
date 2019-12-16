const loadIDX = require(`./utils/load-idx`);
const zip = require(`./utils/zip`);

let args = process.argv.slice(2);

let images = loadIDX(args[0]);
let labels = loadIDX(args[1]);

// Convert int 0-255 to float 0-1
images = images.map(image => image.map(row => row.map(pixel => pixel / 255)));

let data = [];
for (let sample of zip(images, labels))
    data.push(sample);

process.stdout.write(JSON.stringify(data));