import * as React from 'react';
import T from 'prop-types';
import { Map } from 'immutable';

import { connect } from 'react-redux';
import { init } from '../modules/app';
import {
  fetch,
  search,
  setSearch,
  getMessageSeq,
  getLoading,
  getSearchText,
  getCount,
} from '../modules/messages';
import classnames from 'classnames/bind';
import 'normalize.css';

import s from './App.styl';
const cx = classnames.bind(s);
import Spinner from './Spinner.js';

const Message = ({ message: m }) => {
  return (
    <div className={cx('Message')}>
      <div className={cx('text')}>
        {m.get('text')}
      </div>
    </div>
  );
};
Message.propTypes = {
  message: T.instanceOf(Map),
};

const messageListState = state => ({
  messages: getMessageSeq(state),
  count: getCount(state),
  loading: getLoading(state),
});
const MessageList = connect(messageListState, { fetch })(props => {
  const { messages, count, loading } = props;

  return (
    <div className={cx('MessageList', { disabled: loading })}>
      <div className={cx('meta')}>
        <div className={cx('count')}>
          Showing: <strong>{messages.count()}</strong> of <strong>{count}</strong>
        </div>
      </div>
      {messages.map(m => <Message key={m.get('rowid')} message={m} />)}
    </div>
  );
});

const SearchBox = connect(
  state => ({
    searchText: getSearchText(state),
    loading: getLoading(state),
  }),
  { setSearch, search }
)(({ setSearch, search, searchText, loading }) => {
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
