using System.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;

LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel. Docker sets ASPNETCORE_URLS=http://+:8080; local dev defaults to 5052.
var configuredUrls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
builder.WebHost.UseUrls(
    string.IsNullOrWhiteSpace(configuredUrls)
        ? ["http://0.0.0.0:5052"]
        : configuredUrls.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
);

// Add services to the container
builder.Services.AddScoped<backend.Filters.AuditLogActionFilter>();
builder.Services.AddControllers(options =>
    {
        options.Filters.AddService<backend.Filters.AuditLogActionFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new backend.Json.UtcDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new backend.Json.NullableUtcDateTimeJsonConverter());
    });

// Configure database. Supabase uses PostgreSQL; keep SQL Server as an explicit rollback option.
var databaseProvider = builder.Configuration["Database:Provider"] ?? "Postgres";
var databaseConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not configured");
var databaseSchema = builder.Configuration["Database:Schema"] ?? "proptech";

Console.WriteLine(DescribeDatabaseConnection(databaseProvider, databaseConnection, databaseSchema));

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (databaseProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(databaseConnection);
        return;
    }

    options.UseNpgsql(
        WithPostgresSearchPath(databaseConnection, databaseSchema),
        npgsql => npgsql.EnableRetryOnFailure());
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Allow SignalR to authenticate via query string (for WebSocket)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            // If the request is for our hub...
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs"))
            {
                // Read the token out of the query string
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Required for SignalR
    });
});

// Add SignalR
// Configure SignalR with longer timeout
builder.Services.AddSignalR(options =>
{
    options.KeepAliveInterval = TimeSpan.FromSeconds(15); // Send ping every 15s
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(60); // Client timeout after 60s
    options.HandshakeTimeout = TimeSpan.FromSeconds(30);
});

// Phase 1: Register Core Repositories
// Storage service: dung R2 neu da cau hinh day du, nguoc lai fallback luu local (/uploads).
if (backend.Services.R2StorageService.IsConfigured(builder.Configuration))
{
    builder.Services.AddSingleton<backend.Services.IStorageService, backend.Services.R2StorageService>();
    Console.WriteLine("🗄️  Storage: Cloudflare R2");
}
else
{
    builder.Services.AddSingleton<backend.Services.IStorageService, backend.Services.LocalStorageService>();
    Console.WriteLine("🗄️  Storage: Local disk (uploads/) - chua cau hinh R2");
}

builder.Services.AddScoped<backend.Repositories.IUserRepository, backend.Repositories.UserRepository>();
builder.Services.AddScoped<backend.Repositories.IBuildingRepository, backend.Repositories.BuildingRepository>();
builder.Services.AddScoped<backend.Repositories.IFloorRepository, backend.Repositories.FloorRepository>();
builder.Services.AddScoped<backend.Repositories.IRoomRepository, backend.Repositories.RoomRepository>();
builder.Services.AddScoped<backend.Repositories.IResidentRepository, backend.Repositories.ResidentRepository>();

// Phase 2: Contract & Invoice Repositories
builder.Services.AddScoped<backend.Repositories.IHopDongRepository, backend.Repositories.HopDongRepository>();
builder.Services.AddScoped<backend.Repositories.IChiTietORepository, backend.Repositories.ChiTietORepository>();
builder.Services.AddScoped<backend.Repositories.IServiceRepository, backend.Repositories.ServiceRepository>();
builder.Services.AddScoped<backend.Repositories.IHoaDonRepository, backend.Repositories.HoaDonRepository>();
builder.Services.AddScoped<backend.Repositories.IThanhToanRepository, backend.Repositories.ThanhToanRepository>();

// Phase 3: Additional Repositories
builder.Services.AddScoped<backend.Repositories.IXeRepository, backend.Repositories.XeRepository>();
builder.Services.AddScoped<backend.Repositories.IYeuCauSuaChuaRepository, backend.Repositories.YeuCauSuaChuaRepository>();
builder.Services.AddScoped<backend.Repositories.IChiTietSuDungDichVuRepository, backend.Repositories.ChiTietSuDungDichVuRepository>();

// Phase 4: Meter Readings & Settlement Repositories
builder.Services.AddScoped<backend.Repositories.IChiSoDienRepository, backend.Repositories.ChiSoDienRepository>();
builder.Services.AddScoped<backend.Repositories.IChiSoNuocRepository, backend.Repositories.ChiSoNuocRepository>();
builder.Services.AddScoped<backend.Repositories.ITatToanRepository, backend.Repositories.TatToanRepository>();
builder.Services.AddScoped<backend.Repositories.IChiTietPhieuTatToanRepository, backend.Repositories.ChiTietPhieuTatToanRepository>();
builder.Services.AddScoped<backend.Repositories.ITaiSanRepository, backend.Repositories.TaiSanRepository>();
builder.Services.AddScoped<backend.Repositories.IChiTietTaiSanPhongRepository, backend.Repositories.ChiTietTaiSanPhongRepository>();

// Tier 2: KnowledgeBase & Notifications
builder.Services.AddScoped<backend.Repositories.IKnowledgeBaseRepository, backend.Repositories.KnowledgeBaseRepository>();
builder.Services.AddScoped<backend.Repositories.INhatKyNhacNoRepository, backend.Repositories.NhatKyNhacNoRepository>();
builder.Services.AddScoped<backend.Repositories.IAuditLogRepository, backend.Repositories.AuditLogRepository>();
builder.Services.AddScoped<backend.Repositories.INotificationRepository, backend.Repositories.NotificationRepository>();

// Tier 3: Chatbot
builder.Services.AddScoped<backend.Repositories.ILichSuChatRepository, backend.Repositories.LichSuChatRepository>();

// Phase 1: Register Core Services
builder.Services.AddScoped<backend.Services.IJwtService, backend.Services.JwtService>();
builder.Services.AddScoped<backend.Services.IAuthService, backend.Services.AuthService>();
builder.Services.AddScoped<backend.Services.IBuildingService, backend.Services.BuildingService>();
builder.Services.AddScoped<backend.Services.IFloorService, backend.Services.FloorService>();
builder.Services.AddScoped<backend.Services.IRoomService, backend.Services.RoomService>();
builder.Services.AddScoped<backend.Services.IResidentService, backend.Services.ResidentService>();

// Phase 2: Contract & Invoice Services
builder.Services.AddScoped<backend.Services.IHopDongService, backend.Services.HopDongService>();
builder.Services.AddScoped<backend.Services.IChiTietOService, backend.Services.ChiTietOService>();
builder.Services.AddScoped<backend.Services.IServiceService, backend.Services.ServiceService>();
builder.Services.AddScoped<backend.Services.IHoaDonService, backend.Services.HoaDonService>();

// Phase 3: Additional Services
builder.Services.AddScoped<backend.Services.IThanhToanService, backend.Services.ThanhToanService>();
builder.Services.AddScoped<backend.Services.IXeService, backend.Services.XeService>();
builder.Services.AddScoped<backend.Services.IYeuCauSuaChuaService, backend.Services.YeuCauSuaChuaService>();
builder.Services.AddScoped<backend.Services.IChiTietSuDungDichVuService, backend.Services.ChiTietSuDungDichVuService>();
builder.Services.AddScoped<backend.Services.IPostService, backend.Services.PostService>();
builder.Services.AddScoped<backend.Services.IPostMessageService, backend.Services.PostMessageService>();

// Phase 4: Meter Readings & Settlement Services
builder.Services.AddScoped<backend.Services.IChiSoDienService, backend.Services.ChiSoDienService>();
builder.Services.AddScoped<backend.Services.IChiSoNuocService, backend.Services.ChiSoNuocService>();
builder.Services.AddScoped<backend.Services.ITatToanService, backend.Services.TatToanService>();
builder.Services.AddScoped<backend.Services.ITaiSanService, backend.Services.TaiSanService>();
builder.Services.AddScoped<backend.Services.IChiTietTaiSanPhongService, backend.Services.ChiTietTaiSanPhongService>();
builder.Services.AddScoped<backend.Services.IUserService, backend.Services.UserService>();

// Tier 2: KnowledgeBase & Notifications
builder.Services.AddScoped<backend.Services.IKnowledgeBaseService, backend.Services.KnowledgeBaseService>();
builder.Services.AddScoped<backend.Services.IChatbotIngestService, backend.Services.ChatbotIngestService>();
builder.Services.AddScoped<backend.Services.INhatKyNhacNoService, backend.Services.NhatKyNhacNoService>();
builder.Services.AddScoped<backend.Services.IAuditLogService, backend.Services.AuditLogService>();
builder.Services.AddScoped<backend.Services.INotificationService, backend.Services.NotificationService>();

// Tier 3: Chatbot & Reports
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<backend.Services.IChatService, backend.Services.ChatService>();
builder.Services.AddScoped<backend.Services.IReportService, backend.Services.ReportService>();

// PayOS Integration
var payOsSection = builder.Configuration.GetSection("PayOS");
builder.Services.AddSingleton(new PayOS.PayOSClient(
    payOsSection["ClientId"]!,
    payOsSection["ApiKey"]!,
    payOsSection["ChecksumKey"]!));
builder.Services.AddScoped<backend.Services.IPayOSService, backend.Services.PayOSService>();

// Payment Service (Realtime QR Payment)
builder.Services.AddScoped<backend.Services.IPaymentService, backend.Services.PaymentService>();

// VietQR Integration (bank info + QR generation)
builder.Services.AddSingleton<backend.Services.IVietQRService, backend.Services.VietQRService>();

// Utility Reading & Invoice Workflow Services
builder.Services.AddScoped<backend.Services.IUtilityReadingService, backend.Services.UtilityReadingService>();

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Apartment Management API",
        Version = "v1",
        Description = "RESTful API for Apartment Management System"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Ensure database schema and compatibility fixes on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        if (context.Database.IsNpgsql())
        {
            var createSchemaSql = "CREATE SCHEMA IF NOT EXISTS " + QuotePostgresIdentifier(databaseSchema) + ";";
            context.Database.ExecuteSqlRaw(createSchemaSql);
            if (!PostgresTableExists(context, databaseSchema, "BAI_DANG_TIM_PHONG"))
            {
                Console.WriteLine($"Creating PostgreSQL schema objects in '{databaseSchema}'...");
                context.Database.ExecuteSqlRaw(context.Database.GenerateCreateScript());
            }
        }

        // Ensure schema objects exist. With Supabase/Postgres this does not create a new database.
        Console.WriteLine(context.Database.IsNpgsql()
            ? $"Ensuring PostgreSQL schema '{databaseSchema}' exists..."
            : "Ensuring database exists...");
        context.Database.EnsureCreated();

        if (context.Database.IsSqlServer())
        {
        try
        {
            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('dbo.TOA_NHA', 'U') IS NOT NULL
                   AND COL_LENGTH('dbo.TOA_NHA', 'IS_DELETED') IS NULL
                    ALTER TABLE dbo.TOA_NHA ADD IS_DELETED bit NOT NULL CONSTRAINT DF_TOA_NHA_IS_DELETED DEFAULT 0 WITH VALUES;

                IF OBJECT_ID('dbo.TANG', 'U') IS NOT NULL
                   AND COL_LENGTH('dbo.TANG', 'IS_DELETED') IS NULL
                    ALTER TABLE dbo.TANG ADD IS_DELETED bit NOT NULL CONSTRAINT DF_TANG_IS_DELETED DEFAULT 0 WITH VALUES;
            """);
            Console.WriteLine("✅ Building/floor soft-delete columns ensured early");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Building/floor soft-delete column ensure failed: {ex.Message}");
        }

        // Ensure posts table exists before any later query touches it.
        // Some existing databases may have the rest of the schema but be missing this table.
        try
        {
            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('dbo.BAI_DANG_TIM_PHONG', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.BAI_DANG_TIM_PHONG (
                        BAI_DANG_ID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        PHONG_ID INT NOT NULL,
                        MA_PHONG NVARCHAR(50) NOT NULL,
                        TEN_TOA_NHA NVARCHAR(200) NOT NULL,
                        SO_TANG INT NOT NULL,
                        DIEN_TICH DECIMAL(10,2) NULL,
                        SO_NGUOI_TOI_DA INT NULL,
                        SO_NGUOI_DANG_O INT NULL,
                        TIEU_DE NVARCHAR(300) NOT NULL,
                        GIA_THUE DECIMAL(18,2) NOT NULL,
                        NGAY_DANG DATETIME2 NOT NULL,
                        NGAY_TAO DATETIME2 NOT NULL,
                        LUOT_XEM INT NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_LUOT_XEM DEFAULT(0),
                        TIN_NHAN INT NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_TIN_NHAN DEFAULT(0),
                        IS_LOCKED BIT NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_IS_LOCKED DEFAULT(0),
                        TRANG_THAI_BAI_DANG NVARCHAR(50) NOT NULL,
                        TRANG_THAI_PHONG NVARCHAR(50) NOT NULL,
                        KIEU_VAO_O NVARCHAR(20) NOT NULL,
                        NGAY_CO_THE_VAO_O DATETIME2 NULL,
                        CO_VUNG_NGAP_LUT BIT NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_CO_VUNG_NGAP_LUT DEFAULT(0),
                        YEU_CAU_CHU_NHA NVARCHAR(MAX) NULL,
                        KIEU_LIEN_HE NVARCHAR(20) NOT NULL,
                        TEN_LIEN_HE NVARCHAR(200) NOT NULL,
                        SO_DIEN_THOAI NVARCHAR(20) NOT NULL,
                        DICH_VU_JSON NVARCHAR(MAX) NOT NULL,
                        ANH_JSON NVARCHAR(MAX) NOT NULL,
                        ANH_BIA_URL NVARCHAR(1000) NULL,
                        TAO_BOI_ID INT NULL,
                        XOA_BOI_KIEM_DUYET_LUC DATETIME2 NULL,
                        LY_DO_XOA_KIEM_DUYET NVARCHAR(500) NULL,
                        NGUON_XOA NVARCHAR(50) NULL,
                        CONSTRAINT FK_BAI_DANG_TIM_PHONG_PHONG FOREIGN KEY (PHONG_ID) REFERENCES PHONG(PHONG_ID) ON DELETE CASCADE,
                        CONSTRAINT FK_BAI_DANG_TIM_PHONG_USER FOREIGN KEY (TAO_BOI_ID) REFERENCES [USER](USER_ID) ON DELETE SET NULL
                    );
                END;
            """);
            Console.WriteLine("✅ Posts table ensured early");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Posts table ensure failed: {ex.Message}");
        }

        try
        {
            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH('dbo.notifications', 'owner_user_id') IS NULL
                        ALTER TABLE dbo.notifications ADD owner_user_id INT NULL;

                    IF NOT EXISTS (
                        SELECT 1 FROM sys.indexes
                        WHERE name = 'IX_notifications_owner_user_id'
                          AND object_id = OBJECT_ID('dbo.notifications')
                    )
                        CREATE INDEX IX_notifications_owner_user_id ON dbo.notifications(owner_user_id);

                    EXEC(N'
                        UPDATE n
                        SET owner_user_id = COALESCE(
                            recipient.OWNER_USER_ID,
                            recipient.USER_ID,
                            sender.OWNER_USER_ID,
                            sender.USER_ID
                        )
                        FROM dbo.notifications n
                        LEFT JOIN [USER] recipient ON recipient.USER_ID = n.recipient_id
                        LEFT JOIN [USER] sender ON sender.USER_ID = n.user_id
                        WHERE n.owner_user_id IS NULL
                          AND COALESCE(recipient.OWNER_USER_ID, recipient.USER_ID, sender.OWNER_USER_ID, sender.USER_ID) IS NOT NULL;
                    ');
                END;
            """);
            Console.WriteLine("Notification owner scope ensured early");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Notification owner scope ensure failed: {ex.Message}");
        }

        // Apply column additions for existing databases
        try {
            context.Database.ExecuteSqlRaw("""
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOA_DON') AND name = 'APPROVED_BY')
                    ALTER TABLE HOA_DON ADD APPROVED_BY INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOA_DON') AND name = 'APPROVED_AT')
                    ALTER TABLE HOA_DON ADD APPROVED_AT DATETIME2 NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOA_DON') AND name = 'REJECTED_REASON')
                    ALTER TABLE HOA_DON ADD REJECTED_REASON NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'SO_NGUOI_TOI_DA')
                    ALTER TABLE PHONG ADD SO_NGUOI_TOI_DA INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'GIA_DICH_VU_JSON')
                    ALTER TABLE PHONG ADD GIA_DICH_VU_JSON NVARCHAR(MAX) NOT NULL
                        CONSTRAINT DF_PHONG_GIA_DICH_VU_JSON DEFAULT(N'[]') WITH VALUES;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'DIA_CHI_PHONG')
                    ALTER TABLE PHONG ADD DIA_CHI_PHONG NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'VI_DO')
                    ALTER TABLE PHONG ADD VI_DO FLOAT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'KINH_DO')
                    ALTER TABLE PHONG ADD KINH_DO FLOAT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'DIA_CHI_CHUAN_HOA')
                    ALTER TABLE PHONG ADD DIA_CHI_CHUAN_HOA NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'GOONG_PLACE_ID')
                    ALTER TABLE PHONG ADD GOONG_PLACE_ID NVARCHAR(255) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'NGUON_VI_TRI')
                    ALTER TABLE PHONG ADD NGUON_VI_TRI NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'DO_CHINH_XAC_VI_TRI')
                    ALTER TABLE PHONG ADD DO_CHINH_XAC_VI_TRI NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'XAC_NHAN_VI_TRI_LUC')
                    ALTER TABLE PHONG ADD XAC_NHAN_VI_TRI_LUC DATETIME2 NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('PHONG') AND name = 'BAN_KINH_QUET_VI_TRI_M')
                    ALTER TABLE PHONG ADD BAN_KINH_QUET_VI_TRI_M INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'DA_NOP_TIEN_COC')
                    ALTER TABLE HOP_DONG ADD DA_NOP_TIEN_COC BIT NOT NULL
                        CONSTRAINT DF_HOP_DONG_DA_NOP_TIEN_COC DEFAULT(0) WITH VALUES;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'CAP_NHAT_LUC')
                    ALTER TABLE HOP_DONG ADD CAP_NHAT_LUC DATETIME2 NULL;
                IF OBJECT_ID('dbo.LICH_SU_CHINH_SUA_HOP_DONG', 'U') IS NULL
                BEGIN
                    CREATE TABLE dbo.LICH_SU_CHINH_SUA_HOP_DONG (
                        LICH_SU_ID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        HOP_DONG_ID INT NOT NULL,
                        PHIEN_BAN INT NOT NULL,
                        TOM_TAT NVARCHAR(500) NOT NULL,
                        DU_LIEU_JSON NVARCHAR(MAX) NOT NULL,
                        CAP_NHAT_BOI_ID INT NULL,
                        TEN_NGUOI_CAP_NHAT NVARCHAR(200) NULL,
                        CAP_NHAT_LUC DATETIME2 NOT NULL,
                        CONSTRAINT FK_LICH_SU_CHINH_SUA_HOP_DONG_HOP_DONG
                            FOREIGN KEY (HOP_DONG_ID) REFERENCES HOP_DONG(HOP_DONG_ID) ON DELETE CASCADE,
                        CONSTRAINT UQ_LICH_SU_CHINH_SUA_HOP_DONG_VERSION UNIQUE (HOP_DONG_ID, PHIEN_BAN)
                    );
                END;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'MA_HOP_DONG')
                    ALTER TABLE HOP_DONG ADD MA_HOP_DONG NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'NGAY_THANH_TOAN_HANG_THANG')
                    ALTER TABLE HOP_DONG ADD NGAY_THANH_TOAN_HANG_THANG INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'CONG_THUC_HOA_DON_JSON')
                    ALTER TABLE HOP_DONG ADD CONG_THUC_HOA_DON_JSON NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[USER]') AND name = 'MUST_CHANGE_PASSWORD')
                    ALTER TABLE [USER] ADD MUST_CHANGE_PASSWORD BIT NOT NULL CONSTRAINT DF_USER_MUST_CHANGE_PASSWORD DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[USER]') AND name = 'OWNER_USER_ID')
                    ALTER TABLE [USER] ADD OWNER_USER_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TOA_NHA') AND name = 'OWNER_USER_ID')
                    ALTER TABLE TOA_NHA ADD OWNER_USER_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TOA_NHA') AND name = 'VI_DO')
                    ALTER TABLE TOA_NHA ADD VI_DO FLOAT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TOA_NHA') AND name = 'KINH_DO')
                    ALTER TABLE TOA_NHA ADD KINH_DO FLOAT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DICH_VU') AND name = 'OWNER_USER_ID')
                    ALTER TABLE DICH_VU ADD OWNER_USER_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CU_DAN') AND name = 'OWNER_USER_ID')
                    ALTER TABLE CU_DAN ADD OWNER_USER_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TAI_SAN') AND name = 'OWNER_USER_ID')
                    ALTER TABLE TAI_SAN ADD OWNER_USER_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('KNOWLEDGE_BASE') AND name = 'OWNER_USER_ID')
                    ALTER TABLE KNOWLEDGE_BASE ADD OWNER_USER_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[USER]') AND name = 'TEN_HIEN_THI')
                    ALTER TABLE [USER] ADD TEN_HIEN_THI NVARCHAR(200) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LICH_SU_CHAT') AND name = 'IS_KNOWLEDGE_GAP')
                    ALTER TABLE LICH_SU_CHAT ADD IS_KNOWLEDGE_GAP BIT NOT NULL CONSTRAINT DF_LICH_SU_CHAT_IS_KNOWLEDGE_GAP DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'TIEN_NGHI_JSON')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD TIEN_NGHI_JSON NVARCHAR(MAX) NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_TIEN_NGHI_JSON DEFAULT('[]');
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'LUOT_XEM')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD LUOT_XEM INT NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_LUOT_XEM DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'TIN_NHAN')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD TIN_NHAN INT NOT NULL CONSTRAINT DF_BAI_DANG_TIM_PHONG_TIN_NHAN DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'SO_NGUOI_DANG_O')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD SO_NGUOI_DANG_O INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'XOA_BOI_KIEM_DUYET_LUC')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD XOA_BOI_KIEM_DUYET_LUC DATETIME2 NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'LY_DO_XOA_KIEM_DUYET')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD LY_DO_XOA_KIEM_DUYET NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('BAI_DANG_TIM_PHONG') AND name = 'NGUON_XOA')
                    ALTER TABLE BAI_DANG_TIM_PHONG ADD NGUON_XOA NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('YEU_CAU_SUA_CHUA') AND name = 'UPDATED_AT')
                    ALTER TABLE YEU_CAU_SUA_CHUA ADD UPDATED_AT DATETIME2 NOT NULL CONSTRAINT DF_YCSC_UPDATED_AT DEFAULT(GETUTCDATE());
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('THANH_TOAN') AND name = 'NOI_DUNG_CHUYEN_KHOAN')
                    ALTER TABLE THANH_TOAN ADD NOI_DUNG_CHUYEN_KHOAN NVARCHAR(255) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CHI_SO_DIEN') AND name = 'IS_ANOMALY')
                    ALTER TABLE CHI_SO_DIEN ADD IS_ANOMALY BIT NOT NULL CONSTRAINT DF_CHI_SO_DIEN_IS_ANOMALY DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CHI_SO_DIEN') AND name = 'ANOMALY_NOTE')
                    ALTER TABLE CHI_SO_DIEN ADD ANOMALY_NOTE NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CHI_SO_NUOC') AND name = 'IS_ANOMALY')
                    ALTER TABLE CHI_SO_NUOC ADD IS_ANOMALY BIT NOT NULL CONSTRAINT DF_CHI_SO_NUOC_IS_ANOMALY DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('CHI_SO_NUOC') AND name = 'ANOMALY_NOTE')
                    ALTER TABLE CHI_SO_NUOC ADD ANOMALY_NOTE NVARCHAR(500) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('DICH_VU') AND name = 'BUILDING_ID')
                    ALTER TABLE DICH_VU ADD BUILDING_ID INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TAI_SAN') AND name = 'BUILDING_ID')
                    ALTER TABLE TAI_SAN ADD BUILDING_ID INT NULL;
                IF OBJECT_ID('dbo.DICH_VU_TOA_NHA', 'U') IS NULL
                    CREATE TABLE dbo.DICH_VU_TOA_NHA (
                        DICH_VU_ID INT NOT NULL,
                        TOA_NHA_ID INT NOT NULL,
                        CONSTRAINT PK_DICH_VU_TOA_NHA PRIMARY KEY (DICH_VU_ID, TOA_NHA_ID),
                        CONSTRAINT FK_DICH_VU_TOA_NHA_DICH_VU FOREIGN KEY (DICH_VU_ID) REFERENCES DICH_VU(DICH_VU_ID) ON DELETE CASCADE,
                        CONSTRAINT FK_DICH_VU_TOA_NHA_TOA_NHA FOREIGN KEY (TOA_NHA_ID) REFERENCES TOA_NHA(TOA_NHA_ID) ON DELETE CASCADE
                    );
                IF OBJECT_ID('dbo.TAI_SAN_TOA_NHA', 'U') IS NULL
                    CREATE TABLE dbo.TAI_SAN_TOA_NHA (
                        TAI_SAN_ID INT NOT NULL,
                        TOA_NHA_ID INT NOT NULL,
                        CONSTRAINT PK_TAI_SAN_TOA_NHA PRIMARY KEY (TAI_SAN_ID, TOA_NHA_ID),
                        CONSTRAINT FK_TAI_SAN_TOA_NHA_TAI_SAN FOREIGN KEY (TAI_SAN_ID) REFERENCES TAI_SAN(TAI_SAN_ID) ON DELETE CASCADE,
                        CONSTRAINT FK_TAI_SAN_TOA_NHA_TOA_NHA FOREIGN KEY (TOA_NHA_ID) REFERENCES TOA_NHA(TOA_NHA_ID) ON DELETE CASCADE
                    );
            """);
            Console.WriteLine("✅ HOA_DON columns ensured");

            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('dbo.BAI_DANG_TIM_PHONG', 'U') IS NOT NULL
                   AND OBJECT_ID('dbo.PHONG', 'U') IS NOT NULL
                BEGIN
                    IF OBJECT_ID('dbo.HOP_DONG', 'U') IS NOT NULL
                    BEGIN
                        UPDATE p
                        SET TRANG_THAI = N'Đã thuê'
                        FROM PHONG p
                        WHERE EXISTS (
                            SELECT 1
                            FROM HOP_DONG hd
                            WHERE hd.PHONG_ID = p.PHONG_ID
                              AND (hd.NGAY_KET_THUC_DU_KIEN IS NULL OR hd.NGAY_KET_THUC_DU_KIEN > SYSUTCDATETIME())
                        );

                        UPDATE p
                        SET TRANG_THAI = N'Trống'
                        FROM PHONG p
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM HOP_DONG hd
                            WHERE hd.PHONG_ID = p.PHONG_ID
                              AND (hd.NGAY_KET_THUC_DU_KIEN IS NULL OR hd.NGAY_KET_THUC_DU_KIEN > SYSUTCDATETIME())
                        )
                        AND (
                            LOWER(LTRIM(RTRIM(p.TRANG_THAI))) LIKE N'%thuê%'
                            OR LOWER(LTRIM(RTRIM(p.TRANG_THAI))) LIKE N'%thuÃª%'
                            OR LOWER(LTRIM(RTRIM(p.TRANG_THAI))) LIKE N'%thue%'
                            OR LOWER(LTRIM(RTRIM(p.TRANG_THAI))) IN ('rented', 'occupied')
                        );

                        UPDATE bd
                        SET IS_LOCKED = CASE
                                WHEN bd.TRANG_THAI_BAI_DANG = 'deleted' THEN 1
                                WHEN active_room.PHONG_ID IS NULL THEN 0
                                WHEN creator.VAI_TRO = 'CuDan' OR ISNULL(bd.SO_NGUOI_DANG_O, 0) > 0 THEN 0
                                ELSE 1
                            END,
                            TRANG_THAI_BAI_DANG = CASE
                                WHEN bd.TRANG_THAI_BAI_DANG = 'deleted' THEN 'deleted'
                                WHEN active_room.PHONG_ID IS NULL THEN 'active'
                                WHEN creator.VAI_TRO = 'CuDan' OR ISNULL(bd.SO_NGUOI_DANG_O, 0) > 0 THEN 'active'
                                ELSE 'paused'
                            END,
                            TRANG_THAI_PHONG = p.TRANG_THAI
                        FROM BAI_DANG_TIM_PHONG bd
                        INNER JOIN PHONG p ON p.PHONG_ID = bd.PHONG_ID
                        LEFT JOIN [USER] creator ON creator.USER_ID = bd.TAO_BOI_ID
                        OUTER APPLY (
                            SELECT TOP 1 hd.PHONG_ID
                            FROM HOP_DONG hd
                            WHERE hd.PHONG_ID = bd.PHONG_ID
                              AND (hd.NGAY_KET_THUC_DU_KIEN IS NULL OR hd.NGAY_KET_THUC_DU_KIEN > SYSUTCDATETIME())
                        ) active_room;
                    END
                    ELSE
                    BEGIN
                        UPDATE bd
                        SET IS_LOCKED = CASE WHEN bd.TRANG_THAI_BAI_DANG = 'deleted' THEN 1 ELSE 0 END,
                            TRANG_THAI_BAI_DANG = CASE WHEN bd.TRANG_THAI_BAI_DANG = 'deleted' THEN 'deleted' ELSE 'active' END,
                            TRANG_THAI_PHONG = p.TRANG_THAI
                        FROM BAI_DANG_TIM_PHONG bd
                        INNER JOIN PHONG p ON p.PHONG_ID = bd.PHONG_ID;
                    END
                END;
            """);
            Console.WriteLine("Post lock and room status consistency ensured");

            context.Database.ExecuteSqlRaw("""
                DECLARE @DefaultOwnerUserId INT = (
                    SELECT TOP 1 USER_ID
                    FROM [USER]
                    WHERE VAI_TRO IN (N'Admin', N'QuanLy')
                    ORDER BY CASE WHEN VAI_TRO = N'Admin' THEN 0 ELSE 1 END, USER_ID
                );

                IF @DefaultOwnerUserId IS NOT NULL
                BEGIN
                    UPDATE TOA_NHA SET OWNER_USER_ID = @DefaultOwnerUserId WHERE OWNER_USER_ID IS NULL;
                    UPDATE DICH_VU SET OWNER_USER_ID = @DefaultOwnerUserId WHERE OWNER_USER_ID IS NULL;
                    UPDATE CU_DAN SET OWNER_USER_ID = @DefaultOwnerUserId WHERE OWNER_USER_ID IS NULL;
                    UPDATE TAI_SAN SET OWNER_USER_ID = @DefaultOwnerUserId WHERE OWNER_USER_ID IS NULL;
                    UPDATE KNOWLEDGE_BASE SET OWNER_USER_ID = @DefaultOwnerUserId WHERE OWNER_USER_ID IS NULL;
                END;

                UPDATE ts
                SET OWNER_USER_ID = room_owner.OWNER_USER_ID
                FROM TAI_SAN ts
                INNER JOIN (
                    SELECT cttsp.TAI_SAN_ID, MIN(tn.OWNER_USER_ID) AS OWNER_USER_ID
                    FROM CHI_TIET_TAI_SAN_PHONG cttsp
                    INNER JOIN PHONG p ON p.PHONG_ID = cttsp.PHONG_ID
                    INNER JOIN TANG t ON t.TANG_ID = p.TANG_ID
                    INNER JOIN TOA_NHA tn ON tn.TOA_NHA_ID = t.TOA_NHA_ID
                    WHERE tn.OWNER_USER_ID IS NOT NULL
                    GROUP BY cttsp.TAI_SAN_ID
                ) room_owner ON room_owner.TAI_SAN_ID = ts.TAI_SAN_ID
                WHERE ts.OWNER_USER_ID IS NULL OR ts.OWNER_USER_ID <> room_owner.OWNER_USER_ID;

                UPDATE [USER]
                SET OWNER_USER_ID = USER_ID
                WHERE OWNER_USER_ID IS NULL
                  AND VAI_TRO IN (N'Admin', N'QuanLy', N'KeToan', N'NhanVien');

                UPDATE u
                SET OWNER_USER_ID = cd.OWNER_USER_ID
                FROM [USER] u
                INNER JOIN CU_DAN cd ON cd.CU_DAN_ID = u.CU_DAN_ID
                WHERE u.OWNER_USER_ID IS NULL
                  AND cd.OWNER_USER_ID IS NOT NULL;

                UPDATE u
                SET TEN_HIEN_THI = cd.HO_TEN
                FROM [USER] u
                INNER JOIN CU_DAN cd ON cd.CU_DAN_ID = u.CU_DAN_ID
                WHERE (u.TEN_HIEN_THI IS NULL OR LTRIM(RTRIM(u.TEN_HIEN_THI)) = '')
                  AND cd.HO_TEN IS NOT NULL
                  AND LTRIM(RTRIM(cd.HO_TEN)) <> '';

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TOA_NHA_TEN_TOA_NHA' AND object_id = OBJECT_ID('TOA_NHA'))
                    DROP INDEX IX_TOA_NHA_TEN_TOA_NHA ON TOA_NHA;
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PHONG_MA_PHONG' AND object_id = OBJECT_ID('PHONG'))
                    DROP INDEX IX_PHONG_MA_PHONG ON PHONG;
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TAI_SAN_MA_TAI_SAN' AND object_id = OBJECT_ID('TAI_SAN'))
                    DROP INDEX IX_TAI_SAN_MA_TAI_SAN ON TAI_SAN;
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TAI_SAN_AssetCode' AND object_id = OBJECT_ID('TAI_SAN'))
                    DROP INDEX IX_TAI_SAN_AssetCode ON TAI_SAN;
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TaiSans_AssetCode' AND object_id = OBJECT_ID('TAI_SAN'))
                    DROP INDEX IX_TaiSans_AssetCode ON TAI_SAN;

                IF COL_LENGTH('TOA_NHA', 'IS_DELETED') IS NULL
                    ALTER TABLE TOA_NHA ADD IS_DELETED bit NOT NULL CONSTRAINT DF_TOA_NHA_IS_DELETED DEFAULT 0;
                IF COL_LENGTH('TANG', 'IS_DELETED') IS NULL
                    ALTER TABLE TANG ADD IS_DELETED bit NOT NULL CONSTRAINT DF_TANG_IS_DELETED DEFAULT 0;

                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA' AND object_id = OBJECT_ID('TOA_NHA'))
                    DROP INDEX IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA ON TOA_NHA;
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TANG_TOA_NHA_ID_SO_TANG' AND object_id = OBJECT_ID('TANG'))
                    DROP INDEX IX_TANG_TOA_NHA_ID_SO_TANG ON TANG;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA_ACTIVE' AND object_id = OBJECT_ID('TOA_NHA'))
                    CREATE UNIQUE INDEX IX_TOA_NHA_OWNER_USER_ID_TEN_TOA_NHA_ACTIVE ON TOA_NHA(OWNER_USER_ID, TEN_TOA_NHA) WHERE IS_DELETED = 0;
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TANG_TOA_NHA_ID_SO_TANG_ACTIVE' AND object_id = OBJECT_ID('TANG'))
                    CREATE UNIQUE INDEX IX_TANG_TOA_NHA_ID_SO_TANG_ACTIVE ON TANG(TOA_NHA_ID, SO_TANG) WHERE IS_DELETED = 0;
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PHONG_TANG_ID_MA_PHONG' AND object_id = OBJECT_ID('PHONG'))
                    DROP INDEX IX_PHONG_TANG_ID_MA_PHONG ON PHONG;
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PHONG_TANG_ID_MA_PHONG_ACTIVE' AND object_id = OBJECT_ID('PHONG'))
                    CREATE UNIQUE INDEX IX_PHONG_TANG_ID_MA_PHONG_ACTIVE ON PHONG(TANG_ID, MA_PHONG) WHERE TRANG_THAI <> N'Đã xóa';
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_DICH_VU_OWNER_USER_ID_TEN_DICH_VU' AND object_id = OBJECT_ID('DICH_VU'))
                    DROP INDEX IX_DICH_VU_OWNER_USER_ID_TEN_DICH_VU ON DICH_VU;
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TAI_SAN_OWNER_USER_ID_MA_TAI_SAN' AND object_id = OBJECT_ID('TAI_SAN'))
                    CREATE UNIQUE INDEX IX_TAI_SAN_OWNER_USER_ID_MA_TAI_SAN ON TAI_SAN(OWNER_USER_ID, MA_TAI_SAN) WHERE OWNER_USER_ID IS NOT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_KNOWLEDGE_BASE_OWNER_USER_ID' AND object_id = OBJECT_ID('KNOWLEDGE_BASE'))
                    CREATE INDEX IX_KNOWLEDGE_BASE_OWNER_USER_ID ON KNOWLEDGE_BASE(OWNER_USER_ID);
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_USER_OWNER_USER_ID' AND object_id = OBJECT_ID('[USER]'))
                    CREATE INDEX IX_USER_OWNER_USER_ID ON [USER](OWNER_USER_ID);

                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TOA_NHA_USER_OWNER_USER_ID')
                    ALTER TABLE TOA_NHA ADD CONSTRAINT FK_TOA_NHA_USER_OWNER_USER_ID FOREIGN KEY (OWNER_USER_ID) REFERENCES [USER](USER_ID) ON DELETE SET NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_DICH_VU_USER_OWNER_USER_ID')
                    ALTER TABLE DICH_VU ADD CONSTRAINT FK_DICH_VU_USER_OWNER_USER_ID FOREIGN KEY (OWNER_USER_ID) REFERENCES [USER](USER_ID) ON DELETE SET NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_CU_DAN_USER_OWNER_USER_ID')
                    ALTER TABLE CU_DAN ADD CONSTRAINT FK_CU_DAN_USER_OWNER_USER_ID FOREIGN KEY (OWNER_USER_ID) REFERENCES [USER](USER_ID) ON DELETE SET NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TAI_SAN_USER_OWNER_USER_ID')
                    ALTER TABLE TAI_SAN ADD CONSTRAINT FK_TAI_SAN_USER_OWNER_USER_ID FOREIGN KEY (OWNER_USER_ID) REFERENCES [USER](USER_ID) ON DELETE SET NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_KNOWLEDGE_BASE_USER_OWNER_USER_ID')
                    ALTER TABLE KNOWLEDGE_BASE ADD CONSTRAINT FK_KNOWLEDGE_BASE_USER_OWNER_USER_ID FOREIGN KEY (OWNER_USER_ID) REFERENCES [USER](USER_ID) ON DELETE NO ACTION;
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_USER_USER_OWNER_USER_ID')
                    ALTER TABLE [USER] ADD CONSTRAINT FK_USER_USER_OWNER_USER_ID FOREIGN KEY (OWNER_USER_ID) REFERENCES [USER](USER_ID);
            """);
            Console.WriteLine("Owner scope columns ensured");

            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('notifications', 'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH('notifications', 'owner_user_id') IS NULL
                        ALTER TABLE notifications ADD owner_user_id INT NULL;
                END;
            """);

            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('notifications', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.indexes
                        WHERE name = 'IX_notifications_owner_user_id'
                          AND object_id = OBJECT_ID('notifications')
                    )
                        CREATE INDEX IX_notifications_owner_user_id ON notifications(owner_user_id);
                END;
            """);

            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('notifications', 'U') IS NOT NULL
                   AND COL_LENGTH('notifications', 'owner_user_id') IS NOT NULL
                BEGIN
                    EXEC(N'
                        UPDATE n
                        SET owner_user_id = COALESCE(recipient.OWNER_USER_ID, sender.OWNER_USER_ID, sender.USER_ID)
                        FROM notifications n
                        LEFT JOIN [USER] recipient ON recipient.USER_ID = n.recipient_id
                        LEFT JOIN [USER] sender ON sender.USER_ID = n.user_id
                        WHERE n.owner_user_id IS NULL
                          AND COALESCE(recipient.OWNER_USER_ID, sender.OWNER_USER_ID, sender.USER_ID) IS NOT NULL;
                    ');
                END;
            """);
            
            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('notifications', 'U') IS NOT NULL
                BEGIN
                    EXEC(N'
                        UPDATE notifications
                        SET scope_type = ''USER''
                        WHERE scope_type IS NULL OR LTRIM(RTRIM(scope_type)) = '''';

                        UPDATE notifications
                        SET priority = ''NORMAL''
                        WHERE priority IS NULL OR LTRIM(RTRIM(priority)) = '''';

                        UPDATE notifications
                        SET notification_type = ''SYSTEM''
                        WHERE notification_type IS NULL OR LTRIM(RTRIM(notification_type)) = '''';

                        UPDATE notifications
                        SET title = N''Thong bao''
                        WHERE title IS NULL OR LTRIM(RTRIM(title)) = '''';

                        UPDATE notifications
                        SET content = N''''
                        WHERE content IS NULL;

                        UPDATE notifications
                        SET sent_at = COALESCE(sent_at, created_at, SYSUTCDATETIME())
                        WHERE sent_at IS NULL;

                        UPDATE notifications
                        SET created_at = COALESCE(created_at, sent_at, SYSUTCDATETIME())
                        WHERE created_at IS NULL;

                        IF COL_LENGTH(''notifications'', ''is_read'') IS NOT NULL
                        BEGIN
                            UPDATE notifications
                            SET is_read = 0
                            WHERE is_read IS NULL;
                        END
                    ');
                END;
            """);
            Console.WriteLine("Notification owner scope ensured");

            context.Database.ExecuteSqlRaw("""
                UPDATE HOP_DONG
                SET MA_HOP_DONG = CONCAT('HD-', YEAR(GETDATE()), '-', RIGHT(CONCAT('00000', CAST(HOP_DONG_ID AS VARCHAR(10))), 5))
                WHERE MA_HOP_DONG IS NULL OR LTRIM(RTRIM(MA_HOP_DONG)) = '';
            """);
            Console.WriteLine("✅ Contract codes ensured");

            context.Database.ExecuteSqlRaw(@"
                UPDATE [USER]
                SET EMAIL = NULL
                WHERE VAI_TRO = N'CuDan'
                  AND SO_DIEN_THOAI IS NOT NULL
                  AND LOWER(LTRIM(RTRIM(EMAIL))) = LOWER(CONCAT(REPLACE(SO_DIEN_THOAI, ' ', ''), '@resident.local'));
            ");
            Console.WriteLine("✅ Legacy resident placeholder emails removed");

        } catch (Exception colEx) {
            Console.WriteLine($"⚠️ Column migration note: {colEx.Message}");
        }
        
        }
        else
        {
            EnsurePostgresCompatibility(context, databaseSchema);
            Console.WriteLine("PostgreSQL compatibility patches ensured.");
        }

        // Runtime data must come from real user actions, API integrations,
        // or explicit migration scripts.
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error ensuring database schema: {ex.Message}");
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Apartment Management API v1");
    });
}

// Disable HTTPS redirect for mobile development
// app.UseHttpsRedirection();

app.UseCors("AllowAll");

// Serve static files from uploads folder
var configuredUploadsPath = builder.Configuration["Uploads:RootPath"];
var uploadsPath = string.IsNullOrWhiteSpace(configuredUploadsPath)
    ? Path.Combine(builder.Environment.ContentRootPath, "uploads")
    : Environment.ExpandEnvironmentVariables(configuredUploadsPath);
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine($"📁 Created uploads directory: {uploadsPath}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.MapGet("/placeholder.svg", () => Results.Content(
    """
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
      <rect width="960" height="720" fill="#f1f5f9"/>
      <rect x="120" y="150" width="720" height="420" rx="24" fill="#e2e8f0"/>
      <path d="M230 500l145-150 110 105 88-85 155 130H230z" fill="#cbd5e1"/>
      <circle cx="660" cy="280" r="52" fill="#94a3b8"/>
      <text x="480" y="630" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#475569">Không có ảnh</text>
    </svg>
    """,
    "image/svg+xml; charset=utf-8"
));

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<backend.Hubs.NotificationHub>("/hubs/notifications");

app.Run();

static string WithPostgresSearchPath(string connectionString, string schema)
{
    var builder = new NpgsqlConnectionStringBuilder(connectionString)
    {
        SearchPath = string.IsNullOrWhiteSpace(schema) ? "proptech" : schema.Trim()
    };
    return builder.ConnectionString;
}

static string DescribeDatabaseConnection(string provider, string connectionString, string schema)
{
    if (provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
    {
        var builder = new NpgsqlConnectionStringBuilder(connectionString);
        return "Database config: " +
            $"provider=Postgres; host={builder.Host}; port={builder.Port}; " +
            $"database={builder.Database}; username={builder.Username}; schema={schema}";
    }

    return $"Database config: provider={provider}; connection string configured";
}

static bool PostgresTableExists(ApplicationDbContext context, string schema, string table)
{
    var connection = context.Database.GetDbConnection();
    var shouldClose = connection.State != ConnectionState.Open;
    if (shouldClose)
    {
        connection.Open();
    }

    try
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT to_regclass(@table_name)::text;";
        var parameter = command.CreateParameter();
        parameter.ParameterName = "table_name";
        parameter.Value = QuotePostgresIdentifier(schema) + "." + QuotePostgresIdentifier(table);
        command.Parameters.Add(parameter);
        var result = command.ExecuteScalar();
        return result != null && result != DBNull.Value;
    }
    finally
    {
        if (shouldClose)
        {
            connection.Close();
        }
    }
}

static string QuotePostgresIdentifier(string identifier)
{
    var clean = string.IsNullOrWhiteSpace(identifier) ? "proptech" : identifier.Trim();
    return "\"" + clean.Replace("\"", "\"\"") + "\"";
}

static void EnsurePostgresCompatibility(ApplicationDbContext context, string schemaName)
{
    var schema = QuotePostgresIdentifier(schemaName);

    var sql = $$"""
        ALTER TABLE IF EXISTS {{schema}}."TOA_NHA"
            ADD COLUMN IF NOT EXISTS "OWNER_USER_ID" integer,
            ADD COLUMN IF NOT EXISTS "VI_DO" double precision,
            ADD COLUMN IF NOT EXISTS "KINH_DO" double precision,
            ADD COLUMN IF NOT EXISTS "IS_DELETED" boolean NOT NULL DEFAULT false;

        ALTER TABLE IF EXISTS {{schema}}."TANG"
            ADD COLUMN IF NOT EXISTS "IS_DELETED" boolean NOT NULL DEFAULT false;

        ALTER TABLE IF EXISTS {{schema}}."PHONG"
            ADD COLUMN IF NOT EXISTS "SO_NGUOI_TOI_DA" integer,
            ADD COLUMN IF NOT EXISTS "GIA_DICH_VU_JSON" text NOT NULL DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS "DIA_CHI_PHONG" character varying(500),
            ADD COLUMN IF NOT EXISTS "VI_DO" double precision,
            ADD COLUMN IF NOT EXISTS "KINH_DO" double precision,
            ADD COLUMN IF NOT EXISTS "DIA_CHI_CHUAN_HOA" character varying(500),
            ADD COLUMN IF NOT EXISTS "GOONG_PLACE_ID" character varying(255),
            ADD COLUMN IF NOT EXISTS "NGUON_VI_TRI" character varying(50),
            ADD COLUMN IF NOT EXISTS "DO_CHINH_XAC_VI_TRI" character varying(50),
            ADD COLUMN IF NOT EXISTS "XAC_NHAN_VI_TRI_LUC" timestamp without time zone,
            ADD COLUMN IF NOT EXISTS "BAN_KINH_QUET_VI_TRI_M" integer;

        ALTER TABLE IF EXISTS {{schema}}."HOP_DONG"
            ADD COLUMN IF NOT EXISTS "MA_HOP_DONG" character varying(50),
            ADD COLUMN IF NOT EXISTS "DA_NOP_TIEN_COC" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "NGAY_THANH_TOAN_HANG_THANG" integer,
            ADD COLUMN IF NOT EXISTS "CONG_THUC_HOA_DON_JSON" text,
            ADD COLUMN IF NOT EXISTS "CAP_NHAT_LUC" timestamp without time zone;

        ALTER TABLE IF EXISTS {{schema}}."CU_DAN"
            ADD COLUMN IF NOT EXISTS "OWNER_USER_ID" integer,
            ADD COLUMN IF NOT EXISTS "CCCD_FRONT_URL" character varying(500),
            ADD COLUMN IF NOT EXISTS "CCCD_BACK_URL" character varying(500);

        ALTER TABLE IF EXISTS {{schema}}."USER"
            ADD COLUMN IF NOT EXISTS "OWNER_USER_ID" integer,
            ADD COLUMN IF NOT EXISTS "MUST_CHANGE_PASSWORD" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "TEN_HIEN_THI" character varying(200);

        ALTER TABLE IF EXISTS {{schema}}."DICH_VU"
            ADD COLUMN IF NOT EXISTS "DON_GIA_CHUNG" numeric(18,2),
            ADD COLUMN IF NOT EXISTS "NGAY_AP_DUNG" timestamp without time zone,
            ADD COLUMN IF NOT EXISTS "OWNER_USER_ID" integer,
            ADD COLUMN IF NOT EXISTS "BUILDING_ID" integer;

        ALTER TABLE IF EXISTS {{schema}}."CHI_TIET_SU_DUNG_DICH_VU"
            ADD COLUMN IF NOT EXISTS "XE_ID" integer,
            ADD COLUMN IF NOT EXISTS "OVERRIDE_DON_GIA" numeric(18,2),
            ADD COLUMN IF NOT EXISTS "SO_LUONG" numeric(10,2) DEFAULT 1,
            ADD COLUMN IF NOT EXISTS "GHI_CHU" character varying(500),
            ADD COLUMN IF NOT EXISTS "CREATED_AT" timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc');

        ALTER TABLE IF EXISTS {{schema}}."CHI_SO_DIEN"
            ADD COLUMN IF NOT EXISTS "IS_ANOMALY" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "ANOMALY_NOTE" character varying(500),
            ADD COLUMN IF NOT EXISTS "ANH_DONG_HO_URL" character varying(500);

        ALTER TABLE IF EXISTS {{schema}}."CHI_SO_NUOC"
            ADD COLUMN IF NOT EXISTS "IS_ANOMALY" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "ANOMALY_NOTE" character varying(500),
            ADD COLUMN IF NOT EXISTS "ANH_DONG_HO_URL" character varying(500);

        CREATE TABLE IF NOT EXISTS {{schema}}."DICH_VU_TOA_NHA" (
            "DICH_VU_ID" integer NOT NULL,
            "TOA_NHA_ID" integer NOT NULL,
            CONSTRAINT "PK_DICH_VU_TOA_NHA" PRIMARY KEY ("DICH_VU_ID", "TOA_NHA_ID")
        );

        CREATE TABLE IF NOT EXISTS {{schema}}."LICH_SU_GIA_DICH_VU" (
            "ID" integer GENERATED BY DEFAULT AS IDENTITY,
            "DICH_VU_ID" integer NOT NULL,
            "GIA_CU" numeric(18,2) NOT NULL,
            "GIA_MOI" numeric(18,2) NOT NULL,
            "NGAY_AP_DUNG" timestamp without time zone NOT NULL,
            "LY_DO" character varying(500),
            "NGAY_THAY_DOI" timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
            CONSTRAINT "PK_LICH_SU_GIA_DICH_VU" PRIMARY KEY ("ID")
        );

        CREATE INDEX IF NOT EXISTS "IX_DICH_VU_TOA_NHA_TOA_NHA_ID"
            ON {{schema}}."DICH_VU_TOA_NHA" ("TOA_NHA_ID");

        CREATE INDEX IF NOT EXISTS "IX_LICH_SU_GIA_DICH_VU_DICH_VU_ID"
            ON {{schema}}."LICH_SU_GIA_DICH_VU" ("DICH_VU_ID");
    """;

    context.Database.ExecuteSqlRaw(sql);
}

static void LoadDotEnv()
{
    var path = FindDotEnvPath();
    if (path is not null)
    {
        LoadDotEnvFile(path);
    }
}

static string? FindDotEnvPath()
{
    foreach (var startPath in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
    {
        var directory = new DirectoryInfo(startPath);
        while (directory is not null)
        {
            var candidate = Path.Combine(directory.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }
    }

    return null;
}

static void LoadDotEnvFile(string path)
{
    if (!File.Exists(path))
    {
        return;
    }

    foreach (var rawLine in File.ReadAllLines(path))
    {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#'))
        {
            continue;
        }

        if (line.StartsWith("export ", StringComparison.OrdinalIgnoreCase))
        {
            line = line["export ".Length..].TrimStart();
        }

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
        {
            continue;
        }

        var key = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim();
        if (key.Length == 0 || Environment.GetEnvironmentVariable(key) is not null)
        {
            continue;
        }

        value = UnquoteDotEnvValue(value);
        Environment.SetEnvironmentVariable(key, value);
    }
}

static string UnquoteDotEnvValue(string value)
{
    if (value.Length >= 2)
    {
        var first = value[0];
        var last = value[^1];
        if ((first == '"' && last == '"') || (first == '\'' && last == '\''))
        {
            return value[1..^1];
        }
    }

    var commentIndex = value.IndexOf(" #", StringComparison.Ordinal);
    return commentIndex >= 0 ? value[..commentIndex].TrimEnd() : value;
}