using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BookStore.Api.Migrations
{
    public partial class AddUserAvatarUrl : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                ADD COLUMN IF NOT EXISTS ""AvatarUrl"" text;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE ""Users""
                DROP COLUMN IF EXISTS ""AvatarUrl"";
            ");
        }
    }
}