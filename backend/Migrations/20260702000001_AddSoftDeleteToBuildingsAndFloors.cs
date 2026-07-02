using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddSoftDeleteToBuildingsAndFloors : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IS_DELETED",
                table: "TOA_NHA",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IS_DELETED",
                table: "TANG",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TOA_NHA_TEN_TOA_NHA' AND object_id = OBJECT_ID(N'[TOA_NHA]'))
    DROP INDEX IX_TOA_NHA_TEN_TOA_NHA ON TOA_NHA;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA' AND object_id = OBJECT_ID(N'[TOA_NHA]'))
    DROP INDEX IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA ON TOA_NHA;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TANG_TOA_NHA_ID_SO_TANG' AND object_id = OBJECT_ID(N'[TANG]'))
    DROP INDEX IX_TANG_TOA_NHA_ID_SO_TANG ON TANG;
");

            migrationBuilder.CreateIndex(
                name: "IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA_ACTIVE",
                table: "TOA_NHA",
                columns: new[] { "OWNER_USER_ID", "TEN_TOA_NHA" },
                unique: true,
                filter: "[IS_DELETED] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_TANG_TOA_NHA_ID_SO_TANG_ACTIVE",
                table: "TANG",
                columns: new[] { "TOA_NHA_ID", "SO_TANG" },
                unique: true,
                filter: "[IS_DELETED] = 0");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA_ACTIVE",
                table: "TOA_NHA");

            migrationBuilder.DropIndex(
                name: "IX_TANG_TOA_NHA_ID_SO_TANG_ACTIVE",
                table: "TANG");

            migrationBuilder.DropColumn(
                name: "IS_DELETED",
                table: "TOA_NHA");

            migrationBuilder.DropColumn(
                name: "IS_DELETED",
                table: "TANG");

            migrationBuilder.CreateIndex(
                name: "IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA",
                table: "TOA_NHA",
                columns: new[] { "OWNER_USER_ID", "TEN_TOA_NHA" },
                unique: true,
                filter: "[OWNER_USER_ID] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TANG_TOA_NHA_ID_SO_TANG",
                table: "TANG",
                columns: new[] { "TOA_NHA_ID", "SO_TANG" },
                unique: true);
        }
    }
}
