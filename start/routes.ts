/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from "@ioc:Adonis/Core/Route";

Route.get("/", async () => {
  return { api: "exsub-v3", version: 1 };
});

Route.post("login", async ({ auth, request, response }) => {
  const email = request.input("email");
  const password = request.input("password");

  try {
    const token = await auth.use("api").attempt(email, password);
    return token;
  } catch {
    return response.badRequest("Invalid credentials");
  }
});

Route.post("/logout", async ({ auth }) => {
  await auth.use("api").revoke();
  return {
    revoked: true,
  };
});

Route.resource("teams", "TeamsController")
  .middleware({
    "*": ["auth"],
  })
  .apiOnly();

Route.post(
  "teams/:team_id/attach_user/:user_id",
  "TeamsController.attachUser"
).middleware("auth");

Route.post(
  "teams/:team_id/detach_user/:user_id",
  "TeamsController.detachUser"
).middleware("auth");

Route.resource("users", "UsersController")
  .middleware({
    "*": ["auth"],
  })
  .apiOnly();
