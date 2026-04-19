/**
 * Local development API server.
 * Mirrors all Vercel serverless functions in /api/ so that
 * `npm run dev` works end-to-end without deploying to Vercel.
 *
 * Reads environment variables from .env via Node's --env-file flag.
 * Runs on port 3001; Vite proxies /api/* here (see vite.config.js).
 */

import http from 'node:http'
import geminiHandler from './api/gemini.js'
import githubReposHandler from './api/github-repos.js'
import githubInviteHandler from './api/github-invite.js'

const PORT = 3001

// Minimal req/res shim so Vercel-style handlers work with Node's http module
function createShim(nodeReq, nodeRes, body, query) {
  const req = Object.assign(nodeReq, { body, query })
  const res = {
    _status: 200,
    _headers: {},
    status(code) { this._status = code; return this },
    setHeader(k, v) { this._headers[k] = v; return this },
    json(data) {
      nodeRes.writeHead(this._status, {
        'Content-Type': 'application/json',
        ...this._headers,
      })
      nodeRes.end(JSON.stringify(data))
    },
  }
  return { req, res }
}

function parseQuery(url) {
  const idx = url.indexOf('?')
  if (idx === -1) return {}
  return Object.fromEntries(new URLSearchParams(url.slice(idx + 1)))
}

async function readBody(nodeReq) {
  return new Promise((resolve) => {
    let data = ''
    nodeReq.on('data', (chunk) => { data += chunk })
    nodeReq.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  // CORS headers for local dev
  nodeRes.setHeader('Access-Control-Allow-Origin', '*')
  nodeRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  nodeRes.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (nodeReq.method === 'OPTIONS') { nodeRes.writeHead(204); nodeRes.end(); return }

  const path = nodeReq.url.split('?')[0]
  const query = parseQuery(nodeReq.url)
  const body = await readBody(nodeReq)
  const { req, res } = createShim(nodeReq, nodeRes, body, query)

  if (path === '/api/gemini' && nodeReq.method === 'POST') {
    return geminiHandler(req, res)
  }
  if (path === '/api/github-repos' && nodeReq.method === 'GET') {
    return githubReposHandler(req, res)
  }
  if (path === '/api/github-invite' && nodeReq.method === 'POST') {
    return githubInviteHandler(req, res)
  }

  nodeRes.writeHead(404, { 'Content-Type': 'application/json' })
  nodeRes.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`[api] Local API server running on http://localhost:${PORT}`)
})
