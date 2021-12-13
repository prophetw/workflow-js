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
  tasks: Promise<void>[];
  status: JobStatus;
  constructor(url: string) {
    this.url = url;
    this.tasks = [];
    this.status = JobStatus.WAITING;
  }
  async init() {
    // throw 'sub implements this interface';
    // get url html
    // parse html
    // get tasks
  }
  async run() {
    await this.init();
    this.status = JobStatus.PENDING;
    while (this.tasks.length > 0 && this.status !== JobStatus.RESOLVED) {
      // 如果没有解决
      const task = this.tasks.shift();
      // await task.run()
      if (task) {
        this.status = JobStatus.RESOLVED;
      }
    }
    if (this.status === JobStatus.RESOLVED) {
      //  Job is done
    } else {
      //  Job is not done
    }
  }
}
export default Workflow;
