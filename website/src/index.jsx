// Libraries
import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// UI
import 'typeface-roboto';
import 'typeface-patua-one';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { SnackbarProvider } from 'notistack';

// Pages
import DigitRecognizer from './components/DigitRecognizer';
import ErrorBoundary from './components/ErrorBoundary';

let theme = createMuiTheme({
    palette: {
        type: 'dark'
    }
});

render(<MuiThemeProvider theme={theme}>
    <SnackbarProvider
        disableWindowBlurListener={true}
        autoHideDuration={5000}
        anchorOrigin={{ horizontal: `right`, vertical: `bottom` }}>
        <ErrorBoundary>
            <BrowserRouter>
                <Switch>
                    <Route path="/" component={DigitRecognizer} />
                </Switch>
            </BrowserRouter>
        </ErrorBoundary>
    </SnackbarProvider>
</MuiThemeProvider>, document.getElementById(`root`));
