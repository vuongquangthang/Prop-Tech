-- =====================================================================
-- COMPREHENSIVE SAMPLE DATA FOR apartment_management_dev
-- Generated: March 3, 2026
-- Purpose: Create realistic sample data for ALL tables with proper FK relationships
-- =====================================================================

USE apartment_management_dev;
GO

-- Set required options
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Clean existing data (in reverse FK order)
PRINT 'Cleaning existing data...';

DELETE FROM NHAT_KY_NHAC_NO;
DELETE FROM LICH_SU_CHAT;
DELETE FROM THANH_TOAN;
DELETE FROM CHI_TIET_HOA_DON;
DELETE FROM HOA_DON;
DELETE FROM CHI_SO_NUOC;
DELETE FROM CHI_SO_DIEN;
DELETE FROM CHI_TIET_SU_DUNG_DICH_VU;
DELETE FROM CHI_TIET_TAI_SAN_PHONG;
DELETE FROM TAI_SAN;
DELETE FROM YEU_CAU_SUA_CHUA;
DELETE FROM XE;
DELETE FROM CHI_TIET_O;
DELETE FROM HOP_DONG;
DELETE FROM [USER];
DELETE FROM CU_DAN;
DELETE FROM PHONG;
DELETE FROM TANG;
DELETE FROM TOA_NHA;
DELETE FROM DICH_VU;
DELETE FROM KNOWLEDGE_BASE;
DELETE FROM ChiTietPhieuTatToan;
DELETE FROM TatToan;

-- Reset identity seeds
DBCC CHECKIDENT ('TOA_NHA', RESEED, 0);
DBCC CHECKIDENT ('TANG', RESEED, 0);
DBCC CHECKIDENT ('PHONG', RESEED, 0);
DBCC CHECKIDENT ('CU_DAN', RESEED, 0);
DBCC CHECKIDENT ('[USER]', RESEED, 0);
DBCC CHECKIDENT ('HOP_DONG', RESEED, 0);
DBCC CHECKIDENT ('XE', RESEED, 0);
DBCC CHECKIDENT ('DICH_VU', RESEED, 0);
DBCC CHECKIDENT ('CHI_TIET_SU_DUNG_DICH_VU', RESEED, 0);
DBCC CHECKIDENT ('CHI_SO_DIEN', RESEED, 0);
DBCC CHECKIDENT ('CHI_SO_NUOC', RESEED, 0);
DBCC CHECKIDENT ('HOA_DON', RESEED, 0);
DBCC CHECKIDENT ('CHI_TIET_HOA_DON', RESEED, 0);
DBCC CHECKIDENT ('THANH_TOAN', RESEED, 0);
DBCC CHECKIDENT ('TAI_SAN', RESEED, 0);
DBCC CHECKIDENT ('YEU_CAU_SUA_CHUA', RESEED, 0);
DBCC CHECKIDENT ('LICH_SU_CHAT', RESEED, 0);
DBCC CHECKIDENT ('NHAT_KY_NHAC_NO', RESEED, 0);
DBCC CHECKIDENT ('KNOWLEDGE_BASE', RESEED, 0);
DBCC CHECKIDENT ('TatToan', RESEED, 0);
DBCC CHECKIDENT ('ChiTietPhieuTatToan', RESEED, 0);

GO

PRINT 'Starting data insertion...';

-- =====================================================================
-- 1. BUILDING STRUCTURE: 1 Building, 5 Floors, 20 Rooms
-- =====================================================================
PRINT '1. Creating building structure...';

-- 1 Building
INSERT INTO TOA_NHA (TEN_TOA_NHA, DIA_CHI, SO_TANG, MO_TA) VALUES 
(N'Tòa A', N'123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM', 5, N'Tòa nhà chung cư cao cấp với đầy đủ tiện nghi');

DECLARE @ToaNhaId INT = SCOPE_IDENTITY();

-- 5 Floors
INSERT INTO TANG (TOA_NHA_ID, SO_TANG) VALUES 
(@ToaNhaId, 1),
(@ToaNhaId, 2),
(@ToaNhaId, 3),
(@ToaNhaId, 4),
(@ToaNhaId, 5);

DECLARE @Tang1 INT = (SELECT TANG_ID FROM TANG WHERE TOA_NHA_ID = @ToaNhaId AND SO_TANG = 1);
DECLARE @Tang2 INT = (SELECT TANG_ID FROM TANG WHERE TOA_NHA_ID = @ToaNhaId AND SO_TANG = 2);
DECLARE @Tang3 INT = (SELECT TANG_ID FROM TANG WHERE TOA_NHA_ID = @ToaNhaId AND SO_TANG = 3);
DECLARE @Tang4 INT = (SELECT TANG_ID FROM TANG WHERE TOA_NHA_ID = @ToaNhaId AND SO_TANG = 4);
DECLARE @Tang5 INT = (SELECT TANG_ID FROM TANG WHERE TOA_NHA_ID = @ToaNhaId AND SO_TANG = 5);

-- 20 Rooms (4 per floor)
INSERT INTO PHONG (TANG_ID, MA_PHONG, DIEN_TICH, DON_GIA_THUE_MAC_DINH, TRANG_THAI) VALUES
-- Floor 1
(@Tang1, N'101', 35.5, 8000000, N'Đã thuê'),
(@Tang1, N'102', 40.0, 9000000, N'Trống'),
(@Tang1, N'103', 35.5, 8000000, N'Trống'),
(@Tang1, N'104', 45.0, 10000000, N'Trống'),
-- Floor 2
(@Tang2, N'201', 35.5, 7500000, N'Đã thuê'),
(@Tang2, N'202', 40.0, 8500000, N'Trống'),
(@Tang2, N'203', 35.5, 7500000, N'Trống'),
(@Tang2, N'204', 45.0, 9500000, N'Trống'),
-- Floor 3
(@Tang3, N'301', 40.0, 9000000, N'Đã thuê'),
(@Tang3, N'302', 40.0, 9000000, N'Trống'),
(@Tang3, N'303', 35.5, 8000000, N'Trống'),
(@Tang3, N'304', 50.0, 11000000, N'Trống'),
-- Floor 4
(@Tang4, N'401', 35.5, 8000000, N'Trống'),
(@Tang4, N'402', 40.0, 9000000, N'Trống'),
(@Tang4, N'403', 35.5, 8000000, N'Trống'),
(@Tang4, N'404', 45.0, 10000000, N'Trống'),
-- Floor 5
(@Tang5, N'501', 40.0, 9500000, N'Trống'),
(@Tang5, N'502', 45.0, 10500000, N'Trống'),
(@Tang5, N'503', 40.0, 9500000, N'Trống'),
(@Tang5, N'504', 55.0, 12000000, N'Trống');

DECLARE @Phong101 INT = (SELECT PHONG_ID FROM PHONG WHERE MA_PHONG = N'101');
DECLARE @Phong201 INT = (SELECT PHONG_ID FROM PHONG WHERE MA_PHONG = N'201');
DECLARE @Phong301 INT = (SELECT PHONG_ID FROM PHONG WHERE MA_PHONG = N'301');

PRINT '✓ Created 1 building, 5 floors, 20 rooms';

-- =====================================================================
-- 2. PEOPLE: 12 Residents + 15 Users
-- =====================================================================
PRINT '2. Creating residents and users...';

-- 12 Residents
INSERT INTO CU_DAN (HO_TEN, SO_DIEN_THOAI, SO_CCCD, QUE_QUAN) VALUES
(N'Nguyễn Văn An', N'0901234501', N'079088001234', N'Hà Nội'),
(N'Trần Thị Bình', N'0901234502', N'079088001235', N'TP.HCM'),
(N'Lê Văn Cường', N'0901234503', N'079088001236', N'Đà Nẵng'),
(N'Phạm Thị Dung', N'0901234504', N'079088001237', N'Huế'),
(N'Hoàng Văn Em', N'0901234505', N'079088001238', N'Hải Phòng'),
(N'Võ Thị Phượng', N'0901234506', N'079088001239', N'Cần Thơ'),
(N'Đỗ Văn Giang', N'0901234507', N'079088001240', N'Nha Trang'),
(N'Bùi Thị Hoa', N'0901234508', N'079088001241', N'Vũng Tàu'),
(N'Mai Văn Hùng', N'0901234509', N'079088001242', N'Biên Hòa'),
(N'Đinh Thị Linh', N'0901234510', N'079088001243', N'Long An'),
(N'Trương Văn Khoa', N'0901234511', N'079088001244', N'Tiền Giang'),
(N'Ngô Thị Mai', N'0901234512', N'079088001245', N'Bến Tre');

DECLARE @CuDan1 INT = 1, @CuDan2 INT = 2, @CuDan3 INT = 3;
DECLARE @CuDan4 INT = 4, @CuDan5 INT = 5, @CuDan6 INT = 6;
DECLARE @CuDan7 INT = 7, @CuDan8 INT = 8, @CuDan9 INT = 9;
DECLARE @CuDan10 INT = 10, @CuDan11 INT = 11, @CuDan12 INT = 12;

-- Password hash for "123456" using bcrypt-like hash
DECLARE @PasswordHash NVARCHAR(1000) = N'$2a$11$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36q3rkR6Cg9tZnXR5KsqxXW';

-- 15 Users (12 residents + 3 staff)
INSERT INTO [USER] (SO_DIEN_THOAI, MAT_KHAU_HASH, VAI_TRO, CU_DAN_ID, IS_LOCKED, LAST_LOGIN_AT) VALUES
-- Residents
(N'0901234501', @PasswordHash, N'CuDan', @CuDan1, 0, DATEADD(HOUR, -2, GETDATE())),
(N'0901234502', @PasswordHash, N'CuDan', @CuDan2, 0, DATEADD(DAY, -1, GETDATE())),
(N'0901234503', @PasswordHash, N'CuDan', @CuDan3, 0, DATEADD(HOUR, -5, GETDATE())),
(N'0901234504', @PasswordHash, N'CuDan', @CuDan4, 0, NULL),
(N'0901234505', @PasswordHash, N'CuDan', @CuDan5, 0, NULL),
(N'0901234506', @PasswordHash, N'CuDan', @CuDan6, 0, NULL),
(N'0901234507', @PasswordHash, N'CuDan', @CuDan7, 0, NULL),
(N'0901234508', @PasswordHash, N'CuDan', @CuDan8, 0, NULL),
(N'0901234509', @PasswordHash, N'CuDan', @CuDan9, 0, NULL),
(N'0901234510', @PasswordHash, N'CuDan', @CuDan10, 0, NULL),
(N'0901234511', @PasswordHash, N'CuDan', @CuDan11, 0, NULL),
(N'0901234512', @PasswordHash, N'CuDan', @CuDan12, 0, NULL),
-- Staff
(N'0909000001', @PasswordHash, N'Admin', NULL, 0, DATEADD(MINUTE, -30, GETDATE())),
(N'0909000002', @PasswordHash, N'QuanLy', NULL, 0, DATEADD(HOUR, -1, GETDATE())),
(N'0909000003', @PasswordHash, N'KeToan', NULL, 0, DATEADD(HOUR, -3, GETDATE()));

DECLARE @User1 INT = 1, @User2 INT = 2, @User3 INT = 3;
DECLARE @UserAdmin INT = 13, @UserQuanLy INT = 14, @UserKeToan INT = 15;

PRINT '✓ Created 12 residents and 15 users (password: 123456)';

-- =====================================================================
-- 3. CONTRACTS: 3 Active Contracts
-- =====================================================================
PRINT '3. Creating contracts...';

-- 3 active contracts (started 3, 6, and 2 months ago)
INSERT INTO HOP_DONG (PHONG_ID, NGAY_BAT_DAU, NGAY_KET_THUC_DU_KIEN, GIA_THUE_THUC_TE, TIEN_COC) VALUES
(@Phong101, DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 9, GETDATE()), 8000000, 16000000),  -- Room 101
(@Phong201, DATEADD(MONTH, -6, GETDATE()), DATEADD(MONTH, 6, GETDATE()), 7500000, 15000000),  -- Room 201
(@Phong301, DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 10, GETDATE()), 9000000, 18000000); -- Room 301

DECLARE @HopDong1 INT = 1, @HopDong2 INT = 2, @HopDong3 INT = 3;

-- Contract residents
INSERT INTO CHI_TIET_O (HOP_DONG_ID, CU_DAN_ID, VAI_TRO_O, TU_NGAY, DEN_NGAY) VALUES
-- Contract 1 (Room 101): Nguyễn Văn An
(@HopDong1, @CuDan1, N'Người thuê chính', DATEADD(MONTH, -3, GETDATE()), NULL),
-- Contract 2 (Room 201): Trần Thị Bình
(@HopDong2, @CuDan2, N'Người thuê chính', DATEADD(MONTH, -6, GETDATE()), NULL),
-- Contract 3 (Room 301): Lê Văn Cường (main) + Phạm Thị Dung (co-resident)
(@HopDong3, @CuDan3, N'Người thuê chính', DATEADD(MONTH, -2, GETDATE()), NULL),
(@HopDong3, @CuDan4, N'Người ở cùng', DATEADD(MONTH, -2, GETDATE()), NULL);

PRINT '✓ Created 3 active contracts';

-- =====================================================================
-- 4. VEHICLES: Mix of xe máy and ô tô
-- =====================================================================
PRINT '4. Creating vehicles...';

INSERT INTO XE (CU_DAN_ID, BIEN_SO, LOAI_XE, NGAY_DANG_KY, NGAY_HUY) VALUES
(@CuDan1, N'59X1-12345', N'Xe máy', DATEADD(MONTH, -3, GETDATE()), NULL),
(@CuDan2, N'51L2-67890', N'Ô tô', DATEADD(MONTH, -6, GETDATE()), NULL),
(@CuDan3, N'59Y3-11111', N'Xe máy', DATEADD(MONTH, -2, GETDATE()), NULL),
(@CuDan4, N'50G4-22222', N'Xe máy', DATEADD(MONTH, -2, GETDATE()), NULL);

DECLARE @Xe1 INT = 1, @Xe2 INT = 2, @Xe3 INT = 3, @Xe4 INT = 4;

PRINT '✓ Created 4 vehicles (2 xe máy, 2 ô tô)';

-- =====================================================================
-- 5. SERVICES: Electricity, Water, Management, Parking, Internet
-- =====================================================================
PRINT '5. Creating services...';

INSERT INTO DICH_VU (TEN_DICH_VU, LOAI, DON_VI, DON_GIA_CHUNG, IS_ACTIVE) VALUES
(N'Tiền điện', N'Điện', N'kWh', 3500, 1),
(N'Tiền nước', N'Nước', N'm³', 20000, 1),
(N'Phí quản lý', N'Khác', N'm²', 15000, 1),
(N'Gửi xe máy', N'Gửi xe', N'tháng', 100000, 1),
(N'Gửi ô tô', N'Gửi xe', N'tháng', 1500000, 1),
(N'Internet', N'Internet', N'tháng', 200000, 1);

DECLARE @DichVuDien INT = 1;
DECLARE @DichVuNuoc INT = 2;
DECLARE @DichVuQuanLy INT = 3;
DECLARE @DichVuXeMay INT = 4;
DECLARE @DichVuOto INT = 5;
DECLARE @DichVuInternet INT = 6;

PRINT '✓ Created 6 services';

-- =====================================================================
-- 6. SERVICE USAGE: Link rooms and vehicles to services
-- =====================================================================
PRINT '6. Creating service usage records...';

-- Room 101 services
INSERT INTO CHI_TIET_SU_DUNG_DICH_VU (DICH_VU_ID, CU_DAN_ID, PHONG_ID, XE_ID, AP_DUNG_TU, AP_DUNG_DEN, OVERRIDE_DON_GIA, SO_LUONG, GHI_CHU, CREATED_AT) VALUES
(@DichVuDien, @CuDan1, @Phong101, NULL, DATEADD(MONTH, -3, GETDATE()), NULL, NULL, 1, N'Dịch vụ điện phòng 101', DATEADD(MONTH, -3, GETDATE())),
(@DichVuNuoc, @CuDan1, @Phong101, NULL, DATEADD(MONTH, -3, GETDATE()), NULL, NULL, 1, N'Dịch vụ nước phòng 101', DATEADD(MONTH, -3, GETDATE())),
(@DichVuXeMay, @CuDan1, @Phong101, @Xe1, DATEADD(MONTH, -3, GETDATE()), NULL, NULL, 1, N'Gửi xe máy 59X1-12345', DATEADD(MONTH, -3, GETDATE()));

-- Room 201 services
INSERT INTO CHI_TIET_SU_DUNG_DICH_VU (DICH_VU_ID, CU_DAN_ID, PHONG_ID, XE_ID, AP_DUNG_TU, AP_DUNG_DEN, OVERRIDE_DON_GIA, SO_LUONG, GHI_CHU, CREATED_AT) VALUES
(@DichVuDien, @CuDan2, @Phong201, NULL, DATEADD(MONTH, -6, GETDATE()), NULL, NULL, 1, N'Dịch vụ điện phòng 201', DATEADD(MONTH, -6, GETDATE())),
(@DichVuNuoc, @CuDan2, @Phong201, NULL, DATEADD(MONTH, -6, GETDATE()), NULL, NULL, 1, N'Dịch vụ nước phòng 201', DATEADD(MONTH, -6, GETDATE())),
(@DichVuOto, @CuDan2, @Phong201, @Xe2, DATEADD(MONTH, -6, GETDATE()), NULL, NULL, 1, N'Gửi ô tô 51L2-67890', DATEADD(MONTH, -6, GETDATE()));

-- Room 301 services (including Internet)
INSERT INTO CHI_TIET_SU_DUNG_DICH_VU (DICH_VU_ID, CU_DAN_ID, PHONG_ID, XE_ID, AP_DUNG_TU, AP_DUNG_DEN, OVERRIDE_DON_GIA, SO_LUONG, GHI_CHU, CREATED_AT) VALUES
(@DichVuDien, @CuDan3, @Phong301, NULL, DATEADD(MONTH, -2, GETDATE()), NULL, NULL, 1, N'Dịch vụ điện phòng 301', DATEADD(MONTH, -2, GETDATE())),
(@DichVuNuoc, @CuDan3, @Phong301, NULL, DATEADD(MONTH, -2, GETDATE()), NULL, NULL, 1, N'Dịch vụ nước phòng 301', DATEADD(MONTH, -2, GETDATE())),
(@DichVuXeMay, @CuDan3, @Phong301, @Xe3, DATEADD(MONTH, -2, GETDATE()), NULL, NULL, 1, N'Gửi xe máy 59Y3-11111', DATEADD(MONTH, -2, GETDATE())),
(@DichVuXeMay, @CuDan4, @Phong301, @Xe4, DATEADD(MONTH, -2, GETDATE()), NULL, NULL, 1, N'Gửi xe máy 50G4-22222', DATEADD(MONTH, -2, GETDATE())),
(@DichVuInternet, @CuDan3, @Phong301, NULL, DATEADD(MONTH, -2, GETDATE()), NULL, NULL, 1, N'Internet phòng 301', DATEADD(MONTH, -2, GETDATE()));

-- Get actual service usage IDs from the database
DECLARE @SDDV_101_Dien BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuDien AND PHONG_ID = @Phong101);
DECLARE @SDDV_101_Nuoc BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuNuoc AND PHONG_ID = @Phong101);
DECLARE @SDDV_201_Dien BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuDien AND PHONG_ID = @Phong201);
DECLARE @SDDV_201_Nuoc BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuNuoc AND PHONG_ID = @Phong201);
DECLARE @SDDV_301_Dien BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuDien AND PHONG_ID = @Phong301);
DECLARE @SDDV_301_Nuoc BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuNuoc AND PHONG_ID = @Phong301);
DECLARE @SDDV_101_XeMay BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuXeMay AND PHONG_ID = @Phong101);
DECLARE @SDDV_201_Oto BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuOto AND PHONG_ID = @Phong201);
DECLARE @SDDV_301_XeMay1 BIGINT = (SELECT TOP 1 CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuXeMay AND PHONG_ID = @Phong301 AND CU_DAN_ID = @CuDan3);
DECLARE @SDDV_301_XeMay2 BIGINT = (SELECT TOP 1 CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuXeMay AND PHONG_ID = @Phong301 AND CU_DAN_ID = @CuDan4);
DECLARE @SDDV_301_Internet BIGINT = (SELECT CT_SDDV_ID FROM CHI_TIET_SU_DUNG_DICH_VU WHERE DICH_VU_ID = @DichVuInternet AND PHONG_ID = @Phong301);

PRINT '✓ Created service usage records';

-- =====================================================================
-- 7. METER READINGS: January and February 2026
-- =====================================================================
PRINT '7. Creating meter readings...';

-- Electricity readings
-- Room 101
INSERT INTO CHI_SO_DIEN (CT_SDDV_ID, KY_THANG, KY_NAM, CHI_SO_MOI, ANH_DONG_HO_URL, CREATED_AT, CREATED_BY) VALUES
(@SDDV_101_Dien, 1, 2026, 1850, NULL, '2026-01-28', @UserQuanLy),
(@SDDV_101_Dien, 2, 2026, 2020, NULL, '2026-02-28', @UserQuanLy);

-- Room 201
INSERT INTO CHI_SO_DIEN (CT_SDDV_ID, KY_THANG, KY_NAM, CHI_SO_MOI, ANH_DONG_HO_URL, CREATED_AT, CREATED_BY) VALUES
(@SDDV_201_Dien, 1, 2026, 3200, NULL, '2026-01-28', @UserQuanLy),
(@SDDV_201_Dien, 2, 2026, 3395, NULL, '2026-02-28', @UserQuanLy);

-- Room 301
INSERT INTO CHI_SO_DIEN (CT_SDDV_ID, KY_THANG, KY_NAM, CHI_SO_MOI, ANH_DONG_HO_URL, CREATED_AT, CREATED_BY) VALUES
(@SDDV_301_Dien, 1, 2026, 950, NULL, '2026-01-28', @UserQuanLy),
(@SDDV_301_Dien, 2, 2026, 1130, NULL, '2026-02-28', @UserQuanLy);

-- Water readings
-- Room 101
INSERT INTO CHI_SO_NUOC (CT_SDDV_ID, KY_THANG, KY_NAM, CHI_SO_MOI, ANH_DONG_HO_URL, CREATED_AT, CREATED_BY) VALUES
(@SDDV_101_Nuoc, 1, 2026, 125, NULL, '2026-01-28', @UserQuanLy),
(@SDDV_101_Nuoc, 2, 2026, 137, NULL, '2026-02-28', @UserQuanLy);

-- Room 201
INSERT INTO CHI_SO_NUOC (CT_SDDV_ID, KY_THANG, KY_NAM, CHI_SO_MOI, ANH_DONG_HO_URL, CREATED_AT, CREATED_BY) VALUES
(@SDDV_201_Nuoc, 1, 2026, 280, NULL, '2026-01-28', @UserQuanLy),
(@SDDV_201_Nuoc, 2, 2026, 293, NULL, '2026-02-28', @UserQuanLy);

-- Room 301
INSERT INTO CHI_SO_NUOC (CT_SDDV_ID, KY_THANG, KY_NAM, CHI_SO_MOI, ANH_DONG_HO_URL, CREATED_AT, CREATED_BY) VALUES
(@SDDV_301_Nuoc, 1, 2026, 45, NULL, '2026-01-28', @UserQuanLy),
(@SDDV_301_Nuoc, 2, 2026, 59, NULL, '2026-02-28', @UserQuanLy);

PRINT '✓ Created meter readings for Jan and Feb 2026';

-- =====================================================================
-- 8. INVOICES: January (paid) and February (unpaid)
-- =====================================================================
PRINT '8. Creating invoices...';

-- January 2026 invoices (Paid)
-- Room 101: 8M + 525K (150kWh) + 240K (12m³) + 100K (xe) + 532.5K (QL) = 9,397,500
-- Room 201: 7.5M + 700K (200kWh) + 260K (13m³) + 1.5M (oto) + 532.5K (QL) = 10,492,500
-- Room 301: 9M + 595K (170kWh) + 280K (14m³) + 100K (xe1) + 100K (xe2) + 200K (net) + 600K (QL) = 10,875,000
INSERT INTO HOA_DON (HOP_DONG_ID, THANG, NAM, TONG_TIEN, TRANG_THAI, QR_CODE_URL, DUE_DATE) VALUES
(@HopDong1, 1, 2026, 9397500, N'Đã thanh toán', NULL, '2026-02-05'),
(@HopDong2, 1, 2026, 10492500, N'Đã thanh toán', NULL, '2026-02-05'),
(@HopDong3, 1, 2026, 10875000, N'Đã thanh toán', NULL, '2026-02-05');

DECLARE @Invoice_101_Jan INT = 1, @Invoice_201_Jan INT = 2, @Invoice_301_Jan INT = 3;

-- February 2026 invoices (Unpaid)
-- Room 101: 8M + 595K (170kWh) + 240K (12m³) + 100K (xe) + 532.5K (QL) = 9,467,500
-- Room 201: 7.5M + 682.5K (195kWh) + 260K (13m³) + 1.5M (oto) + 532.5K (QL) = 10,475,000
-- Room 301: 9M + 630K (180kWh) + 280K (14m³) + 100K (xe1) + 100K (xe2) + 200K (net) + 600K (QL) = 10,910,000
INSERT INTO HOA_DON (HOP_DONG_ID, THANG, NAM, TONG_TIEN, TRANG_THAI, QR_CODE_URL, DUE_DATE) VALUES
(@HopDong1, 2, 2026, 9467500, N'Chưa thanh toán', NULL, '2026-03-05'),
(@HopDong2, 2, 2026, 10475000, N'Chưa thanh toán', NULL, '2026-03-05'),
(@HopDong3, 2, 2026, 10910000, N'Chưa thanh toán', NULL, '2026-03-05');

DECLARE @Invoice_101_Feb INT = 4, @Invoice_201_Feb INT = 5, @Invoice_301_Feb INT = 6;

PRINT '✓ Created 6 invoices (3 paid, 3 unpaid)';

-- =====================================================================
-- 9. INVOICE LINE ITEMS
-- =====================================================================
PRINT '9. Creating invoice line items...';

-- January Invoice Line Items
-- Room 101 - January
-- Rent: 8,000,000
-- Electricity: 170 kWh (2020-1850) * 3,500 = 595,000
-- Water: 12 m³ (137-125) * 20,000 = 240,000
-- Parking: 100,000
-- Management: 35.5 m² * 15,000 = 532,500
-- Total: 9,467,500

-- Note: For January, we need previous month readings. Let's assume:
-- Room 101: Dec electricity = 1700, Dec water = 113
-- Room 201: Dec electricity = 3000, Dec water = 267
-- Room 301: Dec electricity = 780, Dec water = 31

-- Room 101 - January
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, CT_SDDV_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA) VALUES
(@Invoice_101_Jan, NULL, N'TienPhong', NULL, 1, 8000000, N'Tiền thuê phòng tháng 1/2026'),
(@Invoice_101_Jan, @SDDV_101_Dien, N'Dien', @DichVuDien, 150, 3500, N'Điện: 1850 - 1700 = 150 kWh'),
(@Invoice_101_Jan, @SDDV_101_Nuoc, N'Nuoc', @DichVuNuoc, 12, 20000, N'Nước: 125 - 113 = 12 m³'),
(@Invoice_101_Jan, @SDDV_101_XeMay, N'DichVu', @DichVuXeMay, 1, 100000, N'Phí gửi xe máy'),
(@Invoice_101_Jan, NULL, N'DichVu', @DichVuQuanLy, 35.5, 15000, N'Phí quản lý 35.5 m²');

-- Room 201 - January
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, CT_SDDV_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA) VALUES
(@Invoice_201_Jan, NULL, N'TienPhong', NULL, 1, 7500000, N'Tiền thuê phòng tháng 1/2026'),
(@Invoice_201_Jan, @SDDV_201_Dien, N'Dien', @DichVuDien, 200, 3500, N'Điện: 3200 - 3000 = 200 kWh'),
(@Invoice_201_Jan, @SDDV_201_Nuoc, N'Nuoc', @DichVuNuoc, 13, 20000, N'Nước: 280 - 267 = 13 m³'),
(@Invoice_201_Jan, @SDDV_201_Oto, N'DichVu', @DichVuOto, 1, 1500000, N'Phí gửi ô tô'),
(@Invoice_201_Jan, NULL, N'DichVu', @DichVuQuanLy, 35.5, 15000, N'Phí quản lý 35.5 m²');

-- Room 301 - January
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, CT_SDDV_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA) VALUES
(@Invoice_301_Jan, NULL, N'TienPhong', NULL, 1, 9000000, N'Tiền thuê phòng tháng 1/2026'),
(@Invoice_301_Jan, @SDDV_301_Dien, N'Dien', @DichVuDien, 170, 3500, N'Điện: 950 - 780 = 170 kWh'),
(@Invoice_301_Jan, @SDDV_301_Nuoc, N'Nuoc', @DichVuNuoc, 14, 20000, N'Nước: 45 - 31 = 14 m³'),
(@Invoice_301_Jan, @SDDV_301_XeMay1, N'DichVu', @DichVuXeMay, 1, 100000, N'Phí gửi xe máy - Xe 1'),
(@Invoice_301_Jan, @SDDV_301_XeMay2, N'DichVu', @DichVuXeMay, 1, 100000, N'Phí gửi xe máy - Xe 2'),
(@Invoice_301_Jan, @SDDV_301_Internet, N'DichVu', @DichVuInternet, 1, 200000, N'Phí Internet'),
(@Invoice_301_Jan, NULL, N'DichVu', @DichVuQuanLy, 40, 15000, N'Phí quản lý 40 m²');

-- February Invoice Line Items
-- Room 101 - February
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, CT_SDDV_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA) VALUES
(@Invoice_101_Feb, NULL, N'TienPhong', NULL, 1, 8000000, N'Tiền thuê phòng tháng 2/2026'),
(@Invoice_101_Feb, @SDDV_101_Dien, N'Dien', @DichVuDien, 170, 3500, N'Điện: 2020 - 1850 = 170 kWh'),
(@Invoice_101_Feb, @SDDV_101_Nuoc, N'Nuoc', @DichVuNuoc, 12, 20000, N'Nước: 137 - 125 = 12 m³'),
(@Invoice_101_Feb, @SDDV_101_XeMay, N'DichVu', @DichVuXeMay, 1, 100000, N'Phí gửi xe máy'),
(@Invoice_101_Feb, NULL, N'DichVu', @DichVuQuanLy, 35.5, 15000, N'Phí quản lý 35.5 m²');

-- Room 201 - February
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, CT_SDDV_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA) VALUES
(@Invoice_201_Feb, NULL, N'TienPhong', NULL, 1, 7500000, N'Tiền thuê phòng tháng 2/2026'),
(@Invoice_201_Feb, @SDDV_201_Dien, N'Dien', @DichVuDien, 195, 3500, N'Điện: 3395 - 3200 = 195 kWh'),
(@Invoice_201_Feb, @SDDV_201_Nuoc, N'Nuoc', @DichVuNuoc, 13, 20000, N'Nước: 293 - 280 = 13 m³'),
(@Invoice_201_Feb, @SDDV_201_Oto, N'DichVu', @DichVuOto, 1, 1500000, N'Phí gửi ô tô'),
(@Invoice_201_Feb, NULL, N'DichVu', @DichVuQuanLy, 35.5, 15000, N'Phí quản lý 35.5 m²');

-- Room 301 - February
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, CT_SDDV_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA) VALUES
(@Invoice_301_Feb, NULL, N'TienPhong', NULL, 1, 9000000, N'Tiền thuê phòng tháng 2/2026'),
(@Invoice_301_Feb, @SDDV_301_Dien, N'Dien', @DichVuDien, 180, 3500, N'Điện: 1130 - 950 = 180 kWh'),
(@Invoice_301_Feb, @SDDV_301_Nuoc, N'Nuoc', @DichVuNuoc, 14, 20000, N'Nước: 59 - 45 = 14 m³'),
(@Invoice_301_Feb, @SDDV_301_XeMay1, N'DichVu', @DichVuXeMay, 1, 100000, N'Phí gửi xe máy - Xe 1'),
(@Invoice_301_Feb, @SDDV_301_XeMay2, N'DichVu', @DichVuXeMay, 1, 100000, N'Phí gửi xe máy - Xe 2'),
(@Invoice_301_Feb, @SDDV_301_Internet, N'DichVu', @DichVuInternet, 1, 200000, N'Phí Internet'),
(@Invoice_301_Feb, NULL, N'DichVu', @DichVuQuanLy, 40, 15000, N'Phí quản lý 40 m²');

PRINT '✓ Created invoice line items';

-- =====================================================================
-- 10. PAYMENTS: For January invoices
-- =====================================================================
PRINT '10. Creating payment records...';

INSERT INTO THANH_TOAN (LOAI, HOA_DON_ID, TAT_TOAN_ID, SO_TIEN, MA_GIAO_DICH, PAID_AT, STATUS, CREATED_AT) VALUES
(N'Chuyển khoản', @Invoice_101_Jan, NULL, 9397500, N'TXN202601050001', '2026-02-05 10:30:00', N'Completed', '2026-02-05 10:30:00'),
(N'Chuyển khoản', @Invoice_201_Jan, NULL, 10492500, N'TXN202601050002', '2026-02-05 14:15:00', N'Completed', '2026-02-05 14:15:00'),
(N'Tiền mặt', @Invoice_301_Jan, NULL, 10875000, N'CASH202601060001', '2026-02-06 09:00:00', N'Completed', '2026-02-06 09:00:00');

PRINT '✓ Created 3 payment records';

-- =====================================================================
-- 11. ASSETS: 5 Types and Room Assignments
-- =====================================================================
PRINT '11. Creating assets...';

-- Asset types
INSERT INTO TAI_SAN (TEN_TAI_SAN, MA_TAI_SAN) VALUES
(N'Giường', N'GIUONG'),
(N'Tủ lạnh', N'TULANH'),
(N'Máy lạnh', N'MAYLANH'),
(N'Bàn', N'BAN'),
(N'Tủ', N'TU');

DECLARE @Asset_Giuong INT = (SELECT TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = N'GIUONG');
DECLARE @Asset_TuLanh INT = (SELECT TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = N'TULANH');
DECLARE @Asset_MayLanh INT = (SELECT TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = N'MAYLANH');
DECLARE @Asset_Ban INT = (SELECT TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = N'BAN');
DECLARE @Asset_Tu INT = (SELECT TAI_SAN_ID FROM TAI_SAN WHERE MA_TAI_SAN = N'TU');

-- Assign assets to rooms
-- Room 101
INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES
(@Phong101, @Asset_Giuong, 1, N'Tốt', N'Giường đơn 1m2'),
(@Phong101, @Asset_TuLanh, 1, N'Tốt', N'Tủ lạnh Electrolux 150L'),
(@Phong101, @Asset_MayLanh, 1, N'Tốt', N'Máy lạnh Daikin 1.5HP');

-- Room 201
INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES
(@Phong201, @Asset_Giuong, 1, N'Tốt', N'Giường đơn 1m2'),
(@Phong201, @Asset_TuLanh, 1, N'Tốt', N'Tủ lạnh Samsung 180L'),
(@Phong201, @Asset_MayLanh, 1, N'Tốt', N'Máy lạnh LG 2HP'),
(@Phong201, @Asset_Ban, 1, N'Tốt', N'Bàn làm việc'),
(@Phong201, @Asset_Tu, 1, N'Tốt', N'Tủ quần áo 2 cánh');

-- Room 301
INSERT INTO CHI_TIET_TAI_SAN_PHONG (PHONG_ID, TAI_SAN_ID, SO_LUONG, TINH_TRANG, GHI_CHU) VALUES
(@Phong301, @Asset_Giuong, 2, N'Tốt', N'2 giường đơn 1m2'),
(@Phong301, @Asset_TuLanh, 1, N'Tốt', N'Tủ lạnh Panasonic 200L'),
(@Phong301, @Asset_MayLanh, 1, N'Tốt', N'Máy lạnh Mitsubishi 2HP'),
(@Phong301, @Asset_Ban, 2, N'Tốt', N'2 bàn làm việc'),
(@Phong301, @Asset_Tu, 1, N'Tốt', N'Tủ quần áo 3 cánh');

PRINT '✓ Created 5 asset types and assigned to 3 rooms';

-- =====================================================================
-- 12. MAINTENANCE REQUESTS: 5 Requests with Different Statuses
-- =====================================================================
PRINT '12. Creating maintenance requests...';

INSERT INTO YEU_CAU_SUA_CHUA (PHONG_ID, USER_ID, LOAI_SU_CO, MO_TA, MEDIA_URL, TRANG_THAI, GHI_CHU_ADMIN, CREATED_AT, CLOSED_AT) VALUES
(@Phong101, @User1, N'Điện', N'Ổ cắm trong phòng ngủ bị hỏng, không sạc được điện thoại', NULL, N'Hoàn thành', N'Đã thay ổ cắm mới', DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -3, GETDATE())),
(@Phong201, @User2, N'Nước', N'Vòi sen bị rò nước', NULL, N'Đang xử lý', N'Đã liên hệ thợ sửa', DATEADD(DAY, -2, GETDATE()), NULL),
(@Phong301, @User3, N'Máy lạnh', N'Máy lạnh không lạnh, nghi ngờ hết gas', NULL, N'Chờ xử lý', NULL, DATEADD(DAY, -1, GETDATE()), NULL),
(@Phong101, @User1, N'Khác', N'Khóa cửa bị kẹt', NULL, N'Hoàn thành', N'Đã sửa khóa', DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -9, GETDATE())),
(@Phong201, @User2, N'Nước', N'Bồn cầu bị tắc', NULL, N'Hoàn thành', N'Đã thông tắc', DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -6, GETDATE()));

PRINT '✓ Created 5 maintenance requests';

-- =====================================================================
-- 13. KNOWLEDGE BASE: 10 Articles
-- =====================================================================
PRINT '13. Creating knowledge base articles...';

INSERT INTO KNOWLEDGE_BASE (TIEU_DE, NOI_DUNG, THE_LOAI, TAGS, IS_ACTIVE, UPDATED_AT, UPDATED_BY) VALUES
(N'Thông tin Wifi', 
N'Tên mạng: ToaNha_Wifi | Mật khẩu: Toa@2026 | Tốc độ: 50Mbps | Lưu ý: Wifi miễn phí cho tất cả cư dân', 
N'Dịch vụ', N'wifi,internet,mạng', 1, GETDATE(), @UserAdmin),

(N'Quy định chung cư', 
N'1. Không gây ồn sau 22h. 2. Không nuôi thú cưng quá 5kg. 3. Giữ vệ sinh khu vực chung. 4. Đóng phí đúng hạn mỗi tháng. 5. Báo trước khi có khách ở qua đêm', 
N'Quy định', N'quy định,nội quy', 1, GETDATE(), @UserAdmin),

(N'Bảng giá dịch vụ', 
N'Điện: 3,500đ/kWh | Nước: 20,000đ/m³ | Phí quản lý: 15,000đ/m² | Gửi xe máy: 100,000đ/tháng | Gửi ô tô: 1,500,000đ/tháng | Internet: 200,000đ/tháng', 
N'Dịch vụ', N'giá,dịch vụ,phí', 1, GETDATE(), @UserAdmin),

(N'Thông tin liên hệ', 
N'Ban quản lý: 0909000002 | Bảo vệ: 0909000004 | Kỹ thuật: 0909000005 | Giờ làm việc: 8h-17h thứ 2-6', 
N'Liên hệ', N'liên hệ,hotline,điện thoại', 1, GETDATE(), @UserAdmin),

(N'Hướng dẫn thanh toán', 
N'Cách 1: Chuyển khoản qua ngân hàng. Số TK: 0123456789 - Ngân hàng Vietcombank - Chi nhánh Q7. Nội dung: Họ tên + Mã phòng + Tháng. Cách 2: Nộp tiền mặt tại văn phòng ban quản lý', 
N'Thanh toán', N'thanh toán,chuyển khoản,hóa đơn', 1, GETDATE(), @UserAdmin),

(N'Quy định gửi xe', 
N'1. Đăng ký xe trong vòng 3 ngày kể từ ngày nhập ở. 2. Dán tem xe tại khu vực quy định. 3. Không gửi xe quá 2 xe máy/căn hộ. 4. Xe ô tô phải đỗ đúng vạch kẻ. 5. Không rửa xe trong hầm', 
N'Gửi xe', N'xe,bãi xe,đỗ xe', 1, GETDATE(), @UserAdmin),

(N'Hướng dẫn báo sửa chữa', 
N'Bước 1: Mở app hoặc gọi điện thoại. Bước 2: Mô tả sự cố cụ thể. Bước 3: Chụp ảnh nếu có. Bước 4: Chờ xác nhận từ ban quản lý. Thời gian xử lý: 24-48h với sự cố thường, 2-4h với sự cố khẩn cấp', 
N'Bảo trì', N'sửa chữa,bảo trì,sự cố', 1, GETDATE(), @UserAdmin),

(N'An ninh và camera', 
N'Hệ thống camera 24/7 tại lối vào, thang máy, hành lang, bãi xe. Bảo vệ trực 24/7. Vui lòng mang theo thẻ cư dân khi vào ra. Không cho người lạ đi theo vào', 
N'An ninh', N'camera,bảo vệ,an ninh', 1, GETDATE(), @UserAdmin),

(N'Hướng dẫn sử dụng điện nước', 
N'Đọc số điện nước vào cuối tháng. Không tự ý sửa chữa đồng hồ. Báo ngay nếu phát hiện rò rỉ hoặc hư hỏng. Tiết kiệm điện nước để giảm chi phí', 
N'Tiện ích', N'điện,nước,đồng hồ', 1, GETDATE(), @UserAdmin),

(N'Quy trình ký hợp đồng', 
N'Bước 1: Xem phòng và cọc giữ chỗ. Bước 2: Chuẩn bị CMND/CCCD bản photo. Bước 3: Ký hợp đồng thuê (thời hạn tối thiểu 6 tháng). Bước 4: Đóng tiền cọc (2 tháng tiền phòng). Bước 5: Nhận chìa khóa và nhập ở', 
N'Hợp đồng', N'hợp đồng,thuê,cọc', 1, GETDATE(), @UserAdmin);

PRINT '✓ Created 10 knowledge base articles';

-- =====================================================================
-- 14. CHAT HISTORY: 20 Messages
-- =====================================================================
PRINT '14. Creating chat history...';

INSERT INTO LICH_SU_CHAT (USER_ID, MESSAGE_ROLE, MESSAGE_TEXT, CREATED_AT) VALUES
(@User1, N'user', N'Xin chào, cho mình hỏi giá điện bao nhiêu 1 số?', DATEADD(DAY, -5, GETDATE())),
(@User1, N'assistant', N'Xin chào! Giá điện hiện tại là 3,500đ/kWh. Có gì khác mình có thể giúp bạn không?', DATEADD(DAY, -5, GETDATE())),
(@User1, N'user', N'Cảm ơn bạn. Vậy giá nước là bao nhiêu?', DATEADD(DAY, -5, GETDATE())),
(@User1, N'assistant', N'Giá nước là 20,000đ/m³. Bạn có thể xem bảng giá đầy đủ trong mục Dịch vụ nhé.', DATEADD(DAY, -5, GETDATE())),

(@User2, N'user', N'Làm sao để báo sửa chữa?', DATEADD(DAY, -3, GETDATE())),
(@User2, N'assistant', N'Bạn có thể báo sửa chữa bằng cách: 1) Sử dụng tính năng "Yêu cầu sửa chữa" trong app, hoặc 2) Gọi điện tới hotline 0909000002. Vui lòng mô tả rõ sự cố để chúng tôi hỗ trợ nhanh nhất.', DATEADD(DAY, -3, GETDATE())),
(@User2, N'user', N'Thời gian xử lý mất bao lâu?', DATEADD(DAY, -3, GETDATE())),
(@User2, N'assistant', N'Với sự cố thường: 24-48h. Với sự cố khẩn cấp: 2-4h. Chúng tôi sẽ cố gắng xử lý nhanh nhất có thể!', DATEADD(DAY, -3, GETDATE())),

(@User3, N'user', N'Mật khẩu wifi là gì?', DATEADD(DAY, -2, GETDATE())),
(@User3, N'assistant', N'Tên mạng: ToaNha_Wifi, Mật khẩu: Toa@2026. Wifi miễn phí cho tất cả cư dân với tốc độ 50Mbps.', DATEADD(DAY, -2, GETDATE())),

(@User1, N'user', N'Hóa đơn tháng này thanh toán khi nào?', DATEADD(DAY, -1, GETDATE())),
(@User1, N'assistant', N'Hóa đơn phải thanh toán trước ngày 5 hàng tháng. Bạn có thể thanh toán qua chuyển khoản hoặc nộp tiền mặt tại văn phòng ban quản lý.', DATEADD(DAY, -1, GETDATE())),

(@User3, N'user', N'Tôi có thể nuôi chó không?', DATEADD(DAY, -1, GETDATE())),
(@User3, N'assistant', N'Theo quy định chung cư, bạn có thể nuôi thú cưng nhưng không quá 5kg. Vui lòng giữ vệ sinh và không gây ồn ảnh hưởng đến hàng xóm.', DATEADD(DAY, -1, GETDATE())),

(@User2, N'user', N'Số tài khoản chuyển khoản là gì?', DATEADD(HOUR, -3, GETDATE())),
(@User2, N'assistant', N'Số TK: 0123456789 - Ngân hàng Vietcombank - Chi nhánh Q7. Nội dung CK: Họ tên + Mã phòng + Tháng.', DATEADD(HOUR, -3, GETDATE())),

(@User1, N'user', N'Xe ô tô gửi ở đâu?', DATEADD(HOUR, -2, GETDATE())),
(@User1, N'assistant', N'Xe ô tô gửi ở tầng hầm B1. Vui lòng đỗ đúng vạch kẻ và đăng ký xe với ban quản lý để được cấp tem xe.', DATEADD(HOUR, -2, GETDATE())),

(@UserQuanLy, N'system', N'Hệ thống đã tự động tạo hóa đơn tháng 2/2026', DATEADD(HOUR, -1, GETDATE())),
(@UserAdmin, N'system', N'Đã gửi thông báo nhắc nợ cho 3 cư dân', DATEADD(MINUTE, -30, GETDATE()));

PRINT '✓ Created 20 chat messages';

-- =====================================================================
-- 15. PAYMENT REMINDERS: 5 Records for Unpaid Invoices
-- =====================================================================
PRINT '15. Creating payment reminders...';

INSERT INTO NHAT_KY_NHAC_NO (HOA_DON_ID, SENT_TO_USER_ID, SENT_BY_USER_ID, LAN_NHAC, NHAC_LUC, HINH_THUC, NOI_DUNG, TRANG_THAI_GUI, ERROR_MESSAGE) VALUES
(@Invoice_101_Feb, @User1, @UserAdmin, 1, GETDATE(), N'App notification', 
N'Kính gửi quý cư dân phòng 101, hóa đơn tháng 2/2026 số tiền 9,467,500đ đến hạn thanh toán ngày 05/03/2026. Vui lòng thanh toán đúng hạn.', 
N'Thành công', NULL),

(@Invoice_201_Feb, @User2, @UserAdmin, 1, GETDATE(), N'App notification', 
N'Kính gửi quý cư dân phòng 201, hóa đơn tháng 2/2026 số tiền 10,475,000đ đến hạn thanh toán ngày 05/03/2026. Vui lòng thanh toán đúng hạn.', 
N'Thành công', NULL),

(@Invoice_301_Feb, @User3, @UserAdmin, 1, GETDATE(), N'App notification', 
N'Kính gửi quý cư dân phòng 301, hóa đơn tháng 2/2026 số tiền 10,910,000đ đến hạn thanh toán ngày 05/03/2026. Vui lòng thanh toán đúng hạn.', 
N'Thành công', NULL),

(@Invoice_101_Feb, @User1, @UserAdmin, 2, DATEADD(DAY, 1, GETDATE()), N'SMS', 
N'[ToaNha] Nhắc lần 2: Hóa đơn phòng 101 tháng 2/2026 chưa thanh toán. Vui lòng thanh toán để tránh phát sinh phí trễ hạn.', 
N'Đang gửi', NULL),

(@Invoice_201_Feb, @User2, @UserAdmin, 2, DATEADD(DAY, 1, GETDATE()), N'SMS', 
N'[ToaNha] Nhắc lần 2: Hóa đơn phòng 201 tháng 2/2026 chưa thanh toán. Vui lòng thanh toán để tránh phát sinh phí trễ hạn.', 
N'Đang gửi', NULL);

PRINT '✓ Created 5 payment reminder records';

-- =====================================================================
-- DATA INSERTION COMPLETED
-- =====================================================================
PRINT '';
PRINT '========================================';
PRINT 'DATA INSERTION COMPLETED SUCCESSFULLY!';
PRINT '========================================';
PRINT '';

-- Display summary
PRINT 'Summary of inserted data:';
PRINT '- Buildings: 1';
PRINT '- Floors: 5';
PRINT '- Rooms: 20 (3 rented, 17 available)';
PRINT '- Residents: 12';
PRINT '- Users: 15 (12 residents + 3 staff)';
PRINT '- Contracts: 3 active';
PRINT '- Vehicles: 4 (2 xe máy, 2 ô tô)';
PRINT '- Services: 6';
PRINT '- Service Usage: 11 records';
PRINT '- Meter Readings: 12 (6 electricity + 6 water)';
PRINT '- Invoices: 6 (3 paid + 3 unpaid)';
PRINT '- Invoice Line Items: 38';
PRINT '- Payments: 3';
PRINT '- Assets: 5 types, 13 assignments';
PRINT '- Maintenance Requests: 5';
PRINT '- Knowledge Base: 10 articles';
PRINT '- Chat Messages: 20';
PRINT '- Payment Reminders: 5';
PRINT '';

GO
