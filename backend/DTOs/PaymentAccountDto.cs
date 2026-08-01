namespace backend.DTOs;

/// <summary>TK nhan tien cua Owner (tra ve cho FE).</summary>
public class PaymentAccountDto
{
    public int Id { get; set; }
    public int OwnerUserId { get; set; }
    public string BankBin { get; set; } = string.Empty;
    public string BankAccountNo { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string Provider { get; set; } = "sepay";
    public bool IsActive { get; set; }
    public DateTime? ConnectedAt { get; set; }
}

/// <summary>Owner ket noi / cap nhat TK nhan tien.</summary>
public class ConnectPaymentAccountDto
{
    public string BankBin { get; set; } = string.Empty;
    public string BankAccountNo { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public string? BankName { get; set; }
}
