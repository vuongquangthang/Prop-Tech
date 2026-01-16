using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IMeterReadingRepository : IRepository<MeterReading>
{
    Task<MeterReading?> GetByRoomAndMonthAsync(long roomId, DateTime readingMonth);
    Task<List<MeterReading>> GetByRoomAsync(long roomId);
    Task<MeterReading?> GetPreviousReadingAsync(long roomId, DateTime readingMonth);
}

public class MeterReadingRepository : Repository<MeterReading>, IMeterReadingRepository
{
    public MeterReadingRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<MeterReading?> GetByRoomAndMonthAsync(long roomId, DateTime readingMonth)
    {
        return await _context.MeterReadings
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.ReadingMonth == readingMonth);
    }

    public async Task<List<MeterReading>> GetByRoomAsync(long roomId)
    {
        return await _context.MeterReadings
            .Where(m => m.RoomId == roomId)
            .OrderByDescending(m => m.ReadingMonth)
            .ToListAsync();
    }

    public async Task<MeterReading?> GetPreviousReadingAsync(long roomId, DateTime readingMonth)
    {
        return await _context.MeterReadings
            .Where(m => m.RoomId == roomId && m.ReadingMonth < readingMonth)
            .OrderByDescending(m => m.ReadingMonth)
            .FirstOrDefaultAsync();
    }
}

public interface IWaterMeterReadingRepository : IRepository<WaterMeterReading>
{
    Task<WaterMeterReading?> GetByRoomAndMonthAsync(long roomId, DateTime readingMonth);
    Task<List<WaterMeterReading>> GetByRoomAsync(long roomId);
    Task<WaterMeterReading?> GetPreviousReadingAsync(long roomId, DateTime readingMonth);
}

public class WaterMeterReadingRepository : Repository<WaterMeterReading>, IWaterMeterReadingRepository
{
    public WaterMeterReadingRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<WaterMeterReading?> GetByRoomAndMonthAsync(long roomId, DateTime readingMonth)
    {
        return await _context.WaterMeterReadings
            .FirstOrDefaultAsync(m => m.RoomId == roomId && m.ReadingMonth == readingMonth);
    }

    public async Task<List<WaterMeterReading>> GetByRoomAsync(long roomId)
    {
        return await _context.WaterMeterReadings
            .Where(m => m.RoomId == roomId)
            .OrderByDescending(m => m.ReadingMonth)
            .ToListAsync();
    }

    public async Task<WaterMeterReading?> GetPreviousReadingAsync(long roomId, DateTime readingMonth)
    {
        return await _context.WaterMeterReadings
            .Where(m => m.RoomId == roomId && m.ReadingMonth < readingMonth)
            .OrderByDescending(m => m.ReadingMonth)
            .FirstOrDefaultAsync();
    }
}
