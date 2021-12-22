import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("user management by admin", (group) => {
  let token = null;
  let id = 0;

  group.before(async () => {
    const { body } = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "admin@test.com", password: "123" });

    token = body.token;

    await Database.beginGlobalTransaction(); // enclose test suite
  });

  group.after(async () => {
    await Database.rollbackGlobalTransaction(); // rollback to clean changes
  });

  test("ensure admin can create an user", async (assert) => {
    const createUserResponse = await supertest(BASE_URL)
      .post("/users")
      .set("Authorization", "bearer " + token)
      .send({
        email: "nonadmin@test.com",
        password: "123",
        isAdmin: false,
        name: "Non Admin",
      })
      .expect(201);

    assert.isTrue(createUserResponse.body.id > 0);

    id = createUserResponse.body.id;
  });

  test("ensure admin can update an user", async (assert) => {
    await supertest(BASE_URL)
      .patch("/users/" + id)
      .set("Authorization", "bearer " + token)
      .send({ name: "New Name", ra: "A999" })
      .expect(200);

    const updatedResponse = await supertest(BASE_URL)
      .get("/users/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    assert.equal(updatedResponse.body.name, "New Name");
    assert.equal(updatedResponse.body.ra, "A999");
  });

  test("ensure admin can delete an user", async () => {
    await supertest(BASE_URL)
      .get("/users/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    await supertest(BASE_URL)
      .delete("/users/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    await supertest(BASE_URL)
      .get("/users/" + id)
      .set("Authorization", "bearer " + token)
      .expect(404);
  });

  test("ensure non-admin can't manage users", async () => {
    const createUserResponse = await supertest(BASE_URL)
      .post("/users")
      .set("Authorization", "bearer " + token)
      .send({
        email: "nonadmin@test.com",
        password: "123",
        isAdmin: false,
        name: "Non Admin",
      })
      .expect(201);

    const loginResponse = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "nonadmin@test.com", password: "123" })
      .expect(200);

    let nonAdminToken = loginResponse.body.token;

    await supertest(BASE_URL)
      .post("/users")
      .set("Authorization", "bearer " + nonAdminToken)
      .send({
        email: "nonadmin@test.com",
        password: "123",
        isAdmin: false,
        name: "Non Admin",
      })
      .expect(403);
  });
});
