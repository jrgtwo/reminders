const allowedOrigins = [
  'https://remindertoday.com',
  'https://www.remindertoday.com',
  'http://localhost:5173',
]

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const resolvedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}
