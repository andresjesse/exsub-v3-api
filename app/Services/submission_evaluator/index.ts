import Submission from "App/Models/Submission";

import { evaluate_c } from "./programming_language_c";

export default async function evaluateSubmission(submission: Submission) {
  switch (submission.programmingLang) {
    case "C":
      return await evaluate_c(submission);
    default:
      throw new Error(
        "unsupported programming language: " + submission.programmingLang
      );
  }
}
