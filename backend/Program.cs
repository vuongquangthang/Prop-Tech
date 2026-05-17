using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to listen on all network interfaces
builder.WebHost.UseUrls("http://0.0.0.0:5052", "https://0.0.0.0:5053");

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

// Configure SQL Server Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Phase 4: Meter Readings & Settlement Services
builder.Services.AddScoped<backend.Services.IChiSoDienService, backend.Services.ChiSoDienService>();
builder.Services.AddScoped<backend.Services.IChiSoNuocService, backend.Services.ChiSoNuocService>();
builder.Services.AddScoped<backend.Services.ITatToanService, backend.Services.TatToanService>();
builder.Services.AddScoped<backend.Services.ITaiSanService, backend.Services.TaiSanService>();
builder.Services.AddScoped<backend.Services.IChiTietTaiSanPhongService, backend.Services.ChiTietTaiSanPhongService>();
builder.Services.AddScoped<backend.Services.IUserService, backend.Services.UserService>();

// Tier 2: KnowledgeBase & Notifications
builder.Services.AddScoped<backend.Services.IKnowledgeBaseService, backend.Services.KnowledgeBaseService>();
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

// Seed demo users on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // Ensure database is created
        Console.WriteLine("🔨 Creating new database...");
        context.Database.EnsureCreated();

        // Ensure posts table exists before any later seed/query touches it.
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
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'MA_HOP_DONG')
                    ALTER TABLE HOP_DONG ADD MA_HOP_DONG NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'NGAY_THANH_TOAN_HANG_THANG')
                    ALTER TABLE HOP_DONG ADD NGAY_THANH_TOAN_HANG_THANG INT NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('HOP_DONG') AND name = 'CONG_THUC_HOA_DON_JSON')
                    ALTER TABLE HOP_DONG ADD CONG_THUC_HOA_DON_JSON NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('[USER]') AND name = 'MUST_CHANGE_PASSWORD')
                    ALTER TABLE [USER] ADD MUST_CHANGE_PASSWORD BIT NOT NULL CONSTRAINT DF_USER_MUST_CHANGE_PASSWORD DEFAULT(0);
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LICH_SU_CHAT') AND name = 'IS_KNOWLEDGE_GAP')
                    ALTER TABLE LICH_SU_CHAT ADD IS_KNOWLEDGE_GAP BIT NOT NULL CONSTRAINT DF_LICH_SU_CHAT_IS_KNOWLEDGE_GAP DEFAULT(0);
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
            """);
            Console.WriteLine("✅ HOA_DON columns ensured");

            context.Database.ExecuteSqlRaw("""
                UPDATE HOP_DONG
                SET MA_HOP_DONG = CONCAT('HD-', YEAR(GETDATE()), '-', RIGHT(CONCAT('00000', CAST(HOP_DONG_ID AS VARCHAR(10))), 5))
                WHERE MA_HOP_DONG IS NULL OR LTRIM(RTRIM(MA_HOP_DONG)) = '';
            """);
            Console.WriteLine("✅ Contract codes ensured");

            context.Database.ExecuteSqlRaw(@"
                UPDATE [USER]
                SET EMAIL = CONCAT(REPLACE(SO_DIEN_THOAI, ' ', ''), '@resident.local')
                WHERE VAI_TRO = N'CuDan'
                  AND SO_DIEN_THOAI IS NOT NULL
                  AND (EMAIL IS NULL OR LTRIM(RTRIM(EMAIL)) = '');
            ");
            Console.WriteLine("✅ Resident emails ensured");

            // Upgrade legacy sample assets (common-area) to in-room assets for existing databases
            context.Database.ExecuteSqlRaw(@"
                DELETE FROM CHI_TIET_TAI_SAN_PHONG
                WHERE TAI_SAN_ID IN (
                    SELECT TAI_SAN_ID FROM TAI_SAN
                    WHERE MA_TAI_SAN IN ('THANGMAY-01', 'DIEUHOA-SANH', 'MAYPHATSONG-WIFI', 'CAMERA-SANH-01', 'BANGHEXUONG')
                );

                DELETE FROM TAI_SAN
                WHERE MA_TAI_SAN IN ('THANGMAY-01', 'DIEUHOA-SANH', 'MAYPHATSONG-WIFI', 'CAMERA-SANH-01', 'BANGHEXUONG');

                IF NOT EXISTS (SELECT 1 FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-DIEUHOA')
                    INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES (N'Điều hòa', 'TS-PHONG-DIEUHOA');
                IF NOT EXISTS (SELECT 1 FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-MAYGIAT')
                    INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES (N'Máy giặt', 'TS-PHONG-MAYGIAT');
                IF NOT EXISTS (SELECT 1 FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-GIUONG')
                    INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES (N'Giường', 'TS-PHONG-GIUONG');
                IF NOT EXISTS (SELECT 1 FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-TULANH')
                    INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES (N'Tủ lạnh', 'TS-PHONG-TULANH');
                IF NOT EXISTS (SELECT 1 FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-TUQUANAO')
                    INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES (N'Tủ quần áo', 'TS-PHONG-TUQUANAO');
                IF NOT EXISTS (SELECT 1 FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-BINHNONG')
                    INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES (N'Bình nóng lạnh', 'TS-PHONG-BINHNONG');

                DECLARE @Room101Id INT = (SELECT TOP 1 PHONG_ID FROM PHONG WHERE MA_PHONG = '101');
                DECLARE @Room201Id INT = (SELECT TOP 1 PHONG_ID FROM PHONG WHERE MA_PHONG = '201');
                DECLARE @Room301Id INT = (SELECT TOP 1 PHONG_ID FROM PHONG WHERE MA_PHONG = '301');

                DECLARE @AssetDieuHoa INT = (SELECT TOP 1 TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-DIEUHOA');
                DECLARE @AssetMayGiat INT = (SELECT TOP 1 TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-MAYGIAT');
                DECLARE @AssetGiuong INT = (SELECT TOP 1 TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-GIUONG');
                DECLARE @AssetTuLanh INT = (SELECT TOP 1 TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-TULANH');
                DECLARE @AssetTuQuanAo INT = (SELECT TOP 1 TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-TUQUANAO');
                DECLARE @AssetBinhNong INT = (SELECT TOP 1 TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = 'TS-PHONG-BINHNONG');

                IF @Room101Id IS NOT NULL AND @AssetDieuHoa IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room101Id AND TAI_SAN_ID = @AssetDieuHoa)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room101Id, @AssetDieuHoa, 1, N'Tốt', N'Điều hòa phòng khách');
                IF @Room101Id IS NOT NULL AND @AssetGiuong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room101Id AND TAI_SAN_ID = @AssetGiuong)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room101Id, @AssetGiuong, 2, N'Tốt', N'Giường phòng ngủ');
                IF @Room101Id IS NOT NULL AND @AssetTuLanh IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room101Id AND TAI_SAN_ID = @AssetTuLanh)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room101Id, @AssetTuLanh, 1, N'Tốt', N'Tủ lạnh 2 cánh');

                IF @Room201Id IS NOT NULL AND @AssetDieuHoa IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room201Id AND TAI_SAN_ID = @AssetDieuHoa)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room201Id, @AssetDieuHoa, 1, N'Tốt', N'Điều hòa inverter');
                IF @Room201Id IS NOT NULL AND @AssetMayGiat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room201Id AND TAI_SAN_ID = @AssetMayGiat)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room201Id, @AssetMayGiat, 1, N'Tốt', N'Máy giặt cửa ngang');
                IF @Room201Id IS NOT NULL AND @AssetTuQuanAo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room201Id AND TAI_SAN_ID = @AssetTuQuanAo)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room201Id, @AssetTuQuanAo, 1, N'Tốt', N'Tủ quần áo gỗ');

                IF @Room301Id IS NOT NULL AND @AssetDieuHoa IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room301Id AND TAI_SAN_ID = @AssetDieuHoa)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room301Id, @AssetDieuHoa, 1, N'Tốt', N'Điều hòa phòng ngủ');
                IF @Room301Id IS NOT NULL AND @AssetBinhNong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room301Id AND TAI_SAN_ID = @AssetBinhNong)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room301Id, @AssetBinhNong, 1, N'Tốt', N'Bình nóng lạnh phòng tắm');
                IF @Room301Id IS NOT NULL AND @AssetGiuong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHI_TIET_TAI_SAN_PHONG WHERE PHONG_ID = @Room301Id AND TAI_SAN_ID = @AssetGiuong)
                    INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES (@Room301Id, @AssetGiuong, 1, N'Tốt', N'Giường đôi');
            ");
            context.Database.ExecuteSqlRaw("""
                IF OBJECT_ID('BAI_DANG_TIM_PHONG', 'U') IS NULL
                BEGIN
                    CREATE TABLE BAI_DANG_TIM_PHONG (
                        BAI_DANG_ID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        PHONG_ID INT NOT NULL,
                        MA_PHONG NVARCHAR(50) NOT NULL,
                        TEN_TOA_NHA NVARCHAR(200) NOT NULL,
                        SO_TANG INT NOT NULL,
                        DIEN_TICH DECIMAL(10,2) NULL,
                        SO_NGUOI_TOI_DA INT NULL,
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
                        CONSTRAINT FK_BAI_DANG_TIM_PHONG_PHONG FOREIGN KEY (PHONG_ID) REFERENCES PHONG(PHONG_ID) ON DELETE CASCADE,
                        CONSTRAINT FK_BAI_DANG_TIM_PHONG_USER FOREIGN KEY (TAO_BOI_ID) REFERENCES [USER](USER_ID) ON DELETE SET NULL
                    );
                END;

                IF NOT EXISTS (SELECT 1 FROM BAI_DANG_TIM_PHONG)
                BEGIN
                    DECLARE @Room101Id INT = (SELECT TOP 1 PHONG_ID FROM PHONG WHERE MA_PHONG = '101');
                    DECLARE @Room201Id INT = (SELECT TOP 1 PHONG_ID FROM PHONG WHERE MA_PHONG = '201');
                    DECLARE @Room301Id INT = (SELECT TOP 1 PHONG_ID FROM PHONG WHERE MA_PHONG = '301');
                    DECLARE @AdminUserId INT = (SELECT TOP 1 USER_ID FROM [USER] WHERE VAI_TRO = N'Admin');

                    IF @Room101Id IS NOT NULL
                    BEGIN
                        INSERT INTO BAI_DANG_TIM_PHONG (
                            PHONG_ID, MA_PHONG, TEN_TOA_NHA, SO_TANG, DIEN_TICH, SO_NGUOI_TOI_DA,
                            TIEU_DE, GIA_THUE, NGAY_DANG, NGAY_TAO, LUOT_XEM, TIN_NHAN, IS_LOCKED,
                            TRANG_THAI_BAI_DANG, TRANG_THAI_PHONG, KIEU_VAO_O, NGAY_CO_THE_VAO_O,
                            CO_VUNG_NGAP_LUT, YEU_CAU_CHU_NHA, KIEU_LIEN_HE, TEN_LIEN_HE, SO_DIEN_THOAI,
                            DICH_VU_JSON, ANH_JSON, ANH_BIA_URL, TAO_BOI_ID
                        ) VALUES (
                            @Room101Id, '101', N'Tòa A', 1, 75.50, 4,
                            N'Phòng đẹp thoáng mát giá rẻ gần trường ĐH', 8000000,
                            DATEADD(MINUTE, -30, GETUTCDATE()), DATEADD(MINUTE, -30, GETUTCDATE()), 234, 12, 0,
                            N'active', N'Trống', N'immediate', NULL,
                            0, N'Không nuôi thú cưng, không hút thuốc trong phòng', N'current', N'Nguyễn Văn A', N'0912345678',
                            N'[{"key":"electricity","name":"Tiền điện","unit":"kWh","price":3500},{"key":"water","name":"Tiền nước","unit":"m³","price":25000},{"key":"management","name":"Phí quản lý","unit":"Tháng","price":500000},{"key":"cleaning","name":"Phí dọn rác","unit":"Tháng","price":50000}]',
                            N'[]', NULL, @AdminUserId
                        );
                    END;

                    IF @Room301Id IS NOT NULL
                    BEGIN
                        INSERT INTO BAI_DANG_TIM_PHONG (
                            PHONG_ID, MA_PHONG, TEN_TOA_NHA, SO_TANG, DIEN_TICH, SO_NGUOI_TOI_DA,
                            TIEU_DE, GIA_THUE, NGAY_DANG, NGAY_TAO, LUOT_XEM, TIN_NHAN, IS_LOCKED,
                            TRANG_THAI_BAI_DANG, TRANG_THAI_PHONG, KIEU_VAO_O, NGAY_CO_THE_VAO_O,
                            CO_VUNG_NGAP_LUT, YEU_CAU_CHU_NHA, KIEU_LIEN_HE, TEN_LIEN_HE, SO_DIEN_THOAI,
                            DICH_VU_JSON, ANH_JSON, ANH_BIA_URL, TAO_BOI_ID
                        ) VALUES (
                            @Room301Id, '301', N'Tòa C', 3, 60.00, 6,
                            N'Căn hộ 2PN full nội thất sang trọng', 12000000,
                            DATEADD(MINUTE, -120, GETUTCDATE()), DATEADD(MINUTE, -120, GETUTCDATE()), 189, 8, 1,
                            N'paused', N'Trống', N'from-date', CONVERT(date, DATEADD(DAY, 14, GETUTCDATE())),
                            0, N'Ưu tiên gia đình trẻ, giữ gìn nội thất', N'other', N'Trần Thị B', N'0987654321',
                            N'[{"key":"electricity","name":"Tiền điện","unit":"kWh","price":3500},{"key":"water","name":"Tiền nước","unit":"m³","price":25000},{"key":"management","name":"Phí quản lý","unit":"Tháng","price":500000},{"key":"internet","name":"Internet","unit":"Tháng","price":200000}]',
                            N'[]', NULL, @AdminUserId
                        );
                    END;

                    IF @Room201Id IS NOT NULL
                    BEGIN
                        INSERT INTO BAI_DANG_TIM_PHONG (
                            PHONG_ID, MA_PHONG, TEN_TOA_NHA, SO_TANG, DIEN_TICH, SO_NGUOI_TOI_DA,
                            TIEU_DE, GIA_THUE, NGAY_DANG, NGAY_TAO, LUOT_XEM, TIN_NHAN, IS_LOCKED,
                            TRANG_THAI_BAI_DANG, TRANG_THAI_PHONG, KIEU_VAO_O, NGAY_CO_THE_VAO_O,
                            CO_VUNG_NGAP_LUT, YEU_CAU_CHU_NHA, KIEU_LIEN_HE, TEN_LIEN_HE, SO_DIEN_THOAI,
                            DICH_VU_JSON, ANH_JSON, ANH_BIA_URL, TAO_BOI_ID
                        ) VALUES (
                            @Room201Id, '201', N'Tòa B', 2, 42.00, 3,
                            N'Phòng trọ giá sinh viên gần siêu thị', 7800000,
                            DATEADD(MINUTE, -180, GETUTCDATE()), DATEADD(MINUTE, -180, GETUTCDATE()), 312, 15, 0,
                            N'active', N'Trống', N'immediate', NULL,
                            0, N'Không nuôi thú cưng', N'current', N'Nguyễn Văn C', N'0900000001',
                            N'[{"key":"electricity","name":"Tiền điện","unit":"kWh","price":3500},{"key":"water","name":"Tiền nước","unit":"m³","price":25000},{"key":"management","name":"Phí quản lý","unit":"Tháng","price":500000}]',
                            N'[]', NULL, @AdminUserId
                        );
                    END;
                END;
            """);

            Console.WriteLine("✅ Room assets sample data ensured");

            // Fix seeded invoices: move from current month to 2 months ago so draft workflow is available
            // Only moves invoices with no line items and no payments (pure seeded data)
            context.Database.ExecuteSqlRaw(@"
                UPDATE HOA_DON
                SET THANG = MONTH(DATEADD(MONTH, -2, GETDATE())),
                    NAM   = YEAR(DATEADD(MONTH, -2, GETDATE())),
                    DUE_DATE = DATEADD(DAY, 15, DATEADD(MONTH, DATEDIFF(MONTH, 0, DATEADD(MONTH, -1, GETDATE())), 0))
                WHERE THANG = MONTH(GETDATE())
                  AND NAM   = YEAR(GETDATE())
                  AND TRANG_THAI IN (N'Chưa thanh toán', N'Đã thanh toán')
                  AND HOA_DON_ID NOT IN (SELECT DISTINCT HOA_DON_ID FROM CHI_TIET_HOA_DON)
                  AND HOA_DON_ID NOT IN (SELECT DISTINCT HOA_DON_ID FROM THANH_TOAN WHERE HOA_DON_ID IS NOT NULL)
            ");
            Console.WriteLine("✅ Seeded invoices migrated to past month (if any)");
        } catch (Exception colEx) {
            Console.WriteLine($"⚠️ Column migration note: {colEx.Message}");
        }
        
        // Seed complete demo data with all tables
        DatabaseSeeder.SeedCompleteData(context);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error seeding database: {ex.Message}");
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<backend.Hubs.NotificationHub>("/hubs/notifications");

app.Run();

