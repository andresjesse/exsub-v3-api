import Database from "@ioc:Adonis/Lucid/Database";
import Drive from "@ioc:Adonis/Core/Drive";
import test from "japa";
import supertest from "supertest";

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group("submissions evaluator tests", (group) => {
  let token = null;

  group.beforeEach(async () => {
    const { body } = await supertest(BASE_URL)
      .post("/login")
      .send({ email: "admin@test.com", password: "123" });

    token = body.token;

    await Database.beginGlobalTransaction(); // enclose test suite
    //Drive.fake(); // Fake default disk (fake disk don't work with GCC)

    //write fake Test Cases
    await Drive.put("TEST_CASES/L999/L999E99.1.in", "2");
    await Drive.put("TEST_CASES/L999/L999E99.1.out", "4");
    await Drive.put("TEST_CASES/L999/L999E99.1.in", "4");
    await Drive.put("TEST_CASES/L999/L999E99.1.out", "16");
  });

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction(); // rollback to clean changes
    //Drive.restore(); // Restore original Drive (fake disk don't work with GCC)

    await Drive.delete("TEST_CASES/L999/L999E99.1.in");
    await Drive.delete("TEST_CASES/L999/L999E99.1.out");
    await Drive.delete("TEST_CASES/L999/L999E99.1.in");
    await Drive.delete("TEST_CASES/L999/L999E99.1.out");
    await Drive.delete("STUDENTS/1/L999/99.c");
    await Drive.delete("STUDENTS/1/L999/");
  });

  test("ensure an invalid source code returns compilation error status", async (assert) => {
    const sourceCode = `
      #include <stdio.h>

      int invalid_main() {
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "COMPILATION_ERROR");
  });

  test("ensure an invalid include <> returns compilation error status", async (assert) => {
    const sourceCode = `
      #include <other.h>

      int main() {
        return 0;
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "COMPILATION_ERROR");
  });

  test('ensure an invalid include "" returns compilation error status', async (assert) => {
    const sourceCode = `
      #include "other_quoted.h"

      int main() {
        return 0;
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "COMPILATION_ERROR");
  });

  test("ensure an system(...) call returns compilation error status", async (assert) => {
    const sourceCode = `
      #include <stdio.h>

      int main() {
        system("ls");
        return 0;
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "COMPILATION_ERROR");
  });

  test("ensure an fork(...) call returns compilation error status", async (assert) => {
    const sourceCode = `
      #include <stdio.h>

      int main() {
        fork();
        return 0;
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "COMPILATION_ERROR");
  });

  test("ensure a compilable but incorrect source code returns incorrect status", async (assert) => {
    const sourceCode = `
      #include <stdio.h>

      int main() {
        printf("hello");
        return 0;
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "INCORRECT");
  });

  test("ensure a compilable and correct source code returns correct status", async (assert) => {
    const sourceCode = `
      #include <stdio.h>

      int main() {
        int num;
        scanf("%d", &num);
        printf("%d", num * num);
        return 0;
      }
    `;

    //create a new submission
    const { body } = await supertest(BASE_URL)
      .post("/users/1/submissions")
      .set("Authorization", "bearer " + token)
      .send({
        exercise: "99",
        exerciseList: "L999",
        programmingLang: "C",
        sourceCode,
      })
      .expect(201);

    assert.isTrue(body.id > 0);
    assert.equal(body.status, "CORRECT");
  });
});
