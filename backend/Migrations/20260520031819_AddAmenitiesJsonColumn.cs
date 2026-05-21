using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddAmenitiesJsonColumn : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TIEN_NGHI_JSON",
                table: "BAI_DANG_TIM_PHONG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TIEN_NGHI_JSON",
                table: "BAI_DANG_TIM_PHONG");
        }
    }
}
