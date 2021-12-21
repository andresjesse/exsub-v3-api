import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { schema } from "@ioc:Adonis/Core/Validator";

import Team from "App/Models/Team";
import User from "App/Models/User";

const teamSchema = schema.create({
  description: schema.string({ trim: true }),
});

export default class TeamsController {
  public async index({ bouncer }: HttpContextContract) {
    await bouncer.authorize("manageTeams");
    return await Team.all();
  }

  public async store({ bouncer, request, response }: HttpContextContract) {
    await bouncer.authorize("manageTeams");
    const payload = await request.validate({ schema: teamSchema });
    const team = await Team.create(payload);
    response.status(201);
    return team;
  }

  public async show({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageTeams");
    return await Team.findOrFail(params.id);
  }

  public async update({ bouncer, request, params }: HttpContextContract) {
    await bouncer.authorize("manageTeams");
    const team = await Team.findOrFail(params.id);
    const payload = await request.validate({ schema: teamSchema });
    team.description = payload.description;
    await team.save();
    return team;
  }

  public async destroy({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageTeams");
    const team = await Team.findOrFail(params.id);
    await team.delete();
    return team;
  }

  public async attachUser({ bouncer, params }) {
    await bouncer.authorize("manageTeams");

    const team = await Team.findOrFail(params.team_id);
    const user = await User.findOrFail(params.user_id);

    await team.related("users").attach([user.id]);
  }

  public async detachUser({ bouncer, params }) {
    await bouncer.authorize("manageTeams");

    const team = await Team.findOrFail(params.team_id);
    const user = await User.findOrFail(params.user_id);

    await team.related("users").detach([user.id]);
  }
}
