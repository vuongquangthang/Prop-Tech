using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    [Migration("20260608000001_AddNotificationOwnerUserId")]
    public partial class AddNotificationOwnerUserId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "owner_user_id",
                table: "notifications",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE n
                SET owner_user_id = COALESCE(
                    recipient.OWNER_USER_ID,
                    recipient.USER_ID,
                    sender.OWNER_USER_ID,
                    sender.USER_ID
                )
                FROM notifications AS n
                LEFT JOIN [USER] AS recipient ON n.recipient_id = recipient.USER_ID
                LEFT JOIN [USER] AS sender ON n.user_id = sender.USER_ID
                WHERE n.owner_user_id IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_owner_user_id",
                table: "notifications",
                column: "owner_user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_USER_owner_user_id",
                table: "notifications",
                column: "owner_user_id",
                principalTable: "USER",
                principalColumn: "USER_ID",
                onDelete: ReferentialAction.NoAction);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notifications_USER_owner_user_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "IX_notifications_owner_user_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "owner_user_id",
                table: "notifications");
        }
    }
}
