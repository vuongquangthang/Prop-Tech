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
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
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
builder.Services.AddScoped<backend.Services.IChatService, backend.Services.ChatService>();
builder.Services.AddScoped<backend.Services.IReportService, backend.Services.ReportService>();

// Payment Service (Realtime QR Payment)
builder.Services.AddScoped<backend.Services.IPaymentService, backend.Services.PaymentService>();

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
        
        // Seed demo users
        DatabaseSeeder.SeedDemoUsers(context);
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
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
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

