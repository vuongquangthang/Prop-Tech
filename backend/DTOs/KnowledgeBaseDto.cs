namespace backend.DTOs;

/// <summary>
/// DTO for uploaded knowledge document metadata.
/// </summary>
public class KnowledgeBaseDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public int? OwnerUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO to create a metadata-only knowledge base entry.
/// </summary>
public class CreateKnowledgeBaseDto
{
    public string FileName { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
}

/// <summary>
/// DTO to update a metadata-only knowledge base entry.
/// </summary>
public class UpdateKnowledgeBaseDto
{
    public string? FileName { get; set; }
    public string? FileUrl { get; set; }
}

/// <summary>
/// Result from uploading a document to storage.
/// </summary>
public class DocumentUploadResultDto
{
    public string FileName { get; set; } = null!;
    public string FileUrl { get; set; } = null!;
    public KnowledgeBaseDto? Entry { get; set; }
    public bool IngestTriggered { get; set; }
    public bool IngestSucceeded { get; set; }
    public string? IngestMessage { get; set; }
    public int? IngestDocuments { get; set; }
}
