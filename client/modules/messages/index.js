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
const PAGE_SIZE = 50;

/* Action Types
 * ======================================================================= */
const FETCH = 'messages/FETCH';
const FETCH_SUCCESS = 'messages/FETCH_SUCCESS';
const FETCH_FAILURE = 'messages/FETCH_FAILURE';

const SEARCH = 'messages/SEARCH';
const SEARCH_SUCCESS = 'messages/SEARCH_SUCCESS';
const SEARCH_FAILURE = 'messages/SEARCH_FAILURE';

const REFRESH_DB = 'messages/REFRESH_DB';
const REFRESH_DB_SUCCESS = 'messages/REFRESH_DB_SUCCESS';
const REFRESH_DB_FAILURE = 'messages/REFRESH_DB_FAILURE';

const CLEAR_SYNC_RESULTS = 'messages/CLEAR_SYNC_RESULTS';

const SET_OPTIONS = 'messages/SET_OPTIONS';

const CLEAR_SEARCH = 'messages/CLEAR_SEARCH';

const NOOP = 'messages/NOOP';

/* Actions
 * ======================================================================= */
export const fetch = ({ page, pageSize = PAGE_SIZE }) => ({
  type: FETCH,
  payload: { page, pageSize },
});

export const searchByPage = ({ page = 1, pageSize = PAGE_SIZE, searchText }) => ({
  type: SEARCH,
  payload: { page, pageSize, searchText },
});

export const resync = () => ({
  type: REFRESH_DB,
});

export const clearSyncResults = () => ({
  type: CLEAR_SYNC_RESULTS,
});

export const search = (searchText = '') => {
  if (searchText.length < 2) {
    console.warn('Search must be at least 2 characters.');
    return { type: NOOP };
  }

  return {
    type: SEARCH,
    payload: { page: 1, pageSize: PAGE_SIZE, searchText },
  };
};

export const setSearch = text => ({
  type: SET_OPTIONS,
  payload: {
    searchText: text,
  },
});

export const clearSearch = () => ({
  type: CLEAR_SEARCH,
});

/* Epics
 * ======================================================================= */

/**
 * Reset the message list. This happens on initial app boostrap so there's
 * something to look at and whenever the search is cleared, since we need to
 * refetch the list
 */
const resetEpic = action$ =>
  action$.ofType(INIT, CLEAR_SEARCH).mapTo({
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
      const url = getUrl(`${process.env.SERVICE_URL}/rest/messages`, { page, page_size: pageSize })
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

const searchMessagesEpic = action$ => {
  const [valid, invalid] = action$
    .ofType(SEARCH)
    .map(prop('payload'))
    .partition(({ page, pageSize, searchText }) => page && pageSize && searchText); // Make sure we have page and pageSize

  return valid
    .merge(
      invalid
        .do(() => console.warn('Must fetch with page and pageSize as well as searchText in payload'))
        .ignoreElements()
    )
    .switchMap(({ page, pageSize, searchText }) => {
      const url = getUrl(`${process.env.SERVICE_URL}/rest/search`, { page, page_size: pageSize, q: searchText });
      return Observable.ajax.get(url)
        .map(prop('response'))
        .map(evolve({
          data: processMessages
        }))
        .map(payload => ({
          type: SEARCH_SUCCESS,
          payload,
        }))
        .catch(err => Observable.of({
          type: SEARCH_FAILURE,
          error: true,
          payload: err
        }));
    });
};

const refreshDbEpic = (action$) =>
  action$.ofType(REFRESH_DB)
    .switchMap(() =>
      Observable.ajax.get(`${process.env.SERVICE_URL}/refresh-db`)
        .map(prop('response'))
        .map(prop('data'))
        .map(x => ({
          type: REFRESH_DB_SUCCESS,
          payload: x,
        }))
        .catch(err => Observable.of({
          type: REFRESH_DB_FAILURE,
          error: true,
          payload: err,
        })))

export const epic = combineEpics(
  resetEpic,
  fetchMessagesEpic,
  searchMessagesEpic,
  refreshDbEpic,
);

/* Getters
 * ======================================================================= */
export const getMessages = state => state.getIn(['messages', 'messages']);

export const getMeta = state => state.getIn(['messages', 'meta']);

export const getSyncResults = state => state.getIn(['messages', 'syncResults']);

// The stored search term. Last thing that was searched for
export const getSearchTerm = state => state.getIn(['messages', 'searchTerm']);

export const getCount = createSelector(getMeta, prop('count'));

export const getLastPage = createSelector(getMeta, prop('page'));

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
    case FETCH_SUCCESS:
      if (payload.meta.page === 1) {
        return payload.data; // Search results overwrite everything
      } else {
        return state.merge(payload.data); // Just merge for infinite scroll. But also want to avoid duplicates that might arrise from concat
      }
    case CLEAR_SEARCH:
      return OrderedMap();
    default:
      return state;
  }
};

const Meta = Record({
  count: 0,
  page: 1,
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
    case REFRESH_DB:
      return true;
    case FETCH_SUCCESS:
    case SEARCH_SUCCESS:
    case REFRESH_DB_SUCCESS:
    case FETCH_FAILURE:
    case SEARCH_FAILURE:
    case REFRESH_DB_FAILURE:
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
    case CLEAR_SEARCH:
      return state.set('searchText', '');
    default:
      return state;
  }
};

const searchTerm = (state = '', action) => {
  const { type, payload } = action;

  switch (type) {
    case SEARCH_SUCCESS:
      return payload.meta.searchTerm;
    case CLEAR_SEARCH:
      return '';
    default:
      return state;
  }
};

const SyncResults = Record({
  message: '',
  stdout: '',
  stderr: '',
});

const syncResults = (state = SyncResults(), action) => {
  const { type, payload } = action;

  switch (type) {
    case REFRESH_DB_SUCCESS:
      return SyncResults(payload);
    case CLEAR_SYNC_RESULTS:
      return SyncResults();
    default:
      return state;
  }
};

export default combineReducers({
  messages,
  loading,
  options,
  meta,
  searchTerm,
  syncResults,
});
