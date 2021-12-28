// File Extensions for Programming Languages
export const SubmissionFileExtensions = {
  C: "c",
};

export enum SubmissionStatus {
  COMPILATION_PENDING = "COMPILATION_PENDING",
  COMPILATION_ERROR = "COMPILATION_ERROR",
  CORRECT = "CORRECT",
  INCORRECT = "INCORRECT",
}

export const INCLUDES_WHITELIST = ["stdio.h", "math.h", "string.h"];
