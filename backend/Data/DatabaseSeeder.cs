using backend.Models;
using BCrypt.Net;

namespace backend.Data;

public static class DatabaseSeeder
{
    public static void SeedDemoUsers(ApplicationDbContext context)
    {
        // Check if users already exist
        if (context.Users.Any())
        {
            Console.WriteLine("✅ Database already has users. Skipping seed.");
            return;
        }

        Console.WriteLine("🌱 Seeding demo data...");

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
            var floor = new Floor
            {
                BuildingId = building.Id,
                FloorNumber = i
            };
            floors.Add(floor);
        }
        context.Floors.AddRange(floors);
        context.SaveChanges();

        // 3. Create Rooms
        var rooms = new List<Room>();
        foreach (var floor in floors)
        {
            for (int roomNum = 1; roomNum <= 4; roomNum++)
            {
                var room = new Room
                {
                    FloorId = floor.Id,
                    RoomCode = $"{floor.FloorNumber}0{roomNum}",
                    Area = 75.5m,
                    DefaultRentPrice = 8000000,
                    Status = roomNum == 1 ? "Đã thuê" : "Trống"
                };
                rooms.Add(room);
            }
        }
        context.Rooms.AddRange(rooms);
        context.SaveChanges();

        // 4. Create Residents
        var resident1 = new Resident
        {
            FullName = "Nguyễn Văn A",
            PhoneNumber = "0111222333",
            IdCardNumber = "079123456789",
            Hometown = "TP. Hồ Chí Minh"
        };
        
        var resident2 = new Resident
        {
            FullName = "Trần Thị B",
            PhoneNumber = "0222333444",
            IdCardNumber = "079987654321",
            Hometown = "Hà Nội"
        };
        
        var resident3 = new Resident
        {
            FullName = "Lê Văn C",
            PhoneNumber = "0333444555",
            IdCardNumber = "079456789123",
            Hometown = "Đà Nẵng"
        };
        
        context.Residents.AddRange(resident1, resident2, resident3);
        context.SaveChanges();

        // 5. Create Users
        var userResident1 = new User
        {
            PhoneNumber = "0111222333",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = "CuDan",
            ResidentId = resident1.Id,
            IsLocked = false,
            LastLoginAt = null
        };
        
        var userResident2 = new User
        {
            PhoneNumber = "0222333444",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = "CuDan",
            ResidentId = resident2.Id,
            IsLocked = false,
            LastLoginAt = null
        };
        
        var userResident3 = new User
        {
            PhoneNumber = "0333444555",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = "CuDan",
            ResidentId = resident3.Id,
            IsLocked = false,
            LastLoginAt = null
        };

        var userAdmin = new User
        {
            PhoneNumber = "0123456789",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "Admin",
            IsLocked = false,
            LastLoginAt = null
        };

        var userManager = new User
        {
            PhoneNumber = "0987654321",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
            Role = "QuanLy",
            IsLocked = false,
            LastLoginAt = null
        };

        context.Users.AddRange(userResident1, userResident2, userResident3, userAdmin, userManager);
        context.SaveChanges();

        // 6. Create Contracts for 3 residents
        var contract1 = new HopDong
        {
            RoomId = rooms.First(r => r.RoomCode == "101").Id,
            StartDate = DateTime.UtcNow.AddMonths(-3),
            ExpectedEndDate = DateTime.UtcNow.AddMonths(9),
            ActualRentPrice = 8000000,
            DepositAmount = 16000000
        };
        
        var contract2 = new HopDong
        {
            RoomId = rooms.First(r => r.RoomCode == "201").Id,
            StartDate = DateTime.UtcNow.AddMonths(-6),
            ExpectedEndDate = DateTime.UtcNow.AddMonths(6),
            ActualRentPrice = 7500000,
            DepositAmount = 15000000
        };
        
        var contract3 = new HopDong
        {
            RoomId = rooms.First(r => r.RoomCode == "301").Id,
            StartDate = DateTime.UtcNow.AddMonths(-2),
            ExpectedEndDate = DateTime.UtcNow.AddMonths(10),
            ActualRentPrice = 9000000,
            DepositAmount = 18000000
        };
        
        context.HopDongs.AddRange(contract1, contract2, contract3);
        context.SaveChanges();

        // 7. Create ChiTietO (Residency details) for all 3 residents
        var chiTietO1 = new ChiTietO
        {
            ContractId = contract1.Id,
            ResidentId = resident1.Id,
            ResidencyRole = "Người thuê chính",
            FromDate = contract1.StartDate,
            ToDate = null
        };
        
        var chiTietO2 = new ChiTietO
        {
            ContractId = contract2.Id,
            ResidentId = resident2.Id,
            ResidencyRole = "Người thuê chính",
            FromDate = contract2.StartDate,
            ToDate = null
        };
        
        var chiTietO3 = new ChiTietO
        {
            ContractId = contract3.Id,
            ResidentId = resident3.Id,
            ResidencyRole = "Người thuê chính",
            FromDate = contract3.StartDate,
            ToDate = null
        };
        
        context.ChiTietOs.AddRange(chiTietO1, chiTietO2, chiTietO3);
        context.SaveChanges();

        // 8. Create Sample Invoices for all 3 rooms
        var invoice1 = new HoaDon
        {
            ContractId = contract1.Id,
            Month = (byte)DateTime.UtcNow.Month,
            Year = (short)DateTime.UtcNow.Year,
            DueDate = DateTime.UtcNow.AddDays(15),
            TotalAmount = 10500000,
            Status = "Chưa thanh toán"
        };
        
        var invoice2 = new HoaDon
        {
            ContractId = contract2.Id,
            Month = (byte)DateTime.UtcNow.Month,
            Year = (short)DateTime.UtcNow.Year,
            DueDate = DateTime.UtcNow.AddDays(15),
            TotalAmount = 9800000,
            Status = "Chưa thanh toán"
        };
        
        var invoice3 = new HoaDon
        {
            ContractId = contract3.Id,
            Month = (byte)DateTime.UtcNow.Month,
            Year = (short)DateTime.UtcNow.Year,
            DueDate = DateTime.UtcNow.AddDays(15),
            TotalAmount = 11200000,
            Status = "Chưa thanh toán"
        };
        
        context.HoaDons.AddRange(invoice1, invoice2, invoice3);
        context.SaveChanges();

        // 9. Create KnowledgeBase for Chatbot
        var knowledgeItems = new List<KnowledgeBase>
        {
            new KnowledgeBase
            {
                Category = "Wifi",
                Title = "Thông tin Wifi khu chung cư",
                Content = "Wifi chung của tòa nhà:\n- Tên mạng: PropTech_Public\n- Mật khẩu: PropTech2024\n- Tốc độ: 100Mbps\n- Vị trí: Khu vực phòng chờ tầng 1",
                Tags = "wifi,mạng,internet,password",
                IsActive = true,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = userAdmin.Id
            },
            new KnowledgeBase
            {
                Category = "Quy định",
                Title = "Quy định chung của tòa nhà",
                Content = "Các quy định chung:\n1. Không nuôi vật nuôi có kích thước lớn\n2. Giữ vệ sinh chung\n3. Không gây ồn sau 22h\n4. Đóng phí quản lý đầy đủ hàng tháng\n5. Bảo quản tài sản chung",
                Tags = "quy định,nội quy,luật,rules",
                IsActive = true,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = userAdmin.Id
            },
            new KnowledgeBase
            {
                Category = "Dịch vụ",
                Title = "Giá dịch vụ",
                Content = "Bảng giá dịch vụ:\n- Điện: 3.500đ/kWh\n- Nước: 20.000đ/m³\n- Phí quản lý: 15.000đ/m²\n- Gửi xe máy: 100.000đ/tháng\n- Gửi ô tô: 1.500.000đ/tháng",
                Tags = "giá,dịch vụ,phí,tiền,thanh toán",
                IsActive = true,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = userAdmin.Id
            },
            new KnowledgeBase
            {
                Category = "Liên hệ",
                Title = "Thông tin liên hệ ban quản lý",
                Content = "Liên hệ ban quản lý:\n- Hotline: 1900-xxxx\n- Email: quanly@proptech.com\n- Văn phòng: Tầng 1, Tòa A\n- Giờ làm việc: 8h-17h từ thứ 2 đến thứ 6",
                Tags = "liên hệ,hotline,email,số điện thoại,contact",
                IsActive = true,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = userAdmin.Id
            }
        };
        context.KnowledgeBases.AddRange(knowledgeItems);
        context.SaveChanges();

        Console.WriteLine("✅ Demo data created successfully!");
        Console.WriteLine("\n📋 Demo Accounts:");
        Console.WriteLine("   👤 Resident: 0111222333 / 123456 (Nguyễn Văn A - Phòng 101)");
        Console.WriteLine("   👑 Admin:    0123456789 / Admin@123");
        Console.WriteLine("   👔 Manager:  0987654321 / Manager@123");
        Console.WriteLine("\n🏢 Sample Data:");
        Console.WriteLine("   - Building: Tòa A (5 tầng)");
        Console.WriteLine("   - Rooms: 20 phòng (101-504)");
        Console.WriteLine("   - Contract: HD2024001 (Phòng 101)");
        Console.WriteLine("   - Invoice: 1 hóa đơn chưa thanh toán");
        Console.WriteLine("   - Knowledge Base: 4 bài viết cho chatbot");
    }
}
