using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddServicePriceHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "NGAY_AP_DUNG",
                table: "DICH_VU",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LICH_SU_GIA_DICH_VU",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DICH_VU_ID = table.Column<int>(type: "int", nullable: false),
                    GIA_CU = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    GIA_MOI = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    NGAY_AP_DUNG = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LY_DO = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    NGAY_THAY_DOI = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICH_SU_GIA_DICH_VU", x => x.ID);
                    table.ForeignKey(
                        name: "FK_LICH_SU_GIA_DICH_VU_DICH_VU_DICH_VU_ID",
                        column: x => x.DICH_VU_ID,
                        principalTable: "DICH_VU",
                        principalColumn: "DICH_VU_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LICH_SU_GIA_DICH_VU_DICH_VU_ID",
                table: "LICH_SU_GIA_DICH_VU",
                column: "DICH_VU_ID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LICH_SU_GIA_DICH_VU");

            migrationBuilder.DropColumn(
                name: "NGAY_AP_DUNG",
                table: "DICH_VU");
        }
    }
}
