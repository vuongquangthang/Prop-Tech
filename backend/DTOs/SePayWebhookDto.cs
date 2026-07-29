namespace backend.DTOs;

/// <summary>
/// Payload webhook SePay gui ve khi co tien vao TK. Chi lay cac field can dung.
/// SePay gui: id, gateway, transactionDate, accountNumber, content, transferAmount, ...
/// </summary>
public class SePayWebhookDto
{
    public long? Id { get; set; }                  // ID giao dich ben SePay
    public string? Gateway { get; set; }           // ten ngan hang
    public string? AccountNumber { get; set; }     // so TK nhan tien (-> ra Owner)
    public string? Code { get; set; }              // ma code (neu SePay tach san)
    public string? Content { get; set; }           // noi dung CK (chua HD{id})
    public string? TransferType { get; set; }      // "in" = tien vao
    public decimal? TransferAmount { get; set; }   // so tien
    public string? ReferenceCode { get; set; }     // ma tham chieu ngan hang
    public string? SubAccount { get; set; }
    public string? Description { get; set; }
}

/// <summary>Payload MOCK de demo (khong can SePay that): chi can maHoaDon.</summary>
public class MockPaymentDto
{
    public int InvoiceId { get; set; }             // ma hoa don can danh dau da tra
}
