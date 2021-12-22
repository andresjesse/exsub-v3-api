import Database from "@ioc:Adonis/Lucid/Database";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("dead relationships in team_user pivot table", (group) => {
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

  test("ensure a deleted user also deletes dead relationship team_user", async (assert) => {
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

    let pivotTableEntries = await Database.from("team_user").where(
      "user_id",
      user_id
    );

    //assert user is attached to team
    assert.equal(pivotTableEntries.length, 1);

    //delete user
    await supertest(BASE_URL)
      .delete("/users/" + user_id)
      .set("Authorization", "bearer " + token)
      .expect(200);

    pivotTableEntries = await Database.from("team_user").where(
      "user_id",
      user_id
    );

    //assert user is attached to team
    assert.equal(pivotTableEntries.length, 0);
  });
});
