namespace backend.DTOs;

public class TransactionDto
{
    public long Id { get; set; }
    public string TransactionCode { get; set; } = null!;
    public long InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public decimal Amount { get; set; }
    public string TransactionType { get; set; } = null!; // PAYMENT, REFUND
    public string PaymentMethod { get; set; } = null!;
    public string Status { get; set; } = null!; // PENDING, SUCCESS, FAILED, CANCELLED
    public string? GatewayTransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransactionDetailDto : TransactionDto
{
    public InvoiceDto? Invoice { get; set; }
    public string? GatewayResponse { get; set; }
    public string? Notes { get; set; }
}

public class InitTransactionDto
{
    public long InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = null!; // BANK_TRANSFER, CREDIT_CARD, CASH, E_WALLET, etc.
    public string? ReturnUrl { get; set; }
    public string? Notes { get; set; }
}

public class PaymentCallbackDto
{
    public string TransactionCode { get; set; } = null!;
    public string Status { get; set; } = null!; // SUCCESS, FAILED
    public string? GatewayTransactionId { get; set; }
    public string? GatewayResponse { get; set; }
    public DateTime? PaidAt { get; set; }
}

public class TransactionReceiptDto
{
    public TransactionDto Transaction { get; set; } = null!;
    public InvoiceDetailDto Invoice { get; set; } = null!;
    public decimal RemainingBalance { get; set; }
}

public class InitiatePaymentResponseDto
{
    public long TransactionId { get; set; }
    public string TransactionCode { get; set; } = null!;
    public string Status { get; set; } = "PENDING";
    public decimal Amount { get; set; }
    public string QrCodeUrl { get; set; } = null!;
    public string PaymentUrl { get; set; } = null!;
    /// <summary>URL trang thanh toán PayOS - mở trong trình duyệt</summary>
    public string? CheckoutUrl { get; set; }
    /// <summary>Số tài khoản ngân hàng nhận tiền</summary>
    public string BankAccountNumber { get; set; } = "";
    /// <summary>Tên chủ tài khoản</summary>
    public string BankAccountName { get; set; } = "";
    /// <summary>BIN ngân hàng (dùng cho VietQR)</summary>
    public string BankBin { get; set; } = "";
    /// <summary>Nội dung chuyển khoản</summary>
    public string TransferDescription { get; set; } = "";
    /// <summary>Tên rút gọn ngân hàng (VietinBank, MB, Vietcombank...)</summary>
    public string BankName { get; set; } = "";
    /// <summary>URL logo ngân hàng từ VietQR</summary>
    public string BankLogoUrl { get; set; } = "";
}

public class PaymentCallbackResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = null!;
    public string? InvoiceStatus { get; set; }
}
