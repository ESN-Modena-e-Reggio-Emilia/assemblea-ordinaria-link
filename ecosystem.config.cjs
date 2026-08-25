module.exports = {
  apps: [
    {
      name: "assemblea-link",
      script: "src/index.ts",
      interpreter: "bun",
      cwd: __dirname,
      env_file: ".env",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      time: true
    }
  ]
};
