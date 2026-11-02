import { config } from '../config.js'
import { errMsg, log } from '../log.js'
import { maskPhone } from '../scrub.js'
import { ownerPhones } from '../tenants.js'

export type NoticeResult = 'sent' | 'no_conversation' | 'dry_run' | 'error'

/**
 * Keiki has no "send verbatim" endpoint: a notice is handed to the agent, which relays it.
 * The agent's instructions (keiki/agent-instructions.md) tell it to relay Patchline notices as-is.
 * 404 = this phone has never texted the agent (users must text first; see onboarding).
 */
export async function sendNotice(phone: string, text: string): Promise<NoticeResult> {
  if (!config.KEIKI_API_KEY || !config.KEIKI_AGENT_ID) {
    log.info('keiki dry run', { phone: maskPhone(phone), text })
    return 'dry_run'
  }
  try {
    const res = await fetch(`${config.KEIKI_BASE_URL}/api/v1/developer/agents/${config.KEIKI_AGENT_ID}/notice`, {
      method: 'POST',
      headers: { authorization: `Bearer ${config.KEIKI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ text, phone }),
      signal: AbortSignal.timeout(10_000),
    })
    if (res.status === 404) return 'no_conversation'
    if (!res.ok) {
      log.error('keiki notice failed', { status: res.status, body: (await res.text()).slice(0, 300) })
      return 'error'
    }
    return 'sent'
  } catch (err) {
    log.error('keiki notice error', { err: errMsg(err) })
    return 'error'
  }
}

export async function notifyOwners(tenantId: string, text: string): Promise<NoticeResult[]> {
  const phones = await ownerPhones(tenantId)
  const results = await Promise.all(phones.map((p) => sendNotice(p, text)))
  results.forEach((r, i) => {
    if (r === 'no_conversation') log.warn('owner has no keiki conversation', { tenantId, phone: maskPhone(phones[i]!) })
  })
  return results
}
