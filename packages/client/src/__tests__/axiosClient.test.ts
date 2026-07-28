import { describe, it, expect } from 'vitest';
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { api } from '@/lib/axiosClient';
import i18n from '@/lib/i18n';

describe('axiosClient request interceptor', () => {
  it('attaches Accept-Language with the current i18n language on every request', async () => {
    let capturedConfig: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      capturedConfig = config;
      return { data: {}, status: 200, statusText: 'OK', headers: config.headers, config };
    };

    await api.get('/api/health');

    expect(capturedConfig?.headers?.['Accept-Language']).toBe(i18n.language);
  });

  it('still attaches Accept-Language on requests that skip the auth dance (e.g. login)', async () => {
    let capturedConfig: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      capturedConfig = config;
      return { data: {}, status: 200, statusText: 'OK', headers: config.headers, config };
    };

    await api.post('/api/auth/login', {}, { _skipAuthRefresh: true } as AxiosRequestConfig);

    expect(capturedConfig?.headers?.['Accept-Language']).toBe(i18n.language);
  });
});
