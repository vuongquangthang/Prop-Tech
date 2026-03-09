namespace backend.DTOs;

/// <summary>
/// DTO for KnowledgeBase display
/// </summary>
public class KnowledgeBaseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int? UpdatedBy { get; set; }
    public string? UpdatedByName { get; set; }
}

/// <summary>
/// DTO to create new knowledge base entry
/// </summary>
public class CreateKnowledgeBaseDto
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO to update knowledge base entry
/// </summary>
public class UpdateKnowledgeBaseDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// Result from uploading a document for knowledge extraction
/// </summary>
public class DocumentUploadResultDto
{
    public string FileName { get; set; } = null!;
    public int TotalExtracted { get; set; }
    public int Activated { get; set; }
    public List<KnowledgeBaseDto> Entries { get; set; } = new();
}
