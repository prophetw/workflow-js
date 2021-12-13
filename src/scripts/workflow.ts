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
  constructor(url: string) {
    this.url = url;
    this.tasks = [];
    this.status = JobStatus.WAITING;
    this.init();
  }
  async init() {
    // throw 'sub implements this interface';
    const word = '蜘蛛侠1百度网盘';
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
            this.result = rr;
          }
        }
      }
    }
    if (this.status === JobStatus.RESOLVED) {
      //  Job is done
    } else {
      //  Job is not done
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
        const slink = sharelink.split('/').pop();
        if (slink) {
          // verify link get randsk
          return false;
        }
      }
    }
    return false;
  }
}
const qqq = new Workflow('test');
qqq.run();
