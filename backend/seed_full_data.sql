-- ============================================
-- FULL DATABASE SEED DATA
-- Prop-Tech Apartment Management System
-- ============================================

USE apartment_management_dev;
GO

SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
GO

PRINT 'Clearing existing data...';

-- Delete in correct order (respecting foreign keys)
DELETE FROM YEU_CAU_SUA_CHUA;
DELETE FROM NHAT_KY_NHAC_NO;
DELETE FROM CHI_SO_DIEN;
DELETE FROM CHI_SO_NUOC;
DELETE FROM CHI_TIET_SU_DUNG_DICH_VU;
DELETE FROM CHI_TIET_TAI_SAN_PHONG;
DELETE FROM ChiTietPhieuTatToan;
DELETE FROM TatToan;
DELETE FROM THANH_TOAN;
DELETE FROM CHI_TIET_HOA_DON;
DELETE FROM HOA_DON;
DELETE FROM CHI_TIET_O;
DELETE FROM HOP_DONG;
DELETE FROM XE;
DELETE FROM LICH_SU_CHAT;
DELETE FROM user_sessions;
DELETE FROM [USER];
DELETE FROM CU_DAN;
DELETE FROM PHONG;
DELETE FROM TANG;
DELETE FROM TOA_NHA;
DELETE FROM DICH_VU;
DELETE FROM TAI_SAN;
GO

PRINT 'Data cleared successfully.';

-- ============================================
-- 1. TOA_NHA (Buildings)
-- ============================================
SET IDENTITY_INSERT TOA_NHA ON;

INSERT INTO TOA_NHA (TOA_NHA_ID, TEN_TOA_NHA, DIA_CHI, SO_TANG, MO_TA)
VALUES 
(1, N'Tòa A', N'123 Nguyễn Văn Linh, Quận 7, TP.HCM', 10, N'Tòa nhà chính, view sông Sài Gòn'),
(2, N'Tòa B', N'125 Nguyễn Văn Linh, Quận 7, TP.HCM', 10, N'Tòa nhà phụ, gần trung tâm thương mại'),
(3, N'Tòa C', N'127 Nguyễn Văn Linh, Quận 7, TP.HCM', 8, N'Tòa nhà cao cấp, có bể bơi riêng');

SET IDENTITY_INSERT TOA_NHA OFF;
GO

-- ============================================
-- 2. TANG (Floors)
-- ============================================
SET IDENTITY_INSERT TANG ON;

DECLARE @BuildingId INT, @FloorNum INT, @FloorId INT = 1;

-- Tòa A: 10 floors
SET @BuildingId = 1;
SET @FloorNum = 1;
WHILE @FloorNum <= 10
BEGIN
    INSERT INTO TANG (TANG_ID, TOA_NHA_ID, SO_TANG)
    VALUES (@FloorId, @BuildingId, @FloorNum);
    SET @FloorId = @FloorId + 1;
    SET @FloorNum = @FloorNum + 1;
END

-- Tòa B: 10 floors
SET @BuildingId = 2;
SET @FloorNum = 1;
WHILE @FloorNum <= 10
BEGIN
    INSERT INTO TANG (TANG_ID, TOA_NHA_ID, SO_TANG)
    VALUES (@FloorId, @BuildingId, @FloorNum);
    SET @FloorId = @FloorId + 1;
    SET @FloorNum = @FloorNum + 1;
END

-- Tòa C: 8 floors
SET @BuildingId = 3;
SET @FloorNum = 1;
WHILE @FloorNum <= 8
BEGIN
    INSERT INTO TANG (TANG_ID, TOA_NHA_ID, SO_TANG)
    VALUES (@FloorId, @BuildingId, @FloorNum);
    SET @FloorId = @FloorId + 1;
    SET @FloorNum = @FloorNum + 1;
END

SET IDENTITY_INSERT TANG OFF;
GO

-- ============================================
-- 3. PHONG (Rooms)
-- ============================================
SET IDENTITY_INSERT PHONG ON;

DECLARE @FloorId INT, @RoomNum INT, @RoomId INT = 1;
DECLARE @RoomCode NVARCHAR(50), @Area DECIMAL(10,2), @RentPrice DECIMAL(18,2);
DECLARE @FloorNumber INT;

-- Tòa A - 10 floors, 8 rooms per floor (A101-A108, A201-A208, ...)
SET @FloorId = 1;
WHILE @FloorId <= 10
BEGIN
    SET @RoomNum = 1;
    SET @FloorNumber = @FloorId;
    WHILE @RoomNum <= 8
    BEGIN
        SET @RoomCode = 'A' + CAST(@FloorNumber AS NVARCHAR) + RIGHT('0' + CAST(@RoomNum AS NVARCHAR), 2);
        SET @Area = 25 + (@RoomNum % 3) * 5; -- 25, 30, 35 m2
        SET @RentPrice = 4000000 + (@FloorNumber * 100000) + (@RoomNum * 50000); -- Tăng theo tầng
        
        INSERT INTO PHONG (PHONG_ID, TANG_ID, MA_PHONG, DIEN_TICH, DON_GIA_THUE_MAC_DINH, TRANG_THAI)
        VALUES (@RoomId, @FloorId, @RoomCode, @Area, @RentPrice, 
                CASE WHEN @RoomId <= 15 THEN N'Đã thuê' ELSE N'Trống' END);
        
        SET @RoomId = @RoomId + 1;
        SET @RoomNum = @RoomNum + 1;
    END
    SET @FloorId = @FloorId + 1;
END

-- Tòa B - 10 floors, 6 rooms per floor (B101-B106, B201-B206, ...)
WHILE @FloorId <= 20
BEGIN
    SET @RoomNum = 1;
    SET @FloorNumber = @FloorId - 10;
    WHILE @RoomNum <= 6
    BEGIN
        SET @RoomCode = 'B' + CAST(@FloorNumber AS NVARCHAR) + RIGHT('0' + CAST(@RoomNum AS NVARCHAR), 2);
        SET @Area = 30 + (@RoomNum % 2) * 10; -- 30, 40 m2
        SET @RentPrice = 5000000 + (@FloorNumber * 150000);
        
        INSERT INTO PHONG (PHONG_ID, TANG_ID, MA_PHONG, DIEN_TICH, DON_GIA_THUE_MAC_DINH, TRANG_THAI)
        VALUES (@RoomId, @FloorId, @RoomCode, @Area, @RentPrice, 
                CASE WHEN @RoomId <= 95 THEN N'Đã thuê' ELSE N'Trống' END);
        
        SET @RoomId = @RoomId + 1;
        SET @RoomNum = @RoomNum + 1;
    END
    SET @FloorId = @FloorId + 1;
END

-- Tòa C - 8 floors, 4 rooms per floor (C101-C104, C201-C204, ...)
WHILE @FloorId <= 28
BEGIN
    SET @RoomNum = 1;
    SET @FloorNumber = @FloorId - 20;
    WHILE @RoomNum <= 4
    BEGIN
        SET @RoomCode = 'C' + CAST(@FloorNumber AS NVARCHAR) + RIGHT('0' + CAST(@RoomNum AS NVARCHAR), 2);
        SET @Area = 45 + (@RoomNum * 5); -- 50-65 m2
        SET @RentPrice = 8000000 + (@FloorNumber * 200000);
        
        INSERT INTO PHONG (PHONG_ID, TANG_ID, MA_PHONG, DIEN_TICH, DON_GIA_THUE_MAC_DINH, TRANG_THAI)
        VALUES (@RoomId, @FloorId, @RoomCode, @Area, @RentPrice, 
                CASE WHEN @RoomId <= 165 THEN N'Đã thuê' ELSE N'Trống' END);
        
        SET @RoomId = @RoomId + 1;
        SET @RoomNum = @RoomNum + 1;
    END
    SET @FloorId = @FloorId + 1;
END

SET IDENTITY_INSERT PHONG OFF;
GO

-- ============================================
-- 4. DICH_VU (Services)
-- ============================================
SET IDENTITY_INSERT DICH_VU ON;

INSERT INTO DICH_VU (DICH_VU_ID, TEN_DICH_VU, LOAI, DON_VI, DON_GIA_CHUNG, IS_ACTIVE)
VALUES 
(1, N'Điện sinh hoạt', N'Điện', N'kWh', 3000, 1),
(2, N'Nước sinh hoạt', N'Nước', N'm³', 25000, 1),
(3, N'Internet', N'Internet', N'tháng', 200000, 1),
(4, N'Vệ sinh chung', N'Vệ sinh', N'tháng', 150000, 1),
(5, N'Bảo vệ 24/7', N'Bảo vệ', N'tháng', 100000, 1),
(6, N'Gửi xe máy', N'Gửi xe', N'xe/tháng', 70000, 1),
(7, N'Gửi xe ô tô', N'Gửi xe', N'xe/tháng', 1500000, 1),
(8, N'Thang máy', N'Tiện ích', N'tháng', 50000, 1);

SET IDENTITY_INSERT DICH_VU OFF;
GO

-- ============================================
-- 5. CU_DAN (Residents)
-- ============================================
SET IDENTITY_INSERT CU_DAN ON;

INSERT INTO CU_DAN (CU_DAN_ID, HO_TEN, SO_DIEN_THOAI, SO_CCCD, QUE_QUAN)
VALUES 
-- Phòng 101-108
(1, N'Nguyễn Văn An', '0901234501', '001234567891', N'Hà Nội'),
(2, N'Trần Thị Bình', '0901234502', '001234567892', N'Hải Phòng'),
(3, N'Lê Văn Cường', '0901234503', '001234567893', N'Đà Nẵng'),
(4, N'Phạm Thị Dung', '0901234504', '001234567894', N'TP.HCM'),
(5, N'Hoàng Văn Đức', '0901234505', '001234567895', N'Cần Thơ'),
(6, N'Vũ Thị Em', '0901234506', '001234567896', N'Nghệ An'),
(7, N'Đỗ Văn Phong', '0901234507', '001234567897', N'Huế'),
(8, N'Mai Thị Giang', '0901234508', '001234567898', N'Bình Dương'),
(9, N'Bùi Văn Hải', '0901234509', '001234567899', N'Đồng Nai'),
(10, N'Đinh Thị Hoa', '0901234510', '001234567900', N'Vũng Tàu'),

-- Phòng 201-208
(11, N'Phan Văn Hùng', '0901234511', '001234567901', N'Quảng Nam'),
(12, N'Cao Thị Lan', '0901234512', '001234567902', N'Quảng Ngãi'),
(13, N'Trương Văn Long', '0901234513', '001234567903', N'Bình Định'),
(14, N'Lý Thị Mai', '0901234514', '001234567904', N'Phú Yên'),
(15, N'Võ Văn Nam', '0901234515', '001234567905', N'Khánh Hòa'),

-- Admin và nhân viên
(16, N'Admin System', '0909000001', '099999999999', N'TP.HCM'),
(17, N'Nguyễn Quản Lý', '0909000002', '099999999998', N'TP.HCM'),
(18, N'Trần Kế Toán', '0909000003', '099999999997', N'TP.HCM');

SET IDENTITY_INSERT CU_DAN OFF;
GO

-- ============================================
-- 6. USER (Accounts)
-- ============================================
SET IDENTITY_INSERT [USER] ON;

-- Password for all: "123456" hashed with BCrypt (cost factor 11)
-- Generated and verified: BCrypt.Net.BCrypt.HashPassword("123456", 11)
DECLARE @PasswordHash NVARCHAR(500) = '$2a$11$QantTJk/Hk.eCmSN0R0.8ueKXdWWb440e1Y/O.ukgxmyUuGVMroJe';

INSERT INTO [USER] (USER_ID, SO_DIEN_THOAI, MAT_KHAU_HASH, VAI_TRO, CU_DAN_ID, IS_LOCKED)
VALUES 
-- Admin
(1, '0909000001', @PasswordHash, 'Admin', 16, 0),
-- Quản lý
(2, '0909000002', @PasswordHash, 'QuanLy', 17, 0),
-- Kế toán
(3, '0909000003', @PasswordHash, 'KeToan', 18, 0),
-- Cư dân
(4, '0901234501', @PasswordHash, 'CuDan', 1, 0),
(5, '0901234502', @PasswordHash, 'CuDan', 2, 0),
(6, '0901234503', @PasswordHash, 'CuDan', 3, 0),
(7, '0901234504', @PasswordHash, 'CuDan', 4, 0),
(8, '0901234505', @PasswordHash, 'CuDan', 5, 0),
(9, '0901234506', @PasswordHash, 'CuDan', 6, 0),
(10, '0901234507', @PasswordHash, 'CuDan', 7, 0),
(11, '0901234508', @PasswordHash, 'CuDan', 8, 0),
(12, '0901234509', @PasswordHash, 'CuDan', 9, 0),
(13, '0901234510', @PasswordHash, 'CuDan', 10, 0),
(14, '0901234511', @PasswordHash, 'CuDan', 11, 0),
(15, '0901234512', @PasswordHash, 'CuDan', 12, 0);

SET IDENTITY_INSERT [USER] OFF;
GO

-- ============================================
-- 7. HOP_DONG (Contracts)
-- ============================================
SET IDENTITY_INSERT HOP_DONG ON;

INSERT INTO HOP_DONG (HOP_DONG_ID, PHONG_ID, NGAY_BAT_DAU, NGAY_KET_THUC_DU_KIEN, GIA_THUE_THUC_TE, TIEN_COC)
VALUES 
-- Tòa A - 15 phòng đã thuê
(1, 1, '2025-01-01', '2026-12-31', 5000000, 10000000),  -- Phòng 101
(2, 2, '2025-01-15', '2027-01-14', 5200000, 10400000),  -- Phòng 102
(3, 3, '2025-02-01', '2026-02-01', 5300000, 10600000),  -- Phòng 103
(4, 4, '2024-12-01', '2025-12-01', 5100000, 10200000),  -- Phòng 104
(5, 5, '2025-03-01', '2027-03-01', 5500000, 11000000),  -- Phòng 105
(6, 6, '2025-01-10', '2026-01-10', 5400000, 10800000),  -- Phòng 106
(7, 7, '2024-11-01', '2025-11-01', 5200000, 10400000),  -- Phòng 107
(8, 8, '2025-02-15', '2026-02-15', 5600000, 11200000),  -- Phòng 108
(9, 9, '2025-01-01', '2026-12-31', 5700000, 11400000),  -- Phòng 201
(10, 10, '2025-01-20', '2026-01-20', 5800000, 11600000), -- Phòng 202
(11, 11, '2024-12-15', '2025-12-15', 5900000, 11800000), -- Phòng 203
(12, 12, '2025-02-01', '2027-02-01', 6000000, 12000000), -- Phòng 204
(13, 13, '2025-01-05', '2026-01-05', 6100000, 12200000), -- Phòng 205
(14, 14, '2024-11-20', '2025-11-20', 6200000, 12400000), -- Phòng 206
(15, 15, '2025-03-01', '2026-03-01', 6300000, 12600000); -- Phòng 207

SET IDENTITY_INSERT HOP_DONG OFF;
GO

-- ============================================
-- 8. CHI_TIET_O (Contract Residents)
-- ============================================
INSERT INTO CHI_TIET_O (HOP_DONG_ID, CU_DAN_ID, VAI_TRO_O, TU_NGAY, DEN_NGAY)
VALUES 
(1, 1, N'Người thuê chính', '2025-01-01', NULL),
(2, 2, N'Người thuê chính', '2025-01-15', NULL),
(3, 3, N'Người thuê chính', '2025-02-01', NULL),
(4, 4, N'Người thuê chính', '2024-12-01', NULL),
(5, 5, N'Người thuê chính', '2025-03-01', NULL),
(6, 6, N'Người thuê chính', '2025-01-10', NULL),
(7, 7, N'Người thuê chính', '2024-11-01', NULL),
(8, 8, N'Người thuê chính', '2025-02-15', NULL),
(9, 9, N'Người thuê chính', '2025-01-01', NULL),
(10, 10, N'Người thuê chính', '2025-01-20', NULL),
(11, 11, N'Người thuê chính', '2024-12-15', NULL),
(12, 12, N'Người thuê chính', '2025-02-01', NULL),
(13, 13, N'Người thuê chính', '2025-01-05', NULL),
(14, 14, N'Người thuê chính', '2024-11-20', NULL),
(15, 15, N'Người thuê chính', '2025-03-01', NULL);
GO

-- ============================================
-- 9. XE (Vehicles)
-- ============================================
SET IDENTITY_INSERT XE ON;

INSERT INTO XE (XE_ID, CU_DAN_ID, LOAI_XE, BIEN_SO, NGAY_DANG_KY)
VALUES 
(1, 1, N'Xe máy', N'59A1-12345', '2025-01-01'),
(2, 2, N'Xe máy', N'59B2-23456', '2025-01-15'),
(3, 3, N'Ô tô', N'51F-34567', '2025-02-01'),
(4, 4, N'Xe máy', N'59C3-45678', '2024-12-01'),
(5, 5, N'Xe máy', N'59D4-56789', '2025-03-01'),
(6, 6, N'Ô tô', N'51G-67890', '2025-01-10'),
(7, 7, N'Xe máy', N'59E5-78901', '2024-11-01'),
(8, 8, N'Xe máy', N'59F6-89012', '2025-02-15'),
(9, 9, N'Ô tô', N'51H-90123', '2025-01-01'),
(10, 10, N'Xe máy', N'59G7-01234', '2025-01-20');

SET IDENTITY_INSERT XE OFF;
GO

-- ============================================
-- 10. HOA_DON (Invoices)
-- ============================================
SET IDENTITY_INSERT HOA_DON ON;

-- Hóa đơn tháng 1/2026 (đã thanh toán)
INSERT INTO HOA_DON (HOA_DON_ID, HOP_DONG_ID, THANG, NAM, TONG_TIEN, TRANG_THAI, DUE_DATE)
VALUES 
(1, 1, 1, 2026, 6500000, N'Đã thanh toán', '2026-01-15'),
(2, 2, 1, 2026, 6800000, N'Đã thanh toán', '2026-01-15'),
(3, 3, 1, 2026, 7000000, N'Đã thanh toán', '2026-01-15');

-- Hóa đơn tháng 2/2026 (đã thanh toán)
INSERT INTO HOA_DON (HOA_DON_ID, HOP_DONG_ID, THANG, NAM, TONG_TIEN, TRANG_THAI, DUE_DATE)
VALUES 
(4, 1, 2, 2026, 6600000, N'Đã thanh toán', '2026-02-15'),
(5, 2, 2, 2026, 6900000, N'Đã thanh toán', '2026-02-15'),
(6, 3, 2, 2026, 7100000, N'Đã thanh toán', '2026-02-15');

-- Hóa đơn tháng 3/2026 (chưa thanh toán - tháng hiện tại)
INSERT INTO HOA_DON (HOA_DON_ID, HOP_DONG_ID, THANG, NAM, TONG_TIEN, TRANG_THAI, DUE_DATE)
VALUES 
(7, 1, 3, 2026, 10500000, N'Chưa thanh toán', '2026-03-15'),
(8, 2, 3, 2026, 9800000, N'Chưa thanh toán', '2026-03-15'),
(9, 3, 3, 2026, 11200000, N'Chưa thanh toán', '2026-03-15'),
(10, 4, 3, 2026, 8900000, N'Chưa thanh toán', '2026-03-15'),
(11, 5, 3, 2026, 9500000, N'Chưa thanh toán', '2026-03-15'),
(12, 6, 3, 2026, 9200000, N'Chưa thanh toán', '2026-03-15'),
(13, 7, 3, 2026, 8800000, N'Chưa thanh toán', '2026-03-15'),
(14, 8, 3, 2026, 9600000, N'Chưa thanh toán', '2026-03-15'),
(15, 9, 3, 2026, 10000000, N'Chưa thanh toán', '2026-03-15'),
(16, 10, 3, 2026, 10200000, N'Chưa thanh toán', '2026-03-15');

SET IDENTITY_INSERT HOA_DON OFF;
GO

-- ============================================
-- 11. CHI_TIET_HOA_DON (Invoice Line Items)
-- ============================================
SET IDENTITY_INSERT CHI_TIET_HOA_DON ON;

DECLARE @InvoiceId INT, @LineItemId INT = 1;

-- Chi tiết hóa đơn tháng 1/2026
-- Invoice 1 (6,500,000)
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(@LineItemId, 1, 'TienPhong', NULL, 1, 5000000, N'Tiền phòng tháng 1/2026'),
(@LineItemId + 1, 1, 'Dien', 1, 300, 3000, N'Tiền điện 300 kWh × 3,000đ'),
(@LineItemId + 2, 1, 'Nuoc', 2, 10, 25000, N'Tiền nước 10 m³ × 25,000đ'),
(@LineItemId + 3, 1, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 1, 'DichVu', 4, 1, 150000, N'Vệ sinh chung'),
(@LineItemId + 5, 1, 'DichVu', 5, 1, 100000, N'Bảo vệ 24/7'),
(@LineItemId + 6, 1, 'DichVu', 6, 1, 70000, N'Gửi xe máy'),
(@LineItemId + 7, 1, 'DichVu', 8, 1, 50000, N'Thang máy');

SET @LineItemId = @LineItemId + 8;

-- Invoice 2 (6,800,000)
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(@LineItemId, 2, 'TienPhong', NULL, 1, 5200000, N'Tiền phòng tháng 1/2026'),
(@LineItemId + 1, 2, 'Dien', 1, 320, 3000, N'Tiền điện 320 kWh × 3,000đ'),
(@LineItemId + 2, 2, 'Nuoc', 2, 12, 25000, N'Tiền nước 12 m³ × 25,000đ'),
(@LineItemId + 3, 2, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 2, 'DichVu', 4, 1, 150000, N'Vệ sinh chung'),
(@LineItemId + 5, 2, 'DichVu', 5, 1, 100000, N'Bảo vệ 24/7'),
(@LineItemId + 6, 2, 'DichVu', 6, 1, 70000, N'Gửi xe máy'),
(@LineItemId + 7, 2, 'DichVu', 8, 1, 50000, N'Thang máy');

SET @LineItemId = @LineItemId + 8;

-- Invoice 3 (7,000,000)
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(@LineItemId, 3, 'TienPhong', NULL, 1, 5300000, N'Tiền phòng tháng 1/2026'),
(@LineItemId + 1, 3, 'Dien', 1, 350, 3000, N'Tiền điện 350 kWh × 3,000đ'),
(@LineItemId + 2, 3, 'Nuoc', 2, 15, 25000, N'Tiền nước 15 m³ × 25,000đ'),
(@LineItemId + 3, 3, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 3, 'DichVu', 4, 1, 150000, N'Vệ sinh chung'),
(@LineItemId + 5, 3, 'DichVu', 5, 1, 100000, N'Bảo vệ 24/7'),
(@LineItemId + 6, 3, 'DichVu', 7, 1, 1500000, N'Gửi xe ô tô'),
(@LineItemId + 7, 3, 'DichVu', 8, 1, 50000, N'Thang máy');

SET @LineItemId = @LineItemId + 8;

-- Chi tiết hóa đơn tháng 2/2026 (tương tự)
-- Invoice 4
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(@LineItemId, 4, 'TienPhong', NULL, 1, 5000000, N'Tiền phòng tháng 2/2026'),
(@LineItemId + 1, 4, 'Dien', 1, 310, 3000, N'Tiền điện 310 kWh × 3,000đ'),
(@LineItemId + 2, 4, 'Nuoc', 2, 11, 25000, N'Tiền nước 11 m³ × 25,000đ'),
(@LineItemId + 3, 4, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 4, 'DichVu', 4, 1, 150000, N'Vệ sinh chung'),
(@LineItemId + 5, 4, 'DichVu', 5, 1, 100000, N'Bảo vệ 24/7'),
(@LineItemId + 6, 4, 'DichVu', 6, 1, 70000, N'Gửi xe máy'),
(@LineItemId + 7, 4, 'DichVu', 8, 1, 50000, N'Thang máy');

SET @LineItemId = @LineItemId + 8;

-- Chi tiết hóa đơn tháng 3/2026 (chưa thanh toán - tháng hiện tại)
-- Invoice 7 (Contract 1 - Phòng 101)
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(@LineItemId, 7, 'TienPhong', NULL, 1, 5000000, N'Tiền phòng tháng 3/2026'),
(@LineItemId + 1, 7, 'Dien', 1, 350, 3000, N'Tiền điện 350 kWh × 3,000đ'),
(@LineItemId + 2, 7, 'Nuoc', 2, 12, 25000, N'Tiền nước 12 m³ × 25,000đ'),
(@LineItemId + 3, 7, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 7, 'DichVu', 4, 1, 150000, N'Vệ sinh'),
(@LineItemId + 5, 7, 'DichVu', 5, 1, 100000, N'Bảo vệ'),
(@LineItemId + 6, 7, 'DichVu', 6, 1, 70000, N'Xe máy'),
(@LineItemId + 7, 7, 'DichVu', 8, 1, 50000, N'Thang máy'),
(@LineItemId + 8, 7, 'PhatSinh', NULL, 1, 4200000, N'Chi phí sửa chữa điều hòa');

SET @LineItemId = @LineItemId + 9;

-- Invoice 8 (Contract 2)
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(@LineItemId, 8, 'TienPhong', NULL, 1, 5200000, N'Tiền phòng tháng 3/2026'),
(@LineItemId + 1, 8, 'Dien', 1, 280, 3000, N'Tiền điện 280 kWh × 3,000đ'),
(@LineItemId + 2, 8, 'Nuoc', 2, 10, 25000, N'Tiền nước 10 m³ × 25,000đ'),
(@LineItemId + 3, 8, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 8, 'DichVu', 4, 1, 150000, N'Vệ sinh'),
(@LineItemId + 5, 8, 'DichVu', 5, 1, 100000, N'Bảo vệ'),
(@LineItemId + 6, 8, 'DichVu', 6, 1, 70000, N'Xe máy'),
(@LineItemId + 7, 8, 'DichVu', 8, 1, 50000, N'Thang máy'),
(@LineItemId + 8, 8, 'PhatSinh', NULL, 1, 3460000, N'Phí dịch vụ mở rộng');

SET @LineItemId = @LineItemId + 9;

-- Invoice 9-16 (các hóa đơn khác tháng 3/2026)
INSERT INTO CHI_TIET_HOA_DON (CHI_TIET_ID, HOA_DON_ID, LOAI_KHOAN, DICH_VU_ID, SO_LUONG, DON_GIA, MO_TA)
VALUES 
-- Invoice 9
(@LineItemId, 9, 'TienPhong', NULL, 1, 5300000, N'Tiền phòng tháng 3/2026'),
(@LineItemId + 1, 9, 'Dien', 1, 420, 3000, N'Tiền điện 420 kWh × 3,000đ'),
(@LineItemId + 2, 9, 'Nuoc', 2, 15, 25000, N'Tiền nước 15 m³ × 25,000đ'),
(@LineItemId + 3, 9, 'DichVu', 3, 1, 200000, N'Internet'),
(@LineItemId + 4, 9, 'DichVu', 4, 1, 150000, N'Vệ sinh'),
(@LineItemId + 5, 9, 'DichVu', 5, 1, 100000, N'Bảo vệ'),
(@LineItemId + 6, 9, 'DichVu', 7, 1, 1500000, N'Xe ô tô'),
(@LineItemId + 7, 9, 'DichVu', 8, 1, 50000, N'Thang máy'),
(@LineItemId + 8, 9, 'PhatSinh', NULL, 1, 3565000, N'Bảo trì tổng thể');

SET IDENTITY_INSERT CHI_TIET_HOA_DON OFF;
GO

-- ============================================
-- 12. THANH_TOAN (Payments)
-- ============================================
SET IDENTITY_INSERT THANH_TOAN ON;

INSERT INTO THANH_TOAN (THANH_TOAN_ID, HOA_DON_ID, LOAI, SO_TIEN, MA_GIAO_DICH, STATUS, PAID_AT, CREATED_AT)
VALUES 
(1, 1, N'Chuyển khoản', 6500000, 'TXN20260115001', 'Completed', '2026-01-15', '2026-01-15'),
(2, 2, N'Tiền mặt', 6800000, 'TXN20260116001', 'Completed', '2026-01-16', '2026-01-16'),
(3, 3, N'Chuyển khoản', 7000000, 'TXN20260117001', 'Completed', '2026-01-17', '2026-01-17'),
(4, 4, N'Chuyển khoản', 6600000, 'TXN20260215001', 'Completed', '2026-02-15', '2026-02-15'),
(5, 5, N'Chuyển khoản', 6900000, 'TXN20260216001', 'Completed', '2026-02-16', '2026-02-16'),
(6, 6, N'Tiền mặt', 7100000, 'TXN20260217001', 'Completed', '2026-02-17', '2026-02-17');

SET IDENTITY_INSERT THANH_TOAN OFF;
GO

-- ============================================
-- VERIFY DATA
-- ============================================
PRINT '============================================';
PRINT 'DATA SEEDING COMPLETED';
PRINT '============================================';
PRINT '';

SELECT 'Buildings' as TableName, COUNT(*) as RecordCount FROM TOA_NHA
UNION ALL
SELECT 'Floors', COUNT(*) FROM TANG
UNION ALL 
SELECT 'Rooms', COUNT(*) FROM PHONG
UNION ALL
SELECT 'Services', COUNT(*) FROM DICH_VU
UNION ALL
SELECT 'Residents', COUNT(*) FROM CU_DAN
UNION ALL
SELECT 'Users', COUNT(*) FROM [USER]
UNION ALL
SELECT 'Contracts', COUNT(*) FROM HOP_DONG
UNION ALL
SELECT 'Contract Residents', COUNT(*) FROM CHI_TIET_O
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM XE
UNION ALL
SELECT 'Invoices', COUNT(*) FROM HOA_DON
UNION ALL
SELECT 'Invoice Line Items', COUNT(*) FROM CHI_TIET_HOA_DON
UNION ALL
SELECT 'Payments', COUNT(*) FROM THANH_TOAN;

PRINT '';
PRINT 'Test Accounts (Password: 123456):';
PRINT '- Admin: 0909000001';
PRINT '- QuanLy: 0909000002';
PRINT '- KeToan: 0909000003';
PRINT '- CuDan (Phòng 101): 0901234501';
PRINT '';
GO
