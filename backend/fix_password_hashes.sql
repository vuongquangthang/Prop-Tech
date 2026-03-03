-- Fix password hashes for all users
-- Password: 123456
-- Generated BCrypt hash with cost factor 11

DECLARE @CorrectHash NVARCHAR(500) = '$2a$11$QantTJk/Hk.eCmSN0R0.8ueKXdWWb440e1Y/O.ukgxmyUuGVMroJe';

UPDATE [USER] 
SET MAT_KHAU_HASH = @CorrectHash;

SELECT 
    USER_ID,
    SO_DIEN_THOAI,
    VAI_TRO,
    LEN(MAT_KHAU_HASH) as HashLength,
    LEFT(MAT_KHAU_HASH, 30) as HashPrefix
FROM [USER]
ORDER BY USER_ID;

PRINT 'Password hash updated for all users. Password: 123456';
