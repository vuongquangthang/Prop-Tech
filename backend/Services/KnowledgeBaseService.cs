using backend.DTOs;
using backend.Models;
using backend.Repositories;
using System.Security.Claims;
using UglyToad.PdfPig;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace backend.Services;

public interface IKnowledgeBaseService
{
    Task<List<KnowledgeBaseDto>> GetAllAsync(bool activeOnly = false);
    Task<List<KnowledgeBaseDto>> GetByCategoryAsync(string category);
    Task<List<KnowledgeBaseDto>> SearchAsync(string keyword);
    Task<KnowledgeBaseDto?> GetByIdAsync(int id);
    Task<KnowledgeBaseDto> CreateAsync(CreateKnowledgeBaseDto dto, int userId);
    Task<KnowledgeBaseDto> UpdateAsync(int id, UpdateKnowledgeBaseDto dto, int userId);
    Task DeleteAsync(int id);
    Task<DocumentUploadResultDto> UploadDocumentAsync(IFormFile file, string category, bool autoActivate, int userId);
}

public class KnowledgeBaseService : IKnowledgeBaseService
{
    private readonly IKnowledgeBaseRepository _repository;

    public KnowledgeBaseService(IKnowledgeBaseRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<KnowledgeBaseDto>> GetAllAsync(bool activeOnly = false)
    {
        var items = activeOnly 
            ? await _repository.GetAllActiveAsync()
            : await _repository.GetAllAsync();
        
        return items.Select(MapToDto).ToList();
    }

    public async Task<List<KnowledgeBaseDto>> GetByCategoryAsync(string category)
    {
        var items = await _repository.GetByCategoryAsync(category);
        return items.Select(MapToDto).ToList();
    }

    public async Task<List<KnowledgeBaseDto>> SearchAsync(string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
        {
            return new List<KnowledgeBaseDto>();
        }

        var items = await _repository.SearchAsync(keyword);
        return items.Select(MapToDto).ToList();
    }

    public async Task<KnowledgeBaseDto?> GetByIdAsync(int id)
    {
        var item = await _repository.GetByIdAsync(id);
        return item == null ? null : MapToDto(item);
    }

    public async Task<KnowledgeBaseDto> CreateAsync(CreateKnowledgeBaseDto dto, int userId)
    {
        var kb = new KnowledgeBase
        {
            Title = dto.Title,
            Content = dto.Content,
            Category = dto.Category,
            Tags = dto.Tags,
            IsActive = dto.IsActive,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = userId
        };

        await _repository.AddAsync(kb);
        await _repository.SaveChangesAsync();

        var created = await _repository.GetByIdAsync(kb.Id);
        return MapToDto(created!);
    }

    public async Task<KnowledgeBaseDto> UpdateAsync(int id, UpdateKnowledgeBaseDto dto, int userId)
    {
        var kb = await _repository.GetByIdAsync(id);
        if (kb == null)
        {
            throw new InvalidOperationException("Không tìm thấy kiến thức này");
        }

        if (!string.IsNullOrWhiteSpace(dto.Title))
            kb.Title = dto.Title;

        if (!string.IsNullOrWhiteSpace(dto.Content))
            kb.Content = dto.Content;

        if (dto.Category != null)
            kb.Category = dto.Category;

        if (dto.Tags != null)
            kb.Tags = dto.Tags;

        if (dto.IsActive.HasValue)
            kb.IsActive = dto.IsActive.Value;

        kb.UpdatedAt = DateTime.UtcNow;
        kb.UpdatedBy = userId;

        _repository.Update(kb);
        await _repository.SaveChangesAsync();

        var updated = await _repository.GetByIdAsync(id);
        return MapToDto(updated!);
    }

    public async Task DeleteAsync(int id)
    {
        var kb = await _repository.GetByIdAsync(id);
        if (kb == null)
        {
            throw new InvalidOperationException("Không tìm thấy kiến thức này");
        }

        _repository.Remove(kb);
        await _repository.SaveChangesAsync();
    }

    public async Task<DocumentUploadResultDto> UploadDocumentAsync(IFormFile file, string category, bool autoActivate, int userId)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        string rawText;

        using var memStream = new MemoryStream();
        await file.CopyToAsync(memStream);
        memStream.Position = 0;

        rawText = extension switch
        {
            ".pdf" => ExtractTextFromPdf(memStream),
            ".docx" => ExtractTextFromDocx(memStream),
            ".txt" or ".doc" => new StreamReader(memStream).ReadToEnd(),
            _ => throw new InvalidOperationException("Loại file không được hỗ trợ")
        };

        var chunks = SplitIntoChunks(rawText);
        var entries = new List<KnowledgeBase>();
        var now = DateTime.UtcNow;

        foreach (var chunk in chunks)
        {
            var title = ExtractTitle(chunk);
            var content = chunk.Length > 2000 ? chunk[..2000] : chunk;

            entries.Add(new KnowledgeBase
            {
                Title = title,
                Content = content,
                Category = category,
                IsActive = autoActivate,
                UpdatedAt = now,
                UpdatedBy = userId
            });
        }

        if (entries.Count > 0)
        {
            await _repository.AddRangeAsync(entries);
            await _repository.SaveChangesAsync();
        }

        return new DocumentUploadResultDto
        {
            FileName = file.FileName,
            TotalExtracted = entries.Count,
            Activated = autoActivate ? entries.Count : 0,
            Entries = entries.Select(MapToDto).ToList()
        };
    }

    private static string ExtractTextFromPdf(Stream stream)
    {
        var sb = new System.Text.StringBuilder();
        using var pdf = PdfDocument.Open(stream);
        foreach (var page in pdf.GetPages())
        {
            sb.AppendLine(page.Text);
            sb.AppendLine();
        }
        return sb.ToString();
    }

    private static string ExtractTextFromDocx(Stream stream)
    {
        var sb = new System.Text.StringBuilder();
        using var wordDoc = WordprocessingDocument.Open(stream, false);
        var body = wordDoc.MainDocumentPart?.Document?.Body;
        if (body == null) return string.Empty;
        foreach (var para in body.Elements<Paragraph>())
        {
            var text = para.InnerText.Trim();
            if (!string.IsNullOrEmpty(text))
                sb.AppendLine(text);
        }
        return sb.ToString();
    }

    private static List<string> SplitIntoChunks(string text)
    {
        var paragraphs = text
            .Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim().Replace("\r\n", " ").Replace("\n", " "))
            .Where(p => p.Length >= 20)
            .ToList();

        // If no double-newline separation, split by single lines (headings mode)
        if (paragraphs.Count <= 1)
        {
            paragraphs = text
                .Split(new[] { "\n", "\r\n" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => p.Length >= 20)
                .ToList();
        }

        return paragraphs;
    }

    private static string ExtractTitle(string chunk)
    {
        // Use first sentence as title
        var sentenceEnd = chunk.IndexOfAny(new[] { '.', '?', '!' });
        var title = sentenceEnd > 0 && sentenceEnd < 200
            ? chunk[..(sentenceEnd + 1)]
            : chunk.Length > 150 ? chunk[..150] + "..." : chunk;
        return title.Trim();
    }

    private KnowledgeBaseDto MapToDto(KnowledgeBase kb)
    {
        return new KnowledgeBaseDto
        {
            Id = kb.Id,
            Title = kb.Title,
            Content = kb.Content,
            Category = kb.Category,
            Tags = kb.Tags,
            IsActive = kb.IsActive,
            UpdatedAt = kb.UpdatedAt,
            UpdatedBy = kb.UpdatedBy,
            UpdatedByName = kb.UpdatedByUser?.PhoneNumber
        };
    }
}
