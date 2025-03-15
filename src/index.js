const app = require("./service.js");
const Metrics = require("./metrics.js");
Metrics.interval();

const port = process.argv[2] || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
