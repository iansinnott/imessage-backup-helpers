import * as React from 'react';
import classnames from 'classnames/bind';
import T from 'prop-types';

import s from './Spinner.styl';
const cx = classnames.bind(s);

const Spinner = ({ className, ...props }) => (
  <div className={cx('Spinner', className)} {...props}>
    <div className={cx('container')}>
      <svg viewBox='0 0 100 100'>
        <path
          className={cx('track')}
          d='M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89'
        />
        <path className={cx('head')} d='M 94.5 50 A 44.5 44.5 0 0 0 50 5.5' />
      </svg>
    </div>
  </div>
);

Spinner.propTypes = {
  className: T.string,
};

export default Spinner;
