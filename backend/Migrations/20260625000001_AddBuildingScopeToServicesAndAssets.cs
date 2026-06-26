using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddBuildingScopeToServicesAndAssets : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BUILDING_ID",
                table: "TAI_SAN",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BUILDING_ID",
                table: "DICH_VU",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TAI_SAN_BUILDING_ID",
                table: "TAI_SAN",
                column: "BUILDING_ID");

            migrationBuilder.CreateIndex(
                name: "IX_DICH_VU_BUILDING_ID",
                table: "DICH_VU",
                column: "BUILDING_ID");

            migrationBuilder.AddForeignKey(
                name: "FK_DICH_VU_TOA_NHA_BUILDING_ID",
                table: "DICH_VU",
                column: "BUILDING_ID",
                principalTable: "TOA_NHA",
                principalColumn: "TOA_NHA_ID");

            migrationBuilder.AddForeignKey(
                name: "FK_TAI_SAN_TOA_NHA_BUILDING_ID",
                table: "TAI_SAN",
                column: "BUILDING_ID",
                principalTable: "TOA_NHA",
                principalColumn: "TOA_NHA_ID");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DICH_VU_TOA_NHA_BUILDING_ID",
                table: "DICH_VU");

            migrationBuilder.DropForeignKey(
                name: "FK_TAI_SAN_TOA_NHA_BUILDING_ID",
                table: "TAI_SAN");

            migrationBuilder.DropIndex(
                name: "IX_TAI_SAN_BUILDING_ID",
                table: "TAI_SAN");

            migrationBuilder.DropIndex(
                name: "IX_DICH_VU_BUILDING_ID",
                table: "DICH_VU");

            migrationBuilder.DropColumn(
                name: "BUILDING_ID",
                table: "TAI_SAN");

            migrationBuilder.DropColumn(
                name: "BUILDING_ID",
                table: "DICH_VU");

        }
    }
}
