import * as cheerio from 'cheerio';
import axios from 'axios';
import * as iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';

const searchBaseUrl =
  'https://zhidao.baidu.com/search?lm=0&rn=10&pn=0&fr=search&ie=gbk&dyTabStr=null&word=';
const searchKeyword = '百度网盘';

const search = async (keyword: string) => {
  const sKeyword = keyword + searchKeyword;
  const searchUrl = searchBaseUrl + encodeURIComponent(sKeyword);
  try {
    // const res = await axios.get(searchUrl);
    axios
      .get(searchUrl, {
        responseType: 'arraybuffer',
        headers: {
          Referer: 'https://zhidao.baidu.com/',
          Host: 'zhidao.baidu.com',
          'Accept-Encoding': 'gzip, deflate, br',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36',
        },
      })
      .then((data) => {
        // console.log(data);
        var strJson = iconv.decode(data.data, 'gbk');
        console.log(' ggg');
        fs.writeFileSync(path.resolve('./i.html'), strJson, {
          encoding: 'utf8',
        });
        const $ = cheerio.load(strJson); // like jQuery
        console.log($);
        const cssSelectorPerItem = '#wgt-list > .dl > .dt > a'; //每一个提问题的链接
        const totalAskAry = $(cssSelectorPerItem);
        const linkAry = totalAskAry.map((i, node) => {
          const targetLink = $(node).attr('href');
          return targetLink;
        });
        console.log(linkAry);
        if (linkAry.length > 0) {
          // check if got the right answer
          findFromLink(linkAry[4]);
        } else {
          // no result
          // should go next
        }
      });
  } catch (error) {
    console.log(error);
  }

  console.log(' here ');
};
const findFromLink = (link: string) => {
  console.log(link);
  axios
    .get(link, {
      responseType: 'arraybuffer',
      headers: {
        Referer: 'https://zhidao.baidu.com/',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36',
      },
    })
    .then((data) => {
      // console.log(data);
      var strJson = iconv.decode(data.data, 'gbk');
      console.log(' ggg');
      fs.writeFileSync(path.resolve('./s.html'), strJson, {
        encoding: 'utf8',
      });
      const $ = cheerio.load(strJson); // like jQuery
      console.log($);
      const target = 'baiduyun'; // <baiduyun xxxx /> 标签
      const targetAry = $(target);
      const resultAry = targetAry.map((i, node) => {
        const item = {
          shareLink: $(node).attr('data_sharelink') || '',
          pwd: $(node).attr('data_code') || '',
          size: $(node).attr('data_size') || '',
          title: $(node).attr('data_title') || '',
        };
        return item;
      });
      if (resultAry.length > 0) {
        console.log(resultAry);
        // next step
        // verify sharelink
        verifyShareLinkInfo(resultAry[0]);
      } else {
        // end this with no result
      }
    });
};
// search('超凡蜘蛛侠');
// export { search };
// findFromLink(
//   'https://zhidao.baidu.com/question/554156218791104812.html?fr=iks&word=%E8%B6%85%E5%87%A1%E8%9C%98%E8%9B%9B%E4%BE%A0%E7%99%BE%E5%BA%A6%E7%BD%91%E7%9B&ie=gbk',
// );

const verifyShareLinkInfo = async ({
  pwd,
  shareLink,
  size,
  title,
}: {
  pwd: string;
  shareLink: string;
  size: string;
  title: string;
}) => {
  // shareLink https://pan.baidu.com/s/1-fpNuf6DB_IHXDUto9TQBg =>
  // surl is -fpNuf6DB_IHXDUto9TQBg
  // pwd xxxx
  let surl = '';
  if (shareLink) {
    const ssurl = shareLink.split('/').pop();
    if (ssurl) {
      surl = ssurl.slice(1);
    }
  }
  if (surl) {
    const randsk = await baiduVerifyPassword({
      pwd,
      surl,
    });
    if (randsk) {
      const result = await baiduGetFileList({
        surl,
        randsk,
      });
      return randsk;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
const baiduVerifyPassword = async ({
  surl,
  pwd,
}: {
  surl: string;
  pwd: string;
}): Promise<string> => {
  // get randsk by  password and shorturl
  // https://pan.baidu.com/rest/2.0/xpan/share?method=verify&surl=4DltbIGugiJHqRPl7dJRHg
  const baseUrl = `https://pan.baidu.com/rest/2.0/xpan/share?method=verify`;
  const raw = `pwd=${pwd}`;
  const result = await axios.post(baseUrl, raw, {
    headers: {
      Referer: 'pan.baidu.com',
      'content-type': 'application/x-www-form-urlencoded',
    },
    params: { surl },
  });
  console.log(result);
  if (result.data.errno === 0) {
    const randsk = result.data.randsk;
    return randsk;
  } else {
    return '';
  }
};
const baiduGetFileList = async ({
  surl,
  randsk,
}: {
  surl: string;
  randsk: string;
}): Promise<string> => {
  // shortUrl + randsk  => fileList info  shareid + uk
  // https://pan.baidu.com/rest/2.0/xpan/share?method=list&shorturl=ikBzjeFSyTmfMYLyua31rQ&sekey=4N4PdSB7q4ns6%2BGazcSsJBECC7AHiS8anzKTz0cS%2FEc%3D&root=1
  const baseUrl = `https://pan.baidu.com/rest/2.0/xpan/share?method=list&shorturl=${surl}&sekey=${randsk}&root=1`;
  const result = await axios.get(baseUrl, {
    // params: {
    //   method: 'list',
    //   shorturl: surl,
    //   sekey: randsk,
    //   root: 1, // 根目录下的文件
    // },
    headers: {
      Referer: 'pan.baidu.com',
    },
  });
  if (result && result.data && result.data.errno === 0) {
    // 获取到了准确的信息
    const { share_id, uk, list } = result.data; // share_id uk 用来转存必须的参数
    // list 包含了 具体的信息 转存需要 list_item 的 fs_id
    const fsidlist = list
      .map((item: { fs_id: string; size: string; server_filename: string }) => {
        const { server_filename, size, fs_id } = item;
        return fs_id;
      })
      .filter((id: string | undefined) => id !== undefined);
    console.log(fsidlist);
    const res = await baiduTransfer({
      token:
        '121.c31824075c7bb0671cca998a47aa054a.YntMFaONkGDmefsg-fLkJIufvUdhLRqvkRLrTfT.QbNwqQ',
      share_id,
      uk,
      randsk,
      fsidlist,
    });
    console.log(res);
  }
  return '';
};
const baiduTransfer = async ({
  token,
  share_id,
  uk,
  randsk,
  fsidlist,
}: {
  token: string;
  share_id: string;
  uk: string;
  randsk: string; // 密码解密之后的
  fsidlist: string[];
}): Promise<string> => {
  // 转存的时候需要 baidu 的 token 需要存储的目录
  // use shareid + uk + fileList info  to save to your own netdisk
  const url = `https://pan.baidu.com/rest/2.0/xpan/share?method=transfer&access_token=${token}&shareid=${share_id}&from=${uk}`;
  const ss = ``;
  const result = await axios.post(url, ss, {
    headers: {
      Referer: 'pan.baidu.com',
      // 'content-type': 'application/x-www-form-urlencoded',
    },
  });
  return '';
};
verifyShareLinkInfo({
  pwd: '6zhw',
  shareLink: 'https://pan.baidu.com/s/1-fpNuf6DB_IHXDUto9TQBg',
  size: '',
  title: '',
});
