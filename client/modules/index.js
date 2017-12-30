import { combineEpics } from 'redux-observable';
import { combineReducers } from 'redux-immutable';

import messages, { epic as messagesEpic } from './messages';

export const epic = combineEpics(
  messagesEpic
);

export default combineReducers({
  messages,
});
