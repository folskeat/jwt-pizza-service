const express = require("express");
const config = require("../config.js");
const { Role, DB } = require("../database/database.js");
const { authRouter } = require("./authRouter.js");
const { asyncHandler, StatusCodeError } = require("../endpointHelper.js");
const metric = require("../metrics.js");
const logger = require("../logger.js");

const orderRouter = express.Router();

orderRouter.endpoints = [
  {
    method: "GET",
    path: "/api/order/menu",
    description: "Get the pizza menu",
    example: `curl localhost:3000/api/order/menu`,
    response: [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
    ],
  },
  {
    method: "PUT",
    path: "/api/order/menu",
    requiresAuth: true,
    description: "Add an item to the menu",
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [
      {
        id: 1,
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      },
    ],
  },
  {
    method: "GET",
    path: "/api/order",
    requiresAuth: true,
    description: "Get the orders for the authenticated user",
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: {
      dinerId: 4,
      orders: [
        {
          id: 1,
          franchiseId: 1,
          storeId: 1,
          date: "2024-06-05T05:14:40.000Z",
          items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.05 }],
        },
      ],
      page: 1,
    },
  },
  {
    method: "POST",
    path: "/api/order",
    requiresAuth: true,
    description: "Create a order for the authenticated user",
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: {
      order: {
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
        id: 1,
      },
      jwt: "1111111111",
    },
  },
];

// getMenu
orderRouter.get(
  "/menu",
  metric.track("getMenu"),
  asyncHandler(async (req, res) => {
    res.send(await DB.getMenu());
  })
);

// Chaos testing
let enableChaos = false;
orderRouter.put(
  "/chaos/:state",
  metric.track("chaos"),
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (req.user.isRole(Role.Admin)) {
      enableChaos = req.params.state === "true";
    }

    res.json({ chaos: enableChaos });
  })
);

orderRouter.post("/", (req, res, next) => {
  if (enableChaos && Math.random() < 0.5) {
    throw new StatusCodeError("Chaos monkey", 500);
  }
  next();
});

// addMenuItem
orderRouter.put(
  "/menu",
  metric.track("addMenuItem"),
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError("unable to add menu item", 403);
    }

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);
    res.send(await DB.getMenu());
  })
);

// getOrders
orderRouter.get(
  "/",
  metric.track("getOrders"),
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

// createOrder
orderRouter.post(
  "/",
  metric.track("createOrder"),
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const start = Date.now();

    const orderReq = req.body;

    const order = await DB.addDinerOrder(req.user, orderReq);

    const r = await fetch(`${config.factory.url}/api/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${config.factory.apiKey}`,
      },
      body: JSON.stringify({
        diner: { id: req.user.id, name: req.user.name, email: req.user.email },
        order,
      }),
    });

    logger.factoryLogger(r.status, r.headers, r.body);
    const j = await r.json();

    // Prevent 0 pricing
    if (r.ok) {
      let sumPrice = 0;
      for (let i = 0; i < order.items.length; i++) {
        if (order.items[i].price <= 0.0) {
          metric.orderFail();
          res.status(500).send({
            message: "Failed to fulfill order at factory",
            reportPizzaCreationErrorToPizzaFactoryUrl: j.reportUrl,
          });
        }
        sumPrice = sumPrice + order.items[i].price;
      }

      metric.order(sumPrice, order.items.length);

      res.send({ order, reportSlowPizzaToFactoryUrl: j.reportUrl, jwt: j.jwt });

      res.on("finish", () => {
        const latency = Date.now() - start;
        metric.trackPizzaLatency(latency);
      });
    } else {
      metric.orderFail();
      res.status(500).send({
        message: "Failed to fulfill order at factory",
        reportPizzaCreationErrorToPizzaFactoryUrl: j.reportUrl,
      });
    }
  })
);

module.exports = orderRouter;
