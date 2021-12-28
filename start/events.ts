/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
import Event from "@ioc:Adonis/Core/Event";
import Drive from "@ioc:Adonis/Core/Drive";
import Submission from "App/Models/Submission";
import { INCLUDES_WHITELIST, SubmissionStatus } from "../config/exsub";
import Application from "@ioc:Adonis/Core/Application";

import { execSync, execFileSync } from "child_process";

interface TestResult {
  result: boolean;
  expected_out: string;
  student_out: string;
}

interface TestCase {
  inFile: string;
  outFile: string;
}

Event.on("saved:source_code", async (submission: Submission) => {
  const mainFilePath = Application.tmpPath(
    `compilation/${submission.userId}_${submission.exerciseList}_${submission.exercise}`
  );

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
  } catch (err) {
    submission.status = SubmissionStatus.COMPILATION_ERROR;
    submission.statusMessage = err
      .toString()
      .replace(Application.tmpPath(), "");
    await submission.save();
  } finally {
    Drive.delete(mainFilePath);
  }

  if (results.every((result) => result.result)) {
    submission.status = SubmissionStatus.CORRECT;
    submission.statusMessage = "all tests passed";
    await submission.save();
  } else {
    submission.status = SubmissionStatus.INCORRECT;
    submission.statusMessage = results.toString();
    await submission.save();
  }

  console.log(submission);

  //return submission;
});

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
      throw new Error("Invalid include: " + match[1]);
  }

  for (const match of sourceCode.matchAll(includesQuotRegex)) {
    if (!INCLUDES_WHITELIST.includes(match[1]))
      throw new Error("Invalid include: " + match[1]);
  }

  if (sourceCode.match(systemRegex))
    throw new Error('Invalid function call: system("...")');
};
