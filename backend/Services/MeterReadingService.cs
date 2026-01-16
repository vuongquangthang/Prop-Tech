using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IMeterReadingService
{
    Task<MeterReadingDto?> GetByIdAsync(long id);
    Task<List<MeterReadingDto>> GetByRoomAsync(long roomId);
    Task<MeterReadingDto> CreateAsync(CreateMeterReadingDto dto);
}

public class MeterReadingService : IMeterReadingService
{
    private readonly IMeterReadingRepository _meterReadingRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ILogger<MeterReadingService> _logger;
    private const decimal AnomalyThreshold = 2.0m; // 200% consumption increase = anomaly

    public MeterReadingService(
        IMeterReadingRepository meterReadingRepository,
        IRoomRepository roomRepository,
        ILogger<MeterReadingService> logger)
    {
        _meterReadingRepository = meterReadingRepository;
        _roomRepository = roomRepository;
        _logger = logger;
    }

    public async Task<MeterReadingDto?> GetByIdAsync(long id)
    {
        var reading = await _meterReadingRepository.GetByIdAsync(id);
        return reading == null ? null : MapToDto(reading);
    }

    public async Task<List<MeterReadingDto>> GetByRoomAsync(long roomId)
    {
        var readings = await _meterReadingRepository.GetByRoomAsync(roomId);
        return readings.Select(MapToDto).ToList();
    }

    public async Task<MeterReadingDto> CreateAsync(CreateMeterReadingDto dto)
    {
        // Validate room exists
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Không tìm thấy phòng");
        }

        // Check if reading already exists for this month
        var existingReading = await _meterReadingRepository.GetByRoomAndMonthAsync(dto.RoomId, dto.ReadingMonth);
        if (existingReading != null)
        {
            throw new InvalidOperationException("Chỉ số điện cho tháng này đã tồn tại");
        }

        // Validate reading is not negative
        if (dto.CurrentReading < 0)
        {
            throw new InvalidOperationException("Chỉ số điện không được âm");
        }

        // Get previous reading
        var previousReading = await _meterReadingRepository.GetPreviousReadingAsync(dto.RoomId, dto.ReadingMonth);

        decimal previousValue = previousReading?.CurrentReading ?? 0;

        // Validate current >= previous (delta must be >= 0)
        if (dto.CurrentReading < previousValue)
        {
            throw new InvalidOperationException("Chỉ số hiện tại không được nhỏ hơn chỉ số kỳ trước");
        }

        // Create reading
        var reading = new MeterReading
        {
            RoomId = dto.RoomId,
            ReadingMonth = dto.ReadingMonth,
            PreviousReading = previousValue,
            CurrentReading = dto.CurrentReading,
            IsAnomaly = false,
            CreatedAt = DateTime.UtcNow
        };

        // Detect anomaly: if delta > 2x avg consumption
        if (previousReading != null)
        {
            var consumption = dto.CurrentReading - previousValue;
            
            // Get average of last 3 months
            var recentReadings = await _meterReadingRepository.GetByRoomAsync(dto.RoomId);
            if (recentReadings.Count >= 2)
            {
                var avgConsumption = recentReadings.Take(3)
                    .Where(r => r.ReadingMonth < dto.ReadingMonth)
                    .Average(r => r.CurrentReading - r.PreviousReading);

                if (avgConsumption > 0 && consumption > avgConsumption * AnomalyThreshold)
                {
                    reading.IsAnomaly = true;
                    reading.AnomalyNote = $"Tiêu thụ cao bất thường: {consumption:F2} kWh (trung bình: {avgConsumption:F2} kWh)";
                }
            }
        }

        await _meterReadingRepository.AddAsync(reading);
        await _meterReadingRepository.SaveChangesAsync();

        return MapToDto(reading);
    }

    private MeterReadingDto MapToDto(MeterReading reading)
    {
        return new MeterReadingDto
        {
            Id = reading.Id,
            RoomId = reading.RoomId,
            ReadingMonth = reading.ReadingMonth,
            PreviousReading = reading.PreviousReading,
            CurrentReading = reading.CurrentReading,
            ConsumptionKwh = reading.CurrentReading - reading.PreviousReading,
            IsAnomaly = reading.IsAnomaly,
            AnomalyNote = reading.AnomalyNote,
            CreatedAt = reading.CreatedAt
        };
    }
}

public interface IWaterMeterReadingService
{
    Task<WaterMeterReadingDto?> GetByIdAsync(long id);
    Task<List<WaterMeterReadingDto>> GetByRoomAsync(long roomId);
    Task<WaterMeterReadingDto> CreateAsync(CreateWaterMeterReadingDto dto);
}

public class WaterMeterReadingService : IWaterMeterReadingService
{
    private readonly IWaterMeterReadingRepository _waterMeterReadingRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ILogger<WaterMeterReadingService> _logger;
    private const decimal AnomalyThreshold = 2.0m; // 200% consumption increase = anomaly

    public WaterMeterReadingService(
        IWaterMeterReadingRepository waterMeterReadingRepository,
        IRoomRepository roomRepository,
        ILogger<WaterMeterReadingService> logger)
    {
        _waterMeterReadingRepository = waterMeterReadingRepository;
        _roomRepository = roomRepository;
        _logger = logger;
    }

    public async Task<WaterMeterReadingDto?> GetByIdAsync(long id)
    {
        var reading = await _waterMeterReadingRepository.GetByIdAsync(id);
        return reading == null ? null : MapToDto(reading);
    }

    public async Task<List<WaterMeterReadingDto>> GetByRoomAsync(long roomId)
    {
        var readings = await _waterMeterReadingRepository.GetByRoomAsync(roomId);
        return readings.Select(MapToDto).ToList();
    }

    public async Task<WaterMeterReadingDto> CreateAsync(CreateWaterMeterReadingDto dto)
    {
        // Validate room exists
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Không tìm thấy phòng");
        }

        // Check if reading already exists for this month
        var existingReading = await _waterMeterReadingRepository.GetByRoomAndMonthAsync(dto.RoomId, dto.ReadingMonth);
        if (existingReading != null)
        {
            throw new InvalidOperationException("Chỉ số nước cho tháng này đã tồn tại");
        }

        // Validate reading is not negative
        if (dto.CurrentReading < 0)
        {
            throw new InvalidOperationException("Chỉ số nước không được âm");
        }

        // Get previous reading
        var previousReading = await _waterMeterReadingRepository.GetPreviousReadingAsync(dto.RoomId, dto.ReadingMonth);

        decimal previousValue = previousReading?.CurrentReading ?? 0;

        // Validate current >= previous
        if (dto.CurrentReading < previousValue)
        {
            throw new InvalidOperationException("Chỉ số hiện tại không được nhỏ hơn chỉ số kỳ trước");
        }

        // Create reading
        var reading = new WaterMeterReading
        {
            RoomId = dto.RoomId,
            ReadingMonth = dto.ReadingMonth,
            PreviousReading = previousValue,
            CurrentReading = dto.CurrentReading,
            IsAnomaly = false,
            CreatedAt = DateTime.UtcNow
        };

        // Detect anomaly
        if (previousReading != null)
        {
            var consumption = dto.CurrentReading - previousValue;
            
            var recentReadings = await _waterMeterReadingRepository.GetByRoomAsync(dto.RoomId);
            if (recentReadings.Count >= 2)
            {
                var avgConsumption = recentReadings.Take(3)
                    .Where(r => r.ReadingMonth < dto.ReadingMonth)
                    .Average(r => r.CurrentReading - r.PreviousReading);

                if (avgConsumption > 0 && consumption > avgConsumption * AnomalyThreshold)
                {
                    reading.IsAnomaly = true;
                    reading.AnomalyNote = $"Tiêu thụ cao bất thường: {consumption:F2} m³ (trung bình: {avgConsumption:F2} m³)";
                }
            }
        }

        await _waterMeterReadingRepository.AddAsync(reading);
        await _waterMeterReadingRepository.SaveChangesAsync();

        return MapToDto(reading);
    }

    private WaterMeterReadingDto MapToDto(WaterMeterReading reading)
    {
        return new WaterMeterReadingDto
        {
            Id = reading.Id,
            RoomId = reading.RoomId,
            ReadingMonth = reading.ReadingMonth,
            PreviousReading = reading.PreviousReading,
            CurrentReading = reading.CurrentReading,
            ConsumptionM3 = reading.CurrentReading - reading.PreviousReading,
            IsAnomaly = reading.IsAnomaly,
            AnomalyNote = reading.AnomalyNote,
            CreatedAt = reading.CreatedAt
        };
    }
}
