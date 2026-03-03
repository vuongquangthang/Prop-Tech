using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialSchemaVietnamese : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "blocked_ips",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    blocked_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    blocked_by = table.Column<long>(type: "bigint", nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_blocked_ips", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CU_DAN",
                columns: table => new
                {
                    CU_DAN_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HO_TEN = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SO_DIEN_THOAI = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SO_CCCD = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    QUE_QUAN = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CCCD_FRONT_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CCCD_BACK_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CU_DAN", x => x.CU_DAN_ID);
                });

            migrationBuilder.CreateTable(
                name: "DICH_VU",
                columns: table => new
                {
                    DICH_VU_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TEN_DICH_VU = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LOAI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DON_VI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DON_GIA_CHUNG = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    IS_ACTIVE = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DICH_VU", x => x.DICH_VU_ID);
                });

            migrationBuilder.CreateTable(
                name: "TAI_SAN",
                columns: table => new
                {
                    TAI_SAN_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TEN_TAI_SAN = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MA_TAI_SAN = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TAI_SAN", x => x.TAI_SAN_ID);
                });

            migrationBuilder.CreateTable(
                name: "TOA_NHA",
                columns: table => new
                {
                    TOA_NHA_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TEN_TOA_NHA = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DIA_CHI = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SO_TANG = table.Column<int>(type: "int", nullable: false),
                    MO_TA = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TOA_NHA", x => x.TOA_NHA_ID);
                });

            migrationBuilder.CreateTable(
                name: "USER",
                columns: table => new
                {
                    USER_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SO_DIEN_THOAI = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MAT_KHAU_HASH = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    VAI_TRO = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CU_DAN_ID = table.Column<int>(type: "int", nullable: true),
                    IS_LOCKED = table.Column<bool>(type: "bit", nullable: false),
                    LAST_LOGIN_AT = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USER", x => x.USER_ID);
                    table.ForeignKey(
                        name: "FK_USER_CU_DAN_CU_DAN_ID",
                        column: x => x.CU_DAN_ID,
                        principalTable: "CU_DAN",
                        principalColumn: "CU_DAN_ID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "XE",
                columns: table => new
                {
                    XE_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CU_DAN_ID = table.Column<int>(type: "int", nullable: false),
                    BIEN_SO = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LOAI_XE = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NGAY_DANG_KY = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NGAY_HUY = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XE", x => x.XE_ID);
                    table.ForeignKey(
                        name: "FK_XE_CU_DAN_CU_DAN_ID",
                        column: x => x.CU_DAN_ID,
                        principalTable: "CU_DAN",
                        principalColumn: "CU_DAN_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TANG",
                columns: table => new
                {
                    TANG_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TOA_NHA_ID = table.Column<int>(type: "int", nullable: false),
                    SO_TANG = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TANG", x => x.TANG_ID);
                    table.ForeignKey(
                        name: "FK_TANG_TOA_NHA_TOA_NHA_ID",
                        column: x => x.TOA_NHA_ID,
                        principalTable: "TOA_NHA",
                        principalColumn: "TOA_NHA_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    action = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    entity_type = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<int>(type: "int", nullable: true),
                    old_values = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    new_values = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    user_agent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_logs_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "USER",
                        principalColumn: "USER_ID");
                });

            migrationBuilder.CreateTable(
                name: "KNOWLEDGE_BASE",
                columns: table => new
                {
                    KB_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TIEU_DE = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NOI_DUNG = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    THE_LOAI = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TAGS = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IS_ACTIVE = table.Column<bool>(type: "bit", nullable: false),
                    UPDATED_AT = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UPDATED_BY = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KNOWLEDGE_BASE", x => x.KB_ID);
                    table.ForeignKey(
                        name: "FK_KNOWLEDGE_BASE_USER_UPDATED_BY",
                        column: x => x.UPDATED_BY,
                        principalTable: "USER",
                        principalColumn: "USER_ID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LICH_SU_CHAT",
                columns: table => new
                {
                    CHAT_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    MESSAGE_ROLE = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MESSAGE_TEXT = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CREATED_AT = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LICH_SU_CHAT", x => x.CHAT_ID);
                    table.ForeignKey(
                        name: "FK_LICH_SU_CHAT_USER_USER_ID",
                        column: x => x.USER_ID,
                        principalTable: "USER",
                        principalColumn: "USER_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    recipient_id = table.Column<int>(type: "int", nullable: true),
                    scope_type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    scope_id = table.Column<int>(type: "int", nullable: true),
                    notification_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    link_url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    related_id = table.Column<int>(type: "int", nullable: true),
                    is_read = table.Column<bool>(type: "bit", nullable: false),
                    read_at = table.Column<DateTime>(type: "datetime2", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "USER",
                        principalColumn: "USER_ID");
                });

            migrationBuilder.CreateTable(
                name: "user_sessions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    refresh_token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    device_info = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ip_address = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    expires_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false),
                    revoked_at = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_sessions_USER_user_id",
                        column: x => x.user_id,
                        principalTable: "USER",
                        principalColumn: "USER_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PHONG",
                columns: table => new
                {
                    PHONG_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TANG_ID = table.Column<int>(type: "int", nullable: false),
                    MA_PHONG = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DIEN_TICH = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    DON_GIA_THUE_MAC_DINH = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    TRANG_THAI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PHONG", x => x.PHONG_ID);
                    table.ForeignKey(
                        name: "FK_PHONG_TANG_TANG_ID",
                        column: x => x.TANG_ID,
                        principalTable: "TANG",
                        principalColumn: "TANG_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CHI_TIET_SU_DUNG_DICH_VU",
                columns: table => new
                {
                    CT_SDDV_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DICH_VU_ID = table.Column<int>(type: "int", nullable: false),
                    CU_DAN_ID = table.Column<int>(type: "int", nullable: false),
                    PHONG_ID = table.Column<int>(type: "int", nullable: false),
                    XE_ID = table.Column<int>(type: "int", nullable: true),
                    AP_DUNG_TU = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AP_DUNG_DEN = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OVERRIDE_DON_GIA = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    SO_LUONG = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    GHI_CHU = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_TIET_SU_DUNG_DICH_VU", x => x.CT_SDDV_ID);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_SU_DUNG_DICH_VU_CU_DAN_CU_DAN_ID",
                        column: x => x.CU_DAN_ID,
                        principalTable: "CU_DAN",
                        principalColumn: "CU_DAN_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_SU_DUNG_DICH_VU_DICH_VU_DICH_VU_ID",
                        column: x => x.DICH_VU_ID,
                        principalTable: "DICH_VU",
                        principalColumn: "DICH_VU_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_SU_DUNG_DICH_VU_PHONG_PHONG_ID",
                        column: x => x.PHONG_ID,
                        principalTable: "PHONG",
                        principalColumn: "PHONG_ID");
                    table.ForeignKey(
                        name: "FK_CHI_TIET_SU_DUNG_DICH_VU_XE_XE_ID",
                        column: x => x.XE_ID,
                        principalTable: "XE",
                        principalColumn: "XE_ID");
                });

            migrationBuilder.CreateTable(
                name: "CHI_TIET_TAI_SAN_PHONG",
                columns: table => new
                {
                    PHONG_ID = table.Column<int>(type: "int", nullable: false),
                    TAI_SAN_ID = table.Column<int>(type: "int", nullable: false),
                    SO_LUONG = table.Column<int>(type: "int", nullable: false),
                    TINH_TRANG = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GHI_CHU = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_TIET_TAI_SAN_PHONG", x => new { x.PHONG_ID, x.TAI_SAN_ID });
                    table.ForeignKey(
                        name: "FK_CHI_TIET_TAI_SAN_PHONG_PHONG_PHONG_ID",
                        column: x => x.PHONG_ID,
                        principalTable: "PHONG",
                        principalColumn: "PHONG_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_TAI_SAN_PHONG_TAI_SAN_TAI_SAN_ID",
                        column: x => x.TAI_SAN_ID,
                        principalTable: "TAI_SAN",
                        principalColumn: "TAI_SAN_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HOP_DONG",
                columns: table => new
                {
                    HOP_DONG_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PHONG_ID = table.Column<int>(type: "int", nullable: false),
                    NGAY_BAT_DAU = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NGAY_KET_THUC_DU_KIEN = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GIA_THUE_THUC_TE = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TIEN_COC = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HOP_DONG", x => x.HOP_DONG_ID);
                    table.ForeignKey(
                        name: "FK_HOP_DONG_PHONG_PHONG_ID",
                        column: x => x.PHONG_ID,
                        principalTable: "PHONG",
                        principalColumn: "PHONG_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "YEU_CAU_SUA_CHUA",
                columns: table => new
                {
                    YEU_CAU_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PHONG_ID = table.Column<int>(type: "int", nullable: false),
                    USER_ID = table.Column<int>(type: "int", nullable: false),
                    LOAI_SU_CO = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MO_TA = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    MEDIA_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TRANG_THAI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GHI_CHU_ADMIN = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CLOSED_AT = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YEU_CAU_SUA_CHUA", x => x.YEU_CAU_ID);
                    table.ForeignKey(
                        name: "FK_YEU_CAU_SUA_CHUA_PHONG_PHONG_ID",
                        column: x => x.PHONG_ID,
                        principalTable: "PHONG",
                        principalColumn: "PHONG_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_YEU_CAU_SUA_CHUA_USER_USER_ID",
                        column: x => x.USER_ID,
                        principalTable: "USER",
                        principalColumn: "USER_ID");
                });

            migrationBuilder.CreateTable(
                name: "CHI_SO_DIEN",
                columns: table => new
                {
                    CHI_SO_DIEN_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CT_SDDV_ID = table.Column<long>(type: "bigint", nullable: false),
                    KY_THANG = table.Column<byte>(type: "tinyint", nullable: false),
                    KY_NAM = table.Column<short>(type: "smallint", nullable: false),
                    CHI_SO_MOI = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ANH_DONG_HO_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CREATED_BY = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_SO_DIEN", x => x.CHI_SO_DIEN_ID);
                    table.ForeignKey(
                        name: "FK_CHI_SO_DIEN_CHI_TIET_SU_DUNG_DICH_VU_CT_SDDV_ID",
                        column: x => x.CT_SDDV_ID,
                        principalTable: "CHI_TIET_SU_DUNG_DICH_VU",
                        principalColumn: "CT_SDDV_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHI_SO_DIEN_USER_CREATED_BY",
                        column: x => x.CREATED_BY,
                        principalTable: "USER",
                        principalColumn: "USER_ID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CHI_SO_NUOC",
                columns: table => new
                {
                    CHI_SO_NUOC_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CT_SDDV_ID = table.Column<long>(type: "bigint", nullable: false),
                    KY_THANG = table.Column<byte>(type: "tinyint", nullable: false),
                    KY_NAM = table.Column<short>(type: "smallint", nullable: false),
                    CHI_SO_MOI = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ANH_DONG_HO_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CREATED_AT = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CREATED_BY = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_SO_NUOC", x => x.CHI_SO_NUOC_ID);
                    table.ForeignKey(
                        name: "FK_CHI_SO_NUOC_CHI_TIET_SU_DUNG_DICH_VU_CT_SDDV_ID",
                        column: x => x.CT_SDDV_ID,
                        principalTable: "CHI_TIET_SU_DUNG_DICH_VU",
                        principalColumn: "CT_SDDV_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHI_SO_NUOC_USER_CREATED_BY",
                        column: x => x.CREATED_BY,
                        principalTable: "USER",
                        principalColumn: "USER_ID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CHI_TIET_O",
                columns: table => new
                {
                    HOP_DONG_ID = table.Column<int>(type: "int", nullable: false),
                    CU_DAN_ID = table.Column<int>(type: "int", nullable: false),
                    VAI_TRO_O = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TU_NGAY = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DEN_NGAY = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_TIET_O", x => new { x.HOP_DONG_ID, x.CU_DAN_ID });
                    table.ForeignKey(
                        name: "FK_CHI_TIET_O_CU_DAN_CU_DAN_ID",
                        column: x => x.CU_DAN_ID,
                        principalTable: "CU_DAN",
                        principalColumn: "CU_DAN_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_O_HOP_DONG_HOP_DONG_ID",
                        column: x => x.HOP_DONG_ID,
                        principalTable: "HOP_DONG",
                        principalColumn: "HOP_DONG_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HOA_DON",
                columns: table => new
                {
                    HOA_DON_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HOP_DONG_ID = table.Column<int>(type: "int", nullable: false),
                    THANG = table.Column<byte>(type: "tinyint", nullable: false),
                    NAM = table.Column<short>(type: "smallint", nullable: false),
                    TONG_TIEN = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TRANG_THAI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    QR_CODE_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DUE_DATE = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HOA_DON", x => x.HOA_DON_ID);
                    table.ForeignKey(
                        name: "FK_HOA_DON_HOP_DONG_HOP_DONG_ID",
                        column: x => x.HOP_DONG_ID,
                        principalTable: "HOP_DONG",
                        principalColumn: "HOP_DONG_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TAT_TOAN",
                columns: table => new
                {
                    TAT_TOAN_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HOP_DONG_ID = table.Column<int>(type: "int", nullable: false),
                    NGAY_TAT_TOAN = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TONG_CONG = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PDF_URL = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    GHI_CHU = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TAT_TOAN", x => x.TAT_TOAN_ID);
                    table.ForeignKey(
                        name: "FK_TAT_TOAN_HOP_DONG_HOP_DONG_ID",
                        column: x => x.HOP_DONG_ID,
                        principalTable: "HOP_DONG",
                        principalColumn: "HOP_DONG_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CHI_TIET_HOA_DON",
                columns: table => new
                {
                    CHI_TIET_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HOA_DON_ID = table.Column<int>(type: "int", nullable: false),
                    CT_SDDV_ID = table.Column<long>(type: "bigint", nullable: true),
                    LOAI_KHOAN = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DICH_VU_ID = table.Column<int>(type: "int", nullable: true),
                    SO_LUONG = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    DON_GIA = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    MO_TA = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_TIET_HOA_DON", x => x.CHI_TIET_ID);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_HOA_DON_CHI_TIET_SU_DUNG_DICH_VU_CT_SDDV_ID",
                        column: x => x.CT_SDDV_ID,
                        principalTable: "CHI_TIET_SU_DUNG_DICH_VU",
                        principalColumn: "CT_SDDV_ID");
                    table.ForeignKey(
                        name: "FK_CHI_TIET_HOA_DON_DICH_VU_DICH_VU_ID",
                        column: x => x.DICH_VU_ID,
                        principalTable: "DICH_VU",
                        principalColumn: "DICH_VU_ID");
                    table.ForeignKey(
                        name: "FK_CHI_TIET_HOA_DON_HOA_DON_HOA_DON_ID",
                        column: x => x.HOA_DON_ID,
                        principalTable: "HOA_DON",
                        principalColumn: "HOA_DON_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NHAT_KY_NHAC_NO",
                columns: table => new
                {
                    NHAC_NO_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HOA_DON_ID = table.Column<int>(type: "int", nullable: false),
                    SENT_TO_USER_ID = table.Column<int>(type: "int", nullable: false),
                    SENT_BY_USER_ID = table.Column<int>(type: "int", nullable: true),
                    LAN_NHAC = table.Column<int>(type: "int", nullable: false),
                    NHAC_LUC = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HINH_THUC = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NOI_DUNG = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TRANG_THAI_GUI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ERROR_MESSAGE = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NHAT_KY_NHAC_NO", x => x.NHAC_NO_ID);
                    table.ForeignKey(
                        name: "FK_NHAT_KY_NHAC_NO_HOA_DON_HOA_DON_ID",
                        column: x => x.HOA_DON_ID,
                        principalTable: "HOA_DON",
                        principalColumn: "HOA_DON_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NHAT_KY_NHAC_NO_USER_SENT_BY_USER_ID",
                        column: x => x.SENT_BY_USER_ID,
                        principalTable: "USER",
                        principalColumn: "USER_ID");
                    table.ForeignKey(
                        name: "FK_NHAT_KY_NHAC_NO_USER_SENT_TO_USER_ID",
                        column: x => x.SENT_TO_USER_ID,
                        principalTable: "USER",
                        principalColumn: "USER_ID");
                });

            migrationBuilder.CreateTable(
                name: "CHI_TIET_PHIEU_TAT_TOAN",
                columns: table => new
                {
                    CHI_TIET_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TAT_TOAN_ID = table.Column<int>(type: "int", nullable: false),
                    LOAI_KHOAN = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SO_TIEN = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MO_TA = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHI_TIET_PHIEU_TAT_TOAN", x => x.CHI_TIET_ID);
                    table.ForeignKey(
                        name: "FK_CHI_TIET_PHIEU_TAT_TOAN_TAT_TOAN_TAT_TOAN_ID",
                        column: x => x.TAT_TOAN_ID,
                        principalTable: "TAT_TOAN",
                        principalColumn: "TAT_TOAN_ID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "THANH_TOAN",
                columns: table => new
                {
                    THANH_TOAN_ID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LOAI = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HOA_DON_ID = table.Column<int>(type: "int", nullable: true),
                    TAT_TOAN_ID = table.Column<int>(type: "int", nullable: true),
                    SO_TIEN = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MA_GIAO_DICH = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PAID_AT = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_THANH_TOAN", x => x.THANH_TOAN_ID);
                    table.CheckConstraint("CHK_THANH_TOAN_REF", "([HOA_DON_ID] IS NOT NULL AND [TAT_TOAN_ID] IS NULL) OR ([HOA_DON_ID] IS NULL AND [TAT_TOAN_ID] IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_THANH_TOAN_HOA_DON_HOA_DON_ID",
                        column: x => x.HOA_DON_ID,
                        principalTable: "HOA_DON",
                        principalColumn: "HOA_DON_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_THANH_TOAN_TAT_TOAN_TAT_TOAN_ID",
                        column: x => x.TAT_TOAN_ID,
                        principalTable: "TAT_TOAN",
                        principalColumn: "TAT_TOAN_ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_user_id",
                table: "audit_logs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_SO_DIEN_CREATED_BY",
                table: "CHI_SO_DIEN",
                column: "CREATED_BY");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_SO_DIEN_CT_SDDV_ID_KY_THANG_KY_NAM",
                table: "CHI_SO_DIEN",
                columns: new[] { "CT_SDDV_ID", "KY_THANG", "KY_NAM" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CHI_SO_NUOC_CREATED_BY",
                table: "CHI_SO_NUOC",
                column: "CREATED_BY");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_SO_NUOC_CT_SDDV_ID_KY_THANG_KY_NAM",
                table: "CHI_SO_NUOC",
                columns: new[] { "CT_SDDV_ID", "KY_THANG", "KY_NAM" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_HOA_DON_CT_SDDV_ID",
                table: "CHI_TIET_HOA_DON",
                column: "CT_SDDV_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_HOA_DON_DICH_VU_ID",
                table: "CHI_TIET_HOA_DON",
                column: "DICH_VU_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_HOA_DON_HOA_DON_ID",
                table: "CHI_TIET_HOA_DON",
                column: "HOA_DON_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_O_CU_DAN_ID",
                table: "CHI_TIET_O",
                column: "CU_DAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_PHIEU_TAT_TOAN_TAT_TOAN_ID",
                table: "CHI_TIET_PHIEU_TAT_TOAN",
                column: "TAT_TOAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_SU_DUNG_DICH_VU_CU_DAN_ID",
                table: "CHI_TIET_SU_DUNG_DICH_VU",
                column: "CU_DAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_SU_DUNG_DICH_VU_DICH_VU_ID",
                table: "CHI_TIET_SU_DUNG_DICH_VU",
                column: "DICH_VU_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_SU_DUNG_DICH_VU_PHONG_ID",
                table: "CHI_TIET_SU_DUNG_DICH_VU",
                column: "PHONG_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_SU_DUNG_DICH_VU_XE_ID",
                table: "CHI_TIET_SU_DUNG_DICH_VU",
                column: "XE_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CHI_TIET_TAI_SAN_PHONG_TAI_SAN_ID",
                table: "CHI_TIET_TAI_SAN_PHONG",
                column: "TAI_SAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_CU_DAN_SO_CCCD",
                table: "CU_DAN",
                column: "SO_CCCD",
                unique: true,
                filter: "[SO_CCCD] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_HOA_DON_HOP_DONG_ID_THANG_NAM",
                table: "HOA_DON",
                columns: new[] { "HOP_DONG_ID", "THANG", "NAM" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HOP_DONG_PHONG_ID",
                table: "HOP_DONG",
                column: "PHONG_ID");

            migrationBuilder.CreateIndex(
                name: "IX_KNOWLEDGE_BASE_UPDATED_BY",
                table: "KNOWLEDGE_BASE",
                column: "UPDATED_BY");

            migrationBuilder.CreateIndex(
                name: "IX_LICH_SU_CHAT_USER_ID",
                table: "LICH_SU_CHAT",
                column: "USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_NHAT_KY_NHAC_NO_HOA_DON_ID",
                table: "NHAT_KY_NHAC_NO",
                column: "HOA_DON_ID");

            migrationBuilder.CreateIndex(
                name: "IX_NHAT_KY_NHAC_NO_SENT_BY_USER_ID",
                table: "NHAT_KY_NHAC_NO",
                column: "SENT_BY_USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_NHAT_KY_NHAC_NO_SENT_TO_USER_ID",
                table: "NHAT_KY_NHAC_NO",
                column: "SENT_TO_USER_ID");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id",
                table: "notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_PHONG_MA_PHONG",
                table: "PHONG",
                column: "MA_PHONG",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PHONG_TANG_ID",
                table: "PHONG",
                column: "TANG_ID");

            migrationBuilder.CreateIndex(
                name: "IX_TAI_SAN_MA_TAI_SAN",
                table: "TAI_SAN",
                column: "MA_TAI_SAN",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TANG_TOA_NHA_ID_SO_TANG",
                table: "TANG",
                columns: new[] { "TOA_NHA_ID", "SO_TANG" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TAT_TOAN_HOP_DONG_ID",
                table: "TAT_TOAN",
                column: "HOP_DONG_ID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_THANH_TOAN_HOA_DON_ID",
                table: "THANH_TOAN",
                column: "HOA_DON_ID");

            migrationBuilder.CreateIndex(
                name: "IX_THANH_TOAN_TAT_TOAN_ID",
                table: "THANH_TOAN",
                column: "TAT_TOAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_TOA_NHA_TEN_TOA_NHA",
                table: "TOA_NHA",
                column: "TEN_TOA_NHA",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_USER_CU_DAN_ID",
                table: "USER",
                column: "CU_DAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_USER_SO_DIEN_THOAI",
                table: "USER",
                column: "SO_DIEN_THOAI",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_sessions_user_id",
                table: "user_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_XE_BIEN_SO",
                table: "XE",
                column: "BIEN_SO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_XE_CU_DAN_ID",
                table: "XE",
                column: "CU_DAN_ID");

            migrationBuilder.CreateIndex(
                name: "IX_YEU_CAU_SUA_CHUA_PHONG_ID",
                table: "YEU_CAU_SUA_CHUA",
                column: "PHONG_ID");

            migrationBuilder.CreateIndex(
                name: "IX_YEU_CAU_SUA_CHUA_USER_ID",
                table: "YEU_CAU_SUA_CHUA",
                column: "USER_ID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "blocked_ips");

            migrationBuilder.DropTable(
                name: "CHI_SO_DIEN");

            migrationBuilder.DropTable(
                name: "CHI_SO_NUOC");

            migrationBuilder.DropTable(
                name: "CHI_TIET_HOA_DON");

            migrationBuilder.DropTable(
                name: "CHI_TIET_O");

            migrationBuilder.DropTable(
                name: "CHI_TIET_PHIEU_TAT_TOAN");

            migrationBuilder.DropTable(
                name: "CHI_TIET_TAI_SAN_PHONG");

            migrationBuilder.DropTable(
                name: "KNOWLEDGE_BASE");

            migrationBuilder.DropTable(
                name: "LICH_SU_CHAT");

            migrationBuilder.DropTable(
                name: "NHAT_KY_NHAC_NO");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "THANH_TOAN");

            migrationBuilder.DropTable(
                name: "user_sessions");

            migrationBuilder.DropTable(
                name: "YEU_CAU_SUA_CHUA");

            migrationBuilder.DropTable(
                name: "CHI_TIET_SU_DUNG_DICH_VU");

            migrationBuilder.DropTable(
                name: "TAI_SAN");

            migrationBuilder.DropTable(
                name: "HOA_DON");

            migrationBuilder.DropTable(
                name: "TAT_TOAN");

            migrationBuilder.DropTable(
                name: "USER");

            migrationBuilder.DropTable(
                name: "DICH_VU");

            migrationBuilder.DropTable(
                name: "XE");

            migrationBuilder.DropTable(
                name: "HOP_DONG");

            migrationBuilder.DropTable(
                name: "CU_DAN");

            migrationBuilder.DropTable(
                name: "PHONG");

            migrationBuilder.DropTable(
                name: "TANG");

            migrationBuilder.DropTable(
                name: "TOA_NHA");
        }
    }
}
