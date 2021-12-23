import Database from "@ioc:Adonis/Lucid/Database";
import Drive from "@ioc:Adonis/Core/Drive";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("submissions management by admin", (group) => {
  let token = null;
  let id = 0;

  group.before(async () => {
    const { body } = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "admin@test.com", password: "123" });

    token = body.token;

    await Database.beginGlobalTransaction(); // enclose test suite
    Drive.fake(); // Fake default disk
  });

  group.after(async () => {
    await Database.rollbackGlobalTransaction(); // rollback to clean changes
    Drive.restore(); // Restore original Drive
  });

  test("ensure admin can create a submission", async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post("/users/" + 1 + "/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "E01",
        exerciseList: "L1",
        programmingLang: "C",
        sourceCode: "[source code]",
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    id = body.id;
  });

  test("ensure admin can update a submission", async () => {
    await supertest(BASE_URL)
      .patch("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + token)
      .send({
        programmingLang: "python",
        sourceCode: "[source code]",
      })
      .expect(200);
  });

  test("ensure submissions readonly attributes can't be changed", async (assert) => {
    const { body } = await supertest(BASE_URL)
      .patch("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "error",
        exerciselist: "error",
        sourceCode: "[source code]",
      })
      .expect(200);

    assert.equal(body.exercise, "E01");
    assert.equal(body.exercise_list, "L1");
  });

  test("ensure admin can delete a submission", async () => {
    await supertest(BASE_URL)
      .get("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    await supertest(BASE_URL)
      .delete("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    await supertest(BASE_URL)
      .get("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + token)
      .expect(404);
  });
});
