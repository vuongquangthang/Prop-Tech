import apiService from './api.service';

export interface ServiceInRoomDto {
  serviceId: number;
  serviceName: string;
  unit?: string | null;
  unitPrice?: number | null;
  isActive?: boolean;
}

class ServicesService {
  private baseUrl = '/api/Services';

  async getByRoom(roomId: number): Promise<ServiceInRoomDto[]> {
    return apiService.get<ServiceInRoomDto[]>(`${this.baseUrl}/room/${roomId}`);
  }
}

export const servicesService = new ServicesService();
