import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Submission from "App/Models/Submission";
import { schema } from "@ioc:Adonis/Core/Validator";
import Drive from "@ioc:Adonis/Core/Drive";
import MD5 from "crypto-js/md5";

import User from "App/Models/User";
import { SubmissionFileExtensions, SubmissionStatus } from "Config/exsub";

/**
 * TODO List:
 * - schedule evaluation job
 */

const generateFilePath = ({ exerciseList, exercise, programmingLang }) => {
  return `${exerciseList.toUpperCase()}/${exercise.toUpperCase()}.${
    SubmissionFileExtensions[programmingLang.toUpperCase()]
  }`;
};

const submissionSchema = schema.create({
  exercise: schema.string({ trim: true }),
  exerciseList: schema.string({ trim: true }),
  programmingLang: schema.string({ trim: true }),
});

const submissionSchemaPatch = schema.create({
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

    const { sourceCode } = request.body();
    response.abortIf(!sourceCode, "sourceCode is missing in body", 400);

    const user = await User.findOrFail(params.user_id);
    const payload = await request.validate({ schema: submissionSchema });

    const generatedProps = {
      filePath: generateFilePath(payload),
      status: SubmissionStatus.COMPILATION_PENDING,
      originalfileMd5: await MD5(
        sourceCode.replace(/(\r\n|\n|\r)/gm, "") //remove spaces and line breaks
      ).toString(),
    };

    const obj = await user
      .related("submissions")
      .create({ ...payload, ...generatedProps });

    response.status(201);

    await Drive.put(obj.filePath, sourceCode);

    return obj;
  }

  public async show({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    const submission = await Submission.findOrFail(params.id);

    //serialize and inject sourceCode from file
    const serialized = submission.serialize();
    try {
      const buffer = await Drive.get(submission.filePath);
      serialized.sourceCode = buffer.toString();
    } catch (e) {
      console.log(submission.filePath + " does not exist");
    }

    return serialized;
  }

  public async update({
    bouncer,
    request,
    response,
    params,
  }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);

    const { sourceCode } = request.body();
    response.abortIf(!sourceCode, "sourceCode is missing in body", 400);

    const obj = await Submission.findOrFail(params.id);
    const payload = await request.validate({ schema: submissionSchemaPatch });
    Object.assign(obj, payload);

    //override generated props
    obj.status = SubmissionStatus.COMPILATION_PENDING;
    obj.originalfileMd5 = await MD5(
      sourceCode.replace(/(\r\n|\n|\r)/gm, "") //remove spaces and line breaks
    ).toString();

    await obj.save();

    await Drive.put(obj.filePath, sourceCode);

    return obj;
  }

  public async destroy({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    const obj = await Submission.findOrFail(params.id);
    await obj.delete();

    await Drive.delete(obj.filePath);

    return obj;
  }
}
