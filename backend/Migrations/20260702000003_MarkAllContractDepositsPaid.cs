using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260702000003_MarkAllContractDepositsPaid")]
    public partial class MarkAllContractDepositsPaid : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE HOP_DONG SET DA_NOP_TIEN_COC = 1 WHERE DA_NOP_TIEN_COC = 0");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
