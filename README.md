# ml-intro
Intro to neural networks following [neuralnetworksanddeeplearning.com](http://neuralnetworksanddeeplearning.com)

The project consists of a couple sequential neural network implementations. One written purely in JS (`train.js` & `network.js`) and one which makes use of [Tensorflow](https://www.tensorflow.org/js/) (`tensorflow-train.js`). There's also a small webapp for drawing digits and putting two pretrained models to the test, which you can find [here](https://rafoss.github.io/ml-intro). The canvas supports both mouse and touchscreen, though both can be a little buggy as it was hacked together just to try it out.

## Other files worth mentioning
* An IDX-format reader (`utils/load-idx.js`) for the file format used in the [MNIST](http://yann.lecun.com/exdb/mnist/) dataset.
* An IDX to JSON converter (`binary-to-json.js`) which uses the above.
* Two other network implementations with slight modifications. `network-matrixbatch.js` tries to compute entire mini-batches at once and `network-minibatch-mathjs.js` does the same thing only using [MathJS](https://mathjs.org/download.html). Both seem to be substantially slower than the original approach in `network.js`, probably due to the poorly optimized matrix operations as well as it all running in entirely in JS.
* `extremelysimpletrain.js` and `simpletrain.js` train and test the JS network implementation with some very basic tasks of predicting whether the input number is `>= .5` and whether there is four 1's in a row is a given input.
* `test-mnist-parser.js` writes a random image of a number from the MNIST dataset to file & has some code to print an ASCII representation of the number.
* `website/network-worker.js` and the Tensorflow version both do some processing of the drawn number to more closely match the way the numbers in the MNIST dataset are aligned. This helps a fair bit with classifying the drawings accurately.

## License
MIT License
