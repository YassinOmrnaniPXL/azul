using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Azul.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingUserFields_Take2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Adding the 5 custom fields confirmed to be missing from the Users table.
            // LastVisitToPortugal and DisplayName are confirmed to already exist.

            migrationBuilder.AddColumn<string>(
                name: "ProfilePictureUrl",
                table: "Users",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailNotificationsEnabled",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "SoundEffectsEnabled",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "DarkModeEnabled",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsProfilePublic",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop only the columns that were added by THIS execution of the Up() method.
            migrationBuilder.DropColumn(
                name: "ProfilePictureUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailNotificationsEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SoundEffectsEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DarkModeEnabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsProfilePublic",
                table: "Users");
        }
    }
}
