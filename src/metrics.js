const config = require("./config");
const os = require("os");

class Metrics {
  requests = 0;
  latency = 0;

  /*
  postrequest = 0;

  increasePostRequests() {
    this.postrequests++;
  }


  - in router
  authrouter.post('/', (req, res) => {
      Metrics.increasePostRequests()
    })

  */

  constructor() {}

  interval() {
    setInterval(() => {
      const cpuValue = this.getCpuUsagePercentage();
      this.sendMetricToGrafana("cpu", cpuValue, "gauge", "%");

      const memoryValue = Math.round(this.getMemoryUsagePercentage());
      //console.log("Memory Usage Value:", memoryValue, typeof memoryValue);
      this.sendMetricToGrafana("memory", memoryValue, "gauge", "%");

      this.requests += Math.floor(Math.random() * 200) + 1;
      this.sendMetricToGrafana("requests", this.requests, "sum", "1");

      this.latency += Math.floor(Math.random() * 200) + 1;
      this.sendMetricToGrafana("latency", this.latency, "sum", "ms");
    }, 1000);
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  sendMetricToGrafana(metricName, metricValue, type, unit) {
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

    const body = JSON.stringify(metric);
    fetch(`${config.metrics.url}`, {
      method: "POST",
      body: body,
      headers: {
        Authorization: `Bearer ${config.metrics.apiKey}`,
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
  }
}

const metric = new Metrics();
module.exports = metric;
