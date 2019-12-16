import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { error };
    }

    render() {
        if (this.state.error)
            return <>
                <h1>Something went wrong.</h1>
                <pre>{this.state.error.stack}</pre>
            </>;
        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node
};

export default ErrorBoundary;
