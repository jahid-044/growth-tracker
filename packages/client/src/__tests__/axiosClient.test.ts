import { describe, it, expect, afterEach } from 'vitest';
import { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { api } from '@/lib/axiosClient';
import i18n from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';

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

describe('axiosClient response interceptor', () => {
  afterEach(() => {
    delete api.defaults.adapter;
    useAuthStore.setState({ accessToken: null, user: null });
  });

  it('clears the auth store when the refresh triggered by a 401 also fails', async () => {
    useAuthStore.getState().setSession('stale-token', { id: 'u1', email: 'test@company.com' });

    // Every request 401s — the original call and the /api/auth/refresh it triggers.
    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      throw new AxiosError('Unauthorized', undefined, config, undefined, {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as AxiosResponse);
    };

    await expect(api.get('/api/auth/me')).rejects.toThrow();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
