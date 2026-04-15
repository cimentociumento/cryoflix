import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpClientError } from './HttpClientError';

type RequestConfig = AxiosRequestConfig & {
  traceName?: string;
};

export class HttpClient {
  private constructor(private readonly instance: AxiosInstance) {}

  static create(config?: AxiosRequestConfig) {
    const instance = axios.create({
      timeout: config?.timeout ?? 5000,
      ...config,
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new HttpClientError(
            `HttpClient ${error.config?.method?.toUpperCase()} ${error.config?.url} failed`,
            error.response.status,
            error.response.data,
          );
        }
        throw new HttpClientError(error.message);
      },
    );

    return new HttpClient(instance);
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async head(url: string, config?: RequestConfig): Promise<AxiosResponse['status']> {
    const response = await this.instance.head(url, config);
    return response.status;
  }
}


