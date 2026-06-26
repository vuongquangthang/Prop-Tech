using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class AddBuildingScopeTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DICH_VU_TOA_NHA",
                columns: table => new
                {
                    DICH_VU_ID = table.Column<int>(type: "int", nullable: false),
                    TOA_NHA_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DICH_VU_TOA_NHA", x => new { x.DICH_VU_ID, x.TOA_NHA_ID });
                    table.ForeignKey(
                        name: "FK_DICH_VU_TOA_NHA_DICH_VU_DICH_VU_ID",
                        column: x => x.DICH_VU_ID,
                        principalTable: "DICH_VU",
                        principalColumn: "DICH_VU_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DICH_VU_TOA_NHA_TOA_NHA_TOA_NHA_ID",
                        column: x => x.TOA_NHA_ID,
                        principalTable: "TOA_NHA",
                        principalColumn: "TOA_NHA_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TAI_SAN_TOA_NHA",
                columns: table => new
                {
                    TAI_SAN_ID = table.Column<int>(type: "int", nullable: false),
                    TOA_NHA_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TAI_SAN_TOA_NHA", x => new { x.TAI_SAN_ID, x.TOA_NHA_ID });
                    table.ForeignKey(
                        name: "FK_TAI_SAN_TOA_NHA_TAI_SAN_TAI_SAN_ID",
                        column: x => x.TAI_SAN_ID,
                        principalTable: "TAI_SAN",
                        principalColumn: "TAI_SAN_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TAI_SAN_TOA_NHA_TOA_NHA_TOA_NHA_ID",
                        column: x => x.TOA_NHA_ID,
                        principalTable: "TOA_NHA",
                        principalColumn: "TOA_NHA_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DICH_VU_TOA_NHA_TOA_NHA_ID",
                table: "DICH_VU_TOA_NHA",
                column: "TOA_NHA_ID");

            migrationBuilder.CreateIndex(
                name: "IX_TAI_SAN_TOA_NHA_TOA_NHA_ID",
                table: "TAI_SAN_TOA_NHA",
                column: "TOA_NHA_ID");

            migrationBuilder.Sql(@"
INSERT INTO [DICH_VU_TOA_NHA] ([DICH_VU_ID], [TOA_NHA_ID])
SELECT [DICH_VU_ID], [BUILDING_ID]
FROM [DICH_VU]
WHERE [BUILDING_ID] IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM [DICH_VU_TOA_NHA] s
      WHERE s.[DICH_VU_ID] = [DICH_VU].[DICH_VU_ID]
        AND s.[TOA_NHA_ID] = [DICH_VU].[BUILDING_ID]
  );

INSERT INTO [TAI_SAN_TOA_NHA] ([TAI_SAN_ID], [TOA_NHA_ID])
SELECT [TAI_SAN_ID], [BUILDING_ID]
FROM [TAI_SAN]
WHERE [BUILDING_ID] IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM [TAI_SAN_TOA_NHA] s
      WHERE s.[TAI_SAN_ID] = [TAI_SAN].[TAI_SAN_ID]
        AND s.[TOA_NHA_ID] = [TAI_SAN].[BUILDING_ID]
  );
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DICH_VU_TOA_NHA");
            migrationBuilder.DropTable(name: "TAI_SAN_TOA_NHA");
        }
    }
}
