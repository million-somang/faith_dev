const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch {}

module.exports = {
  apps: [
    {
      name: 'faith-api',
      script: 'npm',
      args: 'run start:api',
      env: {
        NODE_ENV: 'production',
        PORT: 4200
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '350M',
      autorestart: true
    },
    {
      name: 'faith-portal',
      script: 'npm',
      args: 'run start:next',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_SERVER_URL: 'http://127.0.0.1:4200',
        NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY || ''
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      autorestart: true
    }
  ]
};
