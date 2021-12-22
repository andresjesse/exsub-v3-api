import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("public info", () => {
  test("ensure api version is correct", async (assert) => {
    supertest(BASE_URL)
      .get("/")
      .expect(200)
      .then((response) => {
        assert.equal(response.body.version, 1);
      });
  });
});
