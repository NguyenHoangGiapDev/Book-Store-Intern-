using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Books_Categories_CategoryId",
                table: "Books");

            migrationBuilder.DropForeignKey(
                name: "FK_Stationeries_Categories_CategoryId",
                table: "Stationeries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Categories",
                table: "Categories");

            // If BookCategories already exists (e.g. created manually or by other migration), skip rename
            migrationBuilder.Sql(@"DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c WHERE c.relname = 'BookCategories' AND pg_catalog.pg_table_is_visible(c.oid)
    ) THEN
        ALTER TABLE ""Categories"" RENAME TO ""BookCategories"";
    END IF;
END
$$;");

            // Add IsActive column to Users only if it does not exist
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'IsActive'
    ) THEN
        ALTER TABLE ""Users"" ADD COLUMN ""IsActive"" boolean NOT NULL DEFAULT FALSE;
    END IF;
END
$$;");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Stationeries",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Stationeries",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Books",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Books",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "BookCategories",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "BookCategories",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            // Add primary key if table does not already have a primary key (check by contype='p')
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conrelid = '""BookCategories""'::regclass AND contype = 'p'
    ) THEN
        ALTER TABLE ""BookCategories"" ADD CONSTRAINT ""PK_BookCategories"" PRIMARY KEY (""Id"");
    END IF;
END
$$;");

            // Add foreign keys, ignore errors if they already exist
            migrationBuilder.Sql(@"
DO $$
BEGIN
    BEGIN
        ALTER TABLE ""Books"" ADD CONSTRAINT ""FK_Books_BookCategories_CategoryId"" FOREIGN KEY (""CategoryId"") REFERENCES ""BookCategories""(""Id"") ON DELETE RESTRICT;
    EXCEPTION WHEN OTHERS THEN
        -- ignore if constraint exists
        NULL;
    END;

    BEGIN
        ALTER TABLE ""Stationeries"" ADD CONSTRAINT ""FK_Stationeries_BookCategories_CategoryId"" FOREIGN KEY (""CategoryId"") REFERENCES ""BookCategories""(""Id"") ON DELETE RESTRICT;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END
$$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Books_BookCategories_CategoryId",
                table: "Books");

            migrationBuilder.DropForeignKey(
                name: "FK_Stationeries_BookCategories_CategoryId",
                table: "Stationeries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BookCategories",
                table: "BookCategories");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.RenameTable(
                name: "BookCategories",
                newName: "Categories");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Stationeries",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Stationeries",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "Books",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Books",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Categories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Categories",
                table: "Categories",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Books_Categories_CategoryId",
                table: "Books",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Stationeries_Categories_CategoryId",
                table: "Stationeries",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
