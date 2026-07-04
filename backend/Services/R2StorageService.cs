using Amazon.S3;
using Amazon.S3.Model;

namespace backend.Services;

/// <summary>
/// Truu tuong luu tru file (anh). Co 2 impl: R2 (cloud) va Local (dia).
/// </summary>
public interface IStorageService
{
    /// <summary>Upload noi dung file, tra ve URL de hien thi (public URL voi R2, /uploads/... voi local).</summary>
    Task<string> UploadAsync(Stream content, string fileName, string contentType);

    /// <summary>Xoa file theo key hoac URL day du.</summary>
    Task<bool> DeleteAsync(string keyOrUrl);
}

/// <summary>
/// Luu tru len Cloudflare R2 (S3-compatible). Bucket public -> tra ve PublicBaseUrl/{key}.
/// Yeu cau DisablePayloadSigning vi R2 khong ho tro streaming SigV4.
/// </summary>
public class R2StorageService : IStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;
    private readonly string _publicBaseUrl;
    private readonly ILogger<R2StorageService> _logger;

    public R2StorageService(IConfiguration configuration, ILogger<R2StorageService> logger)
    {
        _logger = logger;
        var accountId = configuration["R2:AccountId"] ?? "";
        var accessKey = configuration["R2:AccessKey"] ?? "";
        var secretKey = configuration["R2:SecretKey"] ?? "";
        _bucket = configuration["R2:Bucket"] ?? "";
        _publicBaseUrl = (configuration["R2:PublicBaseUrl"] ?? "").TrimEnd('/');

        var config = new AmazonS3Config
        {
            ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
            // R2 dung region "auto" + path style.
            AuthenticationRegion = "auto",
            ForcePathStyle = true,
        };
        _s3 = new AmazonS3Client(accessKey, secretKey, config);
    }

    /// <summary>Kiem tra cau hinh R2 co day du de dung khong.</summary>
    public static bool IsConfigured(IConfiguration configuration)
        => !string.IsNullOrWhiteSpace(configuration["R2:AccountId"])
           && !string.IsNullOrWhiteSpace(configuration["R2:AccessKey"])
           && !string.IsNullOrWhiteSpace(configuration["R2:SecretKey"])
           && !string.IsNullOrWhiteSpace(configuration["R2:Bucket"])
           && !string.IsNullOrWhiteSpace(configuration["R2:PublicBaseUrl"]);

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType)
    {
        var request = new PutObjectRequest
        {
            BucketName = _bucket,
            Key = fileName,
            InputStream = content,
            ContentType = contentType,
            // BAT BUOC cho R2: khong dung streaming SigV4 / checksum mac dinh.
            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true,
        };
        await _s3.PutObjectAsync(request);
        return $"{_publicBaseUrl}/{fileName}";
    }

    public async Task<bool> DeleteAsync(string keyOrUrl)
    {
        var key = ExtractKey(keyOrUrl);
        if (string.IsNullOrWhiteSpace(key))
        {
            return false;
        }
        try
        {
            await _s3.DeleteObjectAsync(new DeleteObjectRequest { BucketName = _bucket, Key = key });
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "R2 delete failed for {Key}", key);
            return false;
        }
    }

    /// <summary>Lay key tu URL day du hoac tu chinh key.</summary>
    private string ExtractKey(string keyOrUrl)
    {
        if (string.IsNullOrWhiteSpace(keyOrUrl)) return "";
        if (!string.IsNullOrEmpty(_publicBaseUrl) && keyOrUrl.StartsWith(_publicBaseUrl))
        {
            return keyOrUrl.Substring(_publicBaseUrl.Length).TrimStart('/');
        }
        // URL bat ky -> lay phan cuoi; hoac da la key thi giu nguyen.
        var idx = keyOrUrl.LastIndexOf('/');
        return idx >= 0 ? keyOrUrl[(idx + 1)..] : keyOrUrl;
    }
}

/// <summary>
/// Fallback luu tru local (dia) - giu hanh vi cu khi chua cau hinh R2.
/// Tra ve URL tuong doi /uploads/{fileName} (duoc Program.cs serve qua UseStaticFiles).
/// </summary>
public class LocalStorageService : IStorageService
{
    private readonly string _uploadsPath;

    public LocalStorageService(IWebHostEnvironment env, IConfiguration configuration)
    {
        var configured = configuration["Uploads:RootPath"];
        _uploadsPath = string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(env.ContentRootPath, "uploads")
            : Environment.ExpandEnvironmentVariables(configured);
    }

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType)
    {
        if (!Directory.Exists(_uploadsPath))
        {
            Directory.CreateDirectory(_uploadsPath);
        }
        var filePath = Path.Combine(_uploadsPath, fileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await content.CopyToAsync(stream);
        return $"/uploads/{fileName}";
    }

    public Task<bool> DeleteAsync(string keyOrUrl)
    {
        var fileName = Path.GetFileName(keyOrUrl);
        var filePath = Path.Combine(_uploadsPath, fileName);
        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
}
