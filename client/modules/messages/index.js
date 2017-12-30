import { combineEpics } from 'redux-observable';
import { combineReducers } from 'redux-immutable';
import { OrderedMap, Map, Record, fromJS } from 'immutable';
import { evolve, pipe, map, prop } from 'ramda';
import { Observable } from 'rxjs';
import { createSelector } from 'reselect';
import { stringify } from 'querystring';

import { INIT } from '../app';

export const getUrl = (base, query) => {
  const qs = query ? '?' + stringify(query) : '';
  return base + qs;
};

// How many messages to fetch at a time
const PAGE_SIZE = 20;

/* Action Types
 * ======================================================================= */
const FETCH = 'messages/FETCH';
const FETCH_SUCCESS = 'messages/FETCH_SUCCESS';
const FETCH_FAILURE = 'messages/FETCH_FAILURE';

const SEARCH = 'messages/SEARCH';
const SEARCH_SUCCESS = 'messages/SEARCH_SUCCESS';
const SEARCH_FAILURE = 'messages/SEARCH_FAILURE';

const SET_OPTIONS = 'messages/SET_OPTIONS';

/* Actions
 * ======================================================================= */
export const fetch = ({ page, pageSize = PAGE_SIZE }) => ({
  type: FETCH,
  payload: { page, pageSize },
});

export const search = ({ page = 1, pageSize = PAGE_SIZE }) => ({
  type: SEARCH,
  payload: { page, pageSize },
});

export const setSearch = text => ({
  type: SET_OPTIONS,
  payload: {
    searchText: text,
  },
});

/* Epics
 * ======================================================================= */
const initEpic = action$ =>
  action$.ofType(INIT).mapTo({
    type: FETCH,
    payload: {
      page: 1,
      pageSize: PAGE_SIZE,
    },
  });

const listToOrderedMap = key => list => {
  return fromJS(list)
    .toOrderedMap()
    .mapKeys((k, v) => v.get('rowid'));
};

const processMessages = pipe(
  listToOrderedMap('rowid'),
  map(x => x.update('date', t => new Date(t)))
);

const fetchMessagesEpic = action$ => {
  const [valid, invalid] = action$
    .ofType(FETCH)
    .map(prop('payload'))
    .partition(({ page, pageSize }) => page && pageSize); // Make sure we have page and pageSize

  return valid
    .merge(
      invalid
        .do(() => console.warn('Must fetch with page and pageSize in payload'))
        .ignoreElements()
    )
    .mergeMap(({ page, pageSize }) => {
      const url = getUrl(`${process.env.SERVICE_URL}/rest/messages`, { page, pageSize })
      return Observable.ajax.get(url)
        .map(prop('response'))
        .map(evolve({
          data: processMessages
        }))
        .map(payload => ({
          type: FETCH_SUCCESS,
          payload,
        }))
        .catch(err => Observable.of({
          type: FETCH_FAILURE,
          error: true,
          payload: err
        }));
    });
};

export const epic = combineEpics(
  initEpic,
  fetchMessagesEpic,
);

/* Getters
 * ======================================================================= */
export const getMessages = state => state.getIn(['messages', 'messages']);

export const getMeta = state => state.getIn(['messages', 'meta']);

export const getCount = createSelector(getMeta, prop('count'));

// If we need to do client side sorting, this is the place to do it
export const getMessageSeq = createSelector(
  getMessages,
  messages => messages.valueSeq()
);

export const getLoading = state => state.getIn(['messages', 'loading']);

export const getSearchText = state => state.getIn(['messages', 'options', 'searchText']);

/* Stores
 * ======================================================================= */
const messages = (state = OrderedMap(), action) => {
  const { type, payload } = action;

  switch (type) {
    case SEARCH_SUCCESS:
      return payload.data; // Search results overwrite everything
    case FETCH_SUCCESS:
      return state.merge(payload.data); // Just merge for infinite scroll. But also want to avoid duplicates that might arrise from concat
    default:
      return state;
  }
};

const Meta = Record({
  count: 0,
});

const meta = (state = Meta(), action) => {
  const { type, payload } = action;

  switch (type) {
    case SEARCH_SUCCESS:
    case FETCH_SUCCESS:
      return Meta(payload.meta);
    default:
      return state;
  }
};

const loading = (state = false, action) => {
  switch (action.type) {
    case FETCH:
    case SEARCH:
      return true;
    case FETCH_SUCCESS:
    case SEARCH_SUCCESS:
    case FETCH_FAILURE:
    case SEARCH_FAILURE:
      return false;
    default:
      return state;
  }
};

const options = (state = Map({ searchText: '' }), action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_OPTIONS:
      return state.merge(payload);
    default:
      return state;
  }
};

export default combineReducers({
  messages,
  loading,
  options,
  meta,
});
