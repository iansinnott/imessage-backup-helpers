import * as React from 'react';
import T from 'prop-types';
import { Map } from 'immutable';
import reactStringReplace from 'react-string-replace';
import { format } from 'date-fns';

import { connect } from 'react-redux';
import { init } from '../modules/app';
import {
  fetch,
  search,
  searchByPage,
  resync,
  clearSyncResults,
  clearSearch,
  setSearch,
  getSyncResults,
  getMessageSeq,
  getSearchTerm,
  getLoading,
  getLastPage,
  getSearchText,
  getCount,
} from '../modules/messages';
import classnames from 'classnames/bind';
import 'normalize.css';

import s from './App.styl';
const cx = classnames.bind(s);
import Spinner from './Spinner.js';

const Message = ({ searchTerm, message: m }) => {
  let renderText = m.get('text');

  if (searchTerm) {
    renderText = reactStringReplace(m.get('text'), searchTerm, (match, i) => (
      <span key={i} className={cx('hl')}>{match}</span>
    ));
  }

  return (
    <div className={cx('Message')}>
      <div className={cx('meta')}>
        <div className={cx('handle')}>
          {m.get('is_from_me') ? 'Sent by you' : (
            [<strong key='handle'>From: </strong>, m.get('handle')]
          )}
        </div>
        <div style={{ marginLeft: 20 }} className={cx('date')}>
          <strong>On:</strong> {format(m.get('date'), 'YYYY-MM-DD')} at {format(m.get('date'), 'h:mm a')}
        </div>
      </div>
      <div className={cx('text')}>{renderText}</div>
    </div>
  );
};
Message.propTypes = {
  message: T.instanceOf(Map),
  searchTerm: T.string.isRequired,
};

const LoadMoreButton = connect(
  state => ({
    lastPage: getLastPage(state),
    loading: getLoading(state),
    searchTerm: getSearchTerm(state),
  }),
  { fetch, searchByPage },
  ({ lastPage, loading, searchTerm }, { fetch, searchByPage }, props) => ({
    ...props,
    loading,
    loadMore: () => {
      const nextPage = lastPage + 1;

      if (searchTerm) {
        searchByPage({ page: nextPage, searchText: searchTerm });
      } else {
        fetch({ page: nextPage });
      }
    },
  })
)(({ loading, loadMore }) => {
  return (
    <div className={cx('LoadMoreButton')}>
      {loading ? <Spinner className={cx('Spinner2')} /> : (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
});

const ResyncButton = connect(
  state => ({
    loading: getLoading(state),
    results: getSyncResults(state),
  }),
  { resync, clearSyncResults }
)(
  class extends React.Component {
    static displayName = 'ResyncButton';

    static propTypes = {
      resync: T.func.isRequired,
      loading: T.bool.isRequired,
    };

    handleResync = () => {
      if (!confirm(
        "Resyncing will reload all date from your latest iPhone backup. If you haven't " +
        "backed up your phone on this computer recently resyncing won't do anything. It " +
        "won't hurt, but there will be no effect without a recent iPhone backup.\n\nContinue?"
      )) return;

      this.props.resync();
    };

    render() {
      const { message, stdout, stderr } = this.props.results;
      const isOpen = Boolean(stdout);

      return (
        <div className={cx('ResyncButton', { disabled: this.props.loading })}>
          <button className={cx('resync')} onClick={this.handleResync}>
            Re-sync
          </button>
          <div className={cx('outputPanel', { isOpen })}>
            <div className={cx('head')}>
              Resync Rsults
              <small>(Feel free to ignore)</small>
              <button className={cx('clearSync')} onClick={this.props.clearSyncResults}>
                Close
              </button>
            </div>
            <div className={cx('message')}>
              {message}
            </div>
            <pre className={cx('body')}>
              {stdout}
            </pre>
          </div>
        </div>
      )
    }
  }
)

const messageListState = state => ({
  messages: getMessageSeq(state),
  count: getCount(state),
  loading: getLoading(state),
  searchTerm: getSearchTerm(state),
});
const MessageList = connect(messageListState)(props => {
  const { searchTerm, messages, count, loading } = props;
  const currentCount = messages.count();

  return (
    <div className={cx('MessageList', { disabled: loading })}>
      <div className={cx('meta')}>
        <div className={cx('count')}>
          Showing: <strong>{currentCount}</strong> of{' '}
          <strong>{count}</strong>
        </div>
        <ResyncButton />
      </div>
      {messages.map(m => (
        <Message key={m.get('rowid')} searchTerm={searchTerm} message={m} />
      ))}
      {currentCount < count && (
        <LoadMoreButton />
      )}
    </div>
  );
});

const SearchBox = connect(
  state => ({
    searchText: getSearchText(state),
    loading: getLoading(state),
    searchTerm: getSearchTerm(state),
  }),
  { setSearch, search, clearSearch }
)(({ searchTerm, setSearch, search, searchText, loading, clearSearch }) => {
  return (
    <form
      className={cx('SearchBox', { disabled: loading })}
      onSubmit={e => (e.preventDefault(), search(searchText))}>
      <input
        id='search'
        className={cx('search')}
        placeholder={loading ? 'Loading...' : 'Search...'}
        value={searchText}
        onChange={e => setSearch(e.target.value)}
      />
      {searchTerm && (
        <button type='button' className={cx('clear')} onClick={clearSearch}>
          Clear Search
        </button>
      )}
      {loading && <Spinner className={cx('Spinner')} />}
    </form>
  );
});

class App extends React.Component {
  static propTypes = {
    initializeApp: T.func.isRequired,
  };

  componentDidMount() {
    this.props.initializeApp();
  }

  render() {
    return (
      <div className={cx('App')}>
        <SearchBox />
        <MessageList />
      </div>
    );
  }
}

export default connect(null, {
  initializeApp: init
})(App);
