// Browser client for the Patchline onboarding API (src/api.ts in the backend).

export const API_URL = (process.env.NEXT_PUBLIC_PATCHLINE_API ?? "http://localhost:8080").replace(/\/$/, "")

export type PhoneStep = {
  code: string
  expiresAt: number
  /** What the owner texts, e.g. "start 123456". */
  text: string
  /** `sms:` link with the text pre-filled, when the backend has a Keiki SMS number. */
  smsLink: string | null
  /** The Patchline agent's number (E.164), for people who type the text themselves. */
  number: string | null
  /** Keiki join link (opens the conversation), when configured. */
  joinLink: string | null
}

export type Signup = {
  tenantId: string
  sessionToken: string
  phone: PhoneStep
  connect: { prompt: string; expiresAt: number }
}

export type Status = {
  phoneConnected: boolean
  owners: string[]
  lastEventAt: number | null
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  })
  if (res.status === 429) throw new Error("Too many attempts. Try again in a few minutes.")
  if (!res.ok) throw new Error(`Patchline API error (${res.status}).`)
  return (await res.json()) as T
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` })

export const signup = () =>
  call<Signup>("/signup", {
    method: "POST",
    body: JSON.stringify({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  })

export const getStatus = (token: string) => call<Status>("/me/status", { headers: auth(token) })

export const newPhoneCode = (token: string) => call<PhoneStep>("/me/onboarding-code", { method: "POST", headers: auth(token) })

export const newPrompt = (token: string) =>
  call<Signup["connect"]>("/me/connect-prompt", { method: "POST", headers: auth(token) })
