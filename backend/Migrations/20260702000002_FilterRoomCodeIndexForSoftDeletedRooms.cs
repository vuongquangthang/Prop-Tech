using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class FilterRoomCodeIndexForSoftDeletedRooms : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PHONG_MA_PHONG' AND object_id = OBJECT_ID(N'[PHONG]'))
    DROP INDEX IX_PHONG_MA_PHONG ON PHONG;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PHONG_TANG_ID_MA_PHONG' AND object_id = OBJECT_ID(N'[PHONG]'))
    DROP INDEX IX_PHONG_TANG_ID_MA_PHONG ON PHONG;
");

            migrationBuilder.CreateIndex(
                name: "IX_PHONG_TANG_ID_MA_PHONG_ACTIVE",
                table: "PHONG",
                columns: new[] { "TANG_ID", "MA_PHONG" },
                unique: true,
                filter: "[TRANG_THAI] <> N'Đã xóa'");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PHONG_TANG_ID_MA_PHONG_ACTIVE",
                table: "PHONG");

            migrationBuilder.CreateIndex(
                name: "IX_PHONG_TANG_ID_MA_PHONG",
                table: "PHONG",
                columns: new[] { "TANG_ID", "MA_PHONG" },
                unique: true);
        }
    }
}
