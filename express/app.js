const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const multer = require('multer');
const Transform = require('./transform');
let TransformWs = null;

const port = 8040;
// parsing multipart/form-data
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.json());

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8040');
  res.header('Access-Control-Allow-Credentials', true);
  res.header(
    'Access-Control-Allow-Headers',
    'access_token, access-token,  Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild',
  );
  res.header(
    'Access-Control-Allow-Methods',
    'PUT, POST, GET, DELETE, OPTIONS, INCLUDE',
  );

  if (req.method == 'OPTIONS') {
    // res.send(200)
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

// TODO: upload 独立出去
app.post('/upload', upload.single('file'), function (req, res, next) {
  res.end(' ok ');
});

app.post('/progress', function (req, res, next) {
  console.log(' progress post ', req.body);
  res.end(' ok ');
});

app.post('/test', function (req, res, next) {
  console.log(' progress post ', req.body);
  res.send({
    code: 200,
    msg: 'Transforming',
  });
});

app.get('/', function (req, res, next) {
  console.log('get route ---- ', req.testing);
  res.end();
});

// http
app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error(err);
    return process.exit(1);
  } else {
    console.log(`Example app listening at http://localhost:${port}`);
  }
});

const options = {
  key: fs.readFileSync(__dirname + '/key.pem'),
  cert: fs.readFileSync(__dirname + '/cert.pem'),

  // **optional** SPDY-specific options
  spdy: {
    protocols: ['h2', 'spdy/3.1', 'http/1.1'],
    plain: false,

    // **optional**
    // Parse first incoming X_FORWARDED_FOR frame and put it to the
    // headers of every request.
    // NOTE: Use with care! This should not be used without some proxy that
    // will *always* send X_FORWARDED_FOR
    'x-forwarded-for': true,

    connection: {
      windowSize: 1024 * 1024, // Server's window size

      // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
      autoSpdy31: false,
    },
  },
};

// http2 below
// spdy.createServer(options, app).listen(port, (err) => {
//   if (err) {
//     console.error(err)
//     return process.exit(1)
//   } else {
//     console.log(`Example app listening at https://localhost:${port}`)
//   }
// })
