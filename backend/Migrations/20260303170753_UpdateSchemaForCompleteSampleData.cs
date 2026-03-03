using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchemaForCompleteSampleData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CHI_TIET_PHIEU_TAT_TOAN_TAT_TOAN_TAT_TOAN_ID",
                table: "CHI_TIET_PHIEU_TAT_TOAN");

            migrationBuilder.DropForeignKey(
                name: "FK_TAT_TOAN_HOP_DONG_HOP_DONG_ID",
                table: "TAT_TOAN");

            migrationBuilder.DropForeignKey(
                name: "FK_THANH_TOAN_TAT_TOAN_TAT_TOAN_ID",
                table: "THANH_TOAN");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TAT_TOAN",
                table: "TAT_TOAN");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CHI_TIET_PHIEU_TAT_TOAN",
                table: "CHI_TIET_PHIEU_TAT_TOAN");

            migrationBuilder.DropColumn(
                name: "GHI_CHU",
                table: "TAT_TOAN");

            migrationBuilder.DropColumn(
                name: "PDF_URL",
                table: "TAT_TOAN");

            migrationBuilder.DropColumn(
                name: "TONG_CONG",
                table: "TAT_TOAN");

            migrationBuilder.DropColumn(
                name: "LOAI_KHOAN",
                table: "CHI_TIET_PHIEU_TAT_TOAN");

            migrationBuilder.RenameTable(
                name: "TAT_TOAN",
                newName: "TatToan");

            migrationBuilder.RenameTable(
                name: "CHI_TIET_PHIEU_TAT_TOAN",
                newName: "ChiTietPhieuTatToan");

            migrationBuilder.RenameColumn(
                name: "NGAY_TAT_TOAN",
                table: "TatToan",
                newName: "SettlementDate");

            migrationBuilder.RenameColumn(
                name: "TAT_TOAN_ID",
                table: "TatToan",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "HOP_DONG_ID",
                table: "TatToan",
                newName: "ResidencyId");

            migrationBuilder.RenameIndex(
                name: "IX_TAT_TOAN_HOP_DONG_ID",
                table: "TatToan",
                newName: "IX_TatToan_ResidencyId");

            migrationBuilder.RenameColumn(
                name: "TAT_TOAN_ID",
                table: "ChiTietPhieuTatToan",
                newName: "SettlementId");

            migrationBuilder.RenameColumn(
                name: "SO_TIEN",
                table: "ChiTietPhieuTatToan",
                newName: "Amount");

            migrationBuilder.RenameColumn(
                name: "MO_TA",
                table: "ChiTietPhieuTatToan",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "CHI_TIET_ID",
                table: "ChiTietPhieuTatToan",
                newName: "Id");

            migrationBuilder.RenameIndex(
                name: "IX_CHI_TIET_PHIEU_TAT_TOAN_TAT_TOAN_ID",
                table: "ChiTietPhieuTatToan",
                newName: "IX_ChiTietPhieuTatToan_SettlementId");

            migrationBuilder.AddColumn<string>(
                name: "COMPLETION_IMAGE_URL",
                table: "YEU_CAU_SUA_CHUA",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "PAID_AT",
                table: "THANH_TOAN",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<DateTime>(
                name: "CREATED_AT",
                table: "THANH_TOAN",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "STATUS",
                table: "THANH_TOAN",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "APPROVED_AT",
                table: "HOA_DON",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "APPROVED_BY",
                table: "HOA_DON",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "REJECTED_REASON",
                table: "HOA_DON",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Compensation",
                table: "TatToan",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "TatToan",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "Deductions",
                table: "TatToan",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DepositRefund",
                table: "TatToan",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerSignature",
                table: "TatToan",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OutstandingDebt",
                table: "TatToan",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResidentSignature",
                table: "TatToan",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "TatToan",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalSettlement",
                table: "TatToan",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "TatToan",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "ChiTietPhieuTatToan",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ChiTietPhieuTatToan",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ChiTietPhieuTatToan",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "ChiTietPhieuTatToan",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_TatToan",
                table: "TatToan",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ChiTietPhieuTatToan",
                table: "ChiTietPhieuTatToan",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_HOA_DON_APPROVED_BY",
                table: "HOA_DON",
                column: "APPROVED_BY");

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietPhieuTatToan_TatToan_SettlementId",
                table: "ChiTietPhieuTatToan",
                column: "SettlementId",
                principalTable: "TatToan",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_HOA_DON_USER_APPROVED_BY",
                table: "HOA_DON",
                column: "APPROVED_BY",
                principalTable: "USER",
                principalColumn: "USER_ID");

            migrationBuilder.AddForeignKey(
                name: "FK_TatToan_HOP_DONG_ResidencyId",
                table: "TatToan",
                column: "ResidencyId",
                principalTable: "HOP_DONG",
                principalColumn: "HOP_DONG_ID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_THANH_TOAN_TatToan_TAT_TOAN_ID",
                table: "THANH_TOAN",
                column: "TAT_TOAN_ID",
                principalTable: "TatToan",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietPhieuTatToan_TatToan_SettlementId",
                table: "ChiTietPhieuTatToan");

            migrationBuilder.DropForeignKey(
                name: "FK_HOA_DON_USER_APPROVED_BY",
                table: "HOA_DON");

            migrationBuilder.DropForeignKey(
                name: "FK_TatToan_HOP_DONG_ResidencyId",
                table: "TatToan");

            migrationBuilder.DropForeignKey(
                name: "FK_THANH_TOAN_TatToan_TAT_TOAN_ID",
                table: "THANH_TOAN");

            migrationBuilder.DropIndex(
                name: "IX_HOA_DON_APPROVED_BY",
                table: "HOA_DON");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TatToan",
                table: "TatToan");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ChiTietPhieuTatToan",
                table: "ChiTietPhieuTatToan");

            migrationBuilder.DropColumn(
                name: "COMPLETION_IMAGE_URL",
                table: "YEU_CAU_SUA_CHUA");

            migrationBuilder.DropColumn(
                name: "CREATED_AT",
                table: "THANH_TOAN");

            migrationBuilder.DropColumn(
                name: "STATUS",
                table: "THANH_TOAN");

            migrationBuilder.DropColumn(
                name: "APPROVED_AT",
                table: "HOA_DON");

            migrationBuilder.DropColumn(
                name: "APPROVED_BY",
                table: "HOA_DON");

            migrationBuilder.DropColumn(
                name: "REJECTED_REASON",
                table: "HOA_DON");

            migrationBuilder.DropColumn(
                name: "Compensation",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "Deductions",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "DepositRefund",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "ManagerSignature",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "OutstandingDebt",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "ResidentSignature",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "TotalSettlement",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "TatToan");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ChiTietPhieuTatToan");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "ChiTietPhieuTatToan");

            migrationBuilder.RenameTable(
                name: "TatToan",
                newName: "TAT_TOAN");

            migrationBuilder.RenameTable(
                name: "ChiTietPhieuTatToan",
                newName: "CHI_TIET_PHIEU_TAT_TOAN");

            migrationBuilder.RenameColumn(
                name: "SettlementDate",
                table: "TAT_TOAN",
                newName: "NGAY_TAT_TOAN");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "TAT_TOAN",
                newName: "TAT_TOAN_ID");

            migrationBuilder.RenameColumn(
                name: "ResidencyId",
                table: "TAT_TOAN",
                newName: "HOP_DONG_ID");

            migrationBuilder.RenameIndex(
                name: "IX_TatToan_ResidencyId",
                table: "TAT_TOAN",
                newName: "IX_TAT_TOAN_HOP_DONG_ID");

            migrationBuilder.RenameColumn(
                name: "SettlementId",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                newName: "TAT_TOAN_ID");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                newName: "MO_TA");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                newName: "SO_TIEN");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                newName: "CHI_TIET_ID");

            migrationBuilder.RenameIndex(
                name: "IX_ChiTietPhieuTatToan_SettlementId",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                newName: "IX_CHI_TIET_PHIEU_TAT_TOAN_TAT_TOAN_ID");

            migrationBuilder.AlterColumn<DateTime>(
                name: "PAID_AT",
                table: "THANH_TOAN",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GHI_CHU",
                table: "TAT_TOAN",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PDF_URL",
                table: "TAT_TOAN",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TONG_CONG",
                table: "TAT_TOAN",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "MO_TA",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "SO_TIEN",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LOAI_KHOAN",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TAT_TOAN",
                table: "TAT_TOAN",
                column: "TAT_TOAN_ID");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CHI_TIET_PHIEU_TAT_TOAN",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                column: "CHI_TIET_ID");

            migrationBuilder.AddForeignKey(
                name: "FK_CHI_TIET_PHIEU_TAT_TOAN_TAT_TOAN_TAT_TOAN_ID",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                column: "TAT_TOAN_ID",
                principalTable: "TAT_TOAN",
                principalColumn: "TAT_TOAN_ID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TAT_TOAN_HOP_DONG_HOP_DONG_ID",
                table: "TAT_TOAN",
                column: "HOP_DONG_ID",
                principalTable: "HOP_DONG",
                principalColumn: "HOP_DONG_ID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_THANH_TOAN_TAT_TOAN_TAT_TOAN_ID",
                table: "THANH_TOAN",
                column: "TAT_TOAN_ID",
                principalTable: "TAT_TOAN",
                principalColumn: "TAT_TOAN_ID");
        }
    }
}
