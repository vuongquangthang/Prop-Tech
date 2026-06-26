using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class FixAssetCodeUniqueScope : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TAI_SAN_MA_TAI_SAN' AND object_id = OBJECT_ID(N'TAI_SAN'))
    DROP INDEX [IX_TAI_SAN_MA_TAI_SAN] ON [TAI_SAN];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TAI_SAN_OWNER_USER_ID_MA_TAI_SAN' AND object_id = OBJECT_ID(N'TAI_SAN'))
    DROP INDEX [IX_TAI_SAN_OWNER_USER_ID_MA_TAI_SAN] ON [TAI_SAN];

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TAI_SAN_OWNER_USER_ID_BUILDING_ID_MA_TAI_SAN' AND object_id = OBJECT_ID(N'TAI_SAN'))
    CREATE UNIQUE INDEX [IX_TAI_SAN_OWNER_USER_ID_BUILDING_ID_MA_TAI_SAN]
    ON [TAI_SAN] ([OWNER_USER_ID], [BUILDING_ID], [MA_TAI_SAN])
    WHERE [OWNER_USER_ID] IS NOT NULL AND [BUILDING_ID] IS NOT NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TAI_SAN_OWNER_USER_ID_BUILDING_ID_MA_TAI_SAN' AND object_id = OBJECT_ID(N'TAI_SAN'))
    DROP INDEX [IX_TAI_SAN_OWNER_USER_ID_BUILDING_ID_MA_TAI_SAN] ON [TAI_SAN];

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TAI_SAN_MA_TAI_SAN' AND object_id = OBJECT_ID(N'TAI_SAN'))
    CREATE UNIQUE INDEX [IX_TAI_SAN_MA_TAI_SAN] ON [TAI_SAN] ([MA_TAI_SAN]);
");
        }
    }
}
