import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { Observable } from 'rxjs'; // Just to make sure operators are defined
import { createLogger } from 'redux-logger';

const rootEpic = (action$) =>
  action$.ofType('PING')
    .do(x => console.warn('JUST SAW', x))
    .ignoreElements();

const rootReducer = (state = 'PING', action) => {
  const { type, payload } = action;

  switch (type) {
    case 'PING':
      return 'PONG';
    case 'PONG':
      return 'PING';
    default:
      return state;
  }
};

export default () => {
  const middleware = [createEpicMiddleware(rootEpic, { dependencies: {} })];

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

  return createStore(rootReducer, applyMiddleware(...middleware));
};
