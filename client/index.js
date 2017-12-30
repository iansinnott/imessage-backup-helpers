import * as React from 'react';
import { render } from 'react-dom';

import Root from './Root.js';

document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('#root');
  render(<Root />, el);
});
