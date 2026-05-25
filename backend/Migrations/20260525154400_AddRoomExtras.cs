using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260525154400_AddRoomExtras")]
    public partial class AddRoomExtras : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LOAI_PHONG",
                table: "PHONG",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "single");

            migrationBuilder.AddColumn<bool>(
                name: "CO_VE_SINH_KHEP_KIN",
                table: "PHONG",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SO_PHONG_KHACH",
                table: "PHONG",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SO_PHONG_NGU",
                table: "PHONG",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SO_PHONG_BEP",
                table: "PHONG",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SO_PHONG_VE_SINH",
                table: "PHONG",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ANH_PHONG_JSON",
                table: "PHONG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "TIEN_NGHI_JSON",
                table: "PHONG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "DICH_VU_JSON",
                table: "PHONG",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DICH_VU_JSON",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "TIEN_NGHI_JSON",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "ANH_PHONG_JSON",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "SO_PHONG_VE_SINH",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "SO_PHONG_BEP",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "SO_PHONG_NGU",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "SO_PHONG_KHACH",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "CO_VE_SINH_KHEP_KIN",
                table: "PHONG");

            migrationBuilder.DropColumn(
                name: "LOAI_PHONG",
                table: "PHONG");
        }
    }
}
