module.exports = {
  apps: [
    {
      name: 'faith-portal',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
}
