using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Create Full-Text Catalog
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ft_catalog')
                BEGIN
                    CREATE FULLTEXT CATALOG ft_catalog AS DEFAULT;
                END
            ");

            // Step 2: Create Full-Text Index for FAQs table
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('faqs'))
                BEGIN
                    CREATE FULLTEXT INDEX ON faqs(question, answer, keywords)
                    KEY INDEX PK_faqs
                    ON ft_catalog
                    WITH STOPLIST = SYSTEM, CHANGE_TRACKING AUTO;
                END
            ");

            // Step 3: Create Full-Text Index for Regulations table
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('regulations'))
                BEGIN
                    CREATE FULLTEXT INDEX ON regulations(title, content)
                    KEY INDEX PK_regulations
                    ON ft_catalog
                    WITH STOPLIST = SYSTEM, CHANGE_TRACKING AUTO;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop Full-Text Index from Regulations
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('regulations'))
                BEGIN
                    DROP FULLTEXT INDEX ON regulations;
                END
            ");

            // Drop Full-Text Index from FAQs
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('faqs'))
                BEGIN
                    DROP FULLTEXT INDEX ON faqs;
                END
            ");

            // Drop Full-Text Catalog
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ft_catalog')
                BEGIN
                    DROP FULLTEXT CATALOG ft_catalog;
                END
            ");
        }
    }
}
