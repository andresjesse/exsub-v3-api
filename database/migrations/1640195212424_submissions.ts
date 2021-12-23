import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class Submissions extends BaseSchema {
  protected tableName = "submissions";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id").primary();

      table
        .integer("user_id")
        .unsigned()
        .references("users.id")
        .onDelete("CASCADE"); // delete submission when user is deleted

      table.string("file_path").notNullable().unique();
      table.string("exercise").notNullable();
      table.string("exercise_list").notNullable();
      table.string("status");
      table.string("programming_lang").notNullable();
      table.string("originalfile_md5");

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
