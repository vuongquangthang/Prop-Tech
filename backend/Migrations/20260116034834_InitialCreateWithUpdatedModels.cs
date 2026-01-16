using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateWithUpdatedModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "billing_periods",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    period_year = table.Column<int>(type: "int", nullable: false),
                    period_month = table.Column<int>(type: "int", nullable: false),
                    start_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    end_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    due_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "OPEN"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_periods", x => x.id);
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
                    building_code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    building_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    total_floors = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_buildings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "electricity_tiers",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tier_number = table.Column<int>(type: "int", nullable: false),
                    from_kwh = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    to_kwh = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    price_per_kwh = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    effective_from = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    effective_to = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_electricity_tiers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "faqs",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    question = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    answer = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    keywords = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    view_count = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
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
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    service_name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    effective_from = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    effective_to = table.Column<DateTime>(type: "datetime2", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_configs", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "regulations",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    effective_from = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    effective_to = table.Column<DateTime>(type: "datetime2", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_regulations", x => x.id);
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
                    total_rooms = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
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
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    session_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    started_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    ended_at = table.Column<DateTime>(type: "datetime2", nullable: true),
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
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    related_id = table.Column<long>(type: "bigint", nullable: true),
                    is_read = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    read_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "residents",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<long>(type: "bigint", nullable: true),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    phone_number = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    id_card = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: true),
                    date_of_birth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_residents", x => x.id);
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
                    room_number = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    room_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    area_m2 = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    bedrooms = table.Column<int>(type: "int", nullable: false),
                    bathrooms = table.Column<int>(type: "int", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "EMPTY"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rooms", x => x.id);
                    table.ForeignKey(
                        name: "FK_rooms_floors_floor_id",
                        column: x => x.floor_id,
                        principalTable: "floors",
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
                    sender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    message_text = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    intent = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    faq_id = table.Column<int>(type: "int", nullable: true),
                    regulation_id = table.Column<int>(type: "int", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chatbot_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_chatbot_messages_chatbot_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "chatbot_conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chatbot_messages_faqs_faq_id",
                        column: x => x.faq_id,
                        principalTable: "faqs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_chatbot_messages_regulations_regulation_id",
                        column: x => x.regulation_id,
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
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "OPEN"),
                    priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "MEDIUM"),
                    submitted_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    resolved_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    assigned_to = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_complaints", x => x.id);
                    table.ForeignKey(
                        name: "FK_complaints_rooms_room_id",
                        column: x => x.room_id,
                        principalTable: "rooms",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "deposits",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    paid_date = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    refund_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "HELD"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deposits", x => x.id);
                    table.ForeignKey(
                        name: "FK_deposits_rooms_room_id",
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
                    billing_period_id = table.Column<int>(type: "int", nullable: false),
                    issue_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    due_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    total_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    paid_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false, defaultValue: 0m),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "UNPAID"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoices", x => x.id);
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
                    reading_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    previous_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    current_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
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
                    resident_id = table.Column<long>(type: "bigint", nullable: false),
                    room_id = table.Column<long>(type: "bigint", nullable: false),
                    move_in_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    move_out_date = table.Column<DateTime>(type: "datetime2", nullable: true),
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ACTIVE"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_residencies", x => x.id);
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
                    reading_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    previous_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    current_reading = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
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
                    description = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    quantity = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    unit_price = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invoice_line_items", x => x.id);
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
                    status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "SUCCESS"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    created_by = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_transactions_invoices_invoice_id",
                        column: x => x.invoice_id,
                        principalTable: "invoices",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "payment_reconciliations",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    transaction_id = table.Column<long>(type: "bigint", nullable: false),
                    bank_transaction_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    bank_amount = table.Column<decimal>(type: "decimal(15,2)", precision: 15, scale: 2, nullable: false),
                    bank_date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    reconciliation_status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "MATCHED"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    reconciled_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    reconciled_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_reconciliations", x => x.id);
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
                name: "IX_billing_periods_period_year_period_month",
                table: "billing_periods",
                columns: new[] { "period_year", "period_month" },
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
                name: "IX_chatbot_conversations_session_id",
                table: "chatbot_conversations",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_conversations_user_id",
                table: "chatbot_conversations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_messages_conversation_id",
                table: "chatbot_messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_messages_faq_id",
                table: "chatbot_messages",
                column: "faq_id");

            migrationBuilder.CreateIndex(
                name: "IX_chatbot_messages_regulation_id",
                table: "chatbot_messages",
                column: "regulation_id");

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
                name: "IX_deposits_room_id",
                table: "deposits",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_electricity_tiers_tier_number_effective_from",
                table: "electricity_tiers",
                columns: new[] { "tier_number", "effective_from" });

            migrationBuilder.CreateIndex(
                name: "IX_faqs_category",
                table: "faqs",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_floors_building_id",
                table: "floors",
                column: "building_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoice_line_items_invoice_id",
                table: "invoice_line_items",
                column: "invoice_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_billing_period_id",
                table: "invoices",
                column: "billing_period_id");

            migrationBuilder.CreateIndex(
                name: "IX_invoices_invoice_number",
                table: "invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_invoices_room_id",
                table: "invoices",
                column: "room_id");

            migrationBuilder.CreateIndex(
                name: "IX_meter_readings_room_id_reading_date",
                table: "meter_readings",
                columns: new[] { "room_id", "reading_date" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id_is_read",
                table: "notifications",
                columns: new[] { "user_id", "is_read" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_reconciliations_transaction_id",
                table: "payment_reconciliations",
                column: "transaction_id");

            migrationBuilder.CreateIndex(
                name: "IX_price_configs_service_name_effective_from",
                table: "price_configs",
                columns: new[] { "service_name", "effective_from" });

            migrationBuilder.CreateIndex(
                name: "IX_regulations_category",
                table: "regulations",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_residencies_resident_id",
                table: "residencies",
                column: "resident_id");

            migrationBuilder.CreateIndex(
                name: "IX_residencies_room_id",
                table: "residencies",
                column: "room_id");

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
                name: "IX_transactions_invoice_id",
                table: "transactions",
                column: "invoice_id");

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
                name: "IX_water_meter_readings_room_id_reading_date",
                table: "water_meter_readings",
                columns: new[] { "room_id", "reading_date" });
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
                name: "price_configs");

            migrationBuilder.DropTable(
                name: "residencies");

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
                name: "transactions");

            migrationBuilder.DropTable(
                name: "residents");

            migrationBuilder.DropTable(
                name: "invoices");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "billing_periods");

            migrationBuilder.DropTable(
                name: "rooms");

            migrationBuilder.DropTable(
                name: "floors");

            migrationBuilder.DropTable(
                name: "buildings");
        }
    }
}
