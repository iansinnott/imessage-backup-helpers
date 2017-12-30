import * as React from 'react';

import App from './components/App.js';

export default class Root extends React.Component {
  render() {
    return (
      <div className='Root'>
        <App />
      </div>
    );
  }
}
