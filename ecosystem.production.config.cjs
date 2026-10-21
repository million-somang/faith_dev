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
        NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: '4f8a9c2e1b7d6f3a5c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      autorestart: true
    }
  ]
};
