import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Submission from "App/Models/Submission";
import { schema } from "@ioc:Adonis/Core/Validator";
import User from "App/Models/User";

/**
 * TODO List:
 * - receive source code in post body (store and update)
 * - save to disk
 * - generate md5
 * - schedule evaluation job
 * - remove file from disk when destroying
 */

const submissionSchema = schema.create({
  filePath: schema.string({ trim: true }),
  exercise: schema.string({ trim: true }),
  exerciseList: schema.string({ trim: true }),
  status: schema.string.optional({ trim: true }),
  programmingLang: schema.string({ trim: true }),
  originalfileMd5: schema.string.optional({ trim: true }),
});

const submissionSchemaPatch = schema.create({
  status: schema.string.nullableAndOptional({ trim: true }),
  programmingLang: schema.string.nullableAndOptional({ trim: true }),
});

export default class SubmissionsController {
  public async index({ params, bouncer }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    return await Submission.query().where("user_id", params.user_id);
  }

  public async store({
    bouncer,
    params,
    request,
    response,
  }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);

    const user = await User.findOrFail(params.user_id);
    const payload = await request.validate({ schema: submissionSchema });
    const obj = await user.related("submissions").create(payload);
    response.status(201);
    return obj;
  }

  public async show({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    return await Submission.findOrFail(params.id);
  }

  public async update({ bouncer, request, params }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    const obj = await Submission.findOrFail(params.id);
    const payload = await request.validate({ schema: submissionSchemaPatch });
    Object.assign(obj, payload);
    await obj.save();
    return obj;
  }

  public async destroy({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    const obj = await Submission.findOrFail(params.id);
    await obj.delete();
    return obj;
  }
}
