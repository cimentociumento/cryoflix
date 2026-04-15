import { randomUUID } from 'crypto';

type UploadJob = {
  id: string;
  fileName: string;
  status: 'pending' | 'completed';
};

export class UploadService {
  private readonly jobs = new Map<string, UploadJob>();

  requestSignedUrl(fileName: string, mimeType: string) {
    const jobId = randomUUID();
    const uploadUrl = `https://storage.fflix.local/upload/${jobId}`;
    const job: UploadJob = { id: jobId, fileName, status: 'pending' };
    this.jobs.set(jobId, job);

    return { jobId, uploadUrl, fields: { 'Content-Type': mimeType } };
  }

  completeJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Job não encontrado');
    }

    job.status = 'completed';
    return job;
  }

  getJob(jobId: string) {
    return this.jobs.get(jobId);
  }
}

