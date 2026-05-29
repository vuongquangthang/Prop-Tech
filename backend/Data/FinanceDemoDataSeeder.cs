using backend.Models;

namespace backend.Data;

public static class FinanceDemoDataSeeder
{
    private const string DemoOwnerPhone = "proptechadmin01";

    public static void EnsureProptechAdminFinanceDemo(ApplicationDbContext context)
    {
        var owner = context.Users.FirstOrDefault(user =>
            user.PhoneNumber == DemoOwnerPhone && user.Role == "Admin");

        if (owner == null)
        {
            return;
        }

        if (owner.OwnerUserId != owner.Id)
        {
            owner.OwnerUserId = owner.Id;
            context.SaveChanges();
        }

        var electricity = EnsureService(context, owner.Id, "Điện", "Điện", "kWh", 3500);
        var water = EnsureService(context, owner.Id, "Nước", "Nước", "m³", 25000);
        var internet = EnsureService(context, owner.Id, "Internet", "Khác", "tháng", 200000);
        context.SaveChanges();

        var building = EnsureBuilding(context, owner.Id);
        context.SaveChanges();

        var floor1 = EnsureFloor(context, building, 1);
        var floor2 = EnsureFloor(context, building, 2);
        context.SaveChanges();

        var seeds = new[]
        {
            new FinanceRoomSeed("101", floor1, "Mai Anh Dương", "0977000101", "079700010101", 6500000, 420, 552, 36, 47),
            new FinanceRoomSeed("102", floor1, "Phạm Quốc Bảo", "0977000102", "079700010102", 7200000, 210, 298, 18, 26),
            new FinanceRoomSeed("201", floor2, "Nguyễn Thảo My", "0977000201", "079700020101", 8500000, 760, 905, 54, 67),
        };

        var currentPeriod = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var previousPeriod = currentPeriod.AddMonths(-1);
        var twoMonthsAgoPeriod = currentPeriod.AddMonths(-2);

        foreach (var seed in seeds)
        {
            var room = EnsureRoom(context, seed);
            var resident = EnsureResident(context, owner.Id, seed);
            context.SaveChanges();

            EnsureResidentUser(context, owner.Id, resident);
            var contract = EnsureContract(context, room, seed);
            context.SaveChanges();

            EnsureResidency(context, contract, resident);
            var elecUsage = EnsureServiceUsage(context, room, resident, electricity, contract.StartDate);
            var waterUsage = EnsureServiceUsage(context, room, resident, water, contract.StartDate);
            EnsureServiceUsage(context, room, resident, internet, contract.StartDate);
            context.SaveChanges();

            EnsureElectricReading(context, elecUsage.Id, twoMonthsAgoPeriod, seed.ElectricTwoMonthsAgo, owner.Id);
            EnsureElectricReading(context, elecUsage.Id, previousPeriod, seed.ElectricPreviousMonth, owner.Id);
            EnsureWaterReading(context, waterUsage.Id, twoMonthsAgoPeriod, seed.WaterTwoMonthsAgo, owner.Id);
            EnsureWaterReading(context, waterUsage.Id, previousPeriod, seed.WaterPreviousMonth, owner.Id);
            context.SaveChanges();
        }

        Console.WriteLine("Finance demo data ensured for proptechadmin01");
    }

    private static Service EnsureService(
        ApplicationDbContext context,
        int ownerUserId,
        string name,
        string type,
        string unit,
        decimal price)
    {
        var service = context.Services.FirstOrDefault(item =>
            item.OwnerUserId == ownerUserId && item.Name == name);

        if (service == null)
        {
            service = new Service
            {
                OwnerUserId = ownerUserId,
                Name = name,
                ServiceType = type,
                Unit = unit,
                CommonUnitPrice = price,
                EffectiveDate = DateTime.UtcNow,
                IsActive = true,
            };
            context.Services.Add(service);
        }
        else
        {
            service.ServiceType = type;
            service.Unit = unit;
            service.CommonUnitPrice = price;
            service.IsActive = true;
        }

        return service;
    }

    private static Building EnsureBuilding(ApplicationDbContext context, int ownerUserId)
    {
        const string buildingName = "Nhà mẫu PropTech 01";
        var building = context.Buildings.FirstOrDefault(item =>
            item.OwnerUserId == ownerUserId && item.BuildingName == buildingName);

        if (building == null)
        {
            building = new Building
            {
                OwnerUserId = ownerUserId,
                BuildingName = buildingName,
                Address = "12 Nguyễn Hữu Thọ, Quận 7, TP.HCM",
                NumberOfFloors = 2,
                Description = "Dữ liệu mẫu cho quy trình chốt điện nước và tính hóa đơn.",
            };
            context.Buildings.Add(building);
        }
        else
        {
            building.Address = "12 Nguyễn Hữu Thọ, Quận 7, TP.HCM";
            building.NumberOfFloors = 2;
            building.Description = "Dữ liệu mẫu cho quy trình chốt điện nước và tính hóa đơn.";
        }

        return building;
    }

    private static Floor EnsureFloor(ApplicationDbContext context, Building building, int floorNumber)
    {
        var floor = context.Floors.FirstOrDefault(item =>
            item.BuildingId == building.Id && item.FloorNumber == floorNumber);

        if (floor == null)
        {
            floor = new Floor
            {
                BuildingId = building.Id,
                FloorNumber = floorNumber,
            };
            context.Floors.Add(floor);
        }

        return floor;
    }

    private static Room EnsureRoom(ApplicationDbContext context, FinanceRoomSeed seed)
    {
        var room = context.Rooms.FirstOrDefault(item =>
            item.FloorId == seed.Floor.Id && item.RoomCode == seed.RoomCode);

        if (room == null)
        {
            room = new Room
            {
                FloorId = seed.Floor.Id,
                RoomCode = seed.RoomCode,
            };
            context.Rooms.Add(room);
        }

        room.Area = seed.RoomCode == "201" ? 32 : 28;
        room.DefaultRentPrice = seed.Rent;
        room.Status = "Đã thuê";
        room.RoomType = "single";
        room.MaxOccupants = 2;
        room.HasPrivateBathroom = true;
        room.LivingRoomCount = 0;
        room.BedroomCount = 1;
        room.KitchenCount = 0;
        room.BathroomCount = 1;
        room.Description = $"Phòng mẫu {seed.RoomCode} dùng cho chốt điện nước và hóa đơn.";

        return room;
    }

    private static Resident EnsureResident(ApplicationDbContext context, int ownerUserId, FinanceRoomSeed seed)
    {
        var resident = context.Residents.FirstOrDefault(item => item.PhoneNumber == seed.PhoneNumber);

        if (resident == null)
        {
            resident = new Resident
            {
                PhoneNumber = seed.PhoneNumber,
                IdCardNumber = seed.IdCardNumber,
            };
            context.Residents.Add(resident);
        }

        resident.OwnerUserId = ownerUserId;
        resident.FullName = seed.ResidentName;
        resident.Hometown = "TP.HCM";

        return resident;
    }

    private static void EnsureResidentUser(ApplicationDbContext context, int ownerUserId, Resident resident)
    {
        if (string.IsNullOrWhiteSpace(resident.PhoneNumber))
        {
            return;
        }

        var user = context.Users.FirstOrDefault(item => item.PhoneNumber == resident.PhoneNumber);
        if (user == null)
        {
            user = new User
            {
                PhoneNumber = resident.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                Role = "CuDan",
                ResidentId = resident.Id,
                OwnerUserId = ownerUserId,
                IsLocked = false,
                MustChangePassword = false,
            };
            context.Users.Add(user);
        }
        else
        {
            user.Role = "CuDan";
            user.ResidentId = resident.Id;
            user.OwnerUserId = ownerUserId;
            user.IsLocked = false;
        }
    }

    private static HopDong EnsureContract(ApplicationDbContext context, Room room, FinanceRoomSeed seed)
    {
        var contract = context.HopDongs
            .Where(item => item.RoomId == room.Id)
            .OrderByDescending(item => item.StartDate)
            .FirstOrDefault();

        if (contract == null)
        {
            contract = new HopDong
            {
                RoomId = room.Id,
                StartDate = DateTime.UtcNow.Date.AddMonths(-4),
            };
            context.HopDongs.Add(contract);
        }

        contract.ContractCode = $"HD-DEMO-{seed.RoomCode}";
        contract.ExpectedEndDate = DateTime.UtcNow.Date.AddMonths(8);
        contract.ActualRentPrice = seed.Rent;
        contract.DepositAmount = seed.Rent;
        contract.PaymentDayOfMonth = 5;

        return contract;
    }

    private static void EnsureResidency(ApplicationDbContext context, HopDong contract, Resident resident)
    {
        var residency = context.ChiTietOs.FirstOrDefault(item =>
            item.ContractId == contract.Id && item.ResidentId == resident.Id);

        if (residency == null)
        {
            residency = new ChiTietO
            {
                ContractId = contract.Id,
                ResidentId = resident.Id,
                FromDate = contract.StartDate,
            };
            context.ChiTietOs.Add(residency);
        }

        residency.ResidencyRole = "Người thuê";
        residency.ToDate = null;
    }

    private static ChiTietSuDungDichVu EnsureServiceUsage(
        ApplicationDbContext context,
        Room room,
        Resident resident,
        Service service,
        DateTime applyFrom)
    {
        var usage = context.ChiTietSuDungDichVus.FirstOrDefault(item =>
            item.RoomId == room.Id && item.ResidentId == resident.Id && item.ServiceId == service.Id);

        if (usage == null)
        {
            usage = new ChiTietSuDungDichVu
            {
                RoomId = room.Id,
                ResidentId = resident.Id,
                ServiceId = service.Id,
            };
            context.ChiTietSuDungDichVus.Add(usage);
        }

        usage.ApplyFrom = applyFrom;
        usage.ApplyTo = null;
        usage.Quantity = 1;
        usage.OverrideUnitPrice = null;

        return usage;
    }

    private static void EnsureElectricReading(
        ApplicationDbContext context,
        long serviceUsageDetailId,
        DateTime period,
        decimal reading,
        int createdByUserId)
    {
        var month = (byte)period.Month;
        var year = (short)period.Year;
        var existing = context.ChiSoDiens.FirstOrDefault(item =>
            item.ServiceUsageDetailId == serviceUsageDetailId &&
            item.Month == month &&
            item.Year == year);

        if (existing == null)
        {
            context.ChiSoDiens.Add(new ChiSoDien
            {
                ServiceUsageDetailId = serviceUsageDetailId,
                Month = month,
                Year = year,
                NewReading = reading,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdByUserId,
            });
        }
    }

    private static void EnsureWaterReading(
        ApplicationDbContext context,
        long serviceUsageDetailId,
        DateTime period,
        decimal reading,
        int createdByUserId)
    {
        var month = (byte)period.Month;
        var year = (short)period.Year;
        var existing = context.ChiSoNuocs.FirstOrDefault(item =>
            item.ServiceUsageDetailId == serviceUsageDetailId &&
            item.Month == month &&
            item.Year == year);

        if (existing == null)
        {
            context.ChiSoNuocs.Add(new ChiSoNuoc
            {
                ServiceUsageDetailId = serviceUsageDetailId,
                Month = month,
                Year = year,
                NewReading = reading,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdByUserId,
            });
        }
    }

    private sealed record FinanceRoomSeed(
        string RoomCode,
        Floor Floor,
        string ResidentName,
        string PhoneNumber,
        string IdCardNumber,
        decimal Rent,
        decimal ElectricTwoMonthsAgo,
        decimal ElectricPreviousMonth,
        decimal WaterTwoMonthsAgo,
        decimal WaterPreviousMonth);
}
