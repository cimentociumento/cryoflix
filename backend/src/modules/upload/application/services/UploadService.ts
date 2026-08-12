import { randomUUID } from 'crypto';
import { NotFoundError } from '../../../../shared/domain/errors/NotFoundError';

type UploadJob = {
  id: string;
  fileName: string;
  status: 'pending' | 'completed';
  userId: string;
};

export class UploadService {
  private readonly jobs = new Map<string, UploadJob>();

  requestSignedUrl(fileName: string, mimeType: string, userId: string) {
    const jobId = randomUUID();
    const uploadUrl = `https://storage.fflix.local/upload/${jobId}`;
    const job: UploadJob = { id: jobId, fileName, status: 'pending', userId };
    this.jobs.set(jobId, job);

    return { jobId, uploadUrl, fields: { 'Content-Type': mimeType } };
  }

  getJob(jobId: string): UploadJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundError('Job de upload', jobId);
    }
    return job;
  }

  completeJob(jobId: string) {
    const job = this.getJob(jobId);
    job.status = 'completed';
    return job;
  }
}

