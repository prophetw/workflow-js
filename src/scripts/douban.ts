import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';
import path from 'path';
import urlParser from 'url';
// get movie info
//
// https://www.douban.com/search?q=%E9%92%A2%E9%93%81%E4%BE%A0
interface MovieInfo {
  type: string;
  title: string;
  englishName: string;
  sid: string;
  ratingNum: string;
  ratingPeopleNum: string;
  subjectCast: string;
  year: string;
  movieLink: string;
}
class DoubanAPI {
  baseUrl: string;
  keyword: string;
  tasks: MovieInfo[];
  constructor(movieName: string) {
    this.baseUrl = 'https://www.douban.com/';
    this.keyword = movieName;
    this.tasks = []; // 保存着搜索关键词
    this.init();
  }
  async init() {
    // const eWord = iconv.encode(this.keyword, 'gbk').toString('binary');
    const eWord = encodeURIComponent(this.keyword);
    const url = `${this.baseUrl}search?q=${eWord}`;
    const res = await axios.get(url, {
      // responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'text/html',
        Referer: 'https://www.douban.com/',
      },
    });
    if (res && res.data) {
      // const decodeJsonStr = iconv.decode(res.data, 'gb2312');
      const decodeJsonStr = res.data;
      fs.writeFileSync(path.resolve('./i.html'), decodeJsonStr, {
        encoding: 'utf8',
      });
      const $ = cheerio.load(decodeJsonStr);
      const movieInfoAry = Array.from($('.result-list .result'))
        .map((node, index) => {
          const title = $(node).find('.content .title h3 a').html() || '';
          const type = $(node).find('.content .title h3 span').html() || '';
          if (type === '[电影]' && title.trim() === this.keyword) {
            const link =
              $(node).find('.content .title h3 a').attr('href') || '';
            const infoObj = urlParser.parse(link, true, false);
            let mLink = infoObj.query.url || '';
            if (Array.isArray(mLink)) {
              mLink = mLink[0];
            }
            const englishName = $(node).find('.pic a').attr('title') || '';
            const matchSid = mLink.match(/\d+/);
            const sid = (matchSid && matchSid[0]) || '';
            const ratingNum =
              $(node).find('.rating-info .rating_nums').html() || '';
            const ratingPeopleNum =
              $(node).find('.rating-info .rating_nums').next().html() || '';
            const subjectCast =
              $(node).find('.rating-info .subject-cast').html() || '';
            const year = (subjectCast && subjectCast.split('/').pop()) || '';
            return {
              type,
              title,
              englishName,
              sid,
              ratingNum,
              ratingPeopleNum,
              subjectCast,
              year: year.trim(),
              movieLink: mLink,
            };
          } else {
            return undefined;
          }
        })
        .filter((info): info is MovieInfo => info !== undefined);
      console.log(movieInfoAry[0]);
      this.tasks = movieInfoAry;
    }
  }
}

const a = new DoubanAPI('');
