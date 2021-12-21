import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { schema } from "@ioc:Adonis/Core/Validator";

import Team from "App/Models/Team";

const teamSchema = schema.create({
  description: schema.string({ trim: true }),
});

export default class TeamsController {
  public async index({}: HttpContextContract) {
    return await Team.all();
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate({ schema: teamSchema });
    const team = await Team.create(payload);
    response.status(201);
    return team;
  }

  public async show({ params }: HttpContextContract) {
    return await Team.findOrFail(params.id);
  }

  public async update({ request, params }: HttpContextContract) {
    const team = await Team.findOrFail(params.id);
    const payload = await request.validate({ schema: teamSchema });
    team.description = payload.description;
    await team.save();
    return team;
  }

  public async destroy({ params }: HttpContextContract) {
    const team = await Team.findOrFail(params.id);
    await team.delete();
    return team;
  }
}
