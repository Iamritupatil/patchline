import { z } from 'zod'

const optional = z.string().trim().min(1).optional().catch(undefined)

const Env = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    PUBLIC_URL: z.url().default('http://localhost:8080'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    DATABASE_URL: z.string().default('file:./data/patchline.db'),
    DATABASE_AUTH_TOKEN: optional,
    ADMIN_TOKEN: z.string().min(24).optional().catch(undefined),
    KEIKI_BASE_URL: z.url().default('https://onkeiki.com'),
    KEIKI_API_KEY: optional,
    KEIKI_AGENT_ID: optional,
    KEIKI_WEBHOOK_SECRET: optional,
    KEIKI_JOIN_LINK: optional,
    KEIKI_JOIN_CODE: optional,
    KEIKI_SMS_NUMBER: optional,
    SKILLS_SOURCE: z.string().default('Iamritupatil/patchline'),
    KEIKI_DEBUG: z.stringbool().default(false),
    ANTHROPIC_API_KEY: optional,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return
    for (const key of ['KEIKI_API_KEY', 'KEIKI_AGENT_ID', 'KEIKI_WEBHOOK_SECRET', 'ADMIN_TOKEN'] as const) {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'required in production' })
    }
  })

export const config = Env.parse(process.env)
export const isProd = config.NODE_ENV === 'production'
export const corsOrigins = config.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
