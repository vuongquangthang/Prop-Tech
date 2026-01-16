using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IRegulationService
{
    Task<List<RegulationResponseDto>> SearchAsync(string? searchTerm, string? category = null);
    Task<RegulationResponseDto?> GetByIdAsync(long id);
    Task<RegulationResponseDto?> GetByCodeAsync(string code);
    Task<RegulationResponseDto> CreateAsync(RegulationCreateDto dto, long createdBy);
    Task<RegulationResponseDto?> UpdateAsync(long id, RegulationUpdateDto dto);
    Task<bool> DeleteAsync(long id);
    Task IncrementViewCountAsync(long id);
}

public class RegulationService : IRegulationService
{
    private readonly IRegulationRepository _regulationRepository;
    private readonly ApplicationDbContext _context;

    public RegulationService(IRegulationRepository regulationRepository, ApplicationDbContext context)
    {
        _regulationRepository = regulationRepository;
        _context = context;
    }

    public async Task<List<RegulationResponseDto>> SearchAsync(string? searchTerm, string? category = null)
    {
        List<Regulation> regulations;

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            // Use Full-Text Search
            regulations = await _regulationRepository.SearchFullTextAsync(searchTerm, category);
        }
        else
        {
            // Get all active regulations
            regulations = await _regulationRepository.GetActiveRegulationsAsync(category);
        }

        return regulations.Select(r => new RegulationResponseDto
        {
            Id = r.Id,
            RegulationCode = r.RegulationCode,
            Category = r.Category,
            Title = r.Title,
            Content = r.Content,
            EffectiveDate = r.EffectiveDate,
            ExpiryDate = r.ExpiryDate,
            ViewCount = r.ViewCount,
            IsActive = r.IsActive,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    public async Task<RegulationResponseDto?> GetByIdAsync(long id)
    {
        var regulation = await _regulationRepository.GetByIdAsync(id);
        if (regulation == null) return null;

        return new RegulationResponseDto
        {
            Id = regulation.Id,
            RegulationCode = regulation.RegulationCode,
            Category = regulation.Category,
            Title = regulation.Title,
            Content = regulation.Content,
            EffectiveDate = regulation.EffectiveDate,
            ExpiryDate = regulation.ExpiryDate,
            ViewCount = regulation.ViewCount,
            IsActive = regulation.IsActive,
            CreatedAt = regulation.CreatedAt
        };
    }

    public async Task<RegulationResponseDto?> GetByCodeAsync(string code)
    {
        var regulation = await _context.Regulations
            .FirstOrDefaultAsync(r => r.RegulationCode == code);
        
        if (regulation == null) return null;

        return new RegulationResponseDto
        {
            Id = regulation.Id,
            RegulationCode = regulation.RegulationCode,
            Category = regulation.Category,
            Title = regulation.Title,
            Content = regulation.Content,
            EffectiveDate = regulation.EffectiveDate,
            ExpiryDate = regulation.ExpiryDate,
            ViewCount = regulation.ViewCount,
            IsActive = regulation.IsActive,
            CreatedAt = regulation.CreatedAt
        };
    }

    public async Task<RegulationResponseDto> CreateAsync(RegulationCreateDto dto, long createdBy)
    {
        var regulation = new Regulation
        {
            RegulationCode = dto.RegulationCode,
            Category = dto.Category,
            Title = dto.Title,
            Content = dto.Content,
            EffectiveDate = dto.EffectiveDate,
            ExpiryDate = dto.ExpiryDate,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow
        };

        await _regulationRepository.AddAsync(regulation);

        return new RegulationResponseDto
        {
            Id = regulation.Id,
            RegulationCode = regulation.RegulationCode,
            Category = regulation.Category,
            Title = regulation.Title,
            Content = regulation.Content,
            EffectiveDate = regulation.EffectiveDate,
            ExpiryDate = regulation.ExpiryDate,
            ViewCount = regulation.ViewCount,
            IsActive = regulation.IsActive,
            CreatedAt = regulation.CreatedAt
        };
    }

    public async Task<RegulationResponseDto?> UpdateAsync(long id, RegulationUpdateDto dto)
    {
        var regulation = await _regulationRepository.GetByIdAsync(id);
        if (regulation == null) return null;

        if (dto.Category != null) regulation.Category = dto.Category;
        if (dto.Title != null) regulation.Title = dto.Title;
        if (dto.Content != null) regulation.Content = dto.Content;
        if (dto.EffectiveDate.HasValue) regulation.EffectiveDate = dto.EffectiveDate;
        if (dto.ExpiryDate.HasValue) regulation.ExpiryDate = dto.ExpiryDate;
        if (dto.IsActive.HasValue) regulation.IsActive = dto.IsActive.Value;

        _regulationRepository.Update(regulation);
        await _regulationRepository.SaveChangesAsync();

        return new RegulationResponseDto
        {
            Id = regulation.Id,
            RegulationCode = regulation.RegulationCode,
            Category = regulation.Category,
            Title = regulation.Title,
            Content = regulation.Content,
            EffectiveDate = regulation.EffectiveDate,
            ExpiryDate = regulation.ExpiryDate,
            ViewCount = regulation.ViewCount,
            IsActive = regulation.IsActive,
            CreatedAt = regulation.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var regulation = await _regulationRepository.GetByIdAsync(id);
        if (regulation == null) return false;

        _regulationRepository.Remove(regulation);
        await _regulationRepository.SaveChangesAsync();
        return true;
    }

    public async Task IncrementViewCountAsync(long id)
    {
        var regulation = await _context.Regulations.FindAsync(id);
        if (regulation != null)
        {
            regulation.ViewCount++;
            await _context.SaveChangesAsync();
        }
    }
}
