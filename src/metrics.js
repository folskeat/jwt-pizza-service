const config = require("./config");
/*
let requests = {};
let latency = 0;

function track(endpoint) {
  return (req, res, next) => {
    requests[endpoint] = (requests[endpoint] || 0) + 1;
    next();
  };
}

setInterval(() => {
  const cpuValue = Math.floor(Math.random() * 100) + 1;
  sendMetricToGrafana("cpu", cpuValue, "gauge", "%");

  requests += Math.floor(Math.random() * 200) + 1;
  sendMetricToGrafana("requests", requests, "sum", "1");

  latency += Math.floor(Math.random() * 200) + 1;
  sendMetricToGrafana("latency", latency, "sum", "ms");
}, 1000);

function sendMetricToGrafana(metricName, metricValue, type, unit) {
  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                unit: unit,
                [type]: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  if (type === "sum") {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
      type
    ].aggregationTemporality = "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
      type
    ].isMonotonic = true;
  }

  /*
  Object.keys(attributes).forEach((key) => {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0].attributes.push(
      {
        key: key,
        value: { stringValue: attributes[key] },
      }
    );
  });
  

const body = JSON.stringify(metric);
fetch(`${config.url}`, {
  method: "POST",
  body: body,
  headers: {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    if (!response.ok) {
      response.text().then((text) => {
        console.error(
          `Failed to push metrics data to Grafana: ${text}\n${body}`
        );
      });
    } else {
      console.log(`Pushed ${metricName}`);
    }
  })
  .catch((error) => {
    console.error("Error pushing metrics:", error);
  });

/*
  const os = require("os");

  function getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }

  function getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  function sendMetricsPeriodically(period) {
    const timer = setInterval(() => {
      try {
        const buf = new MetricBuilder();
        httpMetrics(buf);
        systemMetrics(buf);
        userMetrics(buf);
        purchaseMetrics(buf);
        authMetrics(buf);

        const metrics = buf.toString("\n");
        this.sendMetricToGrafana(metrics);
      } catch (error) {
        console.log("Error sending metrics", error);
      }
    }, period);
  }
}

module.exports = { track };
*/
