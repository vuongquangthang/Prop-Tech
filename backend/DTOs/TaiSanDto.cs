namespace backend.DTOs
{
    public class TaiSanDto
    {
        public int Id { get; set; }
        public string AssetName { get; set; } = null!;
        public string AssetCode { get; set; } = null!;
        public int? OwnerUserId { get; set; }
        public int? BuildingId { get; set; }
        public string? BuildingName { get; set; }
        public List<int> BuildingIds { get; set; } = new();
        public List<string> BuildingNames { get; set; } = new();
        
        // Aggregated info
        public int TotalRooms { get; set; }
        public int TotalQuantity { get; set; }
    }

    public class CreateTaiSanDto
    {
        public string AssetName { get; set; } = null!;
        public string AssetCode { get; set; } = null!;
        public int? BuildingId { get; set; }
        public List<int>? BuildingIds { get; set; }
    }

    public class UpdateTaiSanDto
    {
        public string? AssetName { get; set; }
        public string? AssetCode { get; set; }
        public int? BuildingId { get; set; }
        public List<int>? BuildingIds { get; set; }
    }

    public class ChiTietTaiSanPhongDto
    {
        public int RoomId { get; set; }
        public int AssetId { get; set; }
        public int Quantity { get; set; }
        public string? Condition { get; set; }
        public string? Note { get; set; }

        // Navigation properties
        public string? RoomCode { get; set; }
        public string? AssetName { get; set; }
        public string? AssetCode { get; set; }
    }

    public class CreateChiTietTaiSanPhongDto
    {
        public int RoomId { get; set; }
        public int AssetId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? Condition { get; set; } = "Tốt";
        public string? Note { get; set; }
    }

    public class UpdateChiTietTaiSanPhongDto
    {
        public int? Quantity { get; set; }
        public string? Condition { get; set; }
        public string? Note { get; set; }
    }
}
