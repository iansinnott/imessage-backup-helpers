const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { OPEN_READONLY } = require('sqlite3'); // sqlite3 is underlying engine
const sqlite = require('sqlite'); // sqlite is promise-based wrapper around sqlite3
const cors = require('cors');

const app = express();

const isDev = process.env.NODE_ENV === 'development';

class HTTPError extends Error {
  constructor(status, ...args) {
    super(...args);
    this.status = status;
  }
}

/* DB
 *
 * NOTE: In queries below I use views defined in 01_initialize_db.sql. See that
 * file for what is available.
 * ======================================================================= */
const DB_FILENAME = fs
  .readFileSync(path.resolve(__dirname, '../DB_FILEPATH'), { encoding: 'utf8' })
  .trim();

const dbp = sqlite.open(DB_FILENAME, {
  verbose: isDev,
  mode: OPEN_READONLY, // So far there are no write ops so this seems safest

  // This is the default, but since the db doesn't change this should prob be
  // true. Just didn't want odd cache related bugs and I'm not sure how this
  // would respond to whatever update method I create later to change hte db
  cached: false,
});

/* REST
 * ======================================================================= */
const rest = express.Router();

const DEFAULT_PAGE_SIZE = 20;

rest.get('/messages', (req, res, next) => {
  const pageSize = Number(req.query.page_size || DEFAULT_PAGE_SIZE);
  const page = Number(req.query.page || 1);
  const offset = (page - 1) * pageSize;

  if (pageSize < 1 || pageSize > 1000) {
    const err = new HTTPError(400, 'Page size must be between 1 and 1000');
    next(err);
    return;
  }

  dbp.then(db => Promise.all([
    db.all('SELECT * FROM all_messages LIMIT ? OFFSET ?;', pageSize, offset),
    db.get('SELECT count(*) as "count" from all_messages;')
  ]))
    .then(([ rows, { count } ]) => res.send({
      data: rows,
      meta: {
        count,
        page,
        pageSize,
        pageCount: Math.ceil(count / pageSize)
      },
      error: null,
    }))
    .catch(err => {
      next(err);
    });
});

/**
 * NOTE: For some reason sqlite seems to be doing something odd with quotes, so
 * trying to insert quotes around the like term didn't work. However, it does
 * work without the quotes so that's what happened here. See:
 * https://github.com/mapbox/node-sqlite3/issues/545
 *
 * NOTE: SQLite does have full text search capabilities which would likely make
 * this much faster: https://www.sqlite.org/fts5.html
 *
 * Example search url: /rest/search?q=hello&page_size=2&page=2
 */
rest.get('/search', (req, res, next) => {
  const pageSize = Number(req.query.page_size || DEFAULT_PAGE_SIZE);
  const page = Number(req.query.page || 1);
  const offset = (page - 1) * pageSize;
  const searchTerm = req.query.q;

  if (pageSize < 1 || pageSize > 1000) {
    const err = new HTTPError(400, 'Page size must be between 1 and 1000');
    next(err);
    return;
  }

  if (!searchTerm) {
    const err = new HTTPError(400, 'Must provide a search term');
    next(err);
    return;
  }

  const likeQuery = `%${searchTerm}%`; // See NOTE

  // Ugh.. this feels very inefficent. What would be the best way to get the
  // count as well as the data?
  dbp.then(db => Promise.all([
    db.all(
      `
        SELECT * FROM all_messages
        WHERE text like ?
        LIMIT ?
        OFFSET ?;
      `.trim(),
      likeQuery,
      pageSize,
      offset
    ),
    db.get(
      `
        SELECT count(*) as "count" FROM all_messages
        WHERE text like ?
        LIMIT ?
        OFFSET ?;
      `.trim(),
      likeQuery,
      pageSize,
      offset
    ),
  ]))
    .then(([ rows, { count } ]) => res.send({
      data: rows,
      meta: {
        count,
        page,
        pageSize,
        pageCount: Math.ceil(count / pageSize),
        searchTerm,
      },
      error: null,
    }))
    .catch(err => {
      next(err);
    });
});


/* App
 * ======================================================================= */
app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json({ type: '*/*' })); // Parse everything. This is a JSON server
app.use(cors());
app.use(morgan(isDev ? 'dev' : 'combined'));

app.use('/rest', rest);

// Allow refreshing the database through the API. This is simply here so I can
// add a button to the UI that will do this. Sending this output in a prod app
// on the web would not be great security posture. But this is meant to only run
// on a local system and will likely make debugging easier if something goes
// wrong. Again, given that the end user is most likely non technical
app.get('/refresh-db', (req, res, next) => {
  exec('make bootstrap_db', {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    maxBuffer: 200 * 1024, // This is the default. Just here for reference
  }, (err, stdout, stderr) => {
    if (err) {
      if (err.message.includes('maxBuffer exceeded')) {
        res.send({
          data: {
            message:
              "Data successfully processed, however, output was too large to display. This probably just means the DB hadn't been refreshed in a while.", // eslint-disable-line quotes
            stdout: '[Output too long for display]',
            stderr: '',
          },
        });
      } else {
        next(err);
      }
      return;
    }

    res.send({
      data: {
        message: 'All is well. Database successfully synced.',
        stdout,
        stderr,
      },
    });
  });
});

app.get('/', (req, res) => {
  res.send({
    data: {
      available: true,
      baseEndpoints: ['/rest'],
    },
  });
});

app.use((req, res, next) => {
  const err = new HTTPError(404, 'Not Found');
  next(err);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).send({
    error: {
      message: err.message,
    },
    data: null,
  });
});

const server = http.createServer(app);

server.listen(app.get('port'), () => {
  console.log(`Server listening on localhost:${app.get('port')}`);
});
