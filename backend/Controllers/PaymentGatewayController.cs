using Microsoft.AspNetCore.Mvc;
using backend.Repositories;
using backend.DTOs;
using backend.Models;
using System.Text;

namespace backend.Controllers;

[ApiController]
[Route("payment")]
public class PaymentGatewayController : ControllerBase
{
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly ILogger<PaymentGatewayController> _logger;

    public PaymentGatewayController(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository,
        ILogger<PaymentGatewayController> logger)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
        _logger = logger;
    }

    /// <summary>
    /// Mock Payment Gateway Page - Displays transaction info and SUCCESS/FAILED buttons
    /// </summary>
    [HttpGet("gateway")]
    public async Task<IActionResult> Gateway([FromQuery] string txn)
    {
        // Find transaction
        var transaction = await _thanhToanRepository.FirstOrDefaultAsync(t => t.TransactionCode == txn);
        if (transaction == null)
        {
            return Content(GenerateErrorPage("Giao dịch không tồn tại"), "text/html", Encoding.UTF8);
        }

        // Get invoice info
        var invoice = transaction.InvoiceId.HasValue 
            ? await _hoaDonRepository.GetByIdAsync(transaction.InvoiceId.Value)
            : null;

        var html = GenerateGatewayPage(transaction, invoice);
        return Content(html, "text/html", Encoding.UTF8);
    }

    private string GenerateGatewayPage(ThanhToan transaction, HoaDon? invoice)
    {
        var invoiceInfo = invoice != null 
            ? $"Hóa đơn tháng {invoice.Month}/{invoice.Year}"
            : "N/A";

        var statusBadge = transaction.Status switch
        {
            "PENDING" => "<span class='badge pending'>⏱️ Đang chờ</span>",
            "SUCCESS" => "<span class='badge success'>✅ Thành công</span>",
            "FAILED" => "<span class='badge failed'>❌ Thất bại</span>",
            _ => "<span class='badge'>" + transaction.Status + "</span>"
        };

        return $@"<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Mock Payment Gateway</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .container {{
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #333;
            font-size: 24px;
            margin-bottom: 8px;
        }}
        .header p {{
            color: #666;
            font-size: 14px;
        }}
        .card {{
            background: #f7f9fc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .info-row:last-child {{
            border-bottom: none;
        }}
        .label {{
            color: #666;
            font-size: 14px;
        }}
        .value {{
            color: #333;
            font-weight: 600;
            font-size: 14px;
            text-align: right;
        }}
        .amount {{
            font-size: 32px;
            color: #667eea;
            font-weight: 700;
            text-align: center;
            margin: 24px 0;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge.pending {{
            background: #fff3cd;
            color: #856404;
        }}
        .badge.success {{
            background: #d4edda;
            color: #155724;
        }}
        .badge.failed {{
            background: #f8d7da;
            color: #721c24;
        }}
        .actions {{
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }}
        .btn {{
            flex: 1;
            padding: 16px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }}
        .btn:active {{
            transform: translateY(0);
        }}
        .btn.success {{
            background: #28a745;
            color: white;
        }}
        .btn.success:hover {{
            background: #218838;
        }}
        .btn.failed {{
            background: #dc3545;
            color: white;
        }}
        .btn.failed:hover {{
            background: #c82333;
        }}
        .btn:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }}
        .note {{
            margin-top: 20px;
            padding: 16px;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }}
        .loading {{
            text-align: center;
            padding: 20px;
            color: #666;
        }}
        .success-message {{
            background: #d4edda;
            color: #155724;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-top: 20px;
            font-weight: 600;
        }}
        .error-message {{
            background: #f8d7da;
            color: #721c24;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-top: 20px;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🏦 Mock Payment Gateway</h1>
            <p>Cổng thanh toán giả lập - Development Only</p>
        </div>

        <div class='card'>
            <div class='info-row'>
                <span class='label'>Mã giao dịch:</span>
                <span class='value'>{transaction.TransactionCode}</span>
            </div>
            <div class='info-row'>
                <span class='label'>Hóa đơn:</span>
                <span class='value'>{invoiceInfo}</span>
            </div>
            <div class='info-row'>
                <span class='label'>Trạng thái:</span>
                <span class='value'>{statusBadge}</span>
            </div>
            <div class='amount'>{transaction.Amount:N0} VNĐ</div>
        </div>

        <div class='note'>
            ⚠️ <strong>Đây là cổng thanh toán giả lập</strong><br>
            Trong môi trường thực tế, đây sẽ là trang của VNPay, ZaloPay, Momo, etc.<br>
            Nhấn nút bên dưới để mô phỏng kết quả thanh toán.
        </div>

        <div class='actions'>
            <button class='btn success' onclick='processPayment(""SUCCESS"")' {(transaction.Status != "PENDING" ? "disabled" : "")}>
                ✅ Thanh Toán Thành Công
            </button>
            <button class='btn failed' onclick='processPayment(""FAILED"")' {(transaction.Status != "PENDING" ? "disabled" : "")}>
                ❌ Thanh Toán Thất Bại
            </button>
        </div>

        <div id='result'></div>
    </div>

    <script>
        const transactionCode = '{transaction.TransactionCode}';
        const apiUrl = '/api/Payment/callback';

        async function processPayment(status) {{
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class=""loading"">⏳ Đang xử lý...</div>';
            
            // Disable buttons
            document.querySelectorAll('.btn').forEach(btn => btn.disabled = true);

            try {{
                const response = await fetch(apiUrl, {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify({{
                        transactionCode: transactionCode,
                        status: status,
                        paidAt: status === 'SUCCESS' ? new Date().toISOString() : null,
                        gatewayTransactionId: 'MOCK_' + Date.now(),
                        gatewayResponse: status === 'SUCCESS' ? 'Payment successful' : 'Payment failed'
                    }})
                }});

                const data = await response.json();
                
                if (data.success) {{
                    resultDiv.innerHTML = `<div class='success-message'>
                        ✅ ${{data.message}}<br>
                        <small>Trạng thái hóa đơn: ${{data.invoiceStatus || 'N/A'}}</small>
                    </div>`;
                    
                    // Auto-close after 3 seconds
                    setTimeout(() => {{
                        window.close();
                    }}, 3000);
                }} else {{
                    resultDiv.innerHTML = `<div class='error-message'>❌ ${{data.message}}</div>`;
                }}
            }} catch (error) {{
                resultDiv.innerHTML = `<div class='error-message'>❌ Có lỗi xảy ra: ${{error.message}}</div>`;
                // Re-enable buttons on error
                document.querySelectorAll('.btn').forEach(btn => btn.disabled = false);
            }}
        }}
    </script>
</body>
</html>";
    }

    private string GenerateErrorPage(string message)
    {
        return $@"<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Error - Payment Gateway</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }}
        .error-container {{
            background: white;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }}
        .error-icon {{
            font-size: 72px;
            margin-bottom: 20px;
        }}
        .error-message {{
            color: #dc3545;
            font-size: 18px;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class='error-container'>
        <div class='error-icon'>❌</div>
        <div class='error-message'>{message}</div>
    </div>
</body>
</html>";
    }
}
