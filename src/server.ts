import { serve } from '@hono/node-server'
import app from './index'
import { config } from 'dotenv'

config()

const port = Number(process.env.PORT || 5000)

// Node.js 서버로 실행
serve({
  fetch: app.fetch,
  port: port
})

console.log(`✅ Faith Portal Server is running on http://localhost:${port}`)
