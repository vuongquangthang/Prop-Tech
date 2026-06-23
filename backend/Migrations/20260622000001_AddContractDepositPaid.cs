using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260622000001_AddContractDepositPaid")]
    public partial class AddContractDepositPaid : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "DA_NOP_TIEN_COC",
                table: "HOP_DONG",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DA_NOP_TIEN_COC",
                table: "HOP_DONG");
        }
    }
}
