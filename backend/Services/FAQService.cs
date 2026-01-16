using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IFAQService
{
    Task<List<FAQResponseDto>> SearchAsync(string? searchTerm, string? category = null);
    Task<FAQResponseDto?> GetByIdAsync(long id);
    Task<FAQResponseDto> CreateAsync(FAQCreateDto dto, long createdBy);
    Task<FAQResponseDto?> UpdateAsync(long id, FAQUpdateDto dto);
    Task<bool> DeleteAsync(long id);
    Task IncrementViewCountAsync(long id);
}

public class FAQService : IFAQService
{
    private readonly IFAQRepository _faqRepository;
    private readonly ApplicationDbContext _context;

    public FAQService(IFAQRepository faqRepository, ApplicationDbContext context)
    {
        _faqRepository = faqRepository;
        _context = context;
    }

    public async Task<List<FAQResponseDto>> SearchAsync(string? searchTerm, string? category = null)
    {
        List<FAQ> faqs;

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            // Use Full-Text Search
            faqs = await _faqRepository.SearchFullTextAsync(searchTerm, category);
        }
        else
        {
            // Get all active FAQs
            faqs = await _faqRepository.GetActiveFAQsAsync(category);
        }

        return faqs.Select(f => new FAQResponseDto
        {
            Id = f.Id,
            Category = f.Category,
            Question = f.Question,
            Answer = f.Answer,
            Keywords = f.Keywords,
            DisplayOrder = f.DisplayOrder,
            ViewCount = f.ViewCount,
            IsActive = f.IsActive,
            CreatedAt = f.CreatedAt
        }).ToList();
    }

    public async Task<FAQResponseDto?> GetByIdAsync(long id)
    {
        var faq = await _faqRepository.GetByIdAsync(id);
        if (faq == null) return null;

        return new FAQResponseDto
        {
            Id = faq.Id,
            Category = faq.Category,
            Question = faq.Question,
            Answer = faq.Answer,
            Keywords = faq.Keywords,
            DisplayOrder = faq.DisplayOrder,
            ViewCount = faq.ViewCount,
            IsActive = faq.IsActive,
            CreatedAt = faq.CreatedAt
        };
    }

    public async Task<FAQResponseDto> CreateAsync(FAQCreateDto dto, long createdBy)
    {
        var faq = new FAQ
        {
            Category = dto.Category,
            Question = dto.Question,
            Answer = dto.Answer,
            Keywords = dto.Keywords,
            DisplayOrder = dto.DisplayOrder,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow
        };

        await _faqRepository.AddAsync(faq);

        return new FAQResponseDto
        {
            Id = faq.Id,
            Category = faq.Category,
            Question = faq.Question,
            Answer = faq.Answer,
            Keywords = faq.Keywords,
            DisplayOrder = faq.DisplayOrder,
            ViewCount = faq.ViewCount,
            IsActive = faq.IsActive,
            CreatedAt = faq.CreatedAt
        };
    }

    public async Task<FAQResponseDto?> UpdateAsync(long id, FAQUpdateDto dto)
    {
        var faq = await _faqRepository.GetByIdAsync(id);
        if (faq == null) return null;

        if (dto.Category != null) faq.Category = dto.Category;
        if (dto.Question != null) faq.Question = dto.Question;
        if (dto.Answer != null) faq.Answer = dto.Answer;
        if (dto.Keywords != null) faq.Keywords = dto.Keywords;
        if (dto.DisplayOrder.HasValue) faq.DisplayOrder = dto.DisplayOrder.Value;
        if (dto.IsActive.HasValue) faq.IsActive = dto.IsActive.Value;

        _faqRepository.Update(faq);
        await _faqRepository.SaveChangesAsync();

        return new FAQResponseDto
        {
            Id = faq.Id,
            Category = faq.Category,
            Question = faq.Question,
            Answer = faq.Answer,
            Keywords = faq.Keywords,
            DisplayOrder = faq.DisplayOrder,
            ViewCount = faq.ViewCount,
            IsActive = faq.IsActive,
            CreatedAt = faq.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var faq = await _faqRepository.GetByIdAsync(id);
        if (faq == null) return false;

        _faqRepository.Remove(faq);
        await _faqRepository.SaveChangesAsync();
        return true;
    }

    public async Task IncrementViewCountAsync(long id)
    {
        var faq = await _context.FAQs.FindAsync(id);
        if (faq != null)
        {
            faq.ViewCount++;
            await _context.SaveChangesAsync();
        }
    }
}
