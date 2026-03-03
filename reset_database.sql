-- Script to reset database and re-seed data
-- Run this in SQL Server Management Studio or Azure Data Studio

USE master;
GO

-- Drop database if exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'PropTechDB')
BEGIN
    ALTER DATABASE PropTechDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE PropTechDB;
    PRINT '✅ Database PropTechDB dropped successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Database PropTechDB does not exist';
END
GO

-- Database will be recreated automatically when backend starts
PRINT '🔄 Please restart the backend to recreate and seed the database';
PRINT '   Run: dotnet run';
GO
