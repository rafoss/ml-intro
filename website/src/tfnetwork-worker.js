const tf = require('@tensorflow/tfjs');
import Jimp from 'jimp';

tf.loadLayersModel('./tfmodel/model.json').then(model => {
    self.addEventListener('message', async e => {
        try {
            let imageData = e.data;

            // We try to normalize the inputs like in the MNIST dataset.
            // While it gets relatively close, this is another source for error
            // in our predictions.

            let image = new Jimp(imageData);

            let left = image.bitmap.width;
            let right = 0;
            let top = image.bitmap.height;
            let bottom = 0;
            for (let y = 0; y < image.bitmap.width; y++) {
                for (let x = 0; x < image.bitmap.height; x++) {
                    let v = image.bitmap.data[y * image.bitmap.width * 4 + x * 4];
                    if (v !== 255) {
                        // all fully white pixels have 255 red in them, so for
                        // our purposes this is a shortcut for black
                        left = Math.min(left, x);
                        right = Math.max(right, x);
                        top = Math.min(top, y);
                        bottom = Math.max(bottom, y);
                    }
                }
            }

            left = Math.max(0, left);
            right = Math.min(image.bitmap.width - 1, right);
            top = Math.max(0, top);
            bottom = Math.min(image.bitmap.height - 1, bottom);

            if (left > right || top > bottom)
                return;

            image.crop(left, top, right - left + 1, bottom - top + 1);
            image.scaleToFit(20, 20, Jimp.RESIZE_BICUBIC);
            // image.resize(Jimp.AUTO, 20, Jimp.RESIZE_BICUBIC);
            // if (image.bitmap.width > 20)
            //     image.resize(20, Jimp.AUTO, Jimp.RESIZE_BICUBIC);

            let sumX = 0, sumY = 0, count = 0;
            for (let y = 0; y < image.bitmap.height; y++) {
                for (let x = 0; x < image.bitmap.width; x++) {
                    let v = image.bitmap.data[y * image.bitmap.width * 4 + x * 4];
                    if (v !== 255) {
                        sumX += x;
                        sumY += y;
                        count++;
                    }
                }
            }
            let offsetX = image.bitmap.width / 2 - sumX / count;
            let offsetY = image.bitmap.height / 2 - sumY / count;

            let marginW = Math.max(0, Math.floor((28 - image.bitmap.width) / 2 + offsetX));
            let marginH = Math.max(0, Math.floor((28 - image.bitmap.height) / 2 + offsetY));
            let scaled = new Jimp(28, 28, 0xffffffff);
            scaled.scan(marginW, marginH, image.bitmap.width, image.bitmap.height,
                (_x, _y, i) => scaled.bitmap.data[i + 3] = 0);
            scaled.composite(image, marginW, marginH);

            let input = [];
            scaled.scan(0, 0, 28, 28, (_x, _y, i) => {
                // Looking at red values
                input.push((255 - scaled.bitmap.data[i]) / 255);
            });

            self.postMessage({
                image: await scaled.getBase64Async('image/png'),
                result: [...await model.predict(tf.tensor([input])).data()]
            });
        } catch (error) {
            console.error(error);
        }
    });
}).catch(error => console.error(error));