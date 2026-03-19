using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddContractBillingFormula : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CONG_THUC_HOA_DON_JSON",
                table: "HOP_DONG",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NGAY_THANH_TOAN_HANG_THANG",
                table: "HOP_DONG",
                type: "int",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CONG_THUC_HOA_DON_JSON",
                table: "HOP_DONG");

            migrationBuilder.DropColumn(
                name: "NGAY_THANH_TOAN_HANG_THANG",
                table: "HOP_DONG");
        }
    }
}
