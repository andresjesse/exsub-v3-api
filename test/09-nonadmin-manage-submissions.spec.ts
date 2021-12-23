import Database from "@ioc:Adonis/Lucid/Database";
import Drive from "@ioc:Adonis/Core/Drive";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("submissions management by admin", (group) => {
  let token = null;
  let nonAdminToken = null;
  let user_id = 0;
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

  test("ensure non-admin user can create a submission", async (assert) => {
    // create a new user
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
    user_id = createUserResponse.body.id;

    //login with new user to get token
    const loginResponse = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "nonadmin@test.com", password: "123" });

    nonAdminToken = loginResponse.body.token;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/" + user_id + "/submissions")
      .set("Authorization", "bearer " + nonAdminToken)
      .send({
        filePath: "L1/E01.c",
        exercise: "E01",
        exerciseList: "L1",
        programmingLang: "C",
        sourceCode: "[source code]",
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    id = body.id;
  });

  test("ensure non-admin can't update a submission from other user", async () => {
    //create a submission from admin
    await supertest(BASE_URL)
      .post("/users/" + 1 + "/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        filePath: "L1/E01.c",
        exercise: "E01",
        exerciseList: "L1",
        programmingLang: "C",
        sourceCode: "[source code]",
      })
      .expect(201);

    //try to patch admin's submission
    await supertest(BASE_URL)
      .patch("/users/" + 1 + "/submissions/" + id)
      .set("Authorization", "bearer " + nonAdminToken)
      .send({
        status: "correct",
        programmingLang: "python",
        sourceCode: "[source code]",
      })
      .expect(403);
  });

  test("ensure non-admin can delete his own submission", async () => {
    await supertest(BASE_URL)
      .get("/users/" + user_id + "/submissions/" + id)
      .set("Authorization", "bearer " + nonAdminToken)
      .expect(200);

    await supertest(BASE_URL)
      .delete("/users/" + user_id + "/submissions/" + id)
      .set("Authorization", "bearer " + nonAdminToken)
      .expect(200);

    await supertest(BASE_URL)
      .get("/users/" + user_id + "/submissions/" + id)
      .set("Authorization", "bearer " + nonAdminToken)
      .expect(404);
  });
});
