using backend.Models;
using BCrypt.Net;

namespace backend.Data;

public static class DatabaseSeeder
{
    public static void SeedCompleteData(ApplicationDbContext context)
    {
        // Check if data already exists
        if (context.Users.Any())
        {
            Console.WriteLine("✅ Database already has data. Skipping seed.");
            return;
        }

        Console.WriteLine("🌱 Seeding complete database...");

        // 1. Create Building
        var building = new Building
        {
            BuildingName = "Tòa A",
            Address = "123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM",
            NumberOfFloors = 10,
            Description = "Tòa nhà cao cấp A"
        };
        context.Buildings.Add(building);
        context.SaveChanges();

        // 2. Create Floors
        var floors = new List<Floor>();
        for (int i = 1; i <= 5; i++)
        {
            floors.Add(new Floor
            {
                BuildingId = building.Id,
                FloorNumber = i
            });
        }
        context.Floors.AddRange(floors);
        context.SaveChanges();

        // 3. Create Rooms (20 rooms: 4 per floor)
        var rooms = new List<Room>();
        foreach (var floor in floors)
        {
            for (int roomNum = 1; roomNum <= 4; roomNum++)
            {
                rooms.Add(new Room
                {
                    FloorId = floor.Id,
                    RoomCode = $"{floor.FloorNumber}0{roomNum}",
                    Area = 75.5m,
                    DefaultRentPrice = 8000000,
                    Status = (roomNum <= 3 && floor.FloorNumber <= 3) ? "Đã thuê" : "Trống"
                });
            }
        }
        context.Rooms.AddRange(rooms);
        context.SaveChanges();

        // 4. Create Residents (12 residents)
        var residents = new List<Resident>
        {
            new Resident { FullName = "Nguyễn Văn A", PhoneNumber = "0111222333", IdCardNumber = "079123456789", Hometown = "TP.HCM" },
            new Resident { FullName = "Trần Thị B", PhoneNumber = "0222333444", IdCardNumber = "079987654321", Hometown = "Hà Nội" },
            new Resident { FullName = "Lê Văn C", PhoneNumber = "0333444555", IdCardNumber = "079456789123", Hometown = "Đà Nẵng" },
            new Resident { FullName = "Phạm Thị D", PhoneNumber = "0444555666", IdCardNumber = "079111222333", Hometown = "TP.HCM" },
            new Resident { FullName = "Hoàng Văn E", PhoneNumber = "0555666777", IdCardNumber = "079222333444", Hometown = "Huế" },
            new Resident { FullName = "Võ Thị F", PhoneNumber = "0666777888", IdCardNumber = "079333444555", Hometown = "Cần Thơ" },
            new Resident { FullName = "Đặng Văn G", PhoneNumber = "0777888999", IdCardNumber = "079444555666", Hometown = "TP.HCM" },
            new Resident { FullName = "Bùi Thị H", PhoneNumber = "0888999000", IdCardNumber = "079555666777", Hometown = "Nha Trang" },
            new Resident { FullName = "Dương Văn I", PhoneNumber = "0999000111", IdCardNumber = "079666777888", Hometown = "Vũng Tàu" },
            new Resident { FullName = "Lý Thị K", PhoneNumber = "0123456780", IdCardNumber = "079777888999", Hometown = "Hà Nội" },
            new Resident { FullName = "Trịnh Văn L", PhoneNumber = "0234567890", IdCardNumber = "079888999000", Hometown = "Đà Lạt" },
            new Resident { FullName = "Phan Thị M", PhoneNumber = "0345678901", IdCardNumber = "079999000111", Hometown = "Quy Nhơn" }
        };
        context.Residents.AddRange(residents);
        context.SaveChanges();

        // 5. Create Users (15 users: 12 residents + 2 staff + 1 admin)
        var users = new List<User>();
        
        // Resident users (12)
        foreach (var resident in residents)
        {
            users.Add(new User
            {
                PhoneNumber = resident.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Role = "CuDan",
                ResidentId = resident.Id,
                IsLocked = false
            });
        }
        
        // Admin
        users.Add(new User
        {
            PhoneNumber = "0123456789",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "Admin",
            ResidentId = null,
            IsLocked = false
        });
        
        // Manager
        users.Add(new User
        {
            PhoneNumber = "0987654321",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
            Role = "QuanLy",
            ResidentId = null,
            IsLocked = false
        });
        
        // Staff
        users.Add(new User
        {
            PhoneNumber = "0912345678",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"),
            Role = "QuanLy",
            ResidentId = null,
            IsLocked = false
        });
        
        context.Users.AddRange(users);
        context.SaveChanges();

        var userAdmin = users.First(u => u.Role == "Admin");
        var userManager = users.First(u => u.PhoneNumber == "0987654321");
        var userResident1 = users.First(u => u.ResidentId == residents[0].Id);

        // 6. Create Contracts (3 contracts)
        var room101 = rooms.First(r => r.RoomCode == "101");
        var room201 = rooms.First(r => r.RoomCode == "201");
        var room301 = rooms.First(r => r.RoomCode == "301");
        
        var contracts = new List<HopDong>
        {
            new HopDong
            {
                RoomId = room101.Id,
                StartDate = DateTime.UtcNow.AddMonths(-3),
                ExpectedEndDate = DateTime.UtcNow.AddMonths(9),
                ActualRentPrice = 8000000,
                DepositAmount = 16000000
            },
            new HopDong
            {
                RoomId = room201.Id,
                StartDate = DateTime.UtcNow.AddMonths(-6),
                ExpectedEndDate = DateTime.UtcNow.AddMonths(6),
                ActualRentPrice = 7500000,
                DepositAmount = 15000000
            },
            new HopDong
            {
                RoomId = room301.Id,
                StartDate = DateTime.UtcNow.AddMonths(-2),
                ExpectedEndDate = DateTime.UtcNow.AddMonths(10),
                ActualRentPrice = 9000000,
                DepositAmount = 18000000
            }
        };
        context.HopDongs.AddRange(contracts);
        context.SaveChanges();

        // 7. Create ChiTietO (residency details)
        var chiTietOs = new List<ChiTietO>
        {
            new ChiTietO { ContractId = contracts[0].Id, ResidentId = residents[0].Id, ResidencyRole = "Người thuê", FromDate = contracts[0].StartDate, ToDate = null },
            new ChiTietO { ContractId = contracts[1].Id, ResidentId = residents[1].Id, ResidencyRole = "Người thuê", FromDate = contracts[1].StartDate, ToDate = null },
            new ChiTietO { ContractId = contracts[2].Id, ResidentId = residents[2].Id, ResidencyRole = "Người thuê", FromDate = contracts[2].StartDate, ToDate = null }
        };
        context.ChiTietOs.AddRange(chiTietOs);
        context.SaveChanges();

        // 8. Create Vehicles (Xe) - 4 vehicles
        var vehicles = new List<Xe>
        {
            new Xe
            {
                ResidentId = residents[0].Id,
                LicensePlate = "59A-12345",
                VehicleType = "Xe máy",
                RegistrationDate = DateTime.UtcNow.AddMonths(-3)
            },
            new Xe
            {
                ResidentId = residents[1].Id,
                LicensePlate = "51G-67890",
                VehicleType = "Ô tô",
                RegistrationDate = DateTime.UtcNow.AddMonths(-6)
            },
            new Xe
            {
                ResidentId = residents[2].Id,
                LicensePlate = "59C-11111",
                VehicleType = "Xe máy",
                RegistrationDate = DateTime.UtcNow.AddMonths(-2)
            },
            new Xe
            {
                ResidentId = residents[3].Id,
                LicensePlate = "59B-22222",
                VehicleType = "Xe máy",
                RegistrationDate = DateTime.UtcNow.AddMonths(-1)
            }
        };
        context.Xes.AddRange(vehicles);
        context.SaveChanges();

        // 9. Create Services (6 services)
        var services = new List<Service>
        {
            new Service { Name = "Điện", ServiceType = "Điện", CommonUnitPrice = 3500, Unit = "kWh" },
            new Service { Name = "Nước", ServiceType = "Nước", CommonUnitPrice = 20000, Unit = "m³" },
            new Service { Name = "Phí quản lý", ServiceType = "Khác", CommonUnitPrice = 15000, Unit = "m²" },
            new Service { Name = "Gửi xe máy", ServiceType = "Gửi xe", CommonUnitPrice = 100000, Unit = "tháng" },
            new Service { Name = "Gửi ô tô", ServiceType = "Gửi xe", CommonUnitPrice = 1500000, Unit = "tháng" },
            new Service { Name = "Internet", ServiceType = "Khác", CommonUnitPrice = 200000, Unit = "tháng" }
        };
        context.Services.AddRange(services);
        context.SaveChanges();

        var serviceElec = services[0];
        var serviceWater = services[1];
        var serviceManagement = services[2];
        var serviceBike = services[3];
        var serviceCar = services[4];
        var serviceInternet = services[5];

        // 10. Create Service Usage Details (ChiTietSuDungDichVu) - 11 records
        var serviceUsages = new List<ChiTietSuDungDichVu>
        {
            // Room 101 services
            new ChiTietSuDungDichVu { RoomId = room101.Id, ServiceId = serviceElec.Id, ResidentId = residents[0].Id, ApplyFrom = contracts[0].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room101.Id, ServiceId = serviceWater.Id, ResidentId = residents[0].Id, ApplyFrom = contracts[0].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room101.Id, ServiceId = serviceBike.Id, VehicleId = vehicles[0].Id, ResidentId = residents[0].Id, ApplyFrom = contracts[0].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room101.Id, ServiceId = serviceInternet.Id, ResidentId = residents[0].Id, ApplyFrom = contracts[0].StartDate, ApplyTo = null, Quantity = 1 },
            
            // Room 201 services
            new ChiTietSuDungDichVu { RoomId = room201.Id, ServiceId = serviceElec.Id, ResidentId = residents[1].Id, ApplyFrom = contracts[1].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room201.Id, ServiceId = serviceWater.Id, ResidentId = residents[1].Id, ApplyFrom = contracts[1].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room201.Id, ServiceId = serviceCar.Id, VehicleId = vehicles[1].Id, ResidentId = residents[1].Id, ApplyFrom = contracts[1].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room201.Id, ServiceId = serviceInternet.Id, ResidentId = residents[1].Id, ApplyFrom = contracts[1].StartDate, ApplyTo = null, Quantity = 1 },
            
            // Room 301 services
            new ChiTietSuDungDichVu { RoomId = room301.Id, ServiceId = serviceElec.Id, ResidentId = residents[2].Id, ApplyFrom = contracts[2].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room301.Id, ServiceId = serviceWater.Id, ResidentId = residents[2].Id, ApplyFrom = contracts[2].StartDate, ApplyTo = null, Quantity = 1 },
            new ChiTietSuDungDichVu { RoomId = room301.Id, ServiceId = serviceBike.Id, VehicleId = vehicles[2].Id, ResidentId = residents[2].Id, ApplyFrom = contracts[2].StartDate, ApplyTo = null, Quantity = 1 }
        };
        context.ChiTietSuDungDichVus.AddRange(serviceUsages);
        context.SaveChanges();

        // 11. Create Meter Readings (CHI_SO_DIEN & CHI_SO_NUOC) - CRITICAL! - 12 records (3 rooms × 2 months × 2 types)
        var elecUsage101 = serviceUsages[0];
        var waterUsage101 = serviceUsages[1];
        var elecUsage201 = serviceUsages[4];
        var waterUsage201 = serviceUsages[5];
        var elecUsage301 = serviceUsages[8];
        var waterUsage301 = serviceUsages[9];

        // January 2026 readings
        context.ChiSoDiens.AddRange(
            new ChiSoDien { ServiceUsageDetailId = elecUsage101.Id, Month = 1, Year = 2026, NewReading = 150, CreatedAt = new DateTime(2026, 1, 31, 10, 0, 0), CreatedBy = userManager.Id },
            new ChiSoDien { ServiceUsageDetailId = elecUsage201.Id, Month = 1, Year = 2026, NewReading = 138, CreatedAt = new DateTime(2026, 1, 31, 11, 0, 0), CreatedBy = userManager.Id },
            new ChiSoDien { ServiceUsageDetailId = elecUsage301.Id, Month = 1, Year = 2026, NewReading = 165, CreatedAt = new DateTime(2026, 1, 31, 12, 0, 0), CreatedBy = userManager.Id }
        );

        context.ChiSoNuocs.AddRange(
            new ChiSoNuoc { ServiceUsageDetailId = waterUsage101.Id, Month = 1, Year = 2026, NewReading = 12, CreatedAt = new DateTime(2026, 1, 31, 10, 15, 0), CreatedBy = userManager.Id },
            new ChiSoNuoc { ServiceUsageDetailId = waterUsage201.Id, Month = 1, Year = 2026, NewReading = 10, CreatedAt = new DateTime(2026, 1, 31, 11, 15, 0), CreatedBy = userManager.Id },
            new ChiSoNuoc { ServiceUsageDetailId = waterUsage301.Id, Month = 1, Year = 2026, NewReading = 14, CreatedAt = new DateTime(2026, 1, 31, 12, 15, 0), CreatedBy = userManager.Id }
        );

        // February 2026 readings
        context.ChiSoDiens.AddRange(
            new ChiSoDien { ServiceUsageDetailId = elecUsage101.Id, Month = 2, Year = 2026, NewReading = 308, CreatedAt = new DateTime(2026, 2, 28, 10, 0, 0), CreatedBy = userManager.Id },
            new ChiSoDien { ServiceUsageDetailId = elecUsage201.Id, Month = 2, Year = 2026, NewReading = 282, CreatedAt = new DateTime(2026, 2, 28, 11, 0, 0), CreatedBy = userManager.Id },
            new ChiSoDien { ServiceUsageDetailId = elecUsage301.Id, Month = 2, Year = 2026, NewReading = 338, CreatedAt = new DateTime(2026, 2, 28, 12, 0, 0), CreatedBy = userManager.Id }
        );

        context.ChiSoNuocs.AddRange(
            new ChiSoNuoc { ServiceUsageDetailId = waterUsage101.Id, Month = 2, Year = 2026, NewReading = 25, CreatedAt = new DateTime(2026, 2, 28, 10, 15, 0), CreatedBy = userManager.Id },
            new ChiSoNuoc { ServiceUsageDetailId = waterUsage201.Id, Month = 2, Year = 2026, NewReading = 21, CreatedAt = new DateTime(2026, 2, 28, 11, 15, 0), CreatedBy = userManager.Id },
            new ChiSoNuoc { ServiceUsageDetailId = waterUsage301.Id, Month = 2, Year = 2026, NewReading = 29, CreatedAt = new DateTime(2026, 2, 28, 12, 15, 0), CreatedBy = userManager.Id }
        );
        
        context.SaveChanges();

        // 12. Create Invoices (HOA_DON) - 6 invoices (3 rooms × 2 months)
        var invoices = new List<HoaDon>
        {
            new HoaDon { ContractId = contracts[0].Id, Month = 1, Year = 2026, DueDate = new DateTime(2026, 2, 15), TotalAmount = 10197500, Status = "Đã thanh toán" },
            new HoaDon { ContractId = contracts[1].Id, Month = 1, Year = 2026, DueDate = new DateTime(2026, 2, 15), TotalAmount = 11015500, Status = "Đã thanh toán" },
            new HoaDon { ContractId = contracts[2].Id, Month = 1, Year = 2026, DueDate = new DateTime(2026, 2, 15), TotalAmount = 10890000, Status = "Chưa thanh toán" },
            new HoaDon { ContractId = contracts[0].Id, Month = 2, Year = 2026, DueDate = new DateTime(2026, 3, 15), TotalAmount = 10485500, Status = "Chưa thanh toán" },
            new HoaDon { ContractId = contracts[1].Id, Month = 2, Year = 2026, DueDate = new DateTime(2026, 3, 15), TotalAmount = 10824000, Status = "Chưa thanh toán" },
            new HoaDon { ContractId = contracts[2].Id, Month = 2, Year = 2026, DueDate = new DateTime(2026, 3, 15), TotalAmount = 11237500, Status = "Chưa thanh toán" }
        };
        context.HoaDons.AddRange(invoices);
        context.SaveChanges();

        // 13. Create Invoice Line Items (CHI_TIET_HOA_DON) - 38 line items
        var lineItems = new List<ChiTietHoaDon>();
        
        // Invoice 1 (Room 101 - Jan) - 6 items
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[0].Id, ItemType = "TienPhong", Description = "Tiền thuê phòng 101 tháng 1/2026", Quantity = 1, UnitPrice = 8000000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[0].Id, ServiceUsageDetailId = elecUsage101.Id, ServiceId = serviceElec.Id, ItemType = "Dien", Description = "Tiền điện (150 kWh)", Quantity = 150, UnitPrice = 3500 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[0].Id, ServiceUsageDetailId = waterUsage101.Id, ServiceId = serviceWater.Id, ItemType = "Nuoc", Description = "Tiền nước (12 m³)", Quantity = 12, UnitPrice = 20000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[0].Id, ServiceId = serviceManagement.Id, ItemType = "DichVu", Description = "Phí quản lý (75.5 m²)", Quantity = 75.5m, UnitPrice = 15000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[0].Id, ServiceUsageDetailId = serviceUsages[2].Id, ServiceId = serviceBike.Id, ItemType = "DichVu", Description = "Gửi xe máy", Quantity = 1, UnitPrice = 100000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[0].Id, ServiceUsageDetailId = serviceUsages[3].Id, ServiceId = serviceInternet.Id, ItemType = "DichVu", Description = "Internet", Quantity = 1, UnitPrice = 200000 });
        
        // Invoice 2 (Room 201 - Jan) - 6 items
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[1].Id, ItemType = "TienPhong", Description = "Tiền thuê phòng 201 tháng 1/2026", Quantity = 1, UnitPrice = 7500000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[1].Id, ServiceUsageDetailId = elecUsage201.Id, ServiceId = serviceElec.Id, ItemType = "Dien", Description = "Tiền điện (138 kWh)", Quantity = 138, UnitPrice = 3500 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[1].Id, ServiceUsageDetailId = waterUsage201.Id, ServiceId = serviceWater.Id, ItemType = "Nuoc", Description = "Tiền nước (10 m³)", Quantity = 10, UnitPrice = 20000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[1].Id, ServiceId = serviceManagement.Id, ItemType = "DichVu", Description = "Phí quản lý (75.5 m²)", Quantity = 75.5m, UnitPrice = 15000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[1].Id, ServiceUsageDetailId = serviceUsages[6].Id, ServiceId = serviceCar.Id, ItemType = "DichVu", Description = "Gửi ô tô", Quantity = 1, UnitPrice = 1500000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[1].Id, ServiceUsageDetailId = serviceUsages[7].Id, ServiceId = serviceInternet.Id, ItemType = "DichVu", Description = "Internet", Quantity = 1, UnitPrice = 200000 });
        
        // Invoice 3 (Room 301 - Jan) - 5 items
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[2].Id, ItemType = "TienPhong", Description = "Tiền thuê phòng 301 tháng 1/2026", Quantity = 1, UnitPrice = 9000000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[2].Id, ServiceUsageDetailId = elecUsage301.Id, ServiceId = serviceElec.Id, ItemType = "Dien", Description = "Tiền điện (165 kWh)", Quantity = 165, UnitPrice = 3500 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[2].Id, ServiceUsageDetailId = waterUsage301.Id, ServiceId = serviceWater.Id, ItemType = "Nuoc", Description = "Tiền nước (14 m³)", Quantity = 14, UnitPrice = 20000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[2].Id, ServiceId = serviceManagement.Id, ItemType = "DichVu", Description = "Phí quản lý (75.5 m²)", Quantity = 75.5m, UnitPrice = 15000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[2].Id, ServiceUsageDetailId = serviceUsages[10].Id, ServiceId = serviceBike.Id, ItemType = "DichVu", Description = "Gửi xe máy", Quantity = 1, UnitPrice = 100000 });
        
        // Invoice 4 (Room 101 - Feb) - 6 items
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[3].Id, ItemType = "TienPhong", Description = "Tiền thuê phòng 101 tháng 2/2026", Quantity = 1, UnitPrice = 8000000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[3].Id, ServiceUsageDetailId = elecUsage101.Id, ServiceId = serviceElec.Id, ItemType = "Dien", Description = "Tiền điện (158 kWh)", Quantity = 158, UnitPrice = 3500 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[3].Id, ServiceUsageDetailId = waterUsage101.Id, ServiceId = serviceWater.Id, ItemType = "Nuoc", Description = "Tiền nước (13 m³)", Quantity = 13, UnitPrice = 20000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[3].Id, ServiceId = serviceManagement.Id, ItemType = "DichVu", Description = "Phí quản lý (75.5 m²)", Quantity = 75.5m, UnitPrice = 15000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[3].Id, ServiceUsageDetailId = serviceUsages[2].Id, ServiceId = serviceBike.Id, ItemType = "DichVu", Description = "Gửi xe máy", Quantity = 1, UnitPrice = 100000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[3].Id, ServiceUsageDetailId = serviceUsages[3].Id, ServiceId = serviceInternet.Id, ItemType = "DichVu", Description = "Internet", Quantity = 1, UnitPrice = 200000 });
        
        // Invoice 5 (Room 201 - Feb) - 6 items
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[4].Id, ItemType = "TienPhong", Description = "Tiền thuê phòng 201 tháng 2/2026", Quantity = 1, UnitPrice = 7500000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[4].Id, ServiceUsageDetailId = elecUsage201.Id, ServiceId = serviceElec.Id, ItemType = "Dien", Description = "Tiền điện (144 kWh)", Quantity = 144, UnitPrice = 3500 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[4].Id, ServiceUsageDetailId = waterUsage201.Id, ServiceId = serviceWater.Id, ItemType = "Nuoc", Description = "Tiền nước (11 m³)", Quantity = 11, UnitPrice = 20000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[4].Id, ServiceId = serviceManagement.Id, ItemType = "DichVu", Description = "Phí quản lý (75.5 m²)", Quantity = 75.5m, UnitPrice = 15000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[4].Id, ServiceUsageDetailId = serviceUsages[6].Id, ServiceId = serviceCar.Id, ItemType = "DichVu", Description = "Gửi ô tô", Quantity = 1, UnitPrice = 1500000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[4].Id, ServiceUsageDetailId = serviceUsages[7].Id, ServiceId = serviceInternet.Id, ItemType = "DichVu", Description = "Internet", Quantity = 1, UnitPrice = 200000 });
        
        // Invoice 6 (Room 301 - Feb) - 5 items
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[5].Id, ItemType = "TienPhong", Description = "Tiền thuê phòng 301 tháng 2/2026", Quantity = 1, UnitPrice = 9000000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[5].Id, ServiceUsageDetailId = elecUsage301.Id, ServiceId = serviceElec.Id, ItemType = "Dien", Description = "Tiền điện (173 kWh)", Quantity = 173, UnitPrice = 3500 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[5].Id, ServiceUsageDetailId = waterUsage301.Id, ServiceId = serviceWater.Id, ItemType = "Nuoc", Description = "Tiền nước (15 m³)", Quantity = 15, UnitPrice = 20000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[5].Id, ServiceId = serviceManagement.Id, ItemType = "DichVu", Description = "Phí quản lý (75.5 m²)", Quantity = 75.5m, UnitPrice = 15000 });
        lineItems.Add(new ChiTietHoaDon { InvoiceId = invoices[5].Id, ServiceUsageDetailId = serviceUsages[10].Id, ServiceId = serviceBike.Id, ItemType = "DichVu", Description = "Gửi xe máy", Quantity = 1, UnitPrice = 100000 });
        
        context.ChiTietHoaDons.AddRange(lineItems);
        context.SaveChanges();

        // 14. Create Payments (THANH_TOAN) - 3 payments
        var payments = new List<ThanhToan>
        {
            new ThanhToan
            {
                PaymentType = "Chuyển khoản",
                InvoiceId = invoices[0].Id,
                Amount = 10197500,
                TransactionCode = "TXN20260210001",
                PaidAt = new DateTime(2026, 2, 10, 14, 30, 0),
                Status = "SUCCESS",
                CreatedAt = new DateTime(2026, 2, 10, 14, 30, 0)
            },
            new ThanhToan
            {
                PaymentType = "Tiền mặt",
                InvoiceId = invoices[1].Id,
                Amount = 11015500,
                TransactionCode = "CASH20260212001",
                PaidAt = new DateTime(2026, 2, 12, 9, 15, 0),
                Status = "SUCCESS",
                CreatedAt = new DateTime(2026, 2, 12, 9, 15, 0)
            },
            new ThanhToan
            {
                PaymentType = "Chuyển khoản",
                InvoiceId = invoices[2].Id,
                Amount = 5000000,
                TransactionCode = "TXN20260220001",
                PaidAt = new DateTime(2026, 2, 20, 16, 0, 0),
                Status = "SUCCESS",
                CreatedAt = new DateTime(2026, 2, 20, 16, 0, 0)
            }
        };
        context.ThanhToans.AddRange(payments);
        context.SaveChanges();

        // 15. Create Assets (TAI_SAN) - 5 assets
        var assets = new List<TaiSan>
        {
            new TaiSan { AssetCode = "THANGMAY-01", AssetName = "Thang máy tầng 1-5" },
            new TaiSan { AssetCode = "DIEUHOA-SANH", AssetName = "Điều hòa sảnh tầng 1" },
            new TaiSan { AssetCode = "MAYPHATSONG-WIFI", AssetName = "Máy phát sóng Wifi" },
            new TaiSan { AssetCode = "CAMERA-SANH-01", AssetName = "Camera an ninh sảnh tầng 1" },
            new TaiSan { AssetCode = "BANGHEXUONG", AssetName = "Bảng hiệu tòa nhà" }
        };
        context.TaiSans.AddRange(assets);
        context.SaveChanges();

        // 16. Create Maintenance Requests (YEU_CAU_SUA_CHUA) - 5 requests
        var maintenanceRequests = new List<YeuCauSuaChua>
        {
            new YeuCauSuaChua
            {
                RoomId = room101.Id,
                UserId = userResident1.Id,
                IssueType = "Điện",
                Description = "Đèn phòng ngủ không sáng, có thể do cầu dao",
                Status = "Hoàn thành",
                AdminNote = "Đã thay cầu dao mới, đèn hoạt động bình thường",
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                ClosedAt = DateTime.UtcNow.AddDays(-3)
            },
            new YeuCauSuaChua
            {
                RoomId = room201.Id,
                UserId = users.First(u => u.ResidentId == residents[1].Id).Id,
                IssueType = "Nước",
                Description = "Vòi nước bồn rửa bát bị rò rỉ",
                Status = "Đang xử lý",
                AdminNote = "Kỹ thuật viên đang kiểm tra",
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                ClosedAt = null
            },
            new YeuCauSuaChua
            {
                RoomId = room301.Id,
                UserId = users.First(u => u.ResidentId == residents[2].Id).Id,
                IssueType = "Khác",
                Description = "Khóa cửa chính bị kẹt, khó mở",
                Status = "Chờ xử lý",
                AdminNote = null,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                ClosedAt = null
            },
            new YeuCauSuaChua
            {
                RoomId = room101.Id,
                UserId = userResident1.Id,
                IssueType = "Điện",
                Description = "Ổ cắm phòng khách bị nóng khi sử dụng",
                Status = "Chờ xử lý",
                AdminNote = null,
                CreatedAt = DateTime.UtcNow,
                ClosedAt = null
            },
            new YeuCauSuaChua
            {
                RoomId = room201.Id,
                UserId = users.First(u => u.ResidentId == residents[1].Id).Id,
                IssueType = "Nước",
                Description = "Áp lực nước yếu vào buổi sáng",
                Status = "Hoàn thành",
                AdminNote = "Đã kiểm tra và tăng áp lực bơm nước",
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                ClosedAt = DateTime.UtcNow.AddDays(-5)
            }
        };
        context.YeuCauSuaChuas.AddRange(maintenanceRequests);
        context.SaveChanges();

        // 17. Create Chat History (LICH_SU_CHAT) - 20 messages
        var chatMessages = new List<LichSuChat>
        {
            new LichSuChat { UserId = userResident1.Id, MessageRole = "user", MessageText = "Wifi của tòa nhà là gì?", CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "assistant", MessageText = "Wifi chung của tòa nhà:\n- Tên mạng: PropTech_Public\n- Mật khẩu: PropTech2024", CreatedAt = DateTime.UtcNow.AddDays(-10).AddSeconds(2) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "user", MessageText = "Giá điện nước là bao nhiêu?", CreatedAt = DateTime.UtcNow.AddDays(-10).AddMinutes(1) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "assistant", MessageText = "Bảng giá dịch vụ:\n- Điện: 3.500đ/kWh\n- Nước: 20.000đ/m³\n- Phí quản lý: 15.000đ/m²", CreatedAt = DateTime.UtcNow.AddDays(-10).AddMinutes(1).AddSeconds(2) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[1].Id).Id, MessageRole = "user", MessageText = "Làm thế nào để báo cáo sự cố?", CreatedAt = DateTime.UtcNow.AddDays(-8) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[1].Id).Id, MessageRole = "assistant", MessageText = "Bạn có thể báo cáo sự cố qua mục 'Yêu cầu sửa chữa' trong app hoặc gọi hotline: 1900-xxxx", CreatedAt = DateTime.UtcNow.AddDays(-8).AddSeconds(2) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[2].Id).Id, MessageRole = "user", MessageText = "Phí gửi xe máy là bao nhiêu?", CreatedAt = DateTime.UtcNow.AddDays(-7) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[2].Id).Id, MessageRole = "assistant", MessageText = "Phí gửi xe:\n- Xe máy: 100.000đ/tháng\n- Ô tô: 1.500.000đ/tháng", CreatedAt = DateTime.UtcNow.AddDays(-7).AddSeconds(2) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "user", MessageText = "Hóa đơn tháng này tôi cần thanh toán bao nhiêu?", CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "assistant", MessageText = "Vui lòng kiểm tra trong mục 'Hóa đơn' để xem chi tiết hóa đơn của bạn", CreatedAt = DateTime.UtcNow.AddDays(-5).AddSeconds(2) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[1].Id).Id, MessageRole = "user", MessageText = "Thanh toán qua VietQR như thế nào?", CreatedAt = DateTime.UtcNow.AddDays(-4) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[1].Id).Id, MessageRole = "assistant", MessageText = "Bạn mở app ngân hàng → Quét mã QR trên hóa đơn → Xác nhận thanh toán", CreatedAt = DateTime.UtcNow.AddDays(-4).AddSeconds(2) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[2].Id).Id, MessageRole = "user", MessageText = "Liên hệ ban quản lý qua số nào?", CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[2].Id).Id, MessageRole = "assistant", MessageText = "Hotline: 1900-xxxx\nEmail: quanly@proptech.com\nGiờ làm việc: 8h-17h thứ 2-6", CreatedAt = DateTime.UtcNow.AddDays(-3).AddSeconds(2) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "user", MessageText = "Quy định về tiếng ồn là gì?", CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new LichSuChat { UserId = userResident1.Id, MessageRole = "assistant", MessageText = "Quy định: Không gây ồn sau 22h để đảm bảo an sinh cho cư dân khác", CreatedAt = DateTime.UtcNow.AddDays(-2).AddSeconds(2) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[1].Id).Id, MessageRole = "user", MessageText = "Có dịch vụ giặt là không?", CreatedAt = DateTime.UtcNow.AddDays(-1) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[1].Id).Id, MessageRole = "assistant", MessageText = "Hiện tại tòa nhà chưa cung cấp dịch vụ giặt là, bạn có thể sử dụng dịch vụ bên ngoài", CreatedAt = DateTime.UtcNow.AddDays(-1).AddSeconds(2) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[2].Id).Id, MessageRole = "user", MessageText = "Làm thế nào để gia hạn hợp đồng?", CreatedAt = DateTime.UtcNow.AddHours(-5) },
            new LichSuChat { UserId = users.First(u => u.ResidentId == residents[2].Id).Id, MessageRole = "assistant", MessageText = "Bạn liên hệ ban quản lý trước 1 tháng để gia hạn hợp đồng, cần mang CMND/CCCD và hợp đồng cũ", CreatedAt = DateTime.UtcNow.AddHours(-5).AddSeconds(2) }
        };
        context.LichSuChats.AddRange(chatMessages);
        context.SaveChanges();

        // 18. Create Payment Reminders (NHAT_KY_NHAC_NO) - 5 reminders
        var reminders = new List<NhatKyNhacNo>
        {
            new NhatKyNhacNo
            {
                InvoiceId = invoices[2].Id,
                SentToUserId = users.First(u => u.ResidentId == residents[2].Id).Id,
                SentByUserId = userManager.Id,
                ReminderCount = 1,
                ReminderTime = DateTime.UtcNow.AddDays(-10),
                ReminderMethod = "SMS",
                Content = "Nhắc nhở: Hóa đơn phòng 301 tháng 1/2026 cần thanh toán trước 15/2/2026. Tổng: 10,890,000đ",
                SendStatus = "Thành công"
            },
            new NhatKyNhacNo
            {
                InvoiceId = invoices[2].Id,
                SentToUserId = users.First(u => u.ResidentId == residents[2].Id).Id,
                SentByUserId = userManager.Id,
                ReminderCount = 2,
                ReminderTime = DateTime.UtcNow.AddDays(-3),
                ReminderMethod = "Email",
                Content = "Nhắc nhở lần 2: Hóa đơn phòng 301 sắp đến hạn thanh toán vào 15/2/2026",
                SendStatus = "Thành công"
            },
            new NhatKyNhacNo
            {
                InvoiceId = invoices[3].Id,
                SentToUserId = userResident1.Id,
                SentByUserId = userManager.Id,
                ReminderCount = 1,
                ReminderTime = DateTime.UtcNow.AddDays(-2),
                ReminderMethod = "App notification",
                Content = "Hóa đơn phòng 101 tháng 2/2026 cần thanh toán trước 15/3/2026. Tổng: 10,485,500đ",
                SendStatus = "Thành công"
            },
            new NhatKyNhacNo
            {
                InvoiceId = invoices[4].Id,
                SentToUserId = users.First(u => u.ResidentId == residents[1].Id).Id,
                SentByUserId = userManager.Id,
                ReminderCount = 1,
                ReminderTime = DateTime.UtcNow.AddDays(-2),
                ReminderMethod = "SMS",
                Content = "Hóa đơn phòng 201 tháng 2/2026 cần thanh toán trước 15/3/2026. Tổng: 10,824,000đ",
                SendStatus = "Thành công"
            },
            new NhatKyNhacNo
            {
                InvoiceId = invoices[5].Id,
                SentToUserId = users.First(u => u.ResidentId == residents[2].Id).Id,
                SentByUserId = userManager.Id,
                ReminderCount = 1,
                ReminderTime = DateTime.UtcNow.AddDays(-2),
                ReminderMethod = "Email",
                Content = "Hóa đơn phòng 301 tháng 2/2026 cần thanh toán trước 15/3/2026. Tổng: 11,237,500đ",
                SendStatus = "Thành công"
            }
        };
        context.NhatKyNhacNos.AddRange(reminders);
        context.SaveChanges();

        // 19. Create Knowledge Base Articles (KNOWLEDGE_BASE) - 10 articles
        var knowledgeBase = new List<KnowledgeBase>
        {
            new KnowledgeBase { Category = "Wifi", Title = "Thông tin Wifi khu chung cư", Content = "Wifi chung của tòa nhà:\n- Tên mạng: PropTech_Public\n- Mật khẩu: PropTech2024\n- Tốc độ: 100Mbps\n- Vị trí: Khu vực phòng chờ tầng 1", Tags = "wifi,mạng,internet,password", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Quy định", Title = "Quy định chung của tòa nhà", Content = "Các quy định chung:\n1. Không nuôi vật nuôi có kích thước lớn\n2. Giữ vệ sinh chung\n3. Không gây ồn sau 22h\n4. Đóng phí quản lý đầy đủ hàng tháng\n5. Bảo quản tài sản chung", Tags = "quy định,nội quy,luật,rules", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Dịch vụ", Title = "Giá dịch vụ", Content = "Bảng giá dịch vụ:\n- Điện: 3.500đ/kWh\n- Nước: 20.000đ/m³\n- Phí quản lý: 15.000đ/m²\n- Gửi xe máy: 100.000đ/tháng\n- Gửi ô tô: 1.500.000đ/tháng", Tags = "giá,dịch vụ,phí,tiền,thanh toán", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Liên hệ", Title = "Thông tin liên hệ ban quản lý", Content = "Liên hệ ban quản lý:\n- Hotline: 1900-xxxx\n- Email: quanly@proptech.com\n- Văn phòng: Tầng 1, Tòa A\n- Giờ làm việc: 8h-17h từ thứ 2 đến thứ 6", Tags = "liên hệ,hotline,email,số điện thoại,contact", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Thanh toán", Title = "Hướng dẫn thanh toán qua VietQR", Content = "Cách thanh toán qua VietQR:\n1. Mở app ngân hàng\n2. Quét mã QR trên hóa đơn\n3. Kiểm tra thông tin\n4. Xác nhận thanh toán\n5. Lưu biên lai", Tags = "thanh toán,vietqr,qr code,payment,chuyển khoản", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Gửi xe", Title = "Quy định gửi xe", Content = "Quy định gửi xe:\n- Đăng ký biển số xe với ban quản lý\n- Xe máy: 100.000đ/tháng\n- Ô tô: 1.500.000đ/tháng\n- Không được gửi xe sai vị trí\n- Giữ gìn vệ sinh khu vực gửi xe", Tags = "gửi xe,xe máy,ô tô,parking,bãi xe", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Bảo trì", Title = "Cách báo cáo sự cố", Content = "Khi có sự cố cần sửa chữa:\n1. Vào mục 'Yêu cầu sửa chữa'\n2. Chọn loại sự cố (Điện/Nước/Khác)\n3. Mô tả chi tiết vấn đề\n4. Chờ ban quản lý xử lý\n5. Nhận thông báo khi hoàn thành", Tags = "sửa chữa,bảo trì,maintenance,sự cố,hỏng hóc", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "An ninh", Title = "Quy định an ninh tòa nhà", Content = "Quy định an ninh:\n- Không cho người lạ vào khu vực chung\n- Khóa cửa phòng khi đi ra ngoài\n- Báo ngay cho bảo vệ nếu phát hiện khả nghi\n- Camera giám sát 24/7\n- Bảo vệ trực 24/7 tại sảnh", Tags = "an ninh,bảo vệ,security,camera,an toàn", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Hợp đồng", Title = "Gia hạn hợp đồng thuê", Content = "Thủ tục gia hạn hợp đồng:\n1. Liên hệ ban quản lý trước 1 tháng\n2. Chuẩn bị: CMND/CCCD, hợp đồng cũ\n3. Ký hợp đồng mới\n4. Đóng tiền cọc (nếu cần)\n5. Nhận chìa khóa và biên bản bàn giao", Tags = "hợp đồng,gia hạn,contract,thuê nhà,lease", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id },
            new KnowledgeBase { Category = "Tiện ích", Title = "Các tiện ích trong tòa nhà", Content = "Tiện ích:\n- Thang máy: 2 thang (tải trọng 1000kg)\n- Bãi đỗ xe: B1 và B2\n- Khu vui chơi trẻ em: Tầng trệt\n- Phòng gym: Tầng 6 (miễn phí cho cư dân)\n- Hồ bơi: Tầng thượng (6h-20h)", Tags = "tiện ích,gym,hồ bơi,thang máy,parking", IsActive = true, UpdatedAt = DateTime.UtcNow, UpdatedBy = userAdmin.Id }
        };
        context.KnowledgeBases.AddRange(knowledgeBase);
        context.SaveChanges();

        Console.WriteLine("✅ Complete data created successfully!");
        Console.WriteLine("\n📊 Data Summary:");
        Console.WriteLine($"   - Buildings: {context.Buildings.Count()}");
        Console.WriteLine($"   - Floors: {context.Floors.Count()}");
        Console.WriteLine($"   - Rooms: {context.Rooms.Count()}");
        Console.WriteLine($"   - Residents: {context.Residents.Count()}");
        Console.WriteLine($"   - Users: {context.Users.Count()}");
        Console.WriteLine($"   - Contracts: {context.HopDongs.Count()}");
        Console.WriteLine($"   - Vehicles: {context.Xes.Count()}");
        Console.WriteLine($"   - Services: {context.Services.Count()}");
        Console.WriteLine($"   - Service Usages: {context.ChiTietSuDungDichVus.Count()}");
        Console.WriteLine($"   - Electricity Readings: {context.ChiSoDiens.Count()}");
        Console.WriteLine($"   - Water Readings: {context.ChiSoNuocs.Count()}");
        Console.WriteLine($"   - Invoices: {context.HoaDons.Count()}");
        Console.WriteLine($"   - Invoice Line Items: {context.ChiTietHoaDons.Count()}");
        Console.WriteLine($"   - Payments: {context.ThanhToans.Count()}");
        Console.WriteLine($"   - Assets: {context.TaiSans.Count()}");
        Console.WriteLine($"   - Maintenance Requests: {context.YeuCauSuaChuas.Count()}");
        Console.WriteLine($"   - Chat Messages: {context.LichSuChats.Count()}");
        Console.WriteLine($"   - Payment Reminders: {context.NhatKyNhacNos.Count()}");
        Console.WriteLine($"   - Knowledge Base: {context.KnowledgeBases.Count()}");
        Console.WriteLine("\n👤 Demo Accounts:");
        Console.WriteLine("   📱 Resident 1: 0111222333 / 123456 (Nguyễn Văn A - Phòng 101)");
        Console.WriteLine("   📱 Resident 2: 0222333444 / 123456 (Trần Thị B - Phòng 201)");
        Console.WriteLine("   👑 Admin:      0123456789 / Admin@123");
        Console.WriteLine("   👔 Manager:    0987654321 / Manager@123");
    }
}
