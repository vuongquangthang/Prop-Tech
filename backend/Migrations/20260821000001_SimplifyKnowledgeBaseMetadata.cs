using backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260821000001_SimplifyKnowledgeBaseMetadata")]
    [DbContext(typeof(ApplicationDbContext))]
    public partial class SimplifyKnowledgeBaseMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KNOWLEDGE_BASE_USER_UPDATED_BY",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropIndex(
                name: "IX_KNOWLEDGE_BASE_UPDATED_BY",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.AddColumn<DateTime>(
                name: "CREATED_AT",
                table: "KNOWLEDGE_BASE",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<string>(
                name: "FILE_URL",
                table: "KNOWLEDGE_BASE",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TEN_FILE",
                table: "KNOWLEDGE_BASE",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
UPDATE ""KNOWLEDGE_BASE""
SET ""TEN_FILE"" = COALESCE(NULLIF(""TIEU_DE"", ''), CONCAT('knowledge-', ""KB_ID"", '.txt')),
    ""FILE_URL"" = ''
WHERE ""TEN_FILE"" = '';
");

            migrationBuilder.DropColumn(
                name: "IS_ACTIVE",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "NOI_DUNG",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "TAGS",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "THE_LOAI",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "TIEU_DE",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "UPDATED_AT",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "UPDATED_BY",
                table: "KNOWLEDGE_BASE");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IS_ACTIVE",
                table: "KNOWLEDGE_BASE",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "NOI_DUNG",
                table: "KNOWLEDGE_BASE",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TAGS",
                table: "KNOWLEDGE_BASE",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "THE_LOAI",
                table: "KNOWLEDGE_BASE",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TIEU_DE",
                table: "KNOWLEDGE_BASE",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UPDATED_AT",
                table: "KNOWLEDGE_BASE",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<int>(
                name: "UPDATED_BY",
                table: "KNOWLEDGE_BASE",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""KNOWLEDGE_BASE""
SET ""TIEU_DE"" = COALESCE(NULLIF(""TEN_FILE"", ''), CONCAT('knowledge-', ""KB_ID"")),
    ""NOI_DUNG"" = COALESCE(""FILE_URL"", ''),
    ""UPDATED_AT"" = ""CREATED_AT"";
");

            migrationBuilder.DropColumn(
                name: "CREATED_AT",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "FILE_URL",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.DropColumn(
                name: "TEN_FILE",
                table: "KNOWLEDGE_BASE");

            migrationBuilder.CreateIndex(
                name: "IX_KNOWLEDGE_BASE_UPDATED_BY",
                table: "KNOWLEDGE_BASE",
                column: "UPDATED_BY");

            migrationBuilder.AddForeignKey(
                name: "FK_KNOWLEDGE_BASE_USER_UPDATED_BY",
                table: "KNOWLEDGE_BASE",
                column: "UPDATED_BY",
                principalTable: "USER",
                principalColumn: "USER_ID",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
