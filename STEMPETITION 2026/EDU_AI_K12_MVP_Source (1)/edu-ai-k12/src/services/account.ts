import { fetchWithGeminiRetry } from './geminiRetry';
import { createContext } from 'react';
export interface Account { id: string; name: string; grade?: number }
export async function request(path: string, body?: FormData | Record<string, unknown>, onRetry?: () => void) {
  const headers: Record<string, string> = {};
  if (body) headers['X-Requested-With'] = 'XMLHttpRequest';
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetchWithGeminiRetry(() => fetch('/api/' + path, {
    method: body ? 'POST' : 'GET', headers, credentials: 'same-origin',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }), onRetry);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Yêu cầu thất bại (' + response.status + ').');
  return data;
}


export const AccountContext = createContext<Account | null>(null);

