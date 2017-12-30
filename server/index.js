const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sqlite = require('sqlite');
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

const dbp = sqlite.open(DB_FILENAME, { verbose: isDev });


/* REST
 * ======================================================================= */
const rest = express.Router();

const DEFAULT_PAGE_SIZE = 20;

rest.get('/messages', (req, res, next) => {
  const offset = Number(req.query.page || 1) - 1;
  const pageSize = Number(req.query.page_size || DEFAULT_PAGE_SIZE);

  if (pageSize < 1 || pageSize > 1000) {
    const err = new HTTPError(400, 'Page size must be between 1 and 1000');
    next(err);
    return;
  }

  dbp.then(db => db.all('SELECT * FROM all_messages LIMIT ? OFFSET ?;', pageSize, offset))
    .then(rows => res.send({
      data: rows,
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
