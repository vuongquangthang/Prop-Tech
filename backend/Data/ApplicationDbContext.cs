using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Auth
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;

    // Structure
    public DbSet<Building> Buildings { get; set; } = null!;
    public DbSet<Floor> Floors { get; set; } = null!;
    public DbSet<Room> Rooms { get; set; } = null!;

    // Residents
    public DbSet<Resident> Residents { get; set; } = null!;
    public DbSet<Residency> Residencies { get; set; } = null!;
    public DbSet<Deposit> Deposits { get; set; } = null!;

    // Pricing
    public DbSet<PriceConfig> PriceConfigs { get; set; } = null!;
    public DbSet<ElectricityTier> ElectricityTiers { get; set; } = null!;
    public DbSet<ElectricityPriceSnapshot> ElectricityPriceSnapshots { get; set; } = null!;
    public DbSet<ElectricityTierSnapshot> ElectricityTierSnapshots { get; set; } = null!;
    public DbSet<WaterMeterReading> WaterMeterReadings { get; set; } = null!;
    public DbSet<MeterReading> MeterReadings { get; set; } = null!;

    // Services
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<ServiceUsage> ServiceUsages { get; set; } = null!;
    public DbSet<ServicePriceAdjustment> ServicePriceAdjustments { get; set; } = null!;
    public DbSet<ServicePriceSnapshot> ServicePriceSnapshots { get; set; } = null!;

    // Billing
    public DbSet<BillingPeriod> BillingPeriods { get; set; } = null!;
    public DbSet<Invoice> Invoices { get; set; } = null!;
    public DbSet<InvoiceLineItem> InvoiceLineItems { get; set; } = null!;

    // Payment
    public DbSet<Transaction> Transactions { get; set; } = null!;
    public DbSet<PaymentReconciliation> PaymentReconciliations { get; set; } = null!;

    // Complaints
    public DbSet<Complaint> Complaints { get; set; } = null!;
    public DbSet<ComplaintAttachment> ComplaintAttachments { get; set; } = null!;
    public DbSet<ComplaintResponse> ComplaintResponses { get; set; } = null!;

    // Chatbot
    public DbSet<FAQ> FAQs { get; set; } = null!;
    public DbSet<Regulation> Regulations { get; set; } = null!;
    public DbSet<ChatbotConversation> ChatbotConversations { get; set; } = null!;
    public DbSet<ChatbotMessage> ChatbotMessages { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<BlockedIp> BlockedIps { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auth
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.Property(e => e.Role).HasDefaultValue("RESIDENT");
            entity.Property(e => e.Status).HasDefaultValue("ACTIVE");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany(e => e.UserSessions).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.RefreshToken);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Structure
        modelBuilder.Entity<Building>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BuildingCode).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Floor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Building).WithMany(e => e.Floors).HasForeignKey(e => e.BuildingId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.BuildingId, e.FloorNumber }).IsUnique().HasDatabaseName("UK_floors_building_floor");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Floor).WithMany(e => e.Rooms).HasForeignKey(e => e.FloorId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.RoomCode);
            entity.Property(e => e.Status).HasDefaultValue("VACANT");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_rooms_room_type", "room_type IN ('FOR_RENT', 'FOR_SALE', 'SOLD')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_rooms_status", "status IN ('VACANT', 'OCCUPIED', 'INACTIVE')"));
        });

        // Residents
        modelBuilder.Entity<Resident>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany(e => e.Residents).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.PhoneNumber);
            entity.HasIndex(e => e.IdCardNumber);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_residents_gender", "gender IN ('MALE', 'FEMALE', 'OTHER')"));
        });

        modelBuilder.Entity<Residency>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Resident).WithMany(e => e.Residencies).HasForeignKey(e => e.ResidentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Room).WithMany(e => e.Residencies).HasForeignKey(e => e.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.RoomId, e.ResidentId, e.OwnershipType }).HasDatabaseName("UK_residencies");
            entity.Property(e => e.Status).HasDefaultValue("ACTIVE");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_residencies_ownership", "ownership_type IN ('OWNER', 'TENANT')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_residencies_status", "status IN ('ACTIVE', 'INACTIVE', 'ENDED')"));
        });

        modelBuilder.Entity<Deposit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Residency).WithOne().HasForeignKey<Deposit>(e => e.ResidencyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Room).WithMany(e => e.Deposits).HasForeignKey(e => e.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Resident).WithMany().HasForeignKey(e => e.ResidentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.ResidencyId).IsUnique();
            entity.Property(e => e.Status).HasDefaultValue("UNPAID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_deposits_status", "status IN ('UNPAID', 'PAID', 'REFUNDED', 'FORFEITED')"));
        });

        // Pricing
        modelBuilder.Entity<PriceConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ServiceType, e.EffectiveDate });
            entity.Property(e => e.EffectiveDate).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_price_configs_service_type", "service_type IN ('WATER', 'ELECTRICITY', 'SERVICE')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_price_configs_pricing_method", "pricing_method IN ('PER_PERSON', 'PER_UNIT', 'FIXED', 'TIERED')"));
        });

        modelBuilder.Entity<ElectricityTier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.PriceConfig).WithMany().HasForeignKey(e => e.PriceConfigId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => new { e.PriceConfigId, e.TierLevel });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ElectricityPriceSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.PriceConfig).WithMany().HasForeignKey(e => e.PriceConfigId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.SnapshotDatetime);
        });

        modelBuilder.Entity<ElectricityTierSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Snapshot).WithMany(e => e.TierSnapshots).HasForeignKey(e => e.SnapshotId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WaterMeterReading>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room).WithMany(e => e.WaterMeterReadings).HasForeignKey(e => e.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.RoomId, e.ReadingMonth });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<MeterReading>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room).WithMany(e => e.MeterReadings).HasForeignKey(e => e.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.RoomId, e.ReadingMonth });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Services
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ServiceUsage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Residency).WithMany().HasForeignKey(e => e.ResidencyId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Service).WithMany().HasForeignKey(e => e.ServiceId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Resident).WithMany().HasForeignKey(e => e.ResidentId).OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => new { e.ResidencyId, e.ServiceId, e.UsageDatetime });
            entity.Property(e => e.IsCharged).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ServicePriceAdjustment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Service).WithMany().HasForeignKey(e => e.ServiceId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.AdjustedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ServicePriceSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Service).WithMany().HasForeignKey(e => e.ServiceId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.SnapshotDatetime).HasDefaultValueSql("GETUTCDATE()");
        });

        // Billing
        modelBuilder.Entity<BillingPeriod>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PeriodMonth).IsUnique();
            entity.Property(e => e.Status).HasDefaultValue("DRAFT");
            entity.Property(e => e.LateFeeEnabled).HasDefaultValue(false);
            entity.Property(e => e.LateFeePercent).HasPrecision(5, 2);
            entity.Property(e => e.LateFeeFixed).HasPrecision(15, 2);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_billing_periods_status", "status IN ('DRAFT', 'CONFIRMED', 'CLOSED')"));
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasOne(e => e.Room).WithMany(e => e.Invoices).HasForeignKey(e => e.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.BillingPeriod).WithMany(e => e.Invoices).HasForeignKey(e => e.BillingPeriodId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.RoomId, e.BillingPeriodId });
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DueDate);
            entity.Property(e => e.Status).HasDefaultValue("UNPAID");
            entity.Property(e => e.PaidAmount).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_invoices_status", "status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'VOIDED')"));
        });

        modelBuilder.Entity<InvoiceLineItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Invoice).WithMany(e => e.LineItems).HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_invoice_line_items_item_type", "item_type IN ('ROOM', 'WATER', 'ELECTRICITY', 'ELECTRICITY_TIER', 'SERVICE', 'ADJUSTMENT', 'LATE_FEE')"));
        });

        // Payment
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TransactionCode).IsUnique();
            entity.HasOne(e => e.Invoice).WithMany(e => e.Transactions).HasForeignKey(e => e.InvoiceId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.PaymentDate);
            entity.Property(e => e.Status).HasDefaultValue("INITIATED");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_transactions_status", "status IN ('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_transactions_payment_method", "payment_method IN ('BANK_TRANSFER', 'CASH', 'EWALLET', 'GATEWAY_MOCK')"));
        });

        modelBuilder.Entity<PaymentReconciliation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Transaction).WithMany(e => e.Reconciliations).HasForeignKey(e => e.TransactionId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.ReconciliationStatus).HasDefaultValue("PENDING");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_payment_reconciliations_status", "reconciliation_status IN ('PENDING', 'MATCHED', 'UNMATCHED')"));
        });

        // Complaints
        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ComplaintCode).IsUnique();
            entity.HasOne(e => e.Room).WithMany(e => e.Complaints).HasForeignKey(e => e.RoomId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.Status, e.Priority });
            entity.Property(e => e.Status).HasDefaultValue("OPEN");
            entity.Property(e => e.Priority).HasDefaultValue("MEDIUM");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_complaints_status", "status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_complaints_priority", "priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')"));
        });

        modelBuilder.Entity<ComplaintAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint).WithMany(e => e.Attachments).HasForeignKey(e => e.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ComplaintResponse>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint).WithMany(e => e.Responses).HasForeignKey(e => e.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.RespondedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // Chatbot
        modelBuilder.Entity<FAQ>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Category);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.ViewCount).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Regulation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RegulationCode).IsUnique();
            entity.HasIndex(e => e.Category);
            entity.Property(e => e.ViewCount).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ChatbotConversation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ConversationId).IsUnique();
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.TotalMessages).HasDefaultValue(0);
            entity.Property(e => e.Status).HasDefaultValue("ACTIVE");
            entity.Property(e => e.SessionStart).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ChatbotMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Conversation).WithMany(e => e.Messages).HasForeignKey(e => e.ConversationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.MatchedFaq).WithMany().HasForeignKey(e => e.MatchedFaqId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.MatchedRegulation).WithMany().HasForeignKey(e => e.MatchedRegulationId).OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.SentAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_chatbot_messages_sender_type", "sender_type IN ('USER', 'BOT')"));
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany(e => e.Notifications).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
            entity.HasIndex(e => new { e.ScopeType, e.ScopeId });
            entity.Property(e => e.Priority).HasDefaultValue("NORMAL");
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.SentAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.ToTable(t => t.HasCheckConstraint("CK_notifications_scope_type", "scope_type IS NULL OR scope_type IN ('USER', 'ROOM', 'FLOOR', 'BUILDING', 'ALL')"));
            entity.ToTable(t => t.HasCheckConstraint("CK_notifications_priority", "priority IN ('NORMAL', 'URGENT')"));
        });

        // Audit
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany(e => e.AuditLogs).HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => new { e.EntityType, e.EntityId });
            entity.HasIndex(e => e.CreatedAt);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<BlockedIp>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.IpAddress);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.BlockedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
    }
}
