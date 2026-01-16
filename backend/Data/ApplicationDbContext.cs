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
    public DbSet<WaterMeterReading> WaterMeterReadings { get; set; } = null!;
    public DbSet<MeterReading> MeterReadings { get; set; } = null!;

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

        // ===== AUTH =====
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
            entity.HasOne(e => e.User)
                .WithMany(e => e.UserSessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.RefreshToken);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== STRUCTURE =====
        modelBuilder.Entity<Building>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Floor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Building)
                .WithMany(e => e.Floors)
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Floor)
                .WithMany(e => e.Rooms)
                .HasForeignKey(e => e.FloorId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Status).HasDefaultValue("EMPTY");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== RESIDENTS =====
        modelBuilder.Entity<Resident>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(e => e.Residents)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.PhoneNumber);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Residency>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Resident)
                .WithMany(e => e.Residencies)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.Residencies)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Status).HasDefaultValue("ACTIVE");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Deposit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.Deposits)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Status).HasDefaultValue("HELD");
            entity.Property(e => e.PaidDate).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== PRICING =====
        modelBuilder.Entity<PriceConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ServiceName, e.EffectiveFrom });
            entity.Property(e => e.EffectiveFrom).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ElectricityTier>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TierNumber, e.EffectiveFrom });
            entity.Property(e => e.EffectiveFrom).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<WaterMeterReading>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.WaterMeterReadings)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.RoomId, e.ReadingDate });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<MeterReading>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.MeterReadings)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.RoomId, e.ReadingDate });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== BILLING =====
        modelBuilder.Entity<BillingPeriod>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PeriodYear, e.PeriodMonth }).IsUnique();
            entity.Property(e => e.Status).HasDefaultValue("OPEN");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasOne(e => e.Room)
                .WithMany(e => e.Invoices)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.BillingPeriod)
                .WithMany(e => e.Invoices)
                .HasForeignKey(e => e.BillingPeriodId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Status).HasDefaultValue("UNPAID");
            entity.Property(e => e.PaidAmount).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<InvoiceLineItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.LineItems)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== PAYMENT =====
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TransactionCode).IsUnique();
            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.Transactions)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Status).HasDefaultValue("SUCCESS");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<PaymentReconciliation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Transaction)
                .WithMany(e => e.Reconciliations)
                .HasForeignKey(e => e.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.ReconciliationStatus).HasDefaultValue("MATCHED");
            entity.Property(e => e.ReconciledAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== COMPLAINTS =====
        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ComplaintCode).IsUnique();
            entity.HasOne(e => e.Room)
                .WithMany(e => e.Complaints)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Status).HasDefaultValue("OPEN");
            entity.Property(e => e.Priority).HasDefaultValue("MEDIUM");
            entity.Property(e => e.SubmittedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ComplaintAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint)
                .WithMany(e => e.Attachments)
                .HasForeignKey(e => e.ComplaintId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ComplaintResponse>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint)
                .WithMany(e => e.Responses)
                .HasForeignKey(e => e.ComplaintId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.RespondedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== CHATBOT =====
        modelBuilder.Entity<FAQ>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Category);
            entity.Property(e => e.ViewCount).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Regulation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Category);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.EffectiveFrom).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ChatbotConversation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.SessionId);
            entity.Property(e => e.Status).HasDefaultValue("ACTIVE");
            entity.Property(e => e.StartedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<ChatbotMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Conversation)
                .WithMany(e => e.Messages)
                .HasForeignKey(e => e.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.FAQ)
                .WithMany()
                .HasForeignKey(e => e.FaqId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Regulation)
                .WithMany()
                .HasForeignKey(e => e.RegulationId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.SentAt).HasDefaultValueSql("GETUTCDATE()");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(e => e.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.UserId, e.IsRead });
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.SentAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // ===== AUDIT =====
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(e => e.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
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

