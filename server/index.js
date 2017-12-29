const http = require('http');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();

const isDev = process.env.NODE_ENV === 'development';

class HTTPError extends Error {
  constructor(status, ...args) {
    super(...args);
    this.status = status;
  }
}

app.set('port', process.env.PORT || 3000);

app.use(bodyParser.json({ type: '*/*' })); // Parse everything. This is a JSON server
app.use(morgan(isDev ? 'dev' : 'combined'));

app.get('/', (req, res) => {
  res.send({
    data: { available: true },
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
