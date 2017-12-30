import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { createLogger } from 'redux-logger';
import { Map } from 'immutable';

import reducer, { epic } from './modules';

export default () => {
  const middleware = [createEpicMiddleware(epic, { dependencies: {} })];

  if (process.env.NODE_ENV === 'development') {
    middleware.push(
      createLogger({
        diff: false,
        duration: false,
        timestamp: true,
        collapsed: true,
        logErrors: true,
        colors: {
          title: () => 'inherit',
          prevState: () => '#9E9E9E',
          action: () => '#03A9F4',
          nextState: () => '#4CAF50',
          error: () => '#F20404',
        },
      })
    );
  }

  return createStore(reducer, Map(), applyMiddleware(...middleware));
};
