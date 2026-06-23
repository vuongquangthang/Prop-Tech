using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260619000001_AddRoomServicePricesJson")]
    public partial class AddRoomServicePricesJson : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GIA_DICH_VU_JSON",
                table: "PHONG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GIA_DICH_VU_JSON",
                table: "PHONG");
        }
    }
}
