using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using backend.Data;

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
        
        // Apply column additions for existing databases
        try {
            context.Database.ExecuteSqlRaw(@"
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
            ");
            Console.WriteLine("✅ HOA_DON columns ensured");

            context.Database.ExecuteSqlRaw(@"
                UPDATE HOP_DONG
                SET MA_HOP_DONG = CONCAT('HD-', YEAR(GETDATE()), '-', RIGHT(CONCAT('00000', CAST(HOP_DONG_ID AS VARCHAR(10))), 5))
                WHERE MA_HOP_DONG IS NULL OR LTRIM(RTRIM(MA_HOP_DONG)) = '';
            ");
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

