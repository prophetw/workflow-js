import Workflow from './workflow';
/**
1.get html
2.parse html
3.filter data
data
 *
 */
class ZhidaoSearchWorkflow extends Workflow {
  // get baidu net share link
  constructor(keyword: string) {
    super(keyword);
    const baseZhidaoSearchUrl = '';
    this.url = baseZhidaoSearchUrl + keyword;
  }
  async init(): Promise<void> {
    // get html page
    // parse html
    // filter usefull data
  }
  async run(): Promise<void> {}
}
