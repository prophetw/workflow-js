const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');

const RESPONSE_CODE = {
  EXIST_TMP_FILE_PIECE: 900010,
  NO_EXIST_TMP_FILE: 900011,
};

function getFileInfoBy(md5, redisClient, res) {
  // 1. from data base
  // 2. from tmp upload  分片临时数据 这个存在用户文件夹
  // 3. not exist 未找到查询记录
  redisClient.get(md5, (err, reply) => {
    if (reply) {
      // 1
      res.send({
        code: 200,
        msg: '秒传',
        data: {
          file: reply.toString(),
          md5,
        },
      });
    } else {
      const targetPath = path.join(__dirname, './tmp/my-uploads/' + md5);
      const isTmpExist = fs.existsSync(targetPath);
      if (isTmpExist) {
        // 2 存在上传的分片数据
        const files = fs.readdirSync(targetPath);
        res.send({
          code: RESPONSE_CODE.EXIST_TMP_FILE_PIECE,
          msg: '存在分片数据',
          data: files,
        });
      } else {
        // 3. 不存在分片数据
        res.send({
          code: RESPONSE_CODE.NO_EXIST_TMP_FILE,
          msg: '不存在分片数据',
          data: [],
        });
      }
    }
  });
}

function mergeTempBy(md5, filename, redisClient) {
  // 分片上传完成 合并临时
  const targetPath = path.join(__dirname, './tmp/my-uploads/' + md5);
  console.log(targetPath);
  if (!filename) {
    return {
      code: 900001,
      msg: 'filename缺少參數',
      success: false,
      data: [],
    };
  }
  // fs.appendFileSync(path.join(__dirname, './uploads/hello.txt'), ' hello ')

  const isPathExist = fs.existsSync(targetPath);
  if (isPathExist) {
    const files = fs.readdirSync(targetPath);
    const savePath = path.join(__dirname, './uploads/' + filename);
    const writePath = fs.createWriteStream(savePath);
    const startMergeTime = Date.now();
    const BUFFER_SIZE = 1024 * 1024 * 5; // 5MB
    // 因为merge比较费时间 所以暂时去掉这块的代码
    files.map((filePath) => {
      const fPath = path.join(targetPath, filePath);
      const readable = fs.createReadStream(fPath);
      readable.pipe(writePath);
    });
    fs.closeSync(fd);
    const endMergeTime = Date.now();
    console.log(' merge cost: ', (endMergeTime - startMergeTime) / 1000 + 's');
    // rimraf.sync(targetPath)
    redisClient.set(md5, savePath);
    return {
      code: 200,
      success: true,
      msg: 'success',
      data: {
        md5,
        filepath: savePath,
      },
    };
  } else {
    console.log(' not exist ');
    return {
      code: 900001,
      msg: 'md5 不存在',
      success: false,
    };
  }
}

const UploadMethod = {
  mergeTempBy,
  getFileInfoBy,
};

module.exports = UploadMethod;
