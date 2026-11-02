// Masks PII and secrets. Runs before anything reaches the DB, LLM, PRs, texts, memory or logs.

type Rule = [RegExp, string | ((match: string, ...groups: string[]) => string)]

const luhn = (digits: string) => {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2
    sum += d
  }
  return sum % 10 === 0
}

const RULES: Rule[] = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[PRIVATE_KEY]'],
  [/\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]+/g, '[JWT]'],
  [/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_\w{30,})/g, '[TOKEN]'],
  [/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g, '[TOKEN]'],
  [/\bsk-[A-Za-z0-9_-]{20,}/g, '[TOKEN]'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, '[TOKEN]'],
  [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[TOKEN]'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/g, '[TOKEN]'],
  [/\bpl_(?:sk|pk|sess)_[A-Za-z0-9_-]{20,}/g, '[TOKEN]'],
  [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [TOKEN]'],
  [
    /((?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|authorization|cookie)["']?\s*[:=]\s*["']?)(?!\[)[^\s"',;&}]+/gi,
    '$1[SECRET]',
  ],
  [/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+@/gi, '$1[CREDS]@'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[EMAIL]'],
  [/\b(?:cus|ch|pi|pm|sub|in|acct|cs|seti|src|card|txn|re|evt|tok)_[A-Za-z0-9]{8,}\b/g, '[ID]'],
  [/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]'],
  [/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, '[IP]'],
  [/\b(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\b/gi, '[IP]'],
  [/\b(?:\d[ -]?){12,18}\d\b/g, (m) => (luhn(m.replace(/[ -]/g, '')) ? '[CARD]' : m)],
  [/\+\d{10,15}\b/g, '[PHONE]'],
  [/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g, '[PHONE]'],
]

export function scrub(text: string): string {
  let out = text
  for (const [re, rep] of RULES) out = out.replace(re, rep as string)
  return out
}

export function scrubDeep<T>(value: T): T {
  if (typeof value === 'string') return scrub(value) as T
  if (Array.isArray(value)) return value.map(scrubDeep) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubDeep(v)])) as T
  }
  return value
}

export const maskPhone = (phone: string) => (phone.length > 4 ? `…${phone.slice(-4)}` : '…')
