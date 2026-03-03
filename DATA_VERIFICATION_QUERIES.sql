-- =====================================================================
-- DATA VERIFICATION QUERIES
-- Purpose: Verify data integrity and FK relationships
-- =====================================================================

USE apartment_management_dev;
GO

PRINT '========================================';
PRINT 'DATA VERIFICATION REPORT';
PRINT '========================================';
PRINT '';

-- =====================================================================
-- 1. RECORD COUNTS
-- =====================================================================
PRINT '1. RECORD COUNTS:';
PRINT '----------------------------------------';

SELECT 'TOA_NHA' AS TableName, COUNT(*) AS RecordCount FROM TOA_NHA
UNION ALL SELECT 'TANG', COUNT(*) FROM TANG
UNION ALL SELECT 'PHONG', COUNT(*) FROM PHONG
UNION ALL SELECT 'CU_DAN', COUNT(*) FROM CU_DAN
UNION ALL SELECT 'USER', COUNT(*) FROM [USER]
UNION ALL SELECT 'HOP_DONG', COUNT(*) FROM HOP_DONG
UNION ALL SELECT 'CHI_TIET_O', COUNT(*) FROM CHI_TIET_O
UNION ALL SELECT 'XE', COUNT(*) FROM XE
UNION ALL SELECT 'DICH_VU', COUNT(*) FROM DICH_VU
UNION ALL SELECT 'CHI_TIET_SU_DUNG_DICH_VU', COUNT(*) FROM CHI_TIET_SU_DUNG_DICH_VU
UNION ALL SELECT 'CHI_SO_DIEN', COUNT(*) FROM CHI_SO_DIEN
UNION ALL SELECT 'CHI_SO_NUOC', COUNT(*) FROM CHI_SO_NUOC
UNION ALL SELECT 'HOA_DON', COUNT(*) FROM HOA_DON
UNION ALL SELECT 'CHI_TIET_HOA_DON', COUNT(*) FROM CHI_TIET_HOA_DON
UNION ALL SELECT 'THANH_TOAN', COUNT(*) FROM THANH_TOAN
UNION ALL SELECT 'TAI_SAN', COUNT(*) FROM TAI_SAN
UNION ALL SELECT 'CHI_TIET_TAI_SAN_PHONG', COUNT(*) FROM CHI_TIET_TAI_SAN_PHONG
UNION ALL SELECT 'YEU_CAU_SUA_CHUA', COUNT(*) FROM YEU_CAU_SUA_CHUA
UNION ALL SELECT 'KNOWLEDGE_BASE', COUNT(*) FROM KNOWLEDGE_BASE
UNION ALL SELECT 'LICH_SU_CHAT', COUNT(*) FROM LICH_SU_CHAT
UNION ALL SELECT 'NHAT_KY_NHAC_NO', COUNT(*) FROM NHAT_KY_NHAC_NO
ORDER BY TableName;

PRINT '';

-- =====================================================================
-- 2. BUILDING STRUCTURE
-- =====================================================================
PRINT '2. BUILDING STRUCTURE:';
PRINT '----------------------------------------';

SELECT 
    tn.TEN_TOA_NHA,
    tn.SO_TANG,
    COUNT(DISTINCT t.TANG_ID) AS TotalFloors,
    COUNT(p.PHONG_ID) AS TotalRooms,
    SUM(CASE WHEN p.TRANG_THAI = N'Đã thuê' THEN 1 ELSE 0 END) AS RentedRooms,
    SUM(CASE WHEN p.TRANG_THAI = N'Trống' THEN 1 ELSE 0 END) AS AvailableRooms
FROM TOA_NHA tn
LEFT JOIN TANG t ON tn.TOA_NHA_ID = t.TOA_NHA_ID
LEFT JOIN PHONG p ON t.TANG_ID = p.TANG_ID
GROUP BY tn.TEN_TOA_NHA, tn.SO_TANG;

PRINT '';

-- =====================================================================
-- 3. ACTIVE CONTRACTS SUMMARY
-- =====================================================================
PRINT '3. ACTIVE CONTRACTS:';
PRINT '----------------------------------------';

SELECT 
    hd.HOP_DONG_ID,
    p.MA_PHONG AS RoomCode,
    hd.GIA_THUE_THUC_TE AS MonthlyRent,
    hd.TIEN_COC AS Deposit,
    hd.NGAY_BAT_DAU AS StartDate,
    hd.NGAY_KET_THUC_DU_KIEN AS EndDate,
    cd.HO_TEN AS MainTenant,
    cd.SO_DIEN_THOAI AS Phone
FROM HOP_DONG hd
INNER JOIN PHONG p ON hd.PHONG_ID = p.PHONG_ID
INNER JOIN CHI_TIET_O cto ON hd.HOP_DONG_ID = cto.HOP_DONG_ID AND cto.VAI_TRO_O = N'Người thuê chính'
INNER JOIN CU_DAN cd ON cto.CU_DAN_ID = cd.CU_DAN_ID
WHERE hd.NGAY_KET_THUC_DU_KIEN IS NULL OR hd.NGAY_KET_THUC_DU_KIEN >= GETDATE()
ORDER BY hd.HOP_DONG_ID;

PRINT '';

-- =====================================================================
-- 4. USERS BY ROLE
-- =====================================================================
PRINT '4. USERS BY ROLE:';
PRINT '----------------------------------------';

SELECT 
    VAI_TRO AS Role,
    COUNT(*) AS UserCount,
    SUM(CASE WHEN IS_LOCKED = 0 THEN 1 ELSE 0 END) AS ActiveUsers,
    SUM(CASE WHEN IS_LOCKED = 1 THEN 1 ELSE 0 END) AS LockedUsers
FROM [USER]
GROUP BY VAI_TRO
ORDER BY VAI_TRO;

PRINT '';

-- =====================================================================
-- 5. VEHICLE REGISTRATIONS
-- =====================================================================
PRINT '5. VEHICLE REGISTRATIONS:';
PRINT '----------------------------------------';

SELECT 
    cd.HO_TEN AS Owner,
    x.BIEN_SO AS PlateNumber,
    x.LOAI_XE AS VehicleType,
    x.NGAY_DANG_KY AS RegisteredDate,
    p.MA_PHONG AS RoomCode
FROM XE x
INNER JOIN CU_DAN cd ON x.CU_DAN_ID = cd.CU_DAN_ID
LEFT JOIN CHI_TIET_O cto ON cd.CU_DAN_ID = cto.CU_DAN_ID AND cto.DEN_NGAY IS NULL
LEFT JOIN HOP_DONG hd ON cto.HOP_DONG_ID = hd.HOP_DONG_ID
LEFT JOIN PHONG p ON hd.PHONG_ID = p.PHONG_ID
WHERE x.NGAY_HUY IS NULL
ORDER BY x.LOAI_XE, cd.HO_TEN;

PRINT '';

-- =====================================================================
-- 6. SERVICES AND PRICING
-- =====================================================================
PRINT '6. ACTIVE SERVICES:';
PRINT '----------------------------------------';

SELECT 
    TEN_DICH_VU AS ServiceName,
    LOAI AS Type,
    DON_VI AS Unit,
    FORMAT(DON_GIA_CHUNG, 'N0') AS UnitPrice,
    CASE WHEN IS_ACTIVE = 1 THEN 'Active' ELSE 'Inactive' END AS Status
FROM DICH_VU
WHERE IS_ACTIVE = 1
ORDER BY LOAI, TEN_DICH_VU;

PRINT '';

-- =====================================================================
-- 7. METER READINGS SUMMARY
-- =====================================================================
PRINT '7. METER READINGS (Latest):';
PRINT '----------------------------------------';

-- Latest electricity readings
SELECT 
    p.MA_PHONG AS Room,
    'Electricity' AS Type,
    csd.KY_THANG AS Month,
    csd.KY_NAM AS Year,
    csd.CHI_SO_MOI AS CurrentReading,
    LAG(csd.CHI_SO_MOI) OVER (PARTITION BY csd.CT_SDDV_ID ORDER BY csd.KY_NAM, csd.KY_THANG) AS PreviousReading,
    csd.CHI_SO_MOI - LAG(csd.CHI_SO_MOI) OVER (PARTITION BY csd.CT_SDDV_ID ORDER BY csd.KY_NAM, csd.KY_THANG) AS Consumption
FROM CHI_SO_DIEN csd
INNER JOIN CHI_TIET_SU_DUNG_DICH_VU ctsddv ON csd.CT_SDDV_ID = ctsddv.CT_SDDV_ID
INNER JOIN PHONG p ON ctsddv.PHONG_ID = p.PHONG_ID
ORDER BY p.MA_PHONG, csd.KY_NAM DESC, csd.KY_THANG DESC;

PRINT '';

-- Latest water readings
SELECT 
    p.MA_PHONG AS Room,
    'Water' AS Type,
    csn.KY_THANG AS Month,
    csn.KY_NAM AS Year,
    csn.CHI_SO_MOI AS CurrentReading,
    LAG(csn.CHI_SO_MOI) OVER (PARTITION BY csn.CT_SDDV_ID ORDER BY csn.KY_NAM, csn.KY_THANG) AS PreviousReading,
    csn.CHI_SO_MOI - LAG(csn.CHI_SO_MOI) OVER (PARTITION BY csn.CT_SDDV_ID ORDER BY csn.KY_NAM, csn.KY_THANG) AS Consumption
FROM CHI_SO_NUOC csn
INNER JOIN CHI_TIET_SU_DUNG_DICH_VU ctsddv ON csn.CT_SDDV_ID = ctsddv.CT_SDDV_ID
INNER JOIN PHONG p ON ctsddv.PHONG_ID = p.PHONG_ID
ORDER BY p.MA_PHONG, csn.KY_NAM DESC, csn.KY_THANG DESC;

PRINT '';

-- =====================================================================
-- 8. INVOICES SUMMARY
-- =====================================================================
PRINT '8. INVOICES SUMMARY:';
PRINT '----------------------------------------';

SELECT 
    p.MA_PHONG AS Room,
    hd.THANG AS Month,
    hd.NAM AS Year,
    FORMAT(hd.TONG_TIEN, 'N0') + ' VND' AS TotalAmount,
    hd.TRANG_THAI AS Status,
    hd.DUE_DATE AS DueDate,
    CASE WHEN tt.THANH_TOAN_ID IS NOT NULL THEN 'Yes' ELSE 'No' END AS Paid
FROM HOA_DON hd
INNER JOIN HOP_DONG hop ON hd.HOP_DONG_ID = hop.HOP_DONG_ID
INNER JOIN PHONG p ON hop.PHONG_ID = p.PHONG_ID
LEFT JOIN THANH_TOAN tt ON hd.HOA_DON_ID = tt.HOA_DON_ID
ORDER BY hd.NAM DESC, hd.THANG DESC, p.MA_PHONG;

PRINT '';

-- =====================================================================
-- 9. INVOICE DETAILS (Sample - Room 101, January 2026)
-- =====================================================================
PRINT '9. SAMPLE INVOICE DETAILS (Room 101, Jan 2026):';
PRINT '----------------------------------------';

SELECT 
    cthd.LOAI_KHOAN AS ItemType,
    dv.TEN_DICH_VU AS ServiceName,
    cthd.SO_LUONG AS Quantity,
    FORMAT(cthd.DON_GIA, 'N0') AS UnitPrice,
    FORMAT(cthd.SO_LUONG * cthd.DON_GIA, 'N0') + ' VND' AS LineTotal,
    cthd.MO_TA AS Description
FROM CHI_TIET_HOA_DON cthd
INNER JOIN HOA_DON hd ON cthd.HOA_DON_ID = hd.HOA_DON_ID
INNER JOIN HOP_DONG hop ON hd.HOP_DONG_ID = hop.HOP_DONG_ID
INNER JOIN PHONG p ON hop.PHONG_ID = p.PHONG_ID
LEFT JOIN DICH_VU dv ON cthd.DICH_VU_ID = dv.DICH_VU_ID
WHERE p.MA_PHONG = '101' AND hd.THANG = 1 AND hd.NAM = 2026
ORDER BY cthd.CHI_TIET_ID;

PRINT '';

-- =====================================================================
-- 10. PAYMENT SUMMARY
-- =====================================================================
PRINT '10. PAYMENT SUMMARY:';
PRINT '----------------------------------------';

SELECT 
    p.MA_PHONG AS Room,
    hd.THANG AS Month,
    hd.NAM AS Year,
    tt.LOAI AS PaymentMethod,
    FORMAT(tt.SO_TIEN, 'N0') + ' VND' AS Amount,
    tt.MA_GIAO_DICH AS TransactionCode,
    tt.PAID_AT AS PaymentDate,
    tt.STATUS AS Status
FROM THANH_TOAN tt
INNER JOIN HOA_DON hd ON tt.HOA_DON_ID = hd.HOA_DON_ID
INNER JOIN HOP_DONG hop ON hd.HOP_DONG_ID = hop.HOP_DONG_ID
INNER JOIN PHONG p ON hop.PHONG_ID = p.PHONG_ID
ORDER BY tt.PAID_AT DESC;

PRINT '';

-- =====================================================================
-- 11. ASSETS BY ROOM
-- =====================================================================
PRINT '11. ROOM ASSETS:';
PRINT '----------------------------------------';

SELECT 
    p.MA_PHONG AS Room,
    ts.TEN_TAI_SAN AS AssetName,
    ctts.SO_LUONG AS Quantity,
    ctts.TINH_TRANG AS Condition,
    ctts.GHI_CHU AS Notes
FROM CHI_TIET_TAI_SAN_PHONG ctts
INNER JOIN PHONG p ON ctts.PHONG_ID = p.PHONG_ID
INNER JOIN TAI_SAN ts ON ctts.TAI_SAN_ID = ts.TAI_SAN_ID
ORDER BY p.MA_PHONG, ts.TEN_TAI_SAN;

PRINT '';

-- =====================================================================
-- 12. MAINTENANCE REQUESTS
-- =====================================================================
PRINT '12. MAINTENANCE REQUESTS:';
PRINT '----------------------------------------';

SELECT 
    yc.YEU_CAU_ID AS RequestID,
    p.MA_PHONG AS Room,
    cd.HO_TEN AS Tenant,
    yc.LOAI_SU_CO AS IssueType,
    yc.MO_TA AS Description,
    yc.TRANG_THAI AS Status,
    yc.CREATED_AT AS CreatedDate,
    yc.CLOSED_AT AS ClosedDate,
    yc.GHI_CHU_ADMIN AS AdminNotes
FROM YEU_CAU_SUA_CHUA yc
INNER JOIN PHONG p ON yc.PHONG_ID = p.PHONG_ID
INNER JOIN [USER] u ON yc.USER_ID = u.USER_ID
LEFT JOIN CU_DAN cd ON u.CU_DAN_ID = cd.CU_DAN_ID
ORDER BY yc.CREATED_AT DESC;

PRINT '';

-- =====================================================================
-- 13. KNOWLEDGE BASE SUMMARY
-- =====================================================================
PRINT '13. KNOWLEDGE BASE ARTICLES:';
PRINT '----------------------------------------';

SELECT 
    KB_ID AS ArticleID,
    TIEU_DE AS Title,
    THE_LOAI AS Category,
    TAGS AS Tags,
    CASE WHEN IS_ACTIVE = 1 THEN 'Active' ELSE 'Inactive' END AS Status
FROM KNOWLEDGE_BASE
WHERE IS_ACTIVE = 1
ORDER BY THE_LOAI, TIEU_DE;

PRINT '';

-- =====================================================================
-- 14. CHAT ACTIVITY SUMMARY
-- =====================================================================
PRINT '14. CHAT ACTIVITY (Recent):';
PRINT '----------------------------------------';

SELECT TOP 10
    u.SO_DIEN_THOAI AS UserPhone,
    ISNULL(cd.HO_TEN, u.VAI_TRO) AS UserName,
    lc.MESSAGE_ROLE AS Role,
    LEFT(lc.MESSAGE_TEXT, 100) AS Message,
    lc.CREATED_AT AS Timestamp
FROM LICH_SU_CHAT lc
INNER JOIN [USER] u ON lc.USER_ID = u.USER_ID
LEFT JOIN CU_DAN cd ON u.CU_DAN_ID = cd.CU_DAN_ID
ORDER BY lc.CREATED_AT DESC;

PRINT '';

-- =====================================================================
-- 15. PAYMENT REMINDERS
-- =====================================================================
PRINT '15. PAYMENT REMINDERS (Recent):';
PRINT '----------------------------------------';

SELECT 
    p.MA_PHONG AS Room,
    hd.THANG AS Month,
    hd.NAM AS Year,
    cd.HO_TEN AS Tenant,
    nn.LAN_NHAC AS ReminderCount,
    nn.HINH_THUC AS Method,
    nn.TRANG_THAI_GUI AS Status,
    nn.NHAC_LUC AS SentAt
FROM NHAT_KY_NHAC_NO nn
INNER JOIN HOA_DON hd ON nn.HOA_DON_ID = hd.HOA_DON_ID
INNER JOIN HOP_DONG hop ON hd.HOP_DONG_ID = hop.HOP_DONG_ID
INNER JOIN PHONG p ON hop.PHONG_ID = p.PHONG_ID
INNER JOIN [USER] u ON nn.SENT_TO_USER_ID = u.USER_ID
LEFT JOIN CU_DAN cd ON u.CU_DAN_ID = cd.CU_DAN_ID
ORDER BY nn.NHAC_LUC DESC;

PRINT '';

-- =====================================================================
-- 16. DATA INTEGRITY CHECKS
-- =====================================================================
PRINT '16. DATA INTEGRITY CHECKS:';
PRINT '----------------------------------------';

-- Check orphaned records
SELECT 'Orphaned Contracts (no residents)' AS CheckName, COUNT(*) AS Count
FROM HOP_DONG hd
LEFT JOIN CHI_TIET_O cto ON hd.HOP_DONG_ID = cto.HOP_DONG_ID
WHERE cto.HOP_DONG_ID IS NULL

UNION ALL

SELECT 'Invoices without line items', COUNT(*)
FROM HOA_DON hd
LEFT JOIN CHI_TIET_HOA_DON cthd ON hd.HOA_DON_ID = cthd.HOA_DON_ID
WHERE cthd.HOA_DON_ID IS NULL

UNION ALL

SELECT 'Users without phone numbers', COUNT(*)
FROM [USER]
WHERE SO_DIEN_THOAI IS NULL OR SO_DIEN_THOAI = ''

UNION ALL

SELECT 'Rooms without floors', COUNT(*)
FROM PHONG
WHERE TANG_ID IS NULL

UNION ALL

SELECT 'Vehicles without owners', COUNT(*)
FROM XE x
LEFT JOIN CU_DAN cd ON x.CU_DAN_ID = cd.CU_DAN_ID
WHERE cd.CU_DAN_ID IS NULL;

PRINT '';

-- =====================================================================
-- 17. FINANCIAL SUMMARY
-- =====================================================================
PRINT '17. FINANCIAL SUMMARY:';
PRINT '----------------------------------------';

-- Total invoiced vs paid
SELECT 
    'Total Invoiced (All)' AS Description,
    FORMAT(SUM(TONG_TIEN), 'N0') + ' VND' AS Amount
FROM HOA_DON

UNION ALL

SELECT 
    'Total Paid',
    FORMAT(SUM(SO_TIEN), 'N0') + ' VND'
FROM THANH_TOAN
WHERE HOA_DON_ID IS NOT NULL

UNION ALL

SELECT 
    'Total Outstanding',
    FORMAT(SUM(hd.TONG_TIEN), 'N0') + ' VND'
FROM HOA_DON hd
LEFT JOIN THANH_TOAN tt ON hd.HOA_DON_ID = tt.HOA_DON_ID
WHERE hd.TRANG_THAI = N'Chưa thanh toán' AND tt.THANH_TOAN_ID IS NULL;

PRINT '';

-- =====================================================================
-- 18. INVOICE CALCULATION VERIFICATION
-- =====================================================================
PRINT '18. INVOICE CALCULATION VERIFICATION:';
PRINT '----------------------------------------';

SELECT 
    hd.HOA_DON_ID AS InvoiceID,
    p.MA_PHONG AS Room,
    FORMAT(hd.TONG_TIEN, 'N0') AS InvoiceTotal,
    FORMAT(SUM(ISNULL(cthd.SO_LUONG, 0) * ISNULL(cthd.DON_GIA, 0)), 'N0') AS CalculatedTotal,
    CASE 
        WHEN ABS(hd.TONG_TIEN - SUM(ISNULL(cthd.SO_LUONG, 0) * ISNULL(cthd.DON_GIA, 0))) < 1 
        THEN 'OK' 
        ELSE 'MISMATCH' 
    END AS Status
FROM HOA_DON hd
INNER JOIN HOP_DONG hop ON hd.HOP_DONG_ID = hop.HOP_DONG_ID
INNER JOIN PHONG p ON hop.PHONG_ID = p.PHONG_ID
LEFT JOIN CHI_TIET_HOA_DON cthd ON hd.HOA_DON_ID = cthd.HOA_DON_ID
GROUP BY hd.HOA_DON_ID, p.MA_PHONG, hd.TONG_TIEN
ORDER BY hd.HOA_DON_ID;

PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION COMPLETED';
PRINT '========================================';

GO
