using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260702000004_FixManualQuantityServiceTypes")]
    public partial class FixManualQuantityServiceTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE DICH_VU
SET LOAI = N'Cần nhập số lượng'
WHERE LOAI = N'Nước'
  AND (DON_VI = N'Lần' OR DON_VI = N'Lan' OR DON_VI = N'lần' OR DON_VI = N'lan');
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
