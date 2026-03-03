using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "REFRESH_TOKEN",
                table: "USER",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "REFRESH_TOKEN_EXPIRY_TIME",
                table: "USER",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "REFRESH_TOKEN",
                table: "USER");

            migrationBuilder.DropColumn(
                name: "REFRESH_TOKEN_EXPIRY_TIME",
                table: "USER");
        }
    }
}
