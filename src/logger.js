const config = require("./config.js");

class Logger {
  // 1. HTTP Requests
  httpLogger = (req, res, next) => {
    let send = res.send;
    res.send = (resBody) => {
      const logData = {
        authorized: !!req.headers.authorization, // Has an auth header
        path: req.originalUrl,
        method: req.method, // HTTP method
        statusCode: res.statusCode, // HTTP status code
        reqBody: JSON.stringify(req.body), // Request body
        resBody: JSON.stringify(resBody), // Response body
      };
      const level = this.statusToLogLevel(res.statusCode);
      this.log(level, "http", logData);
      res.send = send;
      return res.send(resBody);
    };
    next();
  };

  // 2. Database Requests
  queryLogger = (sql, level) => {
    const logData = {
      sql: sql,
    };
    const retLevel = level;
    this.log(retLevel, "query", logData);
  };

  // 3. Factory Requests
  factoryLogger = (status, headers, body) => {
    const logData = {
      factory: "JWT Pizza Factory",
      status: status,
      headers: headers,
      body: body,
    };
    this.log("info", "factory", logData);
  };

  log(level, type, logData) {
    const labels = {
      component: config.logging.source,
      level: level,
      type: type,
    };
    const values = [this.nowString(), this.sanitize(logData)];
    const logEvent = { streams: [{ stream: labels, values: [values] }] };

    this.sendLogToGrafana(logEvent);
  }

  // 4. Check for response if not properly handled
  statusToLogLevel(statusCode) {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warn";
    return "info";
  }

  nowString() {
    return (Math.floor(Date.now()) * 1000000).toString();
  }

  // 5. Sanitize personal data
  sanitize(logData) {
    logData = JSON.stringify(logData);
    return logData.replace(
      /\\"password\\":\s*\\"[^"]*\\"/g,
      '\\"password\\": \\"*****\\"'
    );
  }

  sendLogToGrafana(event) {
    const body = JSON.stringify(event);
    fetch(`${config.logging.url}`, {
      method: "post",
      body: body,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
      },
    }).then((res) => {
      // Some unhandled
      if (!res.ok) console.log("Failed to send log to Grafana");
    });
  }
}
//module.exports = new Logger();
const logger = new Logger();
module.exports = logger;
