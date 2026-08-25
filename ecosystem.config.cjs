module.exports = {
  apps: [
    {
      name: "assemblea-link",
      // PM2 con `interpreter: "bun"` non esegue bun: carica lo script nel suo
      // wrapper via require(), che non supporta il top-level await di src/index.ts.
      // Eseguiamo bun come comando normale, con interpreter disattivato.
      script: "bun",
      args: "run src/index.ts",
      interpreter: "none",
      cwd: __dirname,
      env_file: ".env",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      time: true
    }
  ]
};
