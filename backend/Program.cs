using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using backend.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

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
});

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register Repositories
builder.Services.AddScoped<backend.Repositories.IUserRepository, backend.Repositories.UserRepository>();
builder.Services.AddScoped<backend.Repositories.IUserSessionRepository, backend.Repositories.UserSessionRepository>();
builder.Services.AddScoped<backend.Repositories.IBuildingRepository, backend.Repositories.BuildingRepository>();
builder.Services.AddScoped<backend.Repositories.IFloorRepository, backend.Repositories.FloorRepository>();
builder.Services.AddScoped<backend.Repositories.IRoomRepository, backend.Repositories.RoomRepository>();
builder.Services.AddScoped<backend.Repositories.IFAQRepository, backend.Repositories.FAQRepository>();
builder.Services.AddScoped<backend.Repositories.IRegulationRepository, backend.Repositories.RegulationRepository>();
builder.Services.AddScoped<backend.Repositories.IResidentRepository, backend.Repositories.ResidentRepository>();
builder.Services.AddScoped<backend.Repositories.IResidencyRepository, backend.Repositories.ResidencyRepository>();
builder.Services.AddScoped<backend.Repositories.IDepositRepository, backend.Repositories.DepositRepository>();
builder.Services.AddScoped<backend.Repositories.IPriceConfigRepository, backend.Repositories.PriceConfigRepository>();
builder.Services.AddScoped<backend.Repositories.IMeterReadingRepository, backend.Repositories.MeterReadingRepository>();
builder.Services.AddScoped<backend.Repositories.IWaterMeterReadingRepository, backend.Repositories.WaterMeterReadingRepository>();
builder.Services.AddScoped<backend.Repositories.IBillingPeriodRepository, backend.Repositories.BillingPeriodRepository>();
builder.Services.AddScoped<backend.Repositories.IInvoiceRepository, backend.Repositories.InvoiceRepository>();
builder.Services.AddScoped<backend.Repositories.IInvoiceLineItemRepository, backend.Repositories.InvoiceLineItemRepository>();
builder.Services.AddScoped<backend.Repositories.ITransactionRepository, backend.Repositories.TransactionRepository>();
builder.Services.AddScoped<backend.Repositories.INotificationRepository, backend.Repositories.NotificationRepository>();
builder.Services.AddScoped<backend.Repositories.IComplaintRepository, backend.Repositories.ComplaintRepository>();
builder.Services.AddScoped<backend.Repositories.IComplaintResponseRepository, backend.Repositories.ComplaintResponseRepository>();
builder.Services.AddScoped<backend.Repositories.IAuditLogRepository, backend.Repositories.AuditLogRepository>();

// Register Services
builder.Services.AddScoped<backend.Services.IJwtService, backend.Services.JwtService>();
builder.Services.AddScoped<backend.Services.IAuthService, backend.Services.AuthService>();
builder.Services.AddScoped<backend.Services.IBuildingService, backend.Services.BuildingService>();
builder.Services.AddScoped<backend.Services.IFloorService, backend.Services.FloorService>();
builder.Services.AddScoped<backend.Services.IRoomService, backend.Services.RoomService>();
builder.Services.AddScoped<backend.Services.IFAQService, backend.Services.FAQService>();
builder.Services.AddScoped<backend.Services.IRegulationService, backend.Services.RegulationService>();
builder.Services.AddScoped<backend.Services.IResidentService, backend.Services.ResidentService>();
builder.Services.AddScoped<backend.Services.IResidencyService, backend.Services.ResidencyService>();
builder.Services.AddScoped<backend.Services.IDepositService, backend.Services.DepositService>();
builder.Services.AddScoped<backend.Services.IPriceConfigService, backend.Services.PriceConfigService>();
builder.Services.AddScoped<backend.Services.IMeterReadingService, backend.Services.MeterReadingService>();
builder.Services.AddScoped<backend.Services.IWaterMeterReadingService, backend.Services.WaterMeterReadingService>();
builder.Services.AddScoped<backend.Services.IBillingPeriodService, backend.Services.BillingPeriodService>();
builder.Services.AddScoped<backend.Services.IInvoiceService, backend.Services.InvoiceService>();
builder.Services.AddScoped<backend.Services.ITransactionService, backend.Services.TransactionService>();
builder.Services.AddScoped<backend.Services.INotificationService, backend.Services.NotificationService>();
builder.Services.AddScoped<backend.Services.IComplaintService, backend.Services.ComplaintService>();
builder.Services.AddScoped<backend.Services.IReportService, backend.Services.ReportService>();
builder.Services.AddScoped<backend.Services.IAuditLogService, backend.Services.AuditLogService>();

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

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Apartment Management API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

