import { randomUUID } from 'crypto';

type TranscodingJob = {
  id: string;
  sourceJobId: string;
  status: 'queued' | 'processing' | 'completed';
  renditions: string[];
};

export class TranscodingService {
  private readonly jobs = new Map<string, TranscodingJob>();

  enqueueJob(sourceJobId: string, renditions: string[]): TranscodingJob {
    const job: TranscodingJob = {
      id: randomUUID(),
      sourceJobId,
      status: 'queued',
      renditions,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId: string): TranscodingJob | undefined {
    return this.jobs.get(jobId);
  }
}

