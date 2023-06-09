module.exports = {
    apps: [
      {
        name: "Wormhole3-api-for-near",
        instances: 1,
        exec_mode: "cluster",
        script: "yarn",
        args: "start",
        max_memory_restart: "500M",
        log_date_format : "YYYY-MM-DD HH:mm:ss",
        output: '~/.pm2/logs/wh-out.log',
        error: '~/.pm2/logs/wh-error.log',
        merge_logs: true
      },
    ],
  };
  