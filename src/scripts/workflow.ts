import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
/**
1.get html
2.parse html
3.filter data
data
 *
 */
enum JobStatus {
  REJECTED = 'rejected',
  RESOLVED = 'resolved',
  WAITING = 'waiting',
  PENDING = 'pending',
}

class Workflow {
  url: string;
  tasks: string[];
  status: JobStatus;
  result: any;
  keyword: string;
  constructor(url: string) {
    this.url = url;
    this.tasks = [];
    this.keyword = '';
    this.status = JobStatus.WAITING;
    this.init();
  }
  async init() {
    // throw 'sub implements this interface';
    const word = '钢铁侠3百度网盘';
    this.keyword = word.slice(0, word.indexOf('百度网盘'));
    const eWord = iconv.encode(word, 'gbk').toString('binary');

    const url = `https://zhidao.baidu.com/search?lm=0&rn=10&pn=0&fr=search&ie=gbk&dyTabStr=null&word=${eWord}`;
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'text/html',
        Referer: 'https://zhidao.baidu.com/',
      },
    });
    if (res && res.data) {
      const decodeJsonStr = iconv.decode(res.data, 'gb2312');
      const $ = cheerio.load(decodeJsonStr);
      const hrefAry = Array.from($('#wgt-list dt>a'))
        .map((node, index) => {
          const href = $(node).attr('href');
          return href;
        })
        .filter((href): href is string => href !== undefined);
      console.log(hrefAry);
      this.tasks = hrefAry;
    }
    // get url html
    // parse html
    // get tasks
  }
  async run() {
    await this.init();
    this.status = JobStatus.PENDING;
    while (this.tasks.length > 0 && this.status !== JobStatus.RESOLVED) {
      // 如果没有解决
      const taskLink = this.tasks.shift();
      if (taskLink) {
        const res = await axios.get(taskLink, {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'text/html',
            Referer: 'https://zhidao.baidu.com/',
          },
        });
        if (res && res.data) {
          const decodeJsonStr = iconv.decode(res.data, 'gb2312');
          const $ = cheerio.load(decodeJsonStr);
          // const hrefAry = Array.from($('#wgt-list dt>a'));
          // 1 baiduyun
          const dataAry = Array.from($('baiduyun')).map((node, index) => {
            const info = {
              pwd: $(node).attr('data_code') || '',
              size: $(node).attr('data_size') || '',
              sharelink: $(node).attr('data_sharelink') || '',
              title: $(node).attr('data_title') || '',
            };
            return info;
          });
          // await task.run()
          const rr = await this.goThrough(dataAry);
          if (rr) {
            this.status = JobStatus.RESOLVED;
            // 转存
            this.result = rr;
          }
        }
      }
    }
    if (this.status === JobStatus.RESOLVED) {
      //  Job is done
      this.baiduTransfer({
        ...this.result,
        token:
          '121.c31824075c7bb0671cca998a47aa054a.YntMFaONkGDmefsg-fLkJIufvUdhLRqvkRLrTfT.QbNwqQ',
      });
    } else {
      //  Job is not done
      console.log(' 没找到资源 ');
      return false;
    }
  }
  async goThrough(
    infoAry: {
      pwd: string;
      size: string;
      sharelink: string;
      title: string;
    }[],
  ): Promise<false | any> {
    while (infoAry.length > 0 && this.status !== JobStatus.RESOLVED) {
      // 如果没有解决
      const info = infoAry.shift();
      if (info) {
        const { sharelink, pwd, size, title } = info;
        let surl = sharelink.split('/').pop();
        if (surl) {
          // verify link get randsk
          surl = surl.slice(1);
          const randsk = await this.baiduVerifyPassword({
            pwd,
            surl,
          });
          if (randsk) {
            const result = await this.baiduGetFileList({
              surl,
              randsk,
            });
            if (result) {
              console.log(result);
              this.status = JobStatus.RESOLVED;
              return result;
            }
          }
          return false;
        }
      }
    }
    return false;
  }
  async baiduVerifyPassword({
    surl,
    pwd,
  }: {
    surl: string;
    pwd: string;
  }): Promise<false | string> {
    // get randsk by  password and shorturl
    // https://pan.baidu.com/rest/2.0/xpan/share?method=verify&surl=4DltbIGugiJHqRPl7dJRHg
    const baseUrl = `https://pan.baidu.com/rest/2.0/xpan/share?method=verify`;
    const raw = `pwd=${pwd}`;
    const result = await axios.post(baseUrl, raw, {
      headers: {
        Referer: 'pan.baidu.com',
      },
      params: { surl },
    });
    if (result.data.errno === 0) {
      const randsk = result.data.randsk;
      return randsk;
    } else {
      return false;
    }
  }
  async baiduGetFileList({
    surl,
    randsk,
  }: {
    surl: string;
    randsk: string;
  }): Promise<
    | false
    | {
        share_id: string;
        uk: string;
        fsidlist: string[];
        randsk: string;
      }
  > {
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
      const { share_id, uk, list, mediaType } = result.data; // share_id uk 用来转存必须的参数
      // list 包含了 具体的信息 转存需要 list_item 的 fs_id
      const fsidlist = list
        .map(
          (item: { fs_id: string; size: string; server_filename: string }) => {
            const { server_filename, size, fs_id } = item;
            console.log('server_filename : ', server_filename);
            console.log('size :', size);
            // if(mediaType==='video')
            if (server_filename.indexOf(this.keyword) > -1) {
              return fs_id;
            }
            if (size === '0') return undefined;
            return fs_id;
          },
        )
        .filter((id: string | undefined) => id !== undefined);
      console.log(fsidlist);
      if (fsidlist.length > 0) {
        return {
          share_id,
          uk,
          fsidlist,
          randsk,
        };
      } else {
        return false;
      }
    }
    return false;
  }
  async baiduTransfer({
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
  }): Promise<string> {
    // TODO: check token 1month
    // 转存的时候需要 baidu 的 token 需要存储的目录
    // use shareid + uk + fileList info  to save to your own netdisk
    const url = `https://pan.baidu.com/rest/2.0/xpan/share?method=transfer&access_token=${token}&shareid=${share_id}&from=${uk}`;
    const raw = `fsidlist=[${fsidlist}]&path=/test&sekey=${randsk}`;
    const result = await axios.post(url, raw, {
      headers: {
        Referer: 'pan.baidu.com',
      },
    });
    console.log(result);
    return '';
  }
}
const qqq = new Workflow('test');
qqq.run();
