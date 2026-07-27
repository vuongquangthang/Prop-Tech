using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IPaymentAccountService
{
    /// <summary>TK nhan tien dang active cua Owner (null neu chua ket noi).</summary>
    Task<PaymentAccountDto?> GetByOwnerAsync(int ownerUserId);

    /// <summary>Owner ket noi / cap nhat TK nhan tien. Moi Owner 1 TK active.</summary>
    Task<PaymentAccountDto> ConnectAsync(int ownerUserId, ConnectPaymentAccountDto dto);
}

public class PaymentAccountService : IPaymentAccountService
{
    private readonly IPaymentAccountRepository _repo;

    public PaymentAccountService(IPaymentAccountRepository repo)
    {
        _repo = repo;
    }

    public async Task<PaymentAccountDto?> GetByOwnerAsync(int ownerUserId)
    {
        var acc = await _repo.GetActiveByOwnerAsync(ownerUserId);
        return acc == null ? null : ToDto(acc);
    }

    public async Task<PaymentAccountDto> ConnectAsync(int ownerUserId, ConnectPaymentAccountDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.BankBin) ||
            string.IsNullOrWhiteSpace(dto.BankAccountNo) ||
            string.IsNullOrWhiteSpace(dto.AccountHolder))
        {
            throw new InvalidOperationException("Vui lòng nhập đủ ngân hàng, số tài khoản và tên chủ tài khoản");
        }

        var existing = await _repo.GetActiveByOwnerAsync(ownerUserId);
        if (existing != null)
        {
            // Cap nhat TK hien co.
            existing.BankBin = dto.BankBin.Trim();
            existing.BankAccountNo = dto.BankAccountNo.Trim();
            existing.AccountHolder = dto.AccountHolder.Trim();
            existing.BankName = dto.BankName?.Trim();
            existing.ConnectedAt = LocalNow();
            // Chuan hoa CreatedAt cu (doc tu DB co the la Kind khac) ve Unspecified truoc khi save lai.
            existing.CreatedAt = DateTime.SpecifyKind(existing.CreatedAt, DateTimeKind.Unspecified);
            _repo.Update(existing);
            await _repo.SaveChangesAsync();
            return ToDto(existing);
        }

        var account = new PaymentAccount
        {
            OwnerUserId = ownerUserId,
            BankBin = dto.BankBin.Trim(),
            BankAccountNo = dto.BankAccountNo.Trim(),
            AccountHolder = dto.AccountHolder.Trim(),
            BankName = dto.BankName?.Trim(),
            Provider = "sepay",
            IsActive = true,
            ConnectedAt = LocalNow(),
            CreatedAt = LocalNow()
        };
        await _repo.AddAsync(account);
        await _repo.SaveChangesAsync();
        return ToDto(account);
    }

    // DateTime Kind=Unspecified, khop cot 'timestamp without time zone' (Npgsql tu choi Kind=Utc).
    private static DateTime LocalNow() => DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

    private static PaymentAccountDto ToDto(PaymentAccount a) => new()
    {
        Id = a.Id,
        OwnerUserId = a.OwnerUserId,
        BankBin = a.BankBin,
        BankAccountNo = a.BankAccountNo,
        AccountHolder = a.AccountHolder,
        BankName = a.BankName,
        Provider = a.Provider,
        IsActive = a.IsActive,
        ConnectedAt = a.ConnectedAt
    };
}
