using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IKnowledgeBaseService
{
    Task<List<KnowledgeBaseDto>> GetAllAsync(int ownerUserId, bool activeOnly = false);
    Task<List<KnowledgeBaseDto>> GetByCategoryAsync(string category, int ownerUserId);
    Task<List<KnowledgeBaseDto>> SearchAsync(string keyword, int ownerUserId);
    Task<KnowledgeBaseDto?> GetByIdAsync(int id, int ownerUserId);
    Task<KnowledgeBaseDto> CreateAsync(CreateKnowledgeBaseDto dto, int userId, int ownerUserId);
    Task<KnowledgeBaseDto> UpdateAsync(int id, UpdateKnowledgeBaseDto dto, int userId, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);

    /// <summary>
    /// Hoan tac 1 lan upload: xoa row KNOWLEDGE_BASE va file tren kho luu tru (R2/local).
    /// Dung khi ingest sang ChromaDB that bai -> tranh de lai tai lieu chi ton tai o
    /// Prop-Tech nhung chatbot khong bao gio doc duoc.
    /// </summary>
    Task<bool> RollbackUploadedDocumentAsync(int id, int ownerUserId);

    Task<DocumentUploadResultDto> UploadDocumentAsync(IFormFile file, string category, bool autoActivate, int userId, int ownerUserId);
    Task<DocumentUploadResultDto> UploadDocumentForOwnerAsync(IFormFile file, string category, bool autoActivate, int? userId, int? ownerUserId);
}

public class KnowledgeBaseService : IKnowledgeBaseService
{
    private readonly IKnowledgeBaseRepository _repository;
    private readonly IStorageService _storage;

    public KnowledgeBaseService(IKnowledgeBaseRepository repository, IStorageService storage)
    {
        _repository = repository;
        _storage = storage;
    }

    public async Task<List<KnowledgeBaseDto>> GetAllAsync(int ownerUserId, bool activeOnly = false)
    {
        var items = await _repository.GetAllAsync(ownerUserId);
        return items.Select(MapToDto).ToList();
    }

    public Task<List<KnowledgeBaseDto>> GetByCategoryAsync(string category, int ownerUserId)
        => Task.FromResult(new List<KnowledgeBaseDto>());

    public async Task<List<KnowledgeBaseDto>> SearchAsync(string keyword, int ownerUserId)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return new List<KnowledgeBaseDto>();
        }

        var items = await _repository.SearchAsync(keyword, ownerUserId);
        return items.Select(MapToDto).ToList();
    }

    public async Task<KnowledgeBaseDto?> GetByIdAsync(int id, int ownerUserId)
    {
        var item = await _repository.GetByIdAsync(id, ownerUserId);
        return item == null ? null : MapToDto(item);
    }

    public async Task<KnowledgeBaseDto> CreateAsync(CreateKnowledgeBaseDto dto, int userId, int ownerUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.FileName) || string.IsNullOrWhiteSpace(dto.FileUrl))
        {
            throw new InvalidOperationException("Ten file va URL khong duoc de trong");
        }

        var kb = new KnowledgeBase
        {
            FileName = dto.FileName.Trim(),
            FileUrl = dto.FileUrl.Trim(),
            OwnerUserId = ownerUserId,
            CreatedAt = DateTime.UtcNow,
        };

        await _repository.AddAsync(kb);
        await _repository.SaveChangesAsync();

        var created = await _repository.GetByIdAsync(kb.Id, ownerUserId);
        return MapToDto(created!);
    }

    public async Task<KnowledgeBaseDto> UpdateAsync(int id, UpdateKnowledgeBaseDto dto, int userId, int ownerUserId)
    {
        var kb = await _repository.GetByIdAsync(id, ownerUserId);
        if (kb == null)
        {
            throw new InvalidOperationException("Khong tim thay tai lieu tri thuc nay");
        }

        if (!string.IsNullOrWhiteSpace(dto.FileName))
        {
            kb.FileName = dto.FileName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(dto.FileUrl))
        {
            kb.FileUrl = dto.FileUrl.Trim();
        }

        _repository.Update(kb);
        await _repository.SaveChangesAsync();

        var updated = await _repository.GetByIdAsync(id, ownerUserId);
        return MapToDto(updated!);
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var kb = await _repository.GetByIdAsync(id, ownerUserId);
        if (kb == null)
        {
            throw new InvalidOperationException("Khong tim thay tai lieu tri thuc nay");
        }

        _repository.Remove(kb);
        await _repository.SaveChangesAsync();
    }

    public async Task<bool> RollbackUploadedDocumentAsync(int id, int ownerUserId)
    {
        var kb = await _repository.GetByIdAsync(id, ownerUserId);
        if (kb == null)
        {
            return false;
        }

        var fileUrl = kb.FileUrl;
        _repository.Remove(kb);
        await _repository.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(fileUrl))
        {
            try
            {
                // Xoa file la best-effort: row DB da bien mat nen file con lai chi la
                // rac trong bucket, khong duoc phep lam request upload nem exception.
                await _storage.DeleteAsync(fileUrl);
            }
            catch
            {
                // Bo qua - caller da biet upload that bai.
            }
        }

        return true;
    }

    public Task<DocumentUploadResultDto> UploadDocumentAsync(IFormFile file, string category, bool autoActivate, int userId, int ownerUserId)
        => UploadDocumentForOwnerAsync(file, category, autoActivate, userId, ownerUserId);

    public async Task<DocumentUploadResultDto> UploadDocumentForOwnerAsync(IFormFile file, string category, bool autoActivate, int? userId, int? ownerUserId)
    {
        var originalFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            throw new InvalidOperationException("Ten file khong hop le");
        }

        var storedFileName = $"{Guid.NewGuid():N}_{BuildSafeStorageName(originalFileName)}";
        var contentType = ResolveContentType(file.ContentType, originalFileName);

        await using var stream = file.OpenReadStream();
        var fileUrl = await _storage.UploadAsync(stream, storedFileName, contentType);

        var kb = new KnowledgeBase
        {
            FileName = originalFileName,
            FileUrl = fileUrl,
            OwnerUserId = ownerUserId,
            CreatedAt = DateTime.UtcNow,
        };

        try
        {
            await _repository.AddAsync(kb);
            await _repository.SaveChangesAsync();
        }
        catch
        {
            // File da nam tren R2 nhung khong ghi duoc metadata -> khong con gi tham
            // chieu toi no. Xoa de khong de lai file rac trong bucket, roi nem tiep
            // loi goc de caller biet that bai.
            try
            {
                await _storage.DeleteAsync(fileUrl);
            }
            catch
            {
                // Bo qua: loi goc quan trong hon.
            }

            throw;
        }

        var entry = MapToDto(kb);
        return new DocumentUploadResultDto
        {
            FileName = entry.FileName,
            FileUrl = entry.FileUrl,
            Entry = entry,
        };
    }

    private static KnowledgeBaseDto MapToDto(KnowledgeBase kb)
    {
        return new KnowledgeBaseDto
        {
            Id = kb.Id,
            FileName = kb.FileName,
            FileUrl = kb.FileUrl,
            OwnerUserId = kb.OwnerUserId,
            CreatedAt = kb.CreatedAt,
        };
    }

    /// <summary>
    /// Trinh duyet gui content type KHONG kem charset (vi du "text/markdown" cho file
    /// .md). R2 luu nguyen va tra ve dung nhu vay, nen browser doc file UTF-8 bang
    /// encoding legacy (windows-1252) -> tieng Viet thanh mojibake:
    /// "Quy trinh" hien ra thanh "Quy trÃ¬nh".
    ///
    /// Voi file text thi ep ve "text/plain; charset=utf-8": vua hien thi ngay trong
    /// tab thay vi tai xuong, vua dung dau. Cac dinh dang binary (pdf, docx) giu
    /// nguyen content type do browser gui.
    /// </summary>
    private static string ResolveContentType(string? uploadedContentType, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (extension is ".md" or ".txt")
        {
            return "text/plain; charset=utf-8";
        }

        return string.IsNullOrWhiteSpace(uploadedContentType)
            ? "application/octet-stream"
            : uploadedContentType;
    }

    private static string BuildSafeStorageName(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        var nameWithoutExtension = Path.GetFileNameWithoutExtension(fileName);
        var safeChars = nameWithoutExtension
            .Select(ch => ch <= 127 && (char.IsLetterOrDigit(ch) || ch is '-' or '_') ? ch : '-')
            .ToArray();
        var safeName = new string(safeChars).Trim('-');
        if (string.IsNullOrWhiteSpace(safeName))
        {
            safeName = "document";
        }

        return $"{safeName}{extension.ToLowerInvariant()}";
    }
}
