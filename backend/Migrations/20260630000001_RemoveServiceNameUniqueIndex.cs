using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class RemoveServiceNameUniqueIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DECLARE @indexName sysname;

SELECT TOP 1 @indexName = i.[name]
FROM sys.indexes i
JOIN sys.index_columns ic1 ON ic1.[object_id] = i.[object_id] AND ic1.[index_id] = i.[index_id]
JOIN sys.columns c1 ON c1.[object_id] = ic1.[object_id] AND c1.[column_id] = ic1.[column_id]
JOIN sys.index_columns ic2 ON ic2.[object_id] = i.[object_id] AND ic2.[index_id] = i.[index_id]
JOIN sys.columns c2 ON c2.[object_id] = ic2.[object_id] AND c2.[column_id] = ic2.[column_id]
WHERE i.[object_id] = OBJECT_ID(N'[DICH_VU]')
  AND i.[is_unique] = 1
  AND c1.[name] = N'OWNER_USER_ID'
  AND c2.[name] = N'TEN_DICH_VU';

IF @indexName IS NOT NULL
BEGIN
    EXEC(N'DROP INDEX [' + @indexName + N'] ON [DICH_VU]');
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_DICH_VU_OWNER_USER_ID_TEN_DICH_VU",
                table: "DICH_VU",
                columns: new[] { "OWNER_USER_ID", "TEN_DICH_VU" },
                unique: true,
                filter: "[OWNER_USER_ID] IS NOT NULL");
        }
    }
}
