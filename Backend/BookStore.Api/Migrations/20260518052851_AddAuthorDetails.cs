using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""AuthorCategories"" ADD COLUMN IF NOT EXISTS ""PenName"" text;
                ALTER TABLE ""AuthorCategories"" ADD COLUMN IF NOT EXISTS ""Hometown"" text;
                ALTER TABLE ""AuthorCategories"" ADD COLUMN IF NOT EXISTS ""BirthDate"" timestamp with time zone;
                ALTER TABLE ""AuthorCategories"" ADD COLUMN IF NOT EXISTS ""Nationality"" text;
                ALTER TABLE ""AuthorCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" text;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""AuthorCategories"" DROP COLUMN IF EXISTS ""PenName"";
                ALTER TABLE ""AuthorCategories"" DROP COLUMN IF EXISTS ""Hometown"";
                ALTER TABLE ""AuthorCategories"" DROP COLUMN IF EXISTS ""BirthDate"";
                ALTER TABLE ""AuthorCategories"" DROP COLUMN IF EXISTS ""Nationality"";
                ALTER TABLE ""AuthorCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";
            ");
        }
    }
}
