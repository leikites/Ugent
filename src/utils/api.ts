type JsonInit = {
  method?: 'GET' | 'POST' | 'PATCH'
  body?: unknown
  token?: string
  timeoutMs?: number
}

export async function requestJson<T>(path: string, init?: JsonInit): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }

  if (init?.token) headers.authorization = `Bearer ${init.token}`

  const controller = new AbortController()
  const timeoutMs = init?.timeoutMs ?? 10_000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))

  const raw = await res.text()
  let json: unknown = null
  if (raw) {
    try {
      json = JSON.parse(raw) as unknown
    } catch {
      json = null
    }
  }

  if (res.ok) return json as T
  if (json !== null) return json as T
  throw new Error(`Request failed: ${res.status}`)
}

export async function getJson<T>(path: string, init?: Omit<JsonInit, 'method' | 'body'>): Promise<T> {
  return requestJson<T>(path, init)
}

export async function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return requestJson<T>(path, { method: 'POST', body, token })
}
