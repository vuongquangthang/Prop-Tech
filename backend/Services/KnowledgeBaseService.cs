using backend.DTOs;
using backend.Models;
using backend.Repositories;
using System.Security.Claims;

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
