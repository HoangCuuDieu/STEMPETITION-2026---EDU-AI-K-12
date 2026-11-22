import os
from urllib.parse import quote

import httpx
from fastapi import HTTPException


async def storage_request(method, path, *, content=None, mime=None):
    base_url = os.getenv('SUPABASE_URL', '').strip().rstrip('/')
    secret_key = os.getenv('SUPABASE_SECRET_KEY', '').strip()
    bucket = os.getenv('SUPABASE_STORAGE_BUCKET', '').strip()

    if not all((base_url, secret_key, bucket)):
        raise HTTPException(503, 'Thiếu cấu hình kho tệp.')

    bucket_path = quote(bucket, safe='')
    object_path = quote(path, safe='/')
    endpoint = 'object/authenticated' if method == 'GET' else 'object'
    url = f'{base_url}/storage/v1/{endpoint}/{bucket_path}/{object_path}'

    headers = {'apikey': secret_key}
    if mime:
        headers['Content-Type'] = mime

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.request(
                method, url, headers=headers, content=content,
            )
            response.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(502, 'Kho tệp tạm thời không xử lý được yêu cầu.') from None

    return response.content


async def upload_object(path, content, mime):
    await storage_request('POST', path, content=content, mime=mime)


async def read_object(path):
    return await storage_request('GET', path)
