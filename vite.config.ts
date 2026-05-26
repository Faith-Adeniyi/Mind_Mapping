import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse as NodeServerResponse } from 'node:http'

function apiRoutesPlugin(): Plugin {
  return {
    name: 'api-routes',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: NodeServerResponse, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }

        const routeName = url.split('?')[0].slice('/api/'.length)

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk as Buffer)
          }
          const rawBody = Buffer.concat(chunks).toString('utf-8')
          let parsedBody: unknown
          try {
            parsedBody = rawBody ? JSON.parse(rawBody) : undefined
          } catch {
            parsedBody = rawBody
          }

          const { default: handler } = (await server.ssrLoadModule(`/api/${routeName}.ts`)) as {
            default: (req: unknown, res: unknown) => Promise<void>
          }

          let statusCode = 200
          const pendingHeaders: Record<string, string> = {}

          const fakeRes = {
            setHeader: (name: string, value: string) => {
              pendingHeaders[name] = value
            },
            status: (code: number) => {
              statusCode = code
              return fakeRes
            },
            json: (payload: unknown) => {
              res.writeHead(statusCode, { 'Content-Type': 'application/json', ...pendingHeaders })
              res.end(JSON.stringify(payload))
            },
          }

          await handler({ method: req.method, body: parsedBody, headers: req.headers }, fakeRes)
        } catch (err) {
          console.error('[api-routes]', err)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Bridge non-VITE_ env vars (e.g. GEMINI_API_KEY) into process.env
  // so the api-routes plugin's Node-side handlers can read them.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [tailwindcss(), react(), apiRoutesPlugin()],
  }
})
