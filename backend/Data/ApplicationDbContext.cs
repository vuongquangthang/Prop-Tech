using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Cấu trúc vật lý
    public DbSet<Building> Buildings { get; set; } = null!;
    public DbSet<Floor> Floors { get; set; } = null!;
    public DbSet<Room> Rooms { get; set; } = null!;

    // Cư dân & Người dùng
    public DbSet<Resident> Residents { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;

    // Hợp đồng
    public DbSet<HopDong> HopDongs { get; set; } = null!;
    public DbSet<ChiTietO> ChiTietOs { get; set; } = null!;
    public DbSet<ContractEditHistory> ContractEditHistories { get; set; } = null!;

    // Xe
    public DbSet<Xe> Xes { get; set; } = null!;

    // Bài đăng tìm phòng
    public DbSet<BaiDangTimPhong> BaiDangTimPhongs { get; set; } = null!;

    // Dịch vụ
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<ServiceBuildingScope> ServiceBuildingScopes { get; set; } = null!;
    public DbSet<ServicePriceHistory> ServicePriceHistories { get; set; } = null!;
    public DbSet<ChiTietSuDungDichVu> ChiTietSuDungDichVus { get; set; } = null!;
    public DbSet<ChiSoDien> ChiSoDiens { get; set; } = null!;
    public DbSet<ChiSoNuoc> ChiSoNuocs { get; set; } = null!;

    // Hóa đơn & Thanh toán
    public DbSet<HoaDon> HoaDons { get; set; } = null!;
    public DbSet<ChiTietHoaDon> ChiTietHoaDons { get; set; } = null!;
    public DbSet<TatToan> TatToans { get; set; } = null!;
    public DbSet<ChiTietPhieuTatToan> ChiTietPhieuTatToans { get; set; } = null!;
    public DbSet<ThanhToan> ThanhToans { get; set; } = null!;

    // Tài sản
    public DbSet<TaiSan> TaiSans { get; set; } = null!;
    public DbSet<TaiSanBuildingScope> TaiSanBuildingScopes { get; set; } = null!;
    public DbSet<ChiTietTaiSanPhong> ChiTietTaiSanPhongs { get; set; } = null!;

    // Yêu cầu sửa chữa
    public DbSet<YeuCauSuaChua> YeuCauSuaChuas { get; set; } = null!;

    // Chatbot
    public DbSet<LichSuChat> LichSuChats { get; set; } = null!;
    public DbSet<KnowledgeBase> KnowledgeBases { get; set; } = null!;

    // Nhắc nợ
    public DbSet<NhatKyNhacNo> NhatKyNhacNos { get; set; } = null!;

    // Optional: Keep for logging
    public DbSet<Notification> Notifications { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<BlockedIp> BlockedIps { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ========== CẤU TRÚC VẬT LÝ ==========
        
        modelBuilder.Entity<Building>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.OwnerUserId, e.BuildingName })
                .IsUnique()
                .HasFilter("[IS_DELETED] = 0");
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Floor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.BuildingId, e.FloorNumber })
                .IsUnique()
                .HasFilter("[IS_DELETED] = 0");
            entity.HasOne(e => e.Building)
                .WithMany(e => e.Floors)
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.FloorId, e.RoomCode })
                .IsUnique()
                .HasFilter("[TRANG_THAI] <> N'Đã xóa'");
            entity.HasOne(e => e.Floor)
                .WithMany(e => e.Rooms)
                .HasForeignKey(e => e.FloorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========== CƯ DÂN & NGƯỜI DÙNG ==========
        
        modelBuilder.Entity<Resident>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.IdCardNumber).IsUnique();
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.HasIndex(e => e.OwnerUserId);
            entity.HasOne(e => e.Resident)
                .WithMany(e => e.Users)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ========== HỢP ĐỒNG ==========
        
        modelBuilder.Entity<HopDong>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.HopDongs)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChiTietO>(entity =>
        {
            entity.HasKey(e => new { e.ContractId, e.ResidentId });
            entity.HasOne(e => e.HopDong)
                .WithMany(e => e.ChiTietOs)
                .HasForeignKey(e => e.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Resident)
                .WithMany(e => e.ChiTietOs)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========== XE ==========
        
        modelBuilder.Entity<Xe>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.LicensePlate).IsUnique();
            entity.HasOne(e => e.Resident)
                .WithMany(e => e.Xes)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BaiDangTimPhong>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RoomId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasOne(e => e.Room)
                .WithMany()
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ContractEditHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ContractId, e.Version }).IsUnique();
            entity.HasOne(e => e.Contract)
                .WithMany(e => e.EditHistories)
                .HasForeignKey(e => e.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========== DỊCH VỤ ==========
        
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ServiceBuildingScope>(entity =>
        {
            entity.HasKey(e => new { e.ServiceId, e.BuildingId });
            entity.HasOne(e => e.Service)
                .WithMany(e => e.BuildingScopes)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ServicePriceHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Service)
                .WithMany(e => e.PriceHistories)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChiTietSuDungDichVu>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Service)
                .WithMany(e => e.ChiTietSuDungDichVus)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Resident)
                .WithMany(e => e.ChiTietSuDungDichVus)
                .HasForeignKey(e => e.ResidentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.ChiTietSuDungDichVus)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Vehicle)
                .WithMany(e => e.ChiTietSuDungDichVus)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ChiSoDien>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ServiceUsageDetailId, e.Month, e.Year }).IsUnique();
            entity.HasOne(e => e.ServiceUsageDetail)
                .WithMany(e => e.ChiSoDiens)
                .HasForeignKey(e => e.ServiceUsageDetailId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ChiSoNuoc>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ServiceUsageDetailId, e.Month, e.Year }).IsUnique();
            entity.HasOne(e => e.ServiceUsageDetail)
                .WithMany(e => e.ChiSoNuocs)
                .HasForeignKey(e => e.ServiceUsageDetailId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ========== HÓA ĐƠN & THANH TOÁN ==========
        
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OwnerUserId);
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<HoaDon>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ContractId, e.Month, e.Year }).IsUnique();
            entity.HasOne(e => e.HopDong)
                .WithMany(e => e.HoaDons)
                .HasForeignKey(e => e.ContractId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ChiTietHoaDon>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.HoaDon)
                .WithMany(e => e.ChiTietHoaDons)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ServiceUsageDetail)
                .WithMany(e => e.ChiTietHoaDons)
                .HasForeignKey(e => e.ServiceUsageDetailId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.Service)
                .WithMany(e => e.ChiTietHoaDons)
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<TatToan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Residency)
                .WithOne(e => e.TatToan)
                .HasForeignKey<TatToan>(e => e.ResidencyId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChiTietPhieuTatToan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.TatToan)
                .WithMany(e => e.Details)
                .HasForeignKey(e => e.SettlementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ThanhToan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.HoaDon)
                .WithMany(e => e.ThanhToans)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.TatToan)
                .WithMany()
                .HasForeignKey(e => e.SettlementId)
                .OnDelete(DeleteBehavior.NoAction);
            // Constraint: CHỈ thanh toán cho 1 trong 2 (HoaDon hoặc TatToan)
            entity.ToTable(t => t.HasCheckConstraint(
                "CHK_THANH_TOAN_REF",
                "([HOA_DON_ID] IS NOT NULL AND [TAT_TOAN_ID] IS NULL) OR ([HOA_DON_ID] IS NULL AND [TAT_TOAN_ID] IS NOT NULL)"
            ));
        });

        // ========== TÀI SẢN ==========
        
        modelBuilder.Entity<TaiSan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.OwnerUserId, e.AssetCode });
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TaiSanBuildingScope>(entity =>
        {
            entity.HasKey(e => new { e.AssetId, e.BuildingId });
            entity.HasOne(e => e.Asset)
                .WithMany(e => e.BuildingScopes)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Building)
                .WithMany()
                .HasForeignKey(e => e.BuildingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChiTietTaiSanPhong>(entity =>
        {
            entity.HasKey(e => new { e.RoomId, e.AssetId });
            entity.HasOne(e => e.Room)
                .WithMany(e => e.ChiTietTaiSanPhongs)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.TaiSan)
                .WithMany(e => e.ChiTietTaiSanPhongs)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========== YÊU CẦU SỬA CHỮA ==========
        
        modelBuilder.Entity<YeuCauSuaChua>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Room)
                .WithMany(e => e.YeuCauSuaChuas)
                .HasForeignKey(e => e.RoomId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                .WithMany(e => e.YeuCauSuaChuas)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ========== CHATBOT ==========
        
        modelBuilder.Entity<LichSuChat>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                .WithMany(e => e.LichSuChats)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<KnowledgeBase>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OwnerUserId);
            entity.HasOne(e => e.UpdatedByUser)
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);
            // NoAction (khong SetNull) de tranh nhieu duong cascade tu USER -> KNOWLEDGE_BASE
            // (UpdatedBy da la SetNull). SQL Server cam multiple cascade paths (error 1785).
            entity.HasOne(e => e.OwnerUser)
                .WithMany()
                .HasForeignKey(e => e.OwnerUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ========== NHẮC NỢ ==========
        
        modelBuilder.Entity<NhatKyNhacNo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.HoaDon)
                .WithMany(e => e.NhatKyNhacNos)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.SentToUser)
                .WithMany(e => e.NhatKyNhacNosSentTo)
                .HasForeignKey(e => e.SentToUserId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.SentByUser)
                .WithMany(e => e.NhatKyNhacNosSentBy)
                .HasForeignKey(e => e.SentByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }
}
