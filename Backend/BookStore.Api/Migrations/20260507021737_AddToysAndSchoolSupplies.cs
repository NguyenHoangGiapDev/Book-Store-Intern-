using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BookStore.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddToysAndSchoolSupplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old foreign keys safely if they exist
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Books_BookCategories_CategoryId'
    ) THEN
        ALTER TABLE ""Books""
        DROP CONSTRAINT ""FK_Books_BookCategories_CategoryId"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Stationeries_BookCategories_CategoryId'
    ) THEN
        ALTER TABLE ""Stationeries""
        DROP CONSTRAINT ""FK_Stationeries_BookCategories_CategoryId"";
    END IF;
END $$;
");

            // Drop old primary key safely if it exists
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'PK_BookCategories'
    ) THEN
        ALTER TABLE ""BookCategories""
        DROP CONSTRAINT ""PK_BookCategories"";
    END IF;
END $$;
");

            // Drop ImageUrl columns safely if they exist
            migrationBuilder.Sql(@"ALTER TABLE ""ToyCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";");
            migrationBuilder.Sql(@"ALTER TABLE ""StationeryCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SouvenirCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";");
            migrationBuilder.Sql(@"ALTER TABLE ""SchoolSupplyCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";");
            migrationBuilder.Sql(@"ALTER TABLE ""AccessoryCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";");
            migrationBuilder.Sql(@"ALTER TABLE ""BookCategories"" DROP COLUMN IF EXISTS ""ImageUrl"";");

            // Rename BookCategories to Categories only if needed
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'BookCategories'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Categories'
    ) THEN
        ALTER TABLE ""BookCategories""
        RENAME TO ""Categories"";
    END IF;
END $$;
");

            // Add Type column to Stationeries safely
            migrationBuilder.Sql(@"ALTER TABLE ""Stationeries"" ADD COLUMN IF NOT EXISTS ""Type"" text;");

            // Make sure Categories has primary key
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Categories'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'PK_Categories'
    ) THEN
        ALTER TABLE ""Categories""
        ADD CONSTRAINT ""PK_Categories"" PRIMARY KEY (""Id"");
    END IF;
END $$;
");

            // Adjust Categories columns safely
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Categories'
        AND column_name = 'Name'
    ) THEN
        ALTER TABLE ""Categories""
        ALTER COLUMN ""Name"" TYPE character varying(100);
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Categories'
        AND column_name = 'Description'
    ) THEN
        ALTER TABLE ""Categories""
        ALTER COLUMN ""Description"" TYPE character varying(500);
    END IF;
END $$;
");

            migrationBuilder.CreateTable(
                name: "SchoolSupplies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Brand = table.Column<string>(type: "text", nullable: false),
                    Manufacturer = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchoolSupplies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SchoolSupplies_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Toys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Brand = table.Column<string>(type: "text", nullable: false),
                    Manufacturer = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Toys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Toys_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SchoolSupplies_CategoryId",
                table: "SchoolSupplies",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Toys_CategoryId",
                table: "Toys",
                column: "CategoryId");

            // Add new foreign keys safely
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Books_Categories_CategoryId'
    ) THEN
        ALTER TABLE ""Books""
        ADD CONSTRAINT ""FK_Books_Categories_CategoryId""
        FOREIGN KEY (""CategoryId"")
        REFERENCES ""Categories"" (""Id"")
        ON DELETE RESTRICT;
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Stationeries_Categories_CategoryId'
    ) THEN
        ALTER TABLE ""Stationeries""
        ADD CONSTRAINT ""FK_Stationeries_Categories_CategoryId""
        FOREIGN KEY (""CategoryId"")
        REFERENCES ""Categories"" (""Id"")
        ON DELETE RESTRICT;
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Books_Categories_CategoryId'
    ) THEN
        ALTER TABLE ""Books""
        DROP CONSTRAINT ""FK_Books_Categories_CategoryId"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Stationeries_Categories_CategoryId'
    ) THEN
        ALTER TABLE ""Stationeries""
        DROP CONSTRAINT ""FK_Stationeries_Categories_CategoryId"";
    END IF;
END $$;
");

            migrationBuilder.DropTable(
                name: "SchoolSupplies");

            migrationBuilder.DropTable(
                name: "Toys");

            migrationBuilder.Sql(@"ALTER TABLE ""Stationeries"" DROP COLUMN IF EXISTS ""Type"";");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'PK_Categories'
    ) THEN
        ALTER TABLE ""Categories""
        DROP CONSTRAINT ""PK_Categories"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Categories'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'BookCategories'
    ) THEN
        ALTER TABLE ""Categories""
        RENAME TO ""BookCategories"";
    END IF;
END $$;
");

            migrationBuilder.Sql(@"ALTER TABLE ""ToyCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);");
            migrationBuilder.Sql(@"ALTER TABLE ""StationeryCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);");
            migrationBuilder.Sql(@"ALTER TABLE ""SouvenirCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);");
            migrationBuilder.Sql(@"ALTER TABLE ""SchoolSupplyCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);");
            migrationBuilder.Sql(@"ALTER TABLE ""AccessoryCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" character varying(500);");
            migrationBuilder.Sql(@"ALTER TABLE ""BookCategories"" ADD COLUMN IF NOT EXISTS ""ImageUrl"" text;");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'BookCategories'
        AND column_name = 'Name'
    ) THEN
        ALTER TABLE ""BookCategories""
        ALTER COLUMN ""Name"" TYPE text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'BookCategories'
        AND column_name = 'Description'
    ) THEN
        ALTER TABLE ""BookCategories""
        ALTER COLUMN ""Description"" TYPE text;
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'BookCategories'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'PK_BookCategories'
    ) THEN
        ALTER TABLE ""BookCategories""
        ADD CONSTRAINT ""PK_BookCategories"" PRIMARY KEY (""Id"");
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Books_BookCategories_CategoryId'
    ) THEN
        ALTER TABLE ""Books""
        ADD CONSTRAINT ""FK_Books_BookCategories_CategoryId""
        FOREIGN KEY (""CategoryId"")
        REFERENCES ""BookCategories"" (""Id"")
        ON DELETE RESTRICT;
    END IF;
END $$;
");

            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Stationeries_BookCategories_CategoryId'
    ) THEN
        ALTER TABLE ""Stationeries""
        ADD CONSTRAINT ""FK_Stationeries_BookCategories_CategoryId""
        FOREIGN KEY (""CategoryId"")
        REFERENCES ""BookCategories"" (""Id"")
        ON DELETE RESTRICT;
    END IF;
END $$;
");
        }
    }
}