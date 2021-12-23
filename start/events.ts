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
import Submission from "App/Models/Submission";

Event.on("saved:source_code", (submission: Submission) => {
  console.log(submission.filePath);
});
