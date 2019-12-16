import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

import { withSnackbar } from 'notistack';
import { withStyles } from '@material-ui/core/styles';
import {
    CssBaseline, Typography, Fab, FormControlLabel,
    Switch, FormLabel, FormControl, RadioGroup, Radio
} from '@material-ui/core';
import { ArrowForward, Replay } from '@material-ui/icons';

const argMax = array => array.indexOf(Math.max(...array));

import Worker from 'worker-loader!../network-worker.js';
import TFWorker from 'worker-loader!../tfnetwork-worker.js';

const styles = theme => ({
    root: {
        padding: theme.spacing(2),
        textAlign: 'center'
    },
    grid: {
        display: 'grid',
        gridTemplateRows: '1fr',
        gridTemplateColumns: '1fr auto 1fr',
        gridColumnGap: theme.spacing(1),
        alignItems: 'center',
        textAlign: 'center'
    },
    left: { justifySelf: 'start', textAlign: 'left' },
    right: { justifySelf: 'end', textAlign: 'right' },
    result: {
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gridTemplateColumns: '1fr',
        alignItems: 'center',
        gridRowGap: theme.spacing(1)
    }
});

class DigitRecognizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { viewRaw: false, useTensorflow: false };
    }

    componentDidMount() {
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = 15;
        this.ctx.strokeStyle = "#000000";

        this.worker = new Worker();
        this.worker.addEventListener('message', ({ data: { image, result } }) => {
            this.setState({ image, result });
        });

        this.tfWorker = new TFWorker();
        this.tfWorker.addEventListener('message', ({ data: { image, result } }) => {
            this.setState({ image, result });
        });

        this.canvas.addEventListener('touchstart', this.touchStart.bind(this));
        this.canvas.addEventListener('touchend', this.touchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.touchCancel.bind(this));
        this.canvas.addEventListener('touchmove', this.touchMove.bind(this));
    }

    makePrediction() {
        let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        (this.state.useTensorflow ? this.tfWorker : this.worker).postMessage(imageData);
    }

    toggleUseTensorflow() {
        this.setState({ useTensorflow: !this.state.useTensorflow },
            () => this.makePrediction());
    }

    draw(event) {
        let x = event.clientX - this.canvas.offsetLeft;
        let y = event.clientY - this.canvas.offsetTop;
        if (!this.hasPath) {
            this.hasPath = true;
            this.ctx.beginPath();
            // buggy: tries to clamp the drawing to the nearest edge
            //        when the mouse reenters the canvas
            // if (this.prevX === null || this.prevY === null) {
            //     // clamp to nearest edge
            //     let distX = Math.min(x, this.canvas.width - x);
            //     let distY = Math.min(y, this.canvas.height - y);
            //     if (distX < distY) {
            //         this.prevX = this.canvas.width - x < x ? this.canvas.width : 0;
            //         this.prevY = y;
            //     } else {
            //         this.prevX = x;
            //         this.prevY = this.canvas.height - y < y ? this.canvas.height : 0;
            //     }
            // }
            this.prevX = x;
            this.prevY = y;
            this.ctx.moveTo(this.prevX, this.prevY);
        }
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    stopDraw(event) {
        let x = event.clientX - this.canvas.offsetLeft;
        let y = event.clientY - this.canvas.offsetTop;
        if (this.hasPath) {
            this.ctx.lineTo(x, y)
            this.ctx.stroke();
            this.ctx.closePath();
            this.hasPath = false;
            this.prevX = null;
            this.prevY = null;
            this.makePrediction();
        }
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasPath = false;
        this.ctx.closePath();
        this.setState({ result: undefined, image: undefined });
    }

    mouseDown(event) {
        if (event.button === 0) {
            this.prevX = event.clientX - this.canvas.offsetLeft;
            this.prevY = event.clientY - this.canvas.offsetTop;
            this.draw(event);
        } else {
            this.clear();
        }
    }

    mouseUp(event) {
        if (event.button === 0)
            this.stopDraw(event);
    }

    mouseOut(event) {
        this.stopDraw(event);
    }

    mouseMove(event) {
        if (event.buttons & 1 === 1)
            this.draw(event);
    }

    prevTouches = [];

    touchStart(event) {
        this.ctx.lineCap = 'round';
        for (let [i, touch] of Object.entries(event.changedTouches)) {
            let prev = this.prevTouches[i] || touch;
            let ol = this.canvas.offsetLeft;
            let ot = this.canvas.offsetTop;
            this.ctx.beginPath();
            this.ctx.moveTo(prev.pageX - ol, prev.pageY - ot);
            this.ctx.lineTo(touch.pageX - ol, touch.pageY - ot);
            this.ctx.stroke();
            this.ctx.closePath()
        }
        this.prevTouches = event.touches;
    }

    touchEnd(event) {
        this.prevTouches = event.touches;
        this.makePrediction();
    }

    touchCancel(event) {
        this.prevTouches = event.touches;
    }

    touchMove(event) {
        event.preventDefault();
        this.touchStart(event);
    }

    render() {
        const { classes } = this.props;
        const { image, result, viewRaw } = this.state || {};

        let view;
        if (result) {
            if (viewRaw) {
                view = <pre style={{ fontSize: 16, margin: 0 }}>
                    {result.map((v, i) => `${i}: ${v.toFixed(3)}`).join('\n')}
                </pre>;
            } else {
                view = <>
                    <Typography variant="h1" style={{ textAlign: 'center' }}>
                        {argMax(result)}
                    </Typography>
                    <Typography variant="h4" style={{ textAlign: 'center' }}>
                        Best guess:
                    </Typography>
                </>;
            }
        }

        return (
            <div className={classes.root}>
                <CssBaseline />
                <div className={classes.grid}>
                    <div style={{ textAlign: 'right' }}>
                        <canvas style={{ backgroundColor: 'white' }}
                            className={classes.right}
                            width={350} height={350} ref={c => this.canvas = c}
                            onMouseDown={e => this.mouseDown(e)}
                            onMouseUp={e => this.mouseUp(e)}
                            onMouseOut={e => this.mouseOut(e)}
                            onMouseMove={e => this.mouseMove(e)} />
                    </div>
                    <div>
                        {image && <><img src={image} /><br /></>}
                        <ArrowForward style={{ fontSize: 64 }} />
                    </div>
                    <div className={clsx(classes.left, classes.result)}>
                        <span>
                            <FormControl component="fieldset" style={{ marginTop: '1rem' }}>
                                <FormLabel component="legend">Use model</FormLabel>
                                <RadioGroup value={this.state.useTensorflow} onChange={() => this.toggleUseTensorflow()} row>
                                    <FormControlLabel
                                        value={false}
                                        control={<Radio color="primary" />}
                                        label="Custom"
                                        labelPlacement="end"
                                    />
                                    <FormControlLabel
                                        value={true}
                                        control={<Radio color="primary" />}
                                        label="Tensorflow"
                                        labelPlacement="end"
                                    />
                                </RadioGroup>
                            </FormControl>
                            <br />
                            <Fab size="small" color="secondary"
                                onClick={() => this.clear()}
                                style={{ marginRight: '1rem' }}>
                                <Replay />
                            </Fab>
                            <FormControlLabel
                                control={<Switch checked={viewRaw} value=""
                                    onChange={() => this.setState({ viewRaw: !viewRaw })} />}
                                label="View raw prediction" />
                        </span>
                        <div>
                            {result ? view : <Typography variant="h4" style={{ marginBottom: '3rem' }}>Draw a number</Typography>}
                        </div>
                    </div>
                </div>
                <Typography style={{ marginTop: '1rem' }}>
                    {"It's worth noting that there's a substantial difference between our " +
                        "drawn digits and the MNIST dataset, but this is still a fun little experiment"}
                </Typography>
            </div>
        );
    }
}

DigitRecognizer.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withSnackbar(withStyles(styles)(DigitRecognizer));
