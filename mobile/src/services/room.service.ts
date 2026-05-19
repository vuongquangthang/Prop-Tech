import axios from 'axios';
import { API_BASE_URL } from './api.service';
import * as SecureStore from 'expo-secure-store';

export interface ElectricityTier {
  tierNumber: number;
  fromKwh: number;
  toKwh: number | null;
  pricePerKwh: number;
}

export interface ServiceInfo {
  serviceId: number;
  serviceName: string;
  price: number;
  unit: string;
}

export interface RoomAssetSummary {
  assetId: number;
  assetName: string;
  quantity: number;
  condition?: string | null;
}

export interface RoomDetail {
  id: number;
  roomCode: string;
  buildingName: string;
  floorNumber: number;
  area?: number | null;
  maxOccupants?: number | null;
  status?: string;
  assets?: RoomAssetSummary[];
}

export interface MyRoom {
  roomId: number;
  roomCode: string;
  area: number | null;
  maxOccupants?: number | null;
  amenities?: string[];
  status: string;
  
  buildingId: number;
  buildingName: string;
  buildingAddress: string;
  floorId: number;
  floorNumber: number;
  
  contractId: number;
  contractStartDate: string;
  contractEndDate: string | null;
  rentPrice: number;
  deposit: number;
  householdHeadName?: string;
  
  services: ServiceInfo[];
  
  electricityBasePrice: number | null;
  electricityTiers: ElectricityTier[];
  waterPricePerCubicMeter: number | null;
}

class RoomService {
  /**
   * Get auth headers for API requests
   */
  private async getAuthHeaders() {
    const token = await SecureStore.getItemAsync('access_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Lấy thông tin phòng của cư dân hiện tại
   */
  async getMyRoom(): Promise<MyRoom> {
    try {
      const response = await axios.get<MyRoom>(
        `${API_BASE_URL}/api/Rooms/my-room`,
        { headers: await this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy thông tin phòng');
      }
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin phòng');
    }
  }

  /**
   * Lấy chi tiết phòng theo ID (bao gồm tài sản)
   */
  async getRoomDetail(roomId: number): Promise<RoomDetail> {
    try {
      const response = await axios.get<RoomDetail>(
        `${API_BASE_URL}/api/Rooms/${roomId}`,
        { headers: await this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải chi tiết phòng');
    }
  }
}

export const roomService = new RoomService();

