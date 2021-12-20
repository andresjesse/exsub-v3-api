import { BaseCommand, args, flags } from "@adonisjs/core/build/standalone";

export default class CreateUser extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = "create:user";

  @args.string({ description: "User email (unique)" })
  public email: string;

  @args.string({ description: "User password" })
  public password: string;

  @flags.boolean({ description: "Is Administrator?" })
  public isAdmin: boolean;

  /**
   * Command description is displayed in the "help" output
   */
  public static description = "Create an User from CLI";

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  };

  public async run() {
    const { default: User } = await import("App/Models/User");

    await User.create({
      email: this.email,
      password: this.password,
      isAdmin: this.isAdmin || false,
    });

    this.logger.info("User created!");
  }
}
