/**
 * =====================================================================
 * File: /frontend/src/api/auth.js
 * Owner: Member 3 (feat/frontend-ui)
 * Description: Client API bindings for user authentication
 * =====================================================================
 */

import { request } from './client.js';

export async function register(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function login(credentials) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  if (data?.token) {
    localStorage.setItem('token', data.token);
  }

  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

