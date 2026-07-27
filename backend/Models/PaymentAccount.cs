using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Tai khoan nhan tien cua tung Owner (chu nha). Mo hinh multi-owner:
/// moi Owner co TK ngan hang rieng, tien cu dan di THANG vao TK cua Owner so huu hoa don.
/// Webhook doi soat theo (bank_bin + bank_account_no) -> ra Owner, ket hop ma HD -> ra hoa don.
/// </summary>
[Table("PAYMENT_ACCOUNT")]
public class PaymentAccount
{
    [Key]
    [Column("PAYMENT_ACCOUNT_ID")]
    public int Id { get; set; }

    // Owner so huu TK nay (map voi Building.OwnerUserId / User role chu nha).
    [Column("OWNER_USER_ID")]
    public int OwnerUserId { get; set; }

    [Required]
    [StringLength(20)]
    [Column("BANK_BIN")]
    public string BankBin { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("BANK_ACCOUNT_NO")]
    public string BankAccountNo { get; set; } = null!;

    [Required]
    [StringLength(255)]
    [Column("ACCOUNT_HOLDER")]
    public string AccountHolder { get; set; } = null!;

    // Ten ngan hang hien thi (vd "MBBank"). Tuy chon, sinh QR khong bat buoc.
    [StringLength(100)]
    [Column("BANK_NAME")]
    public string? BankName { get; set; }

    // ID tai khoan trong SePay (khi ket noi that). Null neu chi nhap thu cong.
    [StringLength(100)]
    [Column("SEPAY_ACCOUNT_ID")]
    public string? SepayAccountId { get; set; }

    [Required]
    [StringLength(30)]
    [Column("PROVIDER")]
    public string Provider { get; set; } = "sepay";

    [Column("IS_ACTIVE")]
    public bool IsActive { get; set; } = true;

    [Column("CONNECTED_AT")]
    public DateTime? ConnectedAt { get; set; }

    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Khong khai bao navigation OwnerUser de tranh EF cau hinh quan he phuc tap
    // (bang tao bang SQL, chi can OwnerUserId la du de doi soat).
}
