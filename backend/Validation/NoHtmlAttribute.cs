using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace backend.Validation;

/// <summary>
/// Chặn chuỗi chứa thẻ HTML/script (vd &lt;script&gt;, &lt;img ...&gt;) trong input người dùng.
/// Tránh nội dung nguy hiểm/xấu như "&lt;script&gt;alert(1)&lt;/script&gt;" lọt vào DB.
/// Null/rỗng được coi là hợp lệ (dùng [Required] riêng nếu cần bắt buộc).
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter, AllowMultiple = false)]
public sealed class NoHtmlAttribute : ValidationAttribute
{
    // Bắt bất kỳ thẻ dạng <...> — đủ để chặn HTML/script injection ở trường text thường.
    private static readonly Regex HtmlTagRegex =
        new(@"<[^>]+>", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public NoHtmlAttribute()
    {
        ErrorMessage = "Không được chứa thẻ HTML hoặc mã script.";
    }

    public override bool IsValid(object? value)
    {
        if (value is not string s || string.IsNullOrWhiteSpace(s))
        {
            return true;
        }
        return !HtmlTagRegex.IsMatch(s);
    }
}
