using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BattleKnightExtensionAgent.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDuelsSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DuelsSettings",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LevelMin = table.Column<int>(type: "INTEGER", nullable: false),
                    LevelMax = table.Column<int>(type: "INTEGER", nullable: false),
                    LootFilterEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    LootMax = table.Column<long>(type: "INTEGER", nullable: false),
                    SkipAllOrders = table.Column<bool>(type: "INTEGER", nullable: false),
                    SkipSpecificOrders = table.Column<bool>(type: "INTEGER", nullable: false),
                    OrdersToSkip = table.Column<string>(type: "TEXT", nullable: false),
                    CooldownMs = table.Column<int>(type: "INTEGER", nullable: false),
                    RankingOffset = table.Column<int>(type: "INTEGER", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DuelsSettings", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_DuelsSettings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DuelsSettings");
        }
    }
}
