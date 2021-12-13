const fs = require('fs');
const path = require('path');

function TransformFile({ md5, filename }, res, wsClient) {
  setTimeout(() => {
    console.log(' transform succ ');
    wsClient.send(
      JSON.stringify({
        md5,
        filename,
        msg: 'transform success',
        code: 200,
      }),
    );
  }, 5000);
}

module.exports = TransformFile;
