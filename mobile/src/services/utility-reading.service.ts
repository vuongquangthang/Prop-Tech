import apiService from './api.service';

export interface RoomUtilityReading {
  roomId: number;
  roomCode: string;
  buildingName?: string | null;
  floorName?: string | null;
  residentName?: string | null;
  elecUsageDetailId?: number | null;
  oldElecReading?: number | null;
  newElecReading?: number | null;
  elecRecorded: boolean;
  elecIsAnomaly: boolean;
  elecAnomalyNote?: string | null;
  waterUsageDetailId?: number | null;
  oldWaterReading?: number | null;
  newWaterReading?: number | null;
  waterRecorded: boolean;
  waterIsAnomaly: boolean;
  waterAnomalyNote?: string | null;
}

export interface RecordUtilityReading {
  roomId: number;
  month: number;
  year: number;
  elecUsageDetailId?: number | null;
  waterUsageDetailId?: number | null;
  newElecReading?: number;
  newWaterReading?: number;
}

export interface BatchReadingResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

class UtilityReadingService {
  async getMonthReadings(year: number, month: number): Promise<RoomUtilityReading[]> {
    return apiService.get<RoomUtilityReading[]>(`/api/UtilityReadings/month/${year}/${month}`);
  }

  async recordBatch(readings: RecordUtilityReading[]): Promise<BatchReadingResult> {
    return apiService.post<BatchReadingResult>('/api/UtilityReadings/record-batch', readings);
  }
}

export const utilityReadingService = new UtilityReadingService();
