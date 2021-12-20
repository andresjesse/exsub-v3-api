import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Team from "App/Models/Team";

export default class TeamsController {
  public async index({}: HttpContextContract) {
    return await Team.all();
  }

  public async create({ request }: HttpContextContract) {
    // const description = request.input("description"); // QUAL A DIFERENÇA PRO STORE?
    // const team = await Team.create({
    //   description,
    // });
    // console.log("create");
    // return team;
  }

  public async store({ request }: HttpContextContract) {
    const description = request.input("description");

    const team = await Team.create({
      description,
    });
    console.log("create");

    return team;
  }

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
