using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class CompleteNewSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "billing_periods",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    period_month = table.Column<DateTime>(type: "datetime2", nullable: false),
                    cutoff_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    due_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "DRAFT"),
                    late_fee_enabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    late_fee_percent = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    late_fee_fixed = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_periods", x => x.id);
                    table.CheckConstraint("CK_billing_periods_status", "status IN ('DRAFT', 'CONFIRMED', 'CLOSED')");
                });

            migrationBuilder.CreateTable(
                name: "blocked_ips",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    blocked_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    blocked_by = table.Column<long>(type: "bigint", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_blocked_ips", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "buildings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    building_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    building_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_buildings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "faqs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    question = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    answer = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    keywords = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    display_order = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    view_count = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_faqs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "price_configs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    service_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    pricing_method = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: false),
                    unit_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    effective_date = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    is_tiered = table.Column<bool>(type: "bit", nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_configs", x => x.id);
                    table.CheckConstraint("CK_price_configs_pricing_method", "pricing_method IN ('PER_PERSON', 'PER_UNIT', 'FIXED', 'TIERED')");
                    table.CheckConstraint("CK_price_configs_service_type", "service_type IN ('WATER', 'ELECTRICITY', 'SERVICE')");
                });

            migrationBuilder.CreateTable(
                name: "regulations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    regulation_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    effective_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    expiry_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    view_count = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_regulations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "services",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_services", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    phone_number = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    password_hash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "RESIDENT"),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ACTIVE"),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "floors",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    building_id = table.Column<long>(type: "bigint", nullable: false),
                    floor_number = table.Column<int>(type: "int", nullable: false),
                    floor_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_floors", x => x.id);
                    table.ForeignKey(
                        name: "FK_floors_buildings_building_id",
                        column: x => x.building_id,
                        principalTable: "buildings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "electricity_price_snapshots",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    price_config_id = table.Column<long>(type: "bigint", nullable: true),
                    effective_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    service_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    pricing_method = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: true),
                    is_tiered = table.Column<bool>(type: "bit", nullable: false),
                    snapshot_datetime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_electricity_price_snapshots", x => x.id);
                    table.ForeignKey(
                        name: "FK_electricity_price_snapshots_price_configs_price_config_id",
                        column: x => x.price_config_id,
                        principalTable: "price_configs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "electricity_tiers",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    price_config_id = table.Column<long>(type: "bigint", nullable: true),
                    tier_level = table.Column<int>(type: "int", nullable: false),
                    from_kwh = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    to_kwh = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    unit_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_electricity_tiers", x => x.id);
                    table.ForeignKey(
                        name: "FK_electricity_tiers_price_configs_price_config_id",
                        column: x => x.price_config_id,
                        principalTable: "price_configs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "service_price_adjustments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    service_id = table.Column<long>(type: "bigint", nullable: false),
                    old_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    new_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    adjustment_reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    adjusted_by = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    adjusted_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_price_adjustments", x => x.id);
                    table.ForeignKey(
                        name: "FK_service_price_adjustments_services_service_id",
                        column: x => x.service_id,
                        principalTable: "services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "service_price_snapshots",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    service_id = table.Column<long>(type: "bigint", nullable: false),
                    previous_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    snapshot_datetime = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_price_snapshots", x => x.id);
                    table.ForeignKey(
                        name: "FK_service_price_snapshots_services_service_id",
                        column: x => x.service_id,
                        principalTable: "services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<long>(type: "bigint", nullable: true),
                    old_values = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    new_values = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    user_agent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_logs_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "chatbot_conversations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    conversation_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    session_start = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    session_end = table.Column<DateTime>(type: "datetime2", nullable: true),
                    total_messages = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ACTIVE")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chatbot_conversations", x => x.id);
                    table.ForeignKey(
                        name: "FK_chatbot_conversations_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    recipient_id = table.Column<long>(type: "bigint", nullable: true),
                    scope_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    scope_id = table.Column<long>(type: "bigint", nullable: true),
                    notification_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "NORMAL"),
                    link_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    related_id = table.Column<long>(type: "bigint", nullable: true),
                    is_read = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    read_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.CheckConstraint("CK_notifications_priority", "priority IN ('NORMAL', 'URGENT')");
                    table.CheckConstraint("CK_notifications_scope_type", "scope_type IS NULL OR scope_type IN ('USER', 'ROOM', 'FLOOR', 'BUILDING', 'ALL')");
                    table.ForeignKey(
                        name: "FK_notifications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "residents",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    id_card_number = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    phone_number = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    gender = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    permanent_address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_residents", x => x.id);
                    table.CheckConstraint("CK_residents_gender", "gender IN ('MALE', 'FEMALE', 'OTHER')");
                    table.ForeignKey(
                        name: "FK_residents_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    refresh_token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    device_info = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    revoked_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_sessions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rooms",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    floor_id = table.Column<long>(type: "bigint", nullable: false),
                    room_code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    room_number = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    room_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    monthly_rent = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    sale_price = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "VACANT"),
                    area_sqm = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rooms", x => x.id);
                    table.CheckConstraint("CK_rooms_room_type", "room_type IN ('FOR_RENT', 'FOR_SALE', 'SOLD')");
                    table.CheckConstraint("CK_rooms_status", "status IN ('VACANT', 'OCCUPIED', 'INACTIVE')");
                    table.ForeignKey(
                        name: "FK_rooms_floors_floor_id",
                        column: x => x.floor_id,
                        principalTable: "floors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "electricity_tier_snapshots",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    snapshot_id = table.Column<long>(type: "bigint", nullable: false),
                    tier_level = table.Column<int>(type: "int", nullable: false),
                    from_kwh = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    to_kwh = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    unit_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_electricity_tier_snapshots", x => x.id);
                    table.ForeignKey(
                        name: "FK_electricity_tier_snapshots_electricity_price_snapshots_snapshot_id",
                        column: x => x.snapshot_id,
                        principalTable: "electricity_price_snapshots",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chatbot_messages",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    conversation_id = table.Column<long>(type: "bigint", nullable: false),
                    sender_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    message_content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    intent = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    matched_faq_id = table.Column<long>(type: "bigint", nullable: true),
                    matched_regulation_id = table.Column<long>(type: "bigint", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chatbot_messages", x => x.id);
                    table.CheckConstraint("CK_chatbot_messages_sender_type", "sender_type IN ('USER', 'BOT')");
                    table.ForeignKey(
                        name: "FK_chatbot_messages_chatbot_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "chatbot_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chatbot_messages_faqs_matched_faq_id",
                        column: x => x.matched_faq_id,
                        principalTable: "faqs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_chatbot_messages_regulations_matched_regulation_id",
                        column: x => x.matched_regulation_id,
                        principalTable: "regulations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "complaints",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    complaint_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    resident_id = table.Column<long>(type: "bigint", nullable: false),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    subject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "OPEN"),
                    priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "MEDIUM"),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    assigned_to = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_complaints", x => x.id);
                    table.CheckConstraint("CK_complaints_priority", "priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')");
                    table.CheckConstraint("CK_complaints_status", "status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')");
                    table.ForeignKey(
                        name: "FK_complaints_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "invoices",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    invoice_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    billing_period_id = table.Column<long>(type: "bigint", nullable: false),
                    issue_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    due_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    headcount = table.Column<int>(type: "int", nullable: true),
                    room_charge = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    water_charge = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    electricity_charge = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    service_charge = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    total_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    adjustment_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    adjustment_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    late_fee = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    paid_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false, defaultValue: 0m),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "UNPAID"),
                    snapshot_water_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: true),
                    snapshot_electricity_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: true),
                    snapshot_service_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: true),
                    snapshot_room_rent = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    confirmed_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    confirmed_by = table.Column<long>(type: "bigint", nullable: true),
                    paid_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    voided_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    voided_by = table.Column<long>(type: "bigint", nullable: true),
                    void_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoices", x => x.id);
                    table.CheckConstraint("CK_invoices_status", "status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'VOIDED')");
                    table.ForeignKey(
                        name: "FK_invoices_billing_periods_billing_period_id",
                        column: x => x.billing_period_id,
                        principalTable: "billing_periods",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_invoices_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "meter_readings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    reading_month = table.Column<DateTime>(type: "datetime2", nullable: false),
                    previous_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    current_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    consumption = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    is_anomaly = table.Column<bool>(type: "bit", nullable: false),
                    anomaly_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    recorded_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meter_readings", x => x.id);
                    table.ForeignKey(
                        name: "FK_meter_readings_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "residencies",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    resident_id = table.Column<long>(type: "bigint", nullable: false),
                    ownership_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    is_primary_resident = table.Column<bool>(type: "bit", nullable: false),
                    check_in_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    check_out_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ACTIVE"),
                    contract_number = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    contract_start_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    contract_end_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_residencies", x => x.id);
                    table.CheckConstraint("CK_residencies_ownership", "ownership_type IN ('OWNER', 'TENANT')");
                    table.CheckConstraint("CK_residencies_status", "status IN ('ACTIVE', 'INACTIVE', 'ENDED')");
                    table.ForeignKey(
                        name: "FK_residencies_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_residencies_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "water_meter_readings",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    reading_month = table.Column<DateTime>(type: "datetime2", nullable: false),
                    previous_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    current_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    consumption = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    is_anomaly = table.Column<bool>(type: "bit", nullable: false),
                    anomaly_note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    recorded_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_water_meter_readings", x => x.id);
                    table.ForeignKey(
                        name: "FK_water_meter_readings_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "complaint_attachments",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    complaint_id = table.Column<long>(type: "bigint", nullable: false),
                    file_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    file_path = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    file_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_complaint_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_complaint_attachments_complaints_complaint_id",
                        column: x => x.complaint_id,
                        principalTable: "complaints",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "complaint_responses",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    complaint_id = table.Column<long>(type: "bigint", nullable: false),
                    responded_by = table.Column<long>(type: "bigint", nullable: false),
                    response_text = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    responded_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_complaint_responses", x => x.id);
                    table.ForeignKey(
                        name: "FK_complaint_responses_complaints_complaint_id",
                        column: x => x.complaint_id,
                        principalTable: "complaints",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "invoice_line_items",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    invoice_id = table.Column<long>(type: "bigint", nullable: false),
                    item_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    quantity = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(15,4)", precision: 15, scale: 4, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    tier_info = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_line_items", x => x.id);
                    table.CheckConstraint("CK_invoice_line_items_item_type", "item_type IN ('ROOM', 'WATER', 'ELECTRICITY', 'ELECTRICITY_TIER', 'SERVICE', 'ADJUSTMENT', 'LATE_FEE')");
                    table.ForeignKey(
                        name: "FK_invoice_line_items_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "transactions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    invoice_id = table.Column<long>(type: "bigint", nullable: false),
                    transaction_code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    payment_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    payment_method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    bank_reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "INITIATED"),
                    gateway_reference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    gateway_response = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transactions", x => x.id);
                    table.CheckConstraint("CK_transactions_payment_method", "payment_method IN ('BANK_TRANSFER', 'CASH', 'EWALLET', 'GATEWAY_MOCK')");
                    table.CheckConstraint("CK_transactions_status", "status IN ('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED')");
                    table.ForeignKey(
                        name: "FK_transactions_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "deposits",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    residency_id = table.Column<long>(type: "bigint", nullable: false),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    resident_id = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "UNPAID"),
                    paid_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    refund_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    refund_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: true),
                    refund_deduction = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    refund_reason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    ResidencyId1 = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deposits", x => x.id);
                    table.CheckConstraint("CK_deposits_status", "status IN ('UNPAID', 'PAID', 'REFUNDED', 'FORFEITED')");
                    table.ForeignKey(
                        name: "FK_deposits_residencies_ResidencyId1",
                        column: x => x.ResidencyId1,
                        principalTable: "residencies",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_deposits_residencies_residency_id",
                        column: x => x.residency_id,
                        principalTable: "residencies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_deposits_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_deposits_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "service_usages",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    residency_id = table.Column<long>(type: "bigint", nullable: false),
                    service_id = table.Column<long>(type: "bigint", nullable: false),
                    resident_id = table.Column<long>(type: "bigint", nullable: true),
                    quantity = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    usage_datetime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_charged = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ServiceId1 = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_usages", x => x.id);
                    table.ForeignKey(
                        name: "FK_service_usages_residencies_residency_id",
                        column: x => x.residency_id,
                        principalTable: "residencies",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_service_usages_residents_resident_id",
                        column: x => x.resident_id,
                        principalTable: "residents",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_service_usages_services_ServiceId1",
                        column: x => x.ServiceId1,
                        principalTable: "services",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_service_usages_services_service_id",
                        column: x => x.service_id,
                        principalTable: "services",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "payment_reconciliations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    transaction_id = table.Column<long>(type: "bigint", nullable: false),
                    bank_transaction_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    bank_statement_ref = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    bank_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    bank_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    reconciliation_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "PENDING"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    matched_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    matched_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_reconciliations", x => x.id);
                    table.CheckConstraint("CK_payment_reconciliations_status", "reconciliation_status IN ('PENDING', 'MATCHED', 'UNMATCHED')");
                    table.ForeignKey(
                        name: "FK_payment_reconciliations_transactions_transaction_id",
                        column: x => x.transaction_id,
                        principalTable: "transactions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_created_at",
                table: "audit_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_entity_type_entity_id",
                table: "audit_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_user_id",
                table: "audit_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_billing_periods_period_month",
                table: "billing_periods",
                column: "period_month",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_blocked_ips_ip_address",
                table: "blocked_ips",
                column: "ip_address");

            migrationBuilder.CreateIndex(
                name: "IX_buildings_building_code",
                table: "buildings",
                column: "building_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_conversations_conversation_id",
                table: "chatbot_conversations",
                column: "conversation_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_conversations_user_id",
                table: "chatbot_conversations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_messages_conversation_id",
                table: "chatbot_messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_messages_matched_faq_id",
                table: "chatbot_messages",
                column: "matched_faq_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_messages_matched_regulation_id",
                table: "chatbot_messages",
                column: "matched_regulation_id");

            migrationBuilder.CreateIndex(
                name: "IX_complaint_attachments_complaint_id",
                table: "complaint_attachments",
                column: "complaint_id");

            migrationBuilder.CreateIndex(
                name: "IX_complaint_responses_complaint_id",
                table: "complaint_responses",
                column: "complaint_id");

            migrationBuilder.CreateIndex(
                name: "IX_complaints_complaint_code",
                table: "complaints",
                column: "complaint_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_complaints_room_id",
                table: "complaints",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_complaints_status_priority",
                table: "complaints",
                columns: new[] { "status", "priority" });

            migrationBuilder.CreateIndex(
                name: "IX_deposits_residency_id",
                table: "deposits",
                column: "residency_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_deposits_ResidencyId1",
                table: "deposits",
                column: "ResidencyId1",
                unique: true,
                filter: "[ResidencyId1] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_deposits_resident_id",
                table: "deposits",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_deposits_room_id",
                table: "deposits",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_electricity_price_snapshots_price_config_id",
                table: "electricity_price_snapshots",
                column: "price_config_id");

            migrationBuilder.CreateIndex(
                name: "IX_electricity_price_snapshots_snapshot_datetime",
                table: "electricity_price_snapshots",
                column: "snapshot_datetime");

            migrationBuilder.CreateIndex(
                name: "IX_electricity_tier_snapshots_snapshot_id",
                table: "electricity_tier_snapshots",
                column: "snapshot_id");

            migrationBuilder.CreateIndex(
                name: "IX_electricity_tiers_price_config_id_tier_level",
                table: "electricity_tiers",
                columns: new[] { "price_config_id", "tier_level" });

            migrationBuilder.CreateIndex(
                name: "IX_faqs_category",
                table: "faqs",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "UK_floors_building_floor",
                table: "floors",
                columns: new[] { "building_id", "floor_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_invoice_line_items_invoice_id",
                table: "invoice_line_items",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_billing_period_id",
                table: "invoices",
                column: "billing_period_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_due_date",
                table: "invoices",
                column: "due_date");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_invoice_number",
                table: "invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_invoices_room_id_billing_period_id",
                table: "invoices",
                columns: new[] { "room_id", "billing_period_id" });

            migrationBuilder.CreateIndex(
                name: "IX_invoices_status",
                table: "invoices",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_room_id_reading_month",
                table: "meter_readings",
                columns: new[] { "room_id", "reading_month" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_scope_type_scope_id",
                table: "notifications",
                columns: new[] { "scope_type", "scope_id" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id_is_read",
                table: "notifications",
                columns: new[] { "user_id", "is_read" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_reconciliations_transaction_id",
                table: "payment_reconciliations",
                column: "transaction_id");

            migrationBuilder.CreateIndex(
                name: "IX_price_configs_service_type_effective_date",
                table: "price_configs",
                columns: new[] { "service_type", "effective_date" });

            migrationBuilder.CreateIndex(
                name: "IX_regulations_category",
                table: "regulations",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_regulations_regulation_code",
                table: "regulations",
                column: "regulation_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_residencies_resident_id",
                table: "residencies",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "UK_residencies",
                table: "residencies",
                columns: new[] { "room_id", "resident_id", "ownership_type" });

            migrationBuilder.CreateIndex(
                name: "IX_residents_id_card_number",
                table: "residents",
                column: "id_card_number");

            migrationBuilder.CreateIndex(
                name: "IX_residents_phone_number",
                table: "residents",
                column: "phone_number");

            migrationBuilder.CreateIndex(
                name: "IX_residents_user_id",
                table: "residents",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_rooms_floor_id",
                table: "rooms",
                column: "floor_id");

            migrationBuilder.CreateIndex(
                name: "IX_rooms_room_code",
                table: "rooms",
                column: "room_code");

            migrationBuilder.CreateIndex(
                name: "IX_service_price_adjustments_service_id",
                table: "service_price_adjustments",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_price_snapshots_service_id",
                table: "service_price_snapshots",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_usages_residency_id_service_id_usage_datetime",
                table: "service_usages",
                columns: new[] { "residency_id", "service_id", "usage_datetime" });

            migrationBuilder.CreateIndex(
                name: "IX_service_usages_resident_id",
                table: "service_usages",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_usages_service_id",
                table: "service_usages",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_usages_ServiceId1",
                table: "service_usages",
                column: "ServiceId1");

            migrationBuilder.CreateIndex(
                name: "IX_services_name",
                table: "services",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_invoice_id",
                table: "transactions",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_payment_date",
                table: "transactions",
                column: "payment_date");

            migrationBuilder.CreateIndex(
                name: "IX_transactions_transaction_code",
                table: "transactions",
                column: "transaction_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_sessions_refresh_token",
                table: "user_sessions",
                column: "refresh_token");

            migrationBuilder.CreateIndex(
                name: "IX_user_sessions_user_id",
                table: "user_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_phone_number",
                table: "users",
                column: "phone_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_water_meter_readings_room_id_reading_month",
                table: "water_meter_readings",
                columns: new[] { "room_id", "reading_month" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "blocked_ips");

            migrationBuilder.DropTable(
                name: "chatbot_messages");

            migrationBuilder.DropTable(
                name: "complaint_attachments");

            migrationBuilder.DropTable(
                name: "complaint_responses");

            migrationBuilder.DropTable(
                name: "deposits");

            migrationBuilder.DropTable(
                name: "electricity_tier_snapshots");

            migrationBuilder.DropTable(
                name: "electricity_tiers");

            migrationBuilder.DropTable(
                name: "invoice_line_items");

            migrationBuilder.DropTable(
                name: "meter_readings");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "payment_reconciliations");

            migrationBuilder.DropTable(
                name: "service_price_adjustments");

            migrationBuilder.DropTable(
                name: "service_price_snapshots");

            migrationBuilder.DropTable(
                name: "service_usages");

            migrationBuilder.DropTable(
                name: "user_sessions");

            migrationBuilder.DropTable(
                name: "water_meter_readings");

            migrationBuilder.DropTable(
                name: "chatbot_conversations");

            migrationBuilder.DropTable(
                name: "faqs");

            migrationBuilder.DropTable(
                name: "regulations");

            migrationBuilder.DropTable(
                name: "complaints");

            migrationBuilder.DropTable(
                name: "electricity_price_snapshots");

            migrationBuilder.DropTable(
                name: "transactions");

            migrationBuilder.DropTable(
                name: "residencies");

            migrationBuilder.DropTable(
                name: "services");

            migrationBuilder.DropTable(
                name: "price_configs");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "residents");

            migrationBuilder.DropTable(
                name: "billing_periods");

            migrationBuilder.DropTable(
                name: "rooms");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "floors");

            migrationBuilder.DropTable(
                name: "buildings");
        }
    }
}
