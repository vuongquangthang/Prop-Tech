using System.Text.Json;
using backend.Models;

namespace backend.Data;

public static class PublicRoomDemoSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static void EnsurePublicRooms(ApplicationDbContext context)
    {
        var electricity = EnsureService(context, "Điện", "Điện", "VNĐ/kWh", 3500);
        var water = EnsureService(context, "Nước", "Nước", "VNĐ/m³", 25000);
        var management = EnsureService(context, "Phí quản lý", "Khác", "VNĐ/tháng", 250000);
        var internet = EnsureService(context, "Internet", "Khác", "VNĐ/tháng", 200000);
        var bikeParking = EnsureService(context, "Gửi xe máy", "Gửi xe", "VNĐ/tháng", 120000);
        var cleaning = EnsureService(context, "Vệ sinh chung", "Khác", "VNĐ/tháng", 80000);
        context.SaveChanges();

        var adminUserId = context.Buildings
            .Where(building => building.OwnerUserId.HasValue)
            .Select(building => building.OwnerUserId)
            .FirstOrDefault()
            ?? context.Users
            .Where(user => user.Role == "Admin" || user.Role == "QuanLy")
            .Select(user => (int?)user.Id)
            .FirstOrDefault();

        foreach (var seededService in new[] { electricity, water, management, internet, bikeParking, cleaning })
        {
            if (!seededService.OwnerUserId.HasValue)
            {
                seededService.OwnerUserId = adminUserId;
            }
        }
        context.SaveChanges();

        var residentUser = context.Users
            .Where(user => user.Role == "CuDan"
                && (!adminUserId.HasValue
                    || user.OwnerUserId == adminUserId
                    || (user.Resident != null && user.Resident.OwnerUserId == adminUserId)))
            .OrderBy(user => user.Id)
            .FirstOrDefault();

        var skyline = EnsureBuilding(
            context,
            "TroUyTin Skyline",
            "72 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM",
            18,
            "Tòa căn hộ dịch vụ có bảo vệ 24/7, thang máy, bãi xe và khu sinh hoạt chung.");
        var riverside = EnsureBuilding(
            context,
            "TroUyTin Riverside",
            "15 Mai Chí Thọ, Phường An Phú, TP. Thủ Đức, TP.HCM",
            22,
            "Tòa nhà căn hộ ven sông, gần khu văn phòng và trung tâm thương mại.");
        var garden = EnsureBuilding(
            context,
            "TroUyTin Garden",
            "18 Nguyễn Thị Thập, Phường Tân Phú, Quận 7, TP.HCM",
            9,
            "Khu trọ căn hộ nhỏ yên tĩnh, gần trường đại học, siêu thị và tuyến xe buýt.");
        foreach (var seededBuilding in new[] { skyline, riverside, garden })
        {
            if (!seededBuilding.OwnerUserId.HasValue)
            {
                seededBuilding.OwnerUserId = adminUserId;
            }
        }
        context.SaveChanges();

        var floor8 = EnsureFloor(context, skyline, 8);
        var floor12 = EnsureFloor(context, riverside, 12);
        var floor5 = EnsureFloor(context, garden, 5);
        var floor7 = EnsureFloor(context, garden, 7);
        context.SaveChanges();

        var apartmentNow = EnsureRoom(
            context,
            floor8,
            "APT-0801",
            area: 68,
            rent: 14500000,
            status: "Trống",
            roomType: "apartment",
            maxOccupants: 4,
            hasPrivateBathroom: true,
            livingRooms: 1,
            bedrooms: 2,
            kitchens: 1,
            bathrooms: 2,
            images: new[]
            {
                Placeholder("modern serviced apartment living room in Ho Chi Minh City"),
                Placeholder("bright two bedroom apartment with balcony"),
                Placeholder("clean apartment kitchen and dining area")
            },
            amenities: new[]
            {
                "Full nội thất", "Ban công", "Máy giặt riêng", "Tủ lạnh", "Bếp từ",
                "Thang máy", "Bảo vệ 24/7", "Hầm gửi xe"
            },
            serviceIds: new[] { electricity.Id, water.Id, management.Id, internet.Id, bikeParking.Id },
            description:
                "Căn hộ 2 phòng ngủ, 1 phòng khách rộng, bếp riêng và 2 nhà vệ sinh. Nhà đã có đầy đủ nội thất, ban công thoáng, phù hợp gia đình trẻ hoặc nhóm 3-4 người. Tòa nhà có thang máy, bảo vệ 24/7 và hầm gửi xe.");

        var apartmentFromDate = EnsureRoom(
            context,
            floor12,
            "APT-1202",
            area: 54,
            rent: 12000000,
            status: "Trống",
            roomType: "apartment",
            maxOccupants: 3,
            hasPrivateBathroom: true,
            livingRooms: 1,
            bedrooms: 2,
            kitchens: 1,
            bathrooms: 1,
            images: new[]
            {
                Placeholder("cozy river view apartment bedroom"),
                Placeholder("minimal apartment living room warm light"),
                Placeholder("serviced apartment bathroom clean tiles")
            },
            amenities: new[]
            {
                "View sông", "Sofa", "Giường nệm", "Điều hòa 2 phòng",
                "Máy nước nóng", "Internet riêng", "Smart lock"
            },
            serviceIds: new[] { electricity.Id, water.Id, management.Id, internet.Id },
            description:
                "Căn hộ 2 phòng ngủ view sông, nội thất tối giản, ánh sáng tự nhiên tốt. Phòng phù hợp người đi làm hoặc gia đình nhỏ cần không gian riêng tư, yên tĩnh, có thể nhận nhà theo ngày bàn giao.");

        var sharedSingle = EnsureRoom(
            context,
            floor5,
            "SH-0501",
            area: 30,
            rent: 4800000,
            status: "Đã thuê",
            roomType: "single",
            maxOccupants: 2,
            hasPrivateBathroom: true,
            livingRooms: 0,
            bedrooms: 1,
            kitchens: 0,
            bathrooms: 1,
            images: new[]
            {
                Placeholder("shared studio room clean bright window"),
                Placeholder("small furnished room with desk and wardrobe"),
                Placeholder("private bathroom in rental room")
            },
            amenities: new[]
            {
                "WC riêng", "Điều hòa", "Tủ quần áo", "Bàn học", "Wifi",
                "Kệ bếp mini", "Máy nước nóng"
            },
            serviceIds: new[] { electricity.Id, water.Id, internet.Id, cleaning.Id },
            description:
                "Phòng studio đang có 1 cư dân nữ ở ổn định, cần tìm thêm 1 bạn ở ghép. Phòng có WC riêng, cửa sổ lớn, khu bếp mini và bàn học. Không gian phù hợp sinh viên hoặc người đi làm cần chỗ ở sạch, gọn.");

        var sharedApartment = EnsureRoom(
            context,
            floor7,
            "SH-0703",
            area: 72,
            rent: 13000000,
            status: "Đã thuê",
            roomType: "apartment",
            maxOccupants: 4,
            hasPrivateBathroom: true,
            livingRooms: 1,
            bedrooms: 2,
            kitchens: 1,
            bathrooms: 2,
            images: new[]
            {
                Placeholder("shared two bedroom apartment living room"),
                Placeholder("apartment bedroom for roommate clean modern"),
                Placeholder("apartment balcony city view evening")
            },
            amenities: new[]
            {
                "Phòng khách chung", "Bếp riêng", "Máy giặt", "Tủ lạnh",
                "Điều hòa", "Ban công", "Bảo vệ 24/7", "Thang máy"
            },
            serviceIds: new[] { electricity.Id, water.Id, management.Id, internet.Id, cleaning.Id },
            description:
                "Căn hộ 2 phòng ngủ đang có 2 cư dân đi làm, cần tìm thêm người ở ghép phòng còn trống. Khu sinh hoạt chung rộng, bếp riêng, máy giặt và ban công thoáng. Chi phí dịch vụ chia theo đầu người.");
        context.SaveChanges();

        EnsurePost(context, apartmentNow, floor8, skyline, adminUserId, new PostSeed(
            Title: "Căn hộ 2PN full nội thất, nhận nhà ngay - Bình Thạnh",
            BaseRentPrice: 14500000,
            MoveInType: "immediate",
            MoveInDate: null,
            FloodProne: false,
            CurrentOccupants: 0,
            Views: 428,
            Messages: 21,
            ContactName: "Ban quản lý Prop-Tech",
            ContactPhone: "0901 888 801",
            ContactType: "other",
            Requirements: new[] { "Cọc 1 tháng", "Hợp đồng tối thiểu 6 tháng", "Không hút thuốc trong căn hộ", "Giữ gìn nội thất" },
            ServicePrices: StandardServicePrices(includeManagement: true, includeInternet: true, includeCleaning: false),
            Images: DeserializeList<string>(apartmentNow.ImageUrlsJson),
            Amenities: DeserializeList<string>(apartmentNow.AmenitiesJson),
            CreatedByUserId: adminUserId));

        EnsurePost(context, apartmentFromDate, floor12, riverside, adminUserId, new PostSeed(
            Title: "Căn hộ view sông 2PN, có thể vào ở từ đầu tháng tới",
            BaseRentPrice: 12000000,
            MoveInType: "from-date",
            MoveInDate: DateTime.UtcNow.Date.AddDays(12),
            FloodProne: false,
            CurrentOccupants: 0,
            Views: 316,
            Messages: 14,
            ContactName: "Ban quản lý Prop-Tech",
            ContactPhone: "0902 777 120",
            ContactType: "other",
            Requirements: new[] { "Ưu tiên gia đình nhỏ hoặc người đi làm", "Không nuôi thú cưng lớn", "Thanh toán tiền nhà đầu tháng" },
            ServicePrices: StandardServicePrices(includeManagement: true, includeInternet: true, includeCleaning: false),
            Images: DeserializeList<string>(apartmentFromDate.ImageUrlsJson),
            Amenities: DeserializeList<string>(apartmentFromDate.AmenitiesJson),
            CreatedByUserId: adminUserId));

        EnsurePost(context, sharedSingle, floor5, garden, residentUser?.Id, new PostSeed(
            Title: "Tìm 1 bạn nữ ở ghép studio có WC riêng - Quận 7",
            BaseRentPrice: 4800000,
            MoveInType: "immediate",
            MoveInDate: null,
            FloodProne: false,
            CurrentOccupants: 1,
            Views: 507,
            Messages: 33,
            ContactName: "Nguyễn Văn A",
            ContactPhone: residentUser?.PhoneNumber ?? "0903 555 501",
            ContactType: "current",
            Requirements: new[] { "Nữ", "Sạch sẽ", "Không hút thuốc", "Không dẫn bạn về qua đêm", "Ưu tiên sinh viên hoặc người đi làm giờ hành chính" },
            ServicePrices: StandardServicePrices(includeManagement: false, includeInternet: true, includeCleaning: true),
            Images: DeserializeList<string>(sharedSingle.ImageUrlsJson),
            Amenities: DeserializeList<string>(sharedSingle.AmenitiesJson),
            CreatedByUserId: residentUser?.Id));

        EnsurePost(context, sharedApartment, floor7, garden, residentUser?.Id, new PostSeed(
            Title: "Ở ghép căn hộ 2PN, phòng riêng trong căn hộ - Quận 7",
            BaseRentPrice: 13000000,
            MoveInType: "from-date",
            MoveInDate: DateTime.UtcNow.Date.AddDays(5),
            FloodProne: false,
            CurrentOccupants: 2,
            Views: 462,
            Messages: 28,
            ContactName: "Nguyễn Văn A",
            ContactPhone: "0904 333 703",
            ContactType: "current",
            Requirements: new[] { "Đi làm ổn định", "Giữ vệ sinh khu sinh hoạt chung", "Không tiệc tùng sau 22h", "Chia đều điện nước theo đầu người" },
            ServicePrices: StandardServicePrices(includeManagement: true, includeInternet: true, includeCleaning: true),
            Images: DeserializeList<string>(sharedApartment.ImageUrlsJson),
            Amenities: DeserializeList<string>(sharedApartment.AmenitiesJson),
            CreatedByUserId: residentUser?.Id));

        context.SaveChanges();
        Console.WriteLine("✅ Public room demo data ensured");
    }

    private static Service EnsureService(
        ApplicationDbContext context,
        string name,
        string type,
        string unit,
        decimal price)
    {
        var service = context.Services.FirstOrDefault(item => item.Name == name);
        if (service == null)
        {
            service = new Service
            {
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

    private static Building EnsureBuilding(
        ApplicationDbContext context,
        string name,
        string address,
        int floors,
        string description)
    {
        var building = context.Buildings.FirstOrDefault(item => item.BuildingName == name);
        if (building == null)
        {
            building = new Building
            {
                BuildingName = name,
                Address = address,
                NumberOfFloors = floors,
                Description = description,
            };
            context.Buildings.Add(building);
        }
        else
        {
            building.Address = address;
            building.NumberOfFloors = floors;
            building.Description = description;
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

    private static Room EnsureRoom(
        ApplicationDbContext context,
        Floor floor,
        string roomCode,
        decimal area,
        decimal rent,
        string status,
        string roomType,
        int maxOccupants,
        bool hasPrivateBathroom,
        int livingRooms,
        int bedrooms,
        int kitchens,
        int bathrooms,
        IEnumerable<string> images,
        IEnumerable<string> amenities,
        IEnumerable<int> serviceIds,
        string description)
    {
        var room = context.Rooms.FirstOrDefault(item => item.RoomCode == roomCode);
        if (room == null)
        {
            room = new Room
            {
                FloorId = floor.Id,
                RoomCode = roomCode,
            };
            context.Rooms.Add(room);
        }

        room.FloorId = floor.Id;
        room.Area = area;
        room.DefaultRentPrice = rent;
        room.Status = status;
        room.RoomType = roomType;
        room.MaxOccupants = maxOccupants;
        room.HasPrivateBathroom = hasPrivateBathroom;
        room.LivingRoomCount = livingRooms;
        room.BedroomCount = bedrooms;
        room.KitchenCount = kitchens;
        room.BathroomCount = bathrooms;
        room.ImageUrlsJson = Serialize(images.ToList());
        room.AmenitiesJson = Serialize(amenities.ToList());
        room.ServiceIdsJson = Serialize(serviceIds.ToList());
        room.Description = description;

        return room;
    }

    private static void EnsurePost(
        ApplicationDbContext context,
        Room room,
        Floor floor,
        Building building,
        int? fallbackUserId,
        PostSeed seed)
    {
        var post = context.BaiDangTimPhongs.FirstOrDefault(item =>
            item.RoomId == room.Id && item.Title == seed.Title);

        if (post == null)
        {
            post = new BaiDangTimPhong
            {
                RoomId = room.Id,
                Title = seed.Title,
                CreatedAt = DateTime.UtcNow,
            };
            context.BaiDangTimPhongs.Add(post);
        }

        post.RoomCode = room.RoomCode;
        post.BuildingName = building.BuildingName;
        post.FloorNumber = floor.FloorNumber;
        post.Area = room.Area;
        post.MaxOccupants = room.MaxOccupants;
        post.CurrentOccupants = seed.CurrentOccupants;
        post.BaseRentPrice = seed.BaseRentPrice;
        post.PostDate = DateTime.UtcNow.AddMinutes(-Math.Max(1, seed.Views % 240));
        post.Views = seed.Views;
        post.Messages = seed.Messages;
        post.IsLocked = false;
        post.Status = "active";
        post.RoomStatus = room.Status;
        post.MoveInType = seed.MoveInType;
        post.MoveInDate = seed.MoveInDate;
        post.FloodProne = seed.FloodProne;
        post.LandlordRequirements = string.Join("; ", seed.Requirements);
        post.ContactType = seed.ContactType;
        post.ContactName = seed.ContactName;
        post.ContactPhone = seed.ContactPhone;
        post.ServicePricesJson = Serialize(seed.ServicePrices);
        post.ImageUrlsJson = Serialize(seed.Images);
        post.AmenitiesJson = Serialize(seed.Amenities);
        post.CoverImageUrl = seed.Images.FirstOrDefault();
        post.CreatedByUserId = seed.CreatedByUserId ?? fallbackUserId;
    }

    private static List<ServicePriceSeed> StandardServicePrices(
        bool includeManagement,
        bool includeInternet,
        bool includeCleaning)
    {
        var items = new List<ServicePriceSeed>
        {
            new("electricity", "Tiền điện", "VNĐ/kWh", 3500),
            new("water", "Tiền nước", "VNĐ/m³", 25000),
        };

        if (includeManagement)
        {
            items.Add(new ServicePriceSeed("management", "Phí quản lý", "VNĐ/tháng", 250000));
        }

        if (includeInternet)
        {
            items.Add(new ServicePriceSeed("internet", "Internet", "VNĐ/tháng", 200000));
        }

        if (includeCleaning)
        {
            items.Add(new ServicePriceSeed("cleaning", "Vệ sinh chung", "VNĐ/tháng", 80000));
        }

        return items;
    }

    private static string Placeholder(string query)
        => $"/placeholder.svg?height=720&width=960&query={Uri.EscapeDataString(query)}";

    private static string Serialize<T>(T value)
        => JsonSerializer.Serialize(value, JsonOptions);

    private static List<T> DeserializeList<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<T>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }

    private sealed record ServicePriceSeed(string Key, string Name, string Unit, decimal Price);

    private sealed record PostSeed(
        string Title,
        decimal BaseRentPrice,
        string MoveInType,
        DateTime? MoveInDate,
        bool FloodProne,
        int CurrentOccupants,
        int Views,
        int Messages,
        string ContactName,
        string ContactPhone,
        string ContactType,
        IReadOnlyList<string> Requirements,
        IReadOnlyList<ServicePriceSeed> ServicePrices,
        IReadOnlyList<string> Images,
        IReadOnlyList<string> Amenities,
        int? CreatedByUserId);
}
