import * as React from 'react';
import { Provider } from 'react-redux';
import T from 'prop-types';

import App from './components/App.js';

export default class Root extends React.Component {
  static propTypes = {
    store: T.object,
  };

  render() {
    return (
      <Provider store={this.props.store}>
        <App />
      </Provider>
    );
  }
}
