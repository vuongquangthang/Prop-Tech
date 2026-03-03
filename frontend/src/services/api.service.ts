import { api, handleApiError } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';

// Types
export interface Building {
  id: number;
  buildingCode: string;
  buildingName: string;
  address?: string;
  totalFloors: number;
  description?: string;
}

export interface Floor {
  id: number;
  buildingId: number;
  floorCode: string;
  floorNumber: number;
  description?: string;
}

export interface Room {
  id: number;
  floorId: number;
  roomCode: string;
  roomNumber: string;
  area: number;
  monthlyRent: number;
  status: string;
  description?: string;
}

export interface Resident {
  id: number;
  fullName: string;
  phoneNumber?: string;
  idCardNumber?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  hometown?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface Contract {
  id: number;
  roomId: number;
  contractCode: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: string;
  terminatedDate?: string;
  notes?: string;
}

export interface Invoice {
  id: number;
  roomId: number;
  invoiceCode: string;
  month: number;
  year: number;
  totalAmount: number;
  status: string;
  createdDate: string;
  dueDate?: string;
  finalizedDate?: string;
}

export interface Payment {
  id: number;
  invoiceId?: number;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes?: string;
}

// Building Services
export const buildingService = {
  getAll: async () => {
    try {
      const response = await api.get<Building[]>(API_ENDPOINTS.BUILDINGS.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get<Building>(API_ENDPOINTS.BUILDINGS.BY_ID(id));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<Building, 'id'>) => {
    try {
      const response = await api.post<Building>(API_ENDPOINTS.BUILDINGS.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  update: async (id: number, data: Partial<Building>) => {
    try {
      const response = await api.put<Building>(API_ENDPOINTS.BUILDINGS.BY_ID(id), data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.BUILDINGS.BY_ID(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Floor Services
export const floorService = {
  getAll: async () => {
    try {
      const response = await api.get<Floor[]>(API_ENDPOINTS.FLOORS.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getByBuilding: async (buildingId: number) => {
    try {
      const response = await api.get<Floor[]>(API_ENDPOINTS.FLOORS.BY_BUILDING(buildingId));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<Floor, 'id'>) => {
    try {
      const response = await api.post<Floor>(API_ENDPOINTS.FLOORS.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  update: async (id: number, data: Partial<Floor>) => {
    try {
      const response = await api.put<Floor>(API_ENDPOINTS.FLOORS.BY_ID(id), data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.FLOORS.BY_ID(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Room Services
export const roomService = {
  getAll: async () => {
    try {
      const response = await api.get<Room[]>(API_ENDPOINTS.ROOMS.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getByFloor: async (floorId: number) => {
    try {
      const response = await api.get<Room[]>(API_ENDPOINTS.ROOMS.BY_FLOOR(floorId));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  search: async (keyword: string) => {
    try {
      const response = await api.get<Room[]>(`${API_ENDPOINTS.ROOMS.SEARCH}?keyword=${keyword}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<Room, 'id'>) => {
    try {
      const response = await api.post<Room>(API_ENDPOINTS.ROOMS.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  update: async (id: number, data: Partial<Room>) => {
    try {
      const response = await api.put<Room>(API_ENDPOINTS.ROOMS.BY_ID(id), data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.ROOMS.BY_ID(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Resident Services
export const residentService = {
  getAll: async () => {
    try {
      const response = await api.get<Resident[]>(API_ENDPOINTS.RESIDENTS.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  search: async (name: string) => {
    try {
      const response = await api.get<Resident[]>(`${API_ENDPOINTS.RESIDENTS.SEARCH}?name=${name}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<Resident, 'id'>) => {
    try {
      const response = await api.post<Resident>(API_ENDPOINTS.RESIDENTS.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  update: async (id: number, data: Partial<Resident>) => {
    try {
      const response = await api.put<Resident>(API_ENDPOINTS.RESIDENTS.BY_ID(id), data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  delete: async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.RESIDENTS.BY_ID(id));
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Contract Services
export const contractService = {
  getAll: async () => {
    try {
      const response = await api.get<Contract[]>(API_ENDPOINTS.CONTRACTS.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getActive: async () => {
    try {
      const response = await api.get<Contract[]>(API_ENDPOINTS.CONTRACTS.ACTIVE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getByRoom: async (roomId: number) => {
    try {
      const response = await api.get<Contract[]>(API_ENDPOINTS.CONTRACTS.BY_ROOM(roomId));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<Contract, 'id' | 'contractCode'>) => {
    try {
      const response = await api.post<Contract>(API_ENDPOINTS.CONTRACTS.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  extend: async (id: number, newEndDate: string) => {
    try {
      const response = await api.post<Contract>(API_ENDPOINTS.CONTRACTS.EXTEND(id), { newEndDate });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  terminate: async (id: number, terminatedDate: string, notes?: string) => {
    try {
      const response = await api.post<Contract>(API_ENDPOINTS.CONTRACTS.TERMINATE(id), { 
        terminatedDate, 
        notes 
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Invoice Services
export const invoiceService = {
  getAll: async () => {
    try {
      const response = await api.get<Invoice[]>(API_ENDPOINTS.INVOICES.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get<Invoice>(API_ENDPOINTS.INVOICES.BY_ID(id));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  generate: async (month: number, year: number, roomIds?: number[]) => {
    try {
      const response = await api.post<Invoice[]>(API_ENDPOINTS.INVOICES.GENERATE, {
        month,
        year,
        roomIds,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  finalize: async (id: number) => {
    try {
      const response = await api.post<Invoice>(API_ENDPOINTS.INVOICES.FINALIZE(id));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

// Payment Services
export const paymentService = {
  getAll: async () => {
    try {
      const response = await api.get<Payment[]>(API_ENDPOINTS.PAYMENTS.BASE);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  getByInvoice: async (invoiceId: number) => {
    try {
      const response = await api.get<Payment[]>(API_ENDPOINTS.PAYMENTS.BY_INVOICE(invoiceId));
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  create: async (data: Omit<Payment, 'id' | 'paidAt'>) => {
    try {
      const response = await api.post<Payment>(API_ENDPOINTS.PAYMENTS.BASE, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};
