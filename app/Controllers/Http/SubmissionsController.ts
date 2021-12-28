import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Submission from "App/Models/Submission";
import { schema } from "@ioc:Adonis/Core/Validator";
import Drive from "@ioc:Adonis/Core/Drive";
import MD5 from "crypto-js/md5";

import User from "App/Models/User";
import { SubmissionFileExtensions, SubmissionStatus } from "Config/exsub";
import evaluateSubmission from "App/Services/submission_evaluator";

// Helper Function
const generateFilePath = ({
  userId,
  exerciseList,
  exercise,
  programmingLang,
}) => {
  return `STUDENTS/${userId}/${exerciseList.toUpperCase()}/${exercise.toUpperCase()}.${
    SubmissionFileExtensions[programmingLang.toUpperCase()]
  }`;
};

// Schemas
const submissionSchema = schema.create({
  exercise: schema.string({ trim: true }),
  exerciseList: schema.string({ trim: true }),
  programmingLang: schema.string({ trim: true }),
});

const submissionSchemaPatch = schema.create({
  programmingLang: schema.string.nullableAndOptional({ trim: true }),
});

// Controller Class
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

    // ensure sourceCode exists in body
    const { sourceCode } = request.body();
    response.abortIf(!sourceCode, "sourceCode is missing in body", 400);

    // validate schema
    const user = await User.findOrFail(params.user_id);
    const payload = await request.validate({ schema: submissionSchema });

    // generate additional props
    const generatedProps = {
      filePath: generateFilePath({ userId: user.id, ...payload }),
      status: SubmissionStatus.COMPILATION_PENDING,
      originalfileMd5: await MD5(
        sourceCode.replace(/(\r\n|\n|\r)/gm, "") //remove spaces and line breaks
      ).toString(),
    };

    // create a new submission with paylod and generated props
    const submission = await user
      .related("submissions")
      .create({ ...payload, ...generatedProps });

    // save disk file, emit event for exercise evaluator
    await Drive.put(submission.filePath, sourceCode);
    const evaluatedSubmission = await evaluateSubmission(submission);
    response.status(201);
    return evaluatedSubmission;
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

    // ensure sourceCode exists in body
    const { sourceCode } = request.body();
    response.abortIf(!sourceCode, "sourceCode is missing in body", 400);

    // validate schema, update submission
    const submission = await Submission.findOrFail(params.id);
    const payload = await request.validate({ schema: submissionSchemaPatch });
    Object.assign(submission, payload);

    //override generated props
    submission.status = SubmissionStatus.COMPILATION_PENDING;
    submission.originalfileMd5 = await MD5(
      sourceCode.replace(/(\r\n|\n|\r)/gm, "") //remove spaces and line breaks
    ).toString();

    // save database and disk file, emit event for exercise evaluator
    await submission.save();
    await Drive.put(submission.filePath, sourceCode);
    return await evaluateSubmission(submission);
  }

  public async destroy({ bouncer, params }: HttpContextContract) {
    await bouncer.authorize("manageSubmissions", params.user_id);
    const submission = await Submission.findOrFail(params.id);
    await submission.delete();
    await Drive.delete(submission.filePath);
    return submission;
  }
}
