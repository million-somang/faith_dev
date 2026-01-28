import { serve } from '@hono/node-server'
import app from './index'

// Node.js 서버로 실행
serve({
  fetch: app.fetch,
  port: 3000
})

console.log('✅ Faith Portal Server is running on http://localhost:3000')
