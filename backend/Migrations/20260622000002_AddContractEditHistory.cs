using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260622000002_AddContractEditHistory")]
    public partial class AddContractEditHistory : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CAP_NHAT_LUC",
                table: "HOP_DONG",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LICH_SU_CHINH_SUA_HOP_DONG",
                columns: table => new
                {
                    LICH_SU_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HOP_DONG_ID = table.Column<int>(type: "int", nullable: false),
                    PHIEN_BAN = table.Column<int>(type: "int", nullable: false),
                    TOM_TAT = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DU_LIEU_JSON = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CAP_NHAT_BOI_ID = table.Column<int>(type: "int", nullable: true),
                    TEN_NGUOI_CAP_NHAT = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CAP_NHAT_LUC = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICH_SU_CHINH_SUA_HOP_DONG", x => x.LICH_SU_ID);
                    table.ForeignKey(
                        name: "FK_LICH_SU_CHINH_SUA_HOP_DONG_HOP_DONG_HOP_DONG_ID",
                        column: x => x.HOP_DONG_ID,
                        principalTable: "HOP_DONG",
                        principalColumn: "HOP_DONG_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LICH_SU_CHINH_SUA_HOP_DONG_HOP_DONG_ID_PHIEN_BAN",
                table: "LICH_SU_CHINH_SUA_HOP_DONG",
                columns: new[] { "HOP_DONG_ID", "PHIEN_BAN" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "LICH_SU_CHINH_SUA_HOP_DONG");
            migrationBuilder.DropColumn(name: "CAP_NHAT_LUC", table: "HOP_DONG");
        }
    }
}
