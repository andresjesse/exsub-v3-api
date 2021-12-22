import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("attach users to teams", (group) => {
  let token = null;
  let user_id = 0;
  let team_id = 0;

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

  test("ensure an user can be attached to a team", async (assert) => {
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

    //create a new team
    const createTeamResponse = await supertest(BASE_URL)
      .post("/teams")
      .set("Authorization", "bearer " + token)
      .send({ description: "Sample Team" })
      .expect(201);

    assert.isTrue(createTeamResponse.body.id > 0);
    team_id = createTeamResponse.body.id;

    //attach
    await supertest(BASE_URL)
      .post("/teams/" + team_id + "/attach_user/" + user_id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    const verificationResponse = await supertest(BASE_URL)
      .get("/teams/" + team_id)
      .set("Authorization", "bearer " + token);

    assert.equal(verificationResponse.body.users[0].id, user_id);
  });

  test("ensure an user can be detached from a team", async (assert) => {
    //attach
    await supertest(BASE_URL)
      .post("/teams/" + team_id + "/detach_user/" + user_id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    const verificationResponse = await supertest(BASE_URL)
      .get("/teams/" + team_id)
      .set("Authorization", "bearer " + token);

    assert.equal(verificationResponse.body.users.length, 0);
  });
});
