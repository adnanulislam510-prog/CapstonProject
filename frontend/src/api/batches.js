/**
 * =====================================================================
 * File: /frontend/src/api/batches.js
 * Owner: Member 3 (feat/frontend-ui)
 * Description: Client API bindings for food batch CRUD and state transitions
 * =====================================================================
 */

import { request } from './client.js';

export async function fetchBatches(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return request(`/batches${params ? `?${params}` : ''}`, { method: 'GET' });
}

export async function createBatch(batchData) {
  return request('/batches', {
    method: 'POST',
    body: JSON.stringify(batchData)
  });
}

export async function claimBatch(id, payload = {}) {
  return request(`/batches/${id}/claim`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function notifyOnWay(id, payload = {}) {
  return request(`/batches/${id}/on-way`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function cancelBatch(id, payload = {}) {
  return request(`/batches/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function completeBatch(id, payload = {}) {
  return request(`/batches/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

