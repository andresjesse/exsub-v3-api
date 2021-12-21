import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { schema, rules } from "@ioc:Adonis/Core/Validator";
import User from "App/Models/User";

const userSchema = schema.create({
  email: schema.string({}, [rules.email()]),
  password: schema.string({ trim: true }),
  isAdmin: schema.boolean(),
  name: schema.string({ trim: true }),
  ra: schema.string.optional({ trim: true }),
});

const userSchemaPatch = schema.create({
  email: schema.string.nullableAndOptional({}, [rules.email()]),
  password: schema.string.nullableAndOptional({ trim: true }),
  isAdmin: schema.boolean.nullableAndOptional(),
  name: schema.string.nullableAndOptional({ trim: true }),
  ra: schema.string.nullableAndOptional({ trim: true }),
});

export default class UsersController {
  public async index({ bouncer }: HttpContextContract) {
    await bouncer.authorize("manageUsers");

    return await User.all();
  }

  public async store({ bouncer, request, response }: HttpContextContract) {
    await bouncer.authorize("manageUsers");

    const payload = await request.validate({ schema: userSchema });
    const obj = await User.create(payload);
    response.status(201);
    return obj;
  }

  public async show({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageUsers");

    return await User.findOrFail(params.id);
  }

  public async update({ bouncer, request, params }: HttpContextContract) {
    await bouncer.authorize("manageUsers");

    const obj = await User.findOrFail(params.id);
    const payload = await request.validate({ schema: userSchemaPatch });
    Object.assign(obj, payload);
    await obj.save();
    return obj;
  }

  public async destroy({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageUsers");

    const obj = await User.findOrFail(params.id);
    await obj.delete();
    return obj;
  }
}
