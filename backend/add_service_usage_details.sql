-- Thêm chi tiết sử dụng dịch vụ điện/nước cho tất cả phòng có cư dân đang ở
-- Script này tạo records trong CHI_TIET_SU_DUNG_DICH_VU để hệ thống có thể ghi chỉ số điện nước

USE apartment_management_dev;
GO

-- Xóa dữ liệu cũ nếu có (cho clean start)
DELETE FROM CHI_TIET_SU_DUNG_DICH_VU;
GO

-- Thêm dịch vụ ĐIỆN cho tất cả cư dân đang ở
INSERT INTO CHI_TIET_SU_DUNG_DICH_VU (
    DICH_VU_ID,
    CU_DAN_ID,
    PHONG_ID,
    AP_DUNG_TU,
    AP_DUNG_DEN,
    OVERRIDE_DON_GIA,
    SO_LUONG,
    GHI_CHU,
    CREATED_AT
)
SELECT 
    1 as DICH_VU_ID,            -- Dịch vụ điện
    cto.CU_DAN_ID,
    hd.PHONG_ID,
    cto.TU_NGAY as AP_DUNG_TU,
    NULL as AP_DUNG_DEN,        -- NULL = đang sử dụng
    NULL as OVERRIDE_DON_GIA,  -- Sử dụng giá chung
    1 as SO_LUONG,
    N'Tự động tạo cho dịch vụ điện' as GHI_CHU,
    GETUTCDATE() as CREATED_AT
FROM CHI_TIET_O cto
INNER JOIN HOP_DONG hd ON cto.HOP_DONG_ID = hd.HOP_DONG_ID
WHERE cto.DEN_NGAY IS NULL;  -- Chỉ lấy cư dân đang ở
GO

-- Thêm dịch vụ NƯỚC cho tất cả cư dân đang ở
INSERT INTO CHI_TIET_SU_DUNG_DICH_VU (
    DICH_VU_ID,
    CU_DAN_ID,
    PHONG_ID,
    AP_DUNG_TU,
    AP_DUNG_DEN,
    OVERRIDE_DON_GIA,
    SO_LUONG,
    GHI_CHU,
    CREATED_AT
)
SELECT 
    2 as DICH_VU_ID,            -- Dịch vụ nước
    cto.CU_DAN_ID,
    hd.PHONG_ID,
    cto.TU_NGAY as AP_DUNG_TU,
    NULL as AP_DUNG_DEN,        -- NULL = đang sử dụng
    NULL as OVERRIDE_DON_GIA,  -- Sử dụng giá chung
    1 as SO_LUONG,
    N'Tự động tạo cho dịch vụ nước' as GHI_CHU,
    GETUTCDATE() as CREATED_AT
FROM CHI_TIET_O cto
INNER JOIN HOP_DONG hd ON cto.HOP_DONG_ID = hd.HOP_DONG_ID
WHERE cto.DEN_NGAY IS NULL;  -- Chỉ lấy cư dân đang ở
GO

-- Kiểm tra kết quả
SELECT 
    COUNT(*) as TotalRecords,
    SUM(CASE WHEN DICH_VU_ID = 1 THEN 1 ELSE 0 END) as ElectricityRecords,
    SUM(CASE WHEN DICH_VU_ID = 2 THEN 1 ELSE 0 END) as WaterRecords
FROM CHI_TIET_SU_DUNG_DICH_VU;
GO

-- Xem chi tiết 5 records đầu tiên
SELECT TOP 5 
    sd.CT_SDDV_ID,
    sd.DICH_VU_ID,
    dv.TEN_DICH_VU,
    sd.PHONG_ID,
    p.MA_PHONG,
    sd.CU_DAN_ID,
    cd.HO_TEN,
    sd.AP_DUNG_TU,
    sd.AP_DUNG_DEN
FROM CHI_TIET_SU_DUNG_DICH_VU sd
INNER JOIN DICH_VU dv ON sd.DICH_VU_ID = dv.DICH_VU_ID
INNER JOIN PHONG p ON sd.PHONG_ID = p.PHONG_ID
INNER JOIN CU_DAN cd ON sd.CU_DAN_ID = cd.CU_DAN_ID
ORDER BY sd.CT_SDDV_ID;
GO
