import Database from "@ioc:Adonis/Lucid/Database";
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
  });

  group.after(async () => {
    await Database.rollbackGlobalTransaction(); // rollback to clean changes
  });

  test("ensure admin can create a submission", async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post("/users/" + 1 + "/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        filePath: "L1/E01.c",
        exercise: "E01",
        exerciseList: "L1",
        programmingLang: "C",
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
        status: "correct",
        programmingLang: "python",
      })
      .expect(200);
  });

  test("ensure submissions readonly attributes can't be changed", async (assert) => {
    const { body } = await supertest(BASE_URL)
      .patch("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + token)
      .send({
        filePath: "error",
        exercise: "error",
        exerciselist: "error",
      })
      .expect(200);

    assert.equal(body.file_path, "L1/E01.c");
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
