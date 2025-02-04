const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let adminToken;
let adminUser;
let userID;
let franchise;

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

async function createFranchise() {
  let franchiseName = randomName();

  const newFranchise = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: franchiseName, admins: [{ email: adminUser.email }] });

  console.log(newFranchise.body);
  franchise = newFranchise.body;
  return newFranchise;
}

async function createStore() {
  let storeName = randomName();
  let number = Math.floor(Math.random() * 100);

  const newStore = await request(app)
    .post("/api/franchise/" + franchise.id + "/store")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ franchiseId: number, name: storeName });
  return newStore;
}

async function getMenu() {
  const menuRes = await request(app).get("/api/order/menu");
  return menuRes;
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

function randomPrice() {
  let priceBig = Math.floor(Math.random() * 100);
  let priceSmall = parseFloat(Math.random().toFixed(2));
  let newPrice = priceBig + priceSmall;
  return newPrice;
}

beforeAll(async () => {
  if (process.env.VSCODE_INSPECTOR_OPTIONS) {
    jest.setTimeout(60 * 1000 * 5); // 5 minutes
  }

  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token; //Use admin instead of test user
  userID = registerRes.body.user.id;

  // Admin
  const newAdmin = await createAdminUser();
  console.log(newAdmin);
  const adminLogin = await request(app).put("/api/auth").send(newAdmin);
  console.log(adminLogin.body);
  adminToken = adminLogin.body.token;
  adminUser = adminLogin.body.user;
  console.log(adminUser);
});

test("get menu", async () => {
  const menuRes = await getMenu();
  console.log(menuRes.body);
  expect(menuRes.status).toBe(200);
});

test("add to menu", async () => {
  let newTitle = randomName();
  let newDescription = randomName();
  let newPrice = randomPrice();

  const addMenu = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: newTitle,
      description: newDescription,
      image: "pizza9.png",
      price: newPrice,
    });
  console.log(addMenu.body);
  expect(addMenu.status).toBe(200);
});

test("get orders", async () => {
  const getOrder = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${adminToken}`);

  console.log(getOrder.body);
  expect(getOrder.status).toBe(200);
});
/* WORK ON THIS
test("create orders", async () => {
  let menu = await getMenu();
  let menuItem = menu.body[0];
  console.log(menu.body.length);
  console.log(menuItem);

  // Pick a random order to use
  let orderNumber = Math.floor(Math.random() * menu.body.length);
  //console.log(orderNumber);
  //console.log(menu.body);
  //console.log(menu.body[orderNumber - 1]);

  //let chooseFrom = Math.floor(Math.random() * 100);
  let newName = randomName();
  let newPrice = randomPrice();

  let newFranchise = await createFranchise();
  let newStore = await createStore();
  //console.log(newFranchise.body);
  //console.log(newStore.body);

  // Create parts
  console.log(newFranchise.body.id);
  console.log(newStore.body.id);
  console.log(menuItem.id);
  console.log(menuItem.description);
  console.log(menuItem.price);

  const createOrder = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      franchiseId: newFranchise.body.id,
      storeId: newStore.body.id,
      items: [
        {
          menuId: menuItem.id,
          description: menuItem.description,
          price: menuItem.price,
        },
      ],
    });
  //console.log(createOrder.body);
  expect(createOrder.status).toBe(200);
});*/
