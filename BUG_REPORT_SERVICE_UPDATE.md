# BUG REPORT: Thêm/Xóa Dịch Vụ Hợp Đồng Không Được Lưu Đúng

## 🔴 Vấn Đề
Khi thêm/xóa dịch vụ từ modal edit contract và click "Cập nhật hợp đồng":
- **Lưu không consistent** - lúc đúng, lúc sai, lúc không lưu gì cả
- **Công thức tính tiền (BillingFormulaJson) không update** - vẫn hiển thị dịch vụ cũ
- **ChiTietSuDungDichVu table lưu được nhưng formula không match**

**Ví dụ:**
1. Contract ban đầu có: Điện, Nước, Internet
2. User thêm: Gửi xe (service ID 5)
3. User xóa: Internet (service ID 3)
4. Kết quả mong muốn: Điện, Nước, Gửi xe
5. **Kết quả thực tế:** Vẫn hiển thị Điện, Nước, Internet (lúc đúng hoặc lúc số dịch vụ sai)

## 📊 Root Cause Analysis

### Nguyên Nhân Chính
**ApplyProposalToContractAsync** trong `HopDongService.cs` thực hiện:
1. ✅ Thêm dịch vụ mới vào bảng ChiTietSuDungDichVu
2. ✅ Xóa dịch vụ bằng cách set ApplyTo date
3. ❌ **KHÔNG rebuild contract.BillingFormulaJson** trước khi save

**Flow lỗi:**
```
1. AddAsync(new ChiTietSuDungDichVu) → chỉ trong EF Core change tracker
2. Update(usage với ApplyTo date)      → chỉ trong change tracker
3. SaveChangesAsync()                  → NHƯNG BillingFormulaJson không update
4. Query lại để rebuild formula        → DB không có services mới vì chưa commit
5. Formula JSON vẫn cũ
6. Save contract lần 2               → vẫn formula cũ
```

### Vấn Đề Secondary
- **primaryResidentId = 0** → không thêm được services (nếu scope không include ChiTietOs đúng)
- **Date comparison inconsistent** - so sánh `DateTime` vs `.Date` không nhất quán
- **EF Core caching** - dữ liệu stale khi query lại

## 🛠️ Code Changes Thực Hiện

### File: `backend/Services/HopDongService.cs`
**Method: `ApplyProposalToContractAsync` (line 628-761)**

**Changes:**
1. **Moved SaveChangesAsync TRƯỚC rebuild formula** (line 712)
   - Cũ: SaveChangesAsync gọi SAU rebuild (line 756)
   - Mới: SaveChangesAsync gọi TỚM RANH rebuild (line 712)
   - Reason: Để DB có services mới khi query rebuild

2. **Fixed date comparison** (line 716)
   - Cũ: `u.ApplyFrom <= envelope.EffectiveDate && (u.ApplyTo == null || u.ApplyTo >= envelope.EffectiveDate)`
   - Mới: `u.ApplyFrom.Date <= envelope.EffectiveDate.Date && (u.ApplyTo == null || u.ApplyTo.Value.Date >= envelope.EffectiveDate.Date)`
   - Reason: Loại bỏ time component, chỉ so sánh date

3. **Added error logging** (lines 662-755)
   - `[CONTRACT] ADDING/SKIPPED` - trace service additions
   - `[FORMULA]` logs - trace rebuild process
   - Debug khi nào services được thêm, cách nào được filter

4. **Added primaryResidentId check** (lines 688-690)
   - Log nếu primaryResidentId = 0 hoặc AddedServiceIds empty
   - Để catch case không có resident owner

## 📍 Code Locations

### Service Addition Block (Line 660-690)
```csharp
if (primaryResidentId > 0 && envelope.AddedServiceIds.Any())
{
    var existing = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
    foreach (var serviceId in envelope.AddedServiceIds.Distinct())
    {
        var overlapping = existing.Any(u =>
            u.ServiceId == serviceId
            && u.ApplyFrom <= (contract.ExpectedEndDate ?? DateTime.MaxValue)
            && (u.ApplyTo == null || u.ApplyTo >= envelope.EffectiveDate));

        if (overlapping)
        {
            Console.WriteLine($"[CONTRACT] Service {serviceId} SKIPPED - overlapping exists");
            continue;
        }

        Console.WriteLine($"[CONTRACT] ADDING service {serviceId} for resident {primaryResidentId} from {envelope.EffectiveDate}");
        await _chiTietSuDungDichVuRepository.AddAsync(new ChiTietSuDungDichVu
        {
            ServiceId = serviceId,
            ResidentId = primaryResidentId,
            RoomId = contract.RoomId,
            ApplyFrom = envelope.EffectiveDate,
            ApplyTo = contract.ExpectedEndDate,
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            Note = $"Thêm theo cập nhật hợp đồng {contract.ContractCode}"
        });
    }
}
else
{
    Console.WriteLine($"[CONTRACT] NO ADD - primaryResidentId={primaryResidentId}, AddedServiceIds.Count={envelope.AddedServiceIds.Count}");
}
```

### Service Removal Block (Line 692-702)
```csharp
if (envelope.RemovedServiceIds.Any())
{
    var existing = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
    var removalBoundary = envelope.EffectiveDate.Date.AddDays(-1);

    foreach (var usage in existing.Where(u =>
                 envelope.RemovedServiceIds.Contains(u.ServiceId)
                 && (u.ApplyTo == null || u.ApplyTo >= envelope.EffectiveDate.Date)
                 && u.ApplyFrom <= envelope.EffectiveDate.Date))
    {
        usage.ApplyTo = removalBoundary;
        _chiTietSuDungDichVuRepository.Update(usage);
    }
}
```

### **Critical: SaveChangesAsync BEFORE Rebuild** (Line 704-705)
```csharp
// Save changes to ChiTietSuDungDichVu trước khi rebuild formula
await _hopDongRepository.SaveChangesAsync();
Console.WriteLine($"[CONTRACT] SaveChangesAsync completed");
```

### Formula Rebuild Block (Line 707-761)
```csharp
// Rebuild billing formula khi có thay đổi service
if (envelope.AddedServiceIds.Any() || envelope.RemovedServiceIds.Any() || envelope.ServicePriceChanges.Any())
{
    try
    {
        var allServices = await _serviceRepository.GetAllAsync();
        var allUsages = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
        Console.WriteLine($"[FORMULA] Total usages in DB for room {contract.RoomId}: {allUsages.Count}");
        
        var currentUsages = allUsages
            .Where(u => u.ApplyFrom.Date <= envelope.EffectiveDate.Date && (u.ApplyTo == null || u.ApplyTo.Value.Date >= envelope.EffectiveDate.Date))
            .ToList();
        Console.WriteLine($"[FORMULA] Active usages at {envelope.EffectiveDate.Date}: {currentUsages.Count}");

        var billingFormula = new List<BillingFormulaItemDto>();
        
        // Build formula with rent + services
        billingFormula.Add(new BillingFormulaItemDto
        {
            SortOrder = 1,
            ItemType = "TienPhong",
            ServiceName = "Tiền thuê phòng",
            UnitPrice = contract.ActualRentPrice,
            Quantity = 1,
            QuantityExpression = "1"
        });

        var sortOrder = 2;
        foreach (var usage in currentUsages)
        {
            var service = allServices.FirstOrDefault(s => s.Id == usage.ServiceId);
            if (service != null)
            {
                Console.WriteLine($"[FORMULA] Adding {service.Name} (ID {service.Id}) @{service.CommonUnitPrice}");
                billingFormula.Add(new BillingFormulaItemDto
                {
                    SortOrder = sortOrder++,
                    ItemType = "DichVu",
                    ServiceId = service.Id,
                    ServiceName = service.Name,
                    UnitPrice = service.CommonUnitPrice ?? 0,
                    Quantity = usage.Quantity ?? 1,
                    QuantityExpression = "1"
                });
            }
        }

        contract.BillingFormulaJson = JsonSerializer.Serialize(billingFormula, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        Console.WriteLine($"[FORMULA] Serialized {billingFormula.Count} items");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[FORMULA] ERROR: {ex.Message} {ex.StackTrace}");
    }
}
```

## 🧪 Debug Steps Cần Thực Hiện

### 1. **Console Output Analysis**
Chạy backend và test add/remove services, capture logs:
```
[CONTRACT] ADDING service 5 for resident 3 from 2026-04-01
[CONTRACT] SaveChangesAsync completed
[FORMULA] Total usages in DB for room 2: 8
[FORMULA] Active usages at 2026-04-01: 3
[FORMULA] Adding Điện (ID 1) @150000
[FORMULA] Adding Gửi xe (ID 5) @50000
[FORMULA] Serialized 3 items
```

### 2. **Database Verification**
- Check `CHI_TIET_SU_DUNG_DICH_VU` table:
  - Service mới có được thêm không?
  - Service cũ có `APPLY_TO` date không?
- Check `HOP_DONG.BILLING_FORMULA_JSON`:
  - Có chứa service mới không?
  - Format đúng không? (camelCase properties)

### 3. **Possible Issues to Investigate**
- [ ] `primaryResidentId` = 0 hoặc null
- [ ] `envelope.AddedServiceIds` empty (frontend không gửi đúng)
- [ ] `GetByRoomIdAsync` không query đúng services
- [ ] Date filtering quá strict, filter mất services
- [ ] JSON serialization error
- [ ] Overlapping logic quá khắt khe (skip hết services)

## 📝 Pending Questions

1. **Khi add/remove, console log xuất hiện không?**
   - Nếu NO → services không được thêm vào change tracker
   - Nếu YES → check có bao nhiêu services

2. **`[FORMULA] Total usages in DB` = bao nhiêu?**
   - Nếu = (cũ), tức SaveChangesAsync không commit được
   - Nếu = (cũ + mới), tức commit OK nhưng query lại có vấn đề

3. **`[FORMULA] Adding...` log có hiển thị services mới không?**
   - YES → rebuild OK, lỗi ở frontend hoặc caching
   - NO → filter lại mất services (date issue hoặc ApplyTo issue)

## 🚀 Next Steps

Agent khác cần:
1. **Xem console logs** khi test để xác định vấn đề ở đâu (service add, rebuild, hay save)
2. **Query database** để verify ChiTietSuDungDichVu và BillingFormulaJson
3. **Nếu vẫn lỗi**, adjust:
   - Date comparison logic
   - Overlapping detection
   - Service filtering
   - JSON serialization

---

**Build Status:** ✅ Compiles successfully  
**Code Location:** `backend/Services/HopDongService.cs` line 628-761  
**Related Files:** 
- `backend/DTOs/HopDongDto.cs` (BillingFormulaItemDto definition)
- `backend/Repositories/HopDongRepository.cs` (GetWithDetailsAsync includes ChiTietOs)
- `backend/Controllers/HopDongController.cs` (ProposeChange endpoint)
