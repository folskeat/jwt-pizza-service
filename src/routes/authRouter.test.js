const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let adminToken;
let adminUser;
let userID;

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  user = await DB.addUser(user);
  return { ...user, password: "toomanysecrets" };
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

beforeAll(async () => {
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

test("register fail", async () => {
  const failUser = { name: "David Bowie", email: "wrongo@mail.com" };
  const registerRes = await request(app).post("/api/auth").send(failUser);
  expect(registerRes.status).toBe(400);
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(user);
});

//d is send h is set H for header
test("update admin", async () => {
  const newPassword = "1234";

  const updateRes = await request(app)
    .put("/api/auth/" + adminUser.id)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ email: adminUser.email, password: newPassword });

  console.log(updateRes.body);

  expect(updateRes.status).toBe(200);
});

test("logout user", async () => {
  const falseString = "wrongo";

  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${adminToken}`);
  console.log(logoutRes.body.message);
  expect(logoutRes.status).toBe(200);

  const logout2 = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${falseString}`);
  console.log(logout2.body.message);
  expect(logout2.status).toBe(401);
});
