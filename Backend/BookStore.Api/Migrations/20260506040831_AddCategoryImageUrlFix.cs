using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryImageUrlFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add ImageUrl column to BookCategories only if it does not exist
            migrationBuilder.Sql(@"
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'BookCategories' AND column_name = 'ImageUrl'
        ) THEN
            ALTER TABLE ""BookCategories"" ADD COLUMN ""ImageUrl"" text;
        END IF;
    END
    $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
