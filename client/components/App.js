import * as React from 'react';
import { connect } from 'react-redux';

class App extends React.Component {
  render() {
    return (
      <div className='App'>
        <h1>I'm the app</h1>
      </div>
    );
  }
}

export default connect()(App);
