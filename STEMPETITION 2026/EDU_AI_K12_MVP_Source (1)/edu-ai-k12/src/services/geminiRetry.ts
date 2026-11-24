export async function fetchWithGeminiRetry(
  send: () => Promise<Response>,
  onRetry?: () => void,
  wait = () => new Promise<void>(resolve => setTimeout(resolve, 2000)),
): Promise<Response> {
  const response = await send();
  if (onRetry && response.status === 503 && response.headers.get('X-Gemini-Retry') === '1') {
    onRetry();
    await wait();
    return send();
  }
  return response;
}
