import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("login", (group) => {
  let token = null;

  group.before(async () => {
    await Database.beginGlobalTransaction(); // enclose test suite
  });

  group.after(async () => {
    await Database.rollbackGlobalTransaction(); // rollback to clean changes
  });

  test("ensure admin login works", async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "admin@test.com", password: "123" })
      .expect(200);

    assert.equal(body.type, "bearer");

    token = body.token;
  });

  test("ensure admin logout works", async (assert) => {
    await supertest(BASE_URL)
      .get("/teams")
      .set("Authorization", "bearer " + token)
      .expect(200);

    const { body } = await supertest(BASE_URL)
      .post("/logout")
      .set("Authorization", "bearer " + token)
      .expect(200);

    assert.equal(body.revoked, true);
  });
});
