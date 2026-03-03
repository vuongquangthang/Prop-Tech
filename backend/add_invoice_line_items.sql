-- Add line items to existing test invoices
-- Run this SQL in SSMS or Azure Data Studio

-- Invoice 1 (Phòng 101 - 10,500,000 VNĐ)
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, LOAI_KHOAN, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(1, 'TienPhong', 1, 5000000, N'Tiền phòng tháng 3/2026'),
(1, 'Dien', 350, 3000, N'Tiền điện 350 kWh x 3,000đ'),
(1, 'Nuoc', 12, 25000, N'Tiền nước 12 m³ x 25,000đ'),
(1, 'DichVu', 1, 4200000, N'Phí dịch vụ, internet, vệ sinh');

-- Invoice 2 (Phòng 201 - 9,800,000 VNĐ)
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, LOAI_KHOAN, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(2, 'TienPhong', 1, 5500000, N'Tiền phòng tháng 3/2026'),
(2, 'Dien', 280, 3000, N'Tiền điện 280 kWh x 3,000đ'),
(2, 'Nuoc', 10, 25000, N'Tiền nước 10 m³ x 25,000đ'),
(2, 'DichVu', 1, 3460000, N'Phí dịch vụ, internet, vệ sinh');

-- Invoice 3 (Phòng 301 - 11,200,000 VNĐ)  
INSERT INTO CHI_TIET_HOA_DON (HOA_DON_ID, LOAI_KHOAN, SO_LUONG, DON_GIA, MO_TA)
VALUES 
(3, 'TienPhong', 1, 6000000, N'Tiền phòng tháng 3/2026'),
(3, 'Dien', 420, 3000, N'Tiền điện 420 kWh x 3,000đ'),
(3, 'Nuoc', 15, 25000, N'Tiền nước 15 m³ x 25,000đ'),
(3, 'DichVu', 1, 3565000, N'Phí dịch vụ, internet, vệ sinh');

-- Verify the data
SELECT 
    hd.HOA_DON_ID,
    hd.THANG,
    hd.NAM,
    ct.LOAI_KHOAN,
    ct.MO_TA,
    ct.SO_LUONG,
    ct.DON_GIA,
    (ct.SO_LUONG * ct.DON_GIA) as SUBTOTAL
FROM HOA_DON hd
LEFT JOIN CHI_TIET_HOA_DON ct ON hd.HOA_DON_ID = ct.HOA_DON_ID
WHERE hd.HOA_DON_ID IN (1,2,3)
ORDER BY hd.HOA_DON_ID, ct.CHI_TIET_ID;
