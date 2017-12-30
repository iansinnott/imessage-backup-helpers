import * as React from 'react';
import { render } from 'react-dom';

import Root from './Root.js';
import createStore from './createStore.js'

const store = createStore();

if (process.env.NODE_ENV === 'development') {
  require('./exportGlobals.js').default(window, { store });
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('#root');
  render(<Root store={store} />, el);
});
