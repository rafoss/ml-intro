const fs = require(`fs`);

function createArray(dimensions) {
    if (dimensions.length === 0)
        return null;
    let [size, ...nested] = dimensions;
    return Array.from(new Array(size), () => createArray(nested));
}

function loadIDX(path) {
    let data = fs.readFileSync(path);
    let type = data[2];
    let stepSize;
    let readFunc;
    switch (type) {
        case 0x8:
            // unsigned byte
            stepSize = 1;
            readFunc = data.readUInt8.bind(data);
            break;
        case 0x9:
            // signed byte
            stepSize = 1;
            readFunc = data.readInt8.bind(data);
            break;
        case 0xB:
            // short 2 bytes
            stepSize = 2;
            readFunc = data.readInt16BE.bind(data);
            break;
        case 0xC:
            // int 4 bytes
            stepSize = 4;
            readFunc = data.readInt32BE.bind(data);
            break;
        case 0xD:
            // float 4 bytes
            stepSize = 4;
            readFunc = data.readFloatBE.bind(data);
            break;
        case 0xE:
            // double 8 bytes
            stepSize = 8;
            readFunc = data.readDoubleBE.bind(data);
            break;
        default:
            throw new Error(`Parser for ${type} is not implemented`);
    }

    let numDimensions = data[3];
    let dimSizes = []; // reverse order
    for (let i = 0; i < numDimensions; i++)
        dimSizes.push(data.readInt32BE(4 + i * 4));

    let array = createArray(dimSizes);


    let dataOffset = 4 + numDimensions * 4;
    let numValues = (data.length - dataOffset) / stepSize;
    let divisions = [];
    let last = 1;
    for (let div of dimSizes.slice(1).reverse()) {
        last = div * last;
        divisions.unshift(last);
    }

    for (let i = 0; i < numValues; i++) {
        let value = readFunc(i * stepSize + dataOffset);
        let toModify = array;
        let j = i;
        for (let size of divisions) {
            toModify = toModify[Math.floor(j / size)];
            j = j % size;
        }
        toModify[j] = value;
    }

    return array;
}

module.exports = loadIDX;