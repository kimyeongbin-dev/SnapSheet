/**
 * [역할] 인증 관련 API 통신 모듈
 * - 회원가입, 로그인, 로그아웃, 토큰 갱신, 회원탈퇴
 */

import axios from 'axios';

const BASE = 'http://127.0.0.1:8000/api';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

export const authApi = {
  signup: async (email: string, password: string, passwordConfirm: string): Promise<AuthTokens> => {
    const res = await axios.post(`${BASE}/auth/signup`, {
      email,
      password,
      password_confirm: passwordConfirm,
    });
    return res.data;
  },

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const res = await axios.post(`${BASE}/auth/login`, { email, password });
    return res.data;
  },

  logout: async (): Promise<void> => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    await axios.post(
      `${BASE}/auth/logout`,
      { refresh_token: refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  },

  refresh: async (): Promise<AuthTokens> => {
    const token = localStorage.getItem('refresh_token');
    const res = await axios.post(`${BASE}/auth/refresh`, { refresh_token: token });
    return res.data;
  },

  getMe: async (): Promise<UserInfo> => {
    const token = localStorage.getItem('access_token');
    const res = await axios.get(`${BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  deleteAccount: async (password: string): Promise<void> => {
    const token = localStorage.getItem('access_token');
    await axios.delete(`${BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { password },
    });
  },
};
