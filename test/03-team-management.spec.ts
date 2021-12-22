import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("team management by admin", (group) => {
  let token = null;
  let id = 0;

  group.before(async () => {
    const { body } = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "admin@test.com", password: "123" });

    token = body.token;
  });

  test("ensure admin can create a team", async (assert) => {
    const { body } = await supertest(BASE_URL)
      .get("/teams")
      .set("Authorization", "bearer " + token)
      .expect(200);

    assert.equal(body.length, 0);

    const createResponse = await supertest(BASE_URL)
      .post("/teams")
      .set("Authorization", "bearer " + token)
      .send({ description: "Sample Team" })
      .expect(201);

    id = createResponse.body.id;

    assert.isTrue(id > 0);
  });

  test("ensure admin can update a team", async (assert) => {
    const updatedResponse = await supertest(BASE_URL)
      .patch("/teams/" + id)
      .set("Authorization", "bearer " + token)
      .send({ description: "New Description" })
      .expect(200);

    assert.equal(updatedResponse.body.description, "New Description");
  });

  test("ensure admin can delete a team", async () => {
    await supertest(BASE_URL)
      .get("/teams/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    await supertest(BASE_URL)
      .delete("/teams/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    await supertest(BASE_URL)
      .get("/teams/" + id)
      .set("Authorization", "bearer " + token)
      .expect(404);
  });

  test("ensure non-admin can't manage teams", async () => {
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
      .post("/teams")
      .set("Authorization", "bearer " + nonAdminToken)
      .send({ description: "Sample Team" })
      .expect(403);

    await supertest(BASE_URL)
      .delete("/users/" + createUserResponse.body.id)
      .set("Authorization", "bearer " + token)
      .expect(200);
  });
});
