import Drive from "@ioc:Adonis/Core/Drive";
import Submission from "App/Models/Submission";
import {
  INCLUDES_WHITELIST,
  SubmissionStatus,
  USER_LANGUAGE,
} from "Config/exsub";
import Application from "@ioc:Adonis/Core/Application";
import { execSync, execFileSync } from "child_process";
import I18n from "@ioc:Adonis/Addons/I18n";

interface TestResult {
  result: boolean;
  expected_out: string;
  student_out: string;
}

interface TestCase {
  inFile: string;
  outFile: string;
}

export const evaluate_c = async (submission: Submission) => {
  const mainFilePath = Application.tmpPath(
    `compilation/${submission.userId}_${submission.exerciseList}_${submission.exercise}`
  );

  // ensure no previous executable is present
  Drive.delete(mainFilePath);

  const results: TestResult[] = [];

  try {
    await validateSource(submission);
    const testCases = await getTestCases(submission);

    for (const testCase of testCases) {
      const compilationCommand = `gcc -o ${mainFilePath} EXERCISE_LISTS/${submission.filePath} -lm`;
      const resultCompilation = execSync(compilationCommand, { timeout: 3000 });
      // console.log(resultCompilation.toString());

      const testInput = await Drive.get(testCase.inFile);
      const testOutput = await Drive.get(testCase.outFile);

      const resultExecution = execFileSync(mainFilePath, {
        input: testInput.toString(),
      });
      // console.log(testInput.toString(), resultExecution.toString());

      const cleanOut = resultExecution
        .toString()
        .trim()
        .replace(" ", "")
        .replace("\n", "");
      const cleanExpectedOut = testOutput
        .toString()
        .trim()
        .replace(" ", "")
        .replace("\n", "");

      results.push({
        result: cleanOut === cleanExpectedOut,
        expected_out: testOutput.toString(),
        student_out: resultExecution.toString(),
      });
    }

    if (results.every((result) => result.result)) {
      submission.status = SubmissionStatus.CORRECT;
      submission.statusMessage =
        I18n.locale(USER_LANGUAGE).formatMessage("messages.CORRECT");
      await submission.save();
    } else {
      submission.status = SubmissionStatus.INCORRECT;
      submission.statusMessage =
        I18n.locale(USER_LANGUAGE).formatMessage("messages.INCORRECT");
      await submission.save();
    }
  } catch (err) {
    submission.status = SubmissionStatus.COMPILATION_ERROR;
    const errorStr = err.message?.toString().replace(Application.tmpPath(), "");
    submission.statusMessage = I18n.locale(USER_LANGUAGE).formatMessage(
      "messages.COMPILATION_ERROR",
      { error: errorStr }
    );
    await submission.save();
  } finally {
    Drive.delete(mainFilePath);
  }

  console.log(submission);

  return submission;
};

/**
 * Loads test cases from TEST_CASES folder
 */
const getTestCases = async (submission: Submission) => {
  const exId = `${submission.exerciseList.toUpperCase()}E${submission.exercise.toUpperCase()}`;
  const basePath = `TEST_CASES/${submission.exerciseList.toUpperCase()}/${exId}`;

  const testCases: Array<TestCase> = [];
  let testIndex = 1;

  while (await Drive.exists(`${basePath}.${testIndex}.in`)) {
    testCases.push({
      inFile: `${basePath}.${testIndex}.in`,
      outFile: `${basePath}.${testIndex}.out`,
    });
    testIndex++;
  }

  return testCases;
};

/**
 * Avoids using unknown includes and system() command
 */
const validateSource = async (submission: Submission) => {
  const buffer = await Drive.get(submission.filePath);
  const sourceCode = buffer.toString();

  const includesRegex = /#\s*include\s*<\s*([^>]*)\s*>/gi;
  const includesQuotRegex = /#\s*include\s*\"\s*([^\"]*)\s*\"/gi;
  const systemRegex = /system\s*([^)]*)/gi;

  for (const match of sourceCode.matchAll(includesRegex)) {
    if (!INCLUDES_WHITELIST.includes(match[1]))
      throw new Error(
        I18n.locale(USER_LANGUAGE).formatMessage("messages.INCORRECT_INCLUDE", {
          include: match[1],
        })
      );
  }

  for (const match of sourceCode.matchAll(includesQuotRegex)) {
    if (!INCLUDES_WHITELIST.includes(match[1]))
      throw new Error(
        I18n.locale(USER_LANGUAGE).formatMessage("messages.INCORRECT_INCLUDE", {
          include: match[1],
        })
      );
  }

  if (sourceCode.match(systemRegex))
    throw new Error(
      I18n.locale(USER_LANGUAGE).formatMessage("messages.INVALID_FUNCTION_CALL")
    );
};
