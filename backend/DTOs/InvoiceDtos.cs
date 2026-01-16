namespace backend.DTOs;

// Invoice DTOs
public class InvoiceDto
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public int RoomId { get; set; }
    public required string BillingPeriod { get; set; }
    public decimal Amount { get; set; }
    public required string Status { get; set; }
}

public class CreateInvoiceRequestDto
{
    public int ResidentId { get; set; }
    public int RoomId { get; set; }
    public required string BillingPeriod { get; set; }
    public decimal Amount { get; set; }
}

public class UpdateInvoiceStatusRequestDto
{
    public required string Status { get; set; }
}

// Payment DTOs
public class PaymentDto
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public required string TransactionId { get; set; }
    public required string Status { get; set; }
}

public class CreatePaymentRequestDto
{
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public required string TransactionId { get; set; }
}
