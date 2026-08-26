import { Plus, Edit2, Trash2, Filter, X, AlertTriangle, Loader2, Home, Upload, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomService, floorService, serviceService } from '../../services/api.service';
import type { Floor } from '../../services/api.service';
import type { Service } from '../../services/api.service';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { API_CONFIG } from '../../lib/api-config';
import { fileService } from '../../services/feature.service';
import { FilterSelect } from '../ui/FilterSelect';
import { ImageViewer } from '../ui/ImageViewer';
import { MoneyInput } from '../ui/MoneyInput';
import { LocationPicker } from '../LocationPicker';
import type { ResolvedLocation } from '../../services/goongLocation.service';
import { useTablePagination } from '../../lib/useTablePagination';
import { TablePaginationBar } from '../ui/TablePaginationBar';

interface RoomData {
  id: number;
  floorId: number;
  buildingName?: string;
  buildingAddress?: string;
  buildingLatitude?: number | null;
  buildingLongitude?: number | null;
  floorNumber?: number;
  code: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  normalizedAddress?: string | null;
  goongPlaceId?: string | null;
  locationSource?: string | null;
  locationAccuracy?: string | null;
  manualScanRadiusMeters?: number | null;
  roomNumber: string;
  area: number;
  maxPeople: number;
  price: number;
  status: string;
  description?: string;
  type?: string;
  hasPrivateBathroom?: boolean;
  rooms?: {
    living?: number | null;
    bedroom?: number | null;
    kitchen?: number | null;
    bathroom?: number | null;
  };

  amenities?: string[];
  serviceIds?: number[];
  servicePrices?: { serviceId: number; price: number }[];
  imageUrls?: string[];
}

interface AssetOption {
  id: number;
  assetName: string;
  assetCode: string;
  totalRooms: number;
  totalQuantity: number;
  buildingId?: number | null;
  buildingName?: string | null;
  buildingIds?: number[];
  buildingNames?: string[];
}

const statusConfig = {
  empty: { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  'Trống': { label: 'Trống', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#A7F3D0' },
  rented: { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  'Đã thuê': { label: 'Đã thuê', bgColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FECACA' },
  maintenance: { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
  'Bảo trì': { label: 'Bảo trì', bgColor: '#FED7AA', textColor: '#9A3412', borderColor: '#FDBA74' },
};

const getStatusConfig = (status: string) => {
  return (statusConfig as any)[status] || statusConfig['Trống'];
};

const ROOM_IMAGE_LIMIT = 6;
const ROOM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const resolveRoomImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const appliesToBuilding = (
  item: { buildingId?: number | null; buildingIds?: number[] },
  buildingId?: number | null,
) => {
  if (!buildingId) return true;

  if (Array.isArray(item.buildingIds) && item.buildingIds.length > 0) {
    return item.buildingIds.includes(buildingId);
  }

  return item.buildingId === buildingId;
};

const normalizeServiceKeyPart = (value?: string) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

const getServiceMatchKey = (service: Service) => {
  const name = normalizeServiceKeyPart(service.name);
  const type = normalizeServiceKeyPart(service.serviceType);
  const unit = normalizeServiceKeyPart(service.unit);
  return `${name}__${type}__${unit}`;
};

const isCommonService = (service: Service) =>
  !service.buildingId && (!Array.isArray(service.buildingIds) || service.buildingIds.length === 0);

const normalizeService = (service: any): Service => {
  const buildingIds = Array.isArray(service.buildingIds)
    ? service.buildingIds
    : Array.isArray(service.toaNhaIds)
      ? service.toaNhaIds
      : [];

  return {
    ...service,
    id: service.id || service.dichVuId || 0,
    name: service.name || service.serviceName || service.tenDichVu || '',
    serviceType: service.serviceType || service.loaiDichVu || '',
    unit: service.unit || service.donVi || '',
    commonUnitPrice: service.currentUnitPrice ?? service.commonUnitPrice ?? service.unitPrice ?? service.donGia ?? 0,
    isActive: service.isActive !== false,
    buildingId: service.buildingId ?? service.toaNhaId ?? null,
    buildingName: service.buildingName ?? service.tenToaNha ?? null,
    buildingIds: buildingIds.map(Number).filter((id: number) => Number.isFinite(id) && id > 0),
  };
};

const isPrivateServiceForBuilding = (service: Service, buildingId?: number | null) => {
  if (!buildingId) return false;
  if (Array.isArray(service.buildingIds) && service.buildingIds.length > 0) {
    return service.buildingIds.includes(buildingId);
  }
  return service.buildingId === buildingId;
};

const getAvailableServicesForBuilding = (services: Service[], buildingId?: number | null) => {
  const activeServices = services.filter((service) => service.isActive !== false);

  if (!buildingId) {
    return [];
  }

  return activeServices.filter((service) => isPrivateServiceForBuilding(service, buildingId));
};

const getAutoSelectedServiceIds = (services: Service[], buildingId?: number | null) => {
  const privateKeys = new Set(
    services
      .filter((service) => isPrivateServiceForBuilding(service, buildingId))
      .map(getServiceMatchKey),
  );

  return normalizeExclusiveMeterServiceIds(services
    .filter((service) => !(isCommonService(service) && privateKeys.has(getServiceMatchKey(service))))
    .map((service) => service.id), services);
};

const getMeterServiceCategory = (service?: Service) => {
  if (!service) return null;
  const searchable = `${normalizeServiceKeyPart(service.serviceType)} ${normalizeServiceKeyPart(service.name)}`;
  if (searchable.includes('nuoc') || searchable.includes('water')) return 'water';
  if (searchable.includes('dien') || searchable.includes('electric')) return 'electricity';
  return null;
};

const normalizeExclusiveMeterServiceIds = (serviceIds: number[], services: Service[]) => {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const selectedCategories = new Set<string>();

  return serviceIds.filter((serviceId) => {
    const category = getMeterServiceCategory(serviceById.get(serviceId));
    if (!category) return true;
    if (selectedCategories.has(category)) return false;
    selectedCategories.add(category);
    return true;
  });
};

const toggleExclusiveMeterService = (
  serviceId: number,
  selectedIds: number[],
  services: Service[],
) => {
  if (selectedIds.includes(serviceId)) {
    return selectedIds.filter((id) => id !== serviceId);
  }

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const selectedCategory = getMeterServiceCategory(serviceById.get(serviceId));
  if (!selectedCategory) {
    return [...selectedIds, serviceId];
  }

  return [
    ...selectedIds.filter((id) => getMeterServiceCategory(serviceById.get(id)) !== selectedCategory),
    serviceId,
  ];
};

const uniqueAssetNames = (assets: AssetOption[]) => Array.from(new Set(assets.map((asset) => asset.assetName)));

interface RoomTableProps {
  selectedFloorId?: number | null;
  selectedBuildingId?: number | null;
  addRoomRequest?: { id: number; floorId: number } | null;
  structureRefreshKey?: number;
  onRoomsChange?: () => void;
  inlineForms?: boolean;
}

export function RoomTable({ selectedFloorId, selectedBuildingId, addRoomRequest, structureRefreshKey = 0, onRoomsChange, inlineForms = false }: RoomTableProps = {}) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [assetCatalog, setAssetCatalog] = useState<AssetOption[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addFloorId, setAddFloorId] = useState<number>(0);
  const [lockedAddFloorId, setLockedAddFloorId] = useState<number | null>(null);
  const [addRoomCode, setAddRoomCode] = useState('');
  const [addArea, setAddArea] = useState('');
  const [addMaxPeople, setAddMaxPeople] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addStatus, setAddStatus] = useState('Trống');
  const [addRoomType, setAddRoomType] = useState<'single' | 'apartment'>('single');
  const [addAddress, setAddAddress] = useState('');
  const [addHasPrivateBathroom, setAddHasPrivateBathroom] = useState(false);
  const [addLivingRoomCount, setAddLivingRoomCount] = useState('');
  const [addBedroomCount, setAddBedroomCount] = useState('');
  const [addKitchenCount, setAddKitchenCount] = useState('');
  const [addBathroomCount, setAddBathroomCount] = useState('');
  const [addAmenities, setAddAmenities] = useState<string[]>([]);
  const [addServiceIds, setAddServiceIds] = useState<number[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const [addImageFiles, setAddImageFiles] = useState<File[]>([]);
  const [addImageError, setAddImageError] = useState<string | null>(null);
  const [addDescription, setAddDescription] = useState<string>('');
  const [addFieldErrors, setAddFieldErrors] = useState<Record<string, string>>({});
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [serviceCatalog, setServiceCatalog] = useState<Service[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [editRoomCode, setEditRoomCode] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editMaxPeople, setEditMaxPeople] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('Trống');
  const [editRoomType, setEditRoomType] = useState<'single' | 'apartment'>('single');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editLocationMeta, setEditLocationMeta] = useState<ResolvedLocation | null>(null);
  const [editHasPrivateBathroom, setEditHasPrivateBathroom] = useState(false);
  const [editLivingRoomCount, setEditLivingRoomCount] = useState('');
  const [editBedroomCount, setEditBedroomCount] = useState('');
  const [editKitchenCount, setEditKitchenCount] = useState('');
  const [editBathroomCount, setEditBathroomCount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<(File | null)[]>([]);
  const [editImageError, setEditImageError] = useState<string | null>(null);
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editServiceIds, setEditServiceIds] = useState<number[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRoom, setDeleteRoom] = useState<RoomData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [blockedDeleteRoom, setBlockedDeleteRoom] = useState<RoomData | null>(null);
  const [detailRoom, setDetailRoom] = useState<RoomData | null>(null);
  const [previewImage, setPreviewImage] = useState<{ images: string[]; index: number; titlePrefix: string } | null>(null);

  const isRentedRoomStatus = (status: string) => {
    const s = (status || '').trim().toLowerCase();
    return s === 'rented' || s === 'da thue' || s === 'đã thuê';
  };

  useEffect(() => {
    fetchRooms();
    fetchFloors();
  }, [structureRefreshKey]);

  const normalizeRoom = (room: any): RoomData => ({
    id: room.id || room.phongId || 0,
    floorId: room.floorId || room.tangId || 0,
    buildingName: room.buildingName || '',
    buildingAddress: room.buildingAddress || room.building?.address || '',
    buildingLatitude: room.buildingLatitude ?? room.building?.latitude ?? null,
    buildingLongitude: room.buildingLongitude ?? room.building?.longitude ?? null,
    floorNumber: room.floorNumber || room.soTang || undefined,
    code: room.roomCode || room.maPhong || '',
    address: room.address || '',
    latitude: room.latitude ?? null,
    longitude: room.longitude ?? null,
    normalizedAddress: room.normalizedAddress ?? null,
    goongPlaceId: room.goongPlaceId ?? null,
    locationSource: room.locationSource ?? null,
    locationAccuracy: room.locationAccuracy ?? null,
    manualScanRadiusMeters: room.manualScanRadiusMeters ?? null,
    roomNumber: room.roomNumber || room.soPhong || '',
    area: room.area || room.dienTich || 0,
    maxPeople: room.maxOccupants || 0,
    price: room.defaultRentPrice || room.monthlyRent || room.giaThue || 0,
    status: room.status || room.trangThai || 'Trống',
    description: room.description || room.moTa || '',
    type: room.roomType || room.loaiPhong || room.type || 'single',
    hasPrivateBathroom: !!(room.hasPrivateBathroom ?? room.privateBathroom ?? false),
    rooms: room.rooms || {
      living: room.livingRoomCount ?? null,
      bedroom: room.bedroomCount ?? null,
      kitchen: room.kitchenCount ?? null,
      bathroom: room.bathroomCount ?? null,
    },
    amenities: room.amenities || [],
    serviceIds: room.serviceIds || [],
    servicePrices: room.servicePrices || [],
    imageUrls: Array.isArray(room.imageUrls)
      ? room.imageUrls.map((url: string) => resolveRoomImageUrl(url)).filter(Boolean)
      : [],
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomService.getAll();
      const roomData: RoomData[] = data.map(normalizeRoom);
      setRooms(roomData);
      setDetailRoom((current) => {
        if (!current) return current;
        return roomData.find((room) => room.id === current.id) ?? current;
      });
      return roomData;
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách phòng');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchFloors = async () => {
    try {
      const data = await floorService.getAll();
      setFloors(data);
    } catch {
      // floors not critical
    }
  };

  const fetchServiceCatalog = async () => {
    try {
      const services = (await serviceService.getAll()).map(normalizeService);
      setServiceCatalog(services);
      return services;
    } catch {
      setServiceCatalog([]);
      return [];
    }
  };

  const fetchAssetCatalog = async () => {
    try {
      const res = await api.get<AssetOption[]>(API_ENDPOINTS.ASSETS.BASE);
      setAssetCatalog(res.data);
      return res.data;
    } catch {
      setAssetCatalog([]);
      return [];
    }
  };

  const loadReferenceData = async () => {
    const [services, assets] = await Promise.all([fetchServiceCatalog(), fetchAssetCatalog()]);
    return { services, assets };
  };

  const buildingFloorIds = selectedBuildingId
    ? floors.filter(f => f.buildingId === selectedBuildingId).map(f => f.id)
    : null;

  const selectableFloors = selectedBuildingId
    ? floors.filter(f => f.buildingId === selectedBuildingId)
    : floors;

  const selectedAddFloor = floors.find(f => f.id === addFloorId);
  const selectedAddBuildingId = selectedAddFloor?.buildingId ?? null;
  const availableAddServices = getAvailableServicesForBuilding(serviceCatalog, selectedAddBuildingId);
  const availableAddAssets = assetCatalog.filter(
    asset => appliesToBuilding(asset, selectedAddBuildingId),
  );
  const selectedEditFloor = selectedRoom ? floors.find(f => f.id === selectedRoom.floorId) : undefined;
  const selectedEditBuildingId = selectedEditFloor?.buildingId ?? null;
  const availableEditServices = getAvailableServicesForBuilding(serviceCatalog, selectedEditBuildingId);
  const availableEditAssets = assetCatalog.filter(
    asset => appliesToBuilding(asset, selectedEditBuildingId),
  );
  const addLocationLabel = selectedAddFloor
    ? `Tầng ${selectedAddFloor.floorNumber} - ${selectedAddFloor.buildingName ? selectedAddFloor.buildingName : 'Tòa'}`
    : 'Chưa chọn tầng';

  const getFloorBuildingAddress = (floorId: number) => {
    const floor = floors.find(f => f.id === floorId);
    return floor?.buildingAddress
      || floor?.address
      || rooms.find(room => room.floorId === floorId)?.buildingAddress
      || '';
  };

  const handleAddFloorChange = (nextFloorId: number) => {
    const nextFloor = floors.find(f => f.id === nextFloorId);
    const nextBuildingId = nextFloor?.buildingId ?? null;
    const nextServices = getAvailableServicesForBuilding(serviceCatalog, nextBuildingId);
    const nextAssets = assetCatalog.filter(
      asset => appliesToBuilding(asset, nextBuildingId),
    );

    setAddFloorId(nextFloorId);
    setAddServiceIds(getAutoSelectedServiceIds(nextServices, nextBuildingId));
    setAddAmenities(uniqueAssetNames(nextAssets));
    const currentDefaultAddress = getFloorBuildingAddress(addFloorId).trim();
    const nextDefaultAddress = getFloorBuildingAddress(nextFloorId);
    if (!addAddress.trim() || addAddress.trim() === currentDefaultAddress) {
      setAddAddress(nextDefaultAddress);
    }
  };

  const filteredRooms = rooms
    .filter(room =>
      selectedFloorId != null ? room.floorId === selectedFloorId
      : buildingFloorIds != null ? buildingFloorIds.includes(room.floorId)
      : true
    )
    .filter(room => {
      if (filter === 'all') return true;
      const s = room.status.toLowerCase();
      if (filter === 'empty') return s === 'trống' || s === 'empty';
      if (filter === 'rented') return s === 'đã thuê' || s === 'rented';
      if (filter === 'maintenance') return s === 'bảo trì' || s === 'maintenance';
      return true;
    });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems,
  } = useTablePagination(filteredRooms, {
    initialPageSize: 10,
    resetDeps: [selectedFloorId, selectedBuildingId, filter],
  });

  const setIntegerField = (
    field: string,
    value: string,
    setter: (nextValue: string) => void,
  ) => {
    if (!/^\d*$/.test(value)) {
      setAddFieldErrors((current) => ({
        ...current,
        [field]: 'Sai định dạng. Vui lòng điền định dạng số nguyên',
      }));
      return;
    }

    setter(value);
    setAddFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleAddMaxPeopleChange = (value: string) => {
    if (!/^\d*$/.test(value)) {
      setAddFieldErrors((current) => ({
        ...current,
        maxPeople: 'Sai định dạng. Vui lòng điền định dạng số nguyên',
      }));
      return;
    }

    if (value !== '' && Number(value) < 1) {
      setAddFieldErrors((current) => ({
        ...current,
        maxPeople: 'Số người tối đa phải từ 1 trở lên',
      }));
      return;
    }

    setAddMaxPeople(value);
    setAddFieldErrors((current) => ({ ...current, maxPeople: '' }));
  };

  const setDecimalField = (
    field: string,
    value: string,
    setter: (nextValue: string) => void,
    maxDecimals = 2,
  ) => {
    const normalized = value.replace(',', '.');
    const decimalPattern = new RegExp(`^\\d*(?:\\.\\d{0,${maxDecimals}})?$`);
    if (!decimalPattern.test(normalized)) {
      setAddFieldErrors((current) => ({
        ...current,
        [field]: 'Sai định dạng. Vui lòng điền định dạng số',
      }));
      return;
    }

    setter(normalized);
    setAddFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const addPriceVnd = addPrice ? Math.round(Number(addPrice) * 1_000_000) : 0;

  const toggleAmenity = (amenity: string) => {
    setAddAmenities(prev => prev.includes(amenity) ? prev.filter(item => item !== amenity) : [...prev, amenity]);
  };

  const toggleService = (serviceId: number) => {
    setAddServiceIds((currentIds) =>
      toggleExclusiveMeterService(serviceId, currentIds, availableAddServices),
    );
  };

  const handleAddImageChange = (files?: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = Math.max(0, ROOM_IMAGE_LIMIT - addImageFiles.length);
    if (remaining === 0) {
      setAddImageError(`Chỉ được tải tối đa ${ROOM_IMAGE_LIMIT} ảnh cho một phòng`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remaining);
    const validFiles = selectedFiles.filter((file) => file.size <= ROOM_IMAGE_MAX_BYTES);
    const rejectedFiles = selectedFiles.filter((file) => file.size > ROOM_IMAGE_MAX_BYTES);

    if (files.length > remaining) {
      setAddImageError(
        addImageFiles.length === 0
          ? `Bạn đã chọn quá ${ROOM_IMAGE_LIMIT} ảnh. Hệ thống chỉ nhận ${ROOM_IMAGE_LIMIT} ảnh đầu tiên.`
          : `Bạn chỉ còn có thể thêm ${remaining} ảnh. Mỗi phòng tối đa ${ROOM_IMAGE_LIMIT} ảnh.`,
      );
    } else if (rejectedFiles.length > 0) {
      setAddImageError(`Một số ảnh vượt quá 5MB: ${rejectedFiles.map((file) => file.name).join(', ')}`);
    } else {
      setAddImageError(null);
    }

    if (validFiles.length === 0) return;

    const previewTasks = validFiles.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }));

    void Promise.all(previewTasks).then((previews) => {
      const validPreviews = previews.filter(Boolean);
      setAddImageFiles((current) => [...current, ...validFiles].slice(0, ROOM_IMAGE_LIMIT));
      setAddImagePreviews((current) => [...current, ...validPreviews].slice(0, ROOM_IMAGE_LIMIT));
    });
  };

  const removeAddImage = (index: number) => {
    setAddImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setAddImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleEditImageChange = (files?: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = Math.max(0, ROOM_IMAGE_LIMIT - editImagePreviews.length);
    if (remaining === 0) {
      setEditImageError(`Chỉ được tải tối đa ${ROOM_IMAGE_LIMIT} ảnh cho một phòng`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remaining);
    const validFiles = selectedFiles.filter((file) => file.size <= ROOM_IMAGE_MAX_BYTES);
    const rejectedFiles = selectedFiles.filter((file) => file.size > ROOM_IMAGE_MAX_BYTES);

    if (files.length > remaining) {
      setEditImageError(
        editImagePreviews.length === 0
          ? `Bạn đã chọn quá ${ROOM_IMAGE_LIMIT} ảnh. Hệ thống chỉ nhận ${ROOM_IMAGE_LIMIT} ảnh đầu tiên.`
          : `Bạn chỉ còn có thể thêm ${remaining} ảnh. Mỗi phòng tối đa ${ROOM_IMAGE_LIMIT} ảnh.`,
      );
    } else if (rejectedFiles.length > 0) {
      setEditImageError(`Một số ảnh vượt quá 5MB: ${rejectedFiles.map((file) => file.name).join(', ')}`);
    } else {
      setEditImageError(null);
    }

    if (validFiles.length === 0) return;

    const previewTasks = validFiles.map((file) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }));

    void Promise.all(previewTasks).then((previews) => {
      const validPreviews = previews.filter(Boolean);
      setEditImageFiles((current) => [...current, ...validFiles].slice(0, ROOM_IMAGE_LIMIT));
      setEditImagePreviews((current) => [...current, ...validPreviews].slice(0, ROOM_IMAGE_LIMIT));
    });
  };

  const removeEditImage = (index: number) => {
    setEditImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setEditImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };


    const openAddModal = async (preferredFloorId?: number) => {
    let services: Service[] = [];
    let assets: AssetOption[] = [];
    try {
      const [serviceData, assetRes] = await Promise.all([
        serviceService.getAll(),
        api.get<AssetOption[]>(API_ENDPOINTS.ASSETS.BASE),
      ]);
      services = serviceData.map(normalizeService);
      assets = assetRes.data ?? [];
      setServiceCatalog(services);
      setAssetCatalog(assets);
    } catch {
      setServiceCatalog([]);
      setAssetCatalog([]);
    }

    const defaultFloorId =
      (preferredFloorId != null && floors.some(f => f.id === preferredFloorId) ? preferredFloorId : null)
      ?? (selectedFloorId != null && selectableFloors.some(f => f.id === selectedFloorId) ? selectedFloorId : null)
      ?? selectableFloors[0]?.id
      ?? 0;
    const defaultFloor = floors.find(f => f.id === defaultFloorId);
    const defaultBuildingId = defaultFloor?.buildingId ?? null;
    const defaultServices = getAvailableServicesForBuilding(services, defaultBuildingId);
    const defaultAssets = assets.filter(asset => appliesToBuilding(asset, defaultBuildingId));

    setAddFloorId(defaultFloorId);
    setLockedAddFloorId(preferredFloorId != null && defaultFloorId === preferredFloorId ? preferredFloorId : null);
    setAddRoomCode('');
    setAddArea('');
    setAddMaxPeople('');
    setAddPrice('');
    setAddStatus('Trống');
    setAddRoomType('single');
    setAddAddress(getFloorBuildingAddress(defaultFloorId));
    setAddHasPrivateBathroom(false);
    setAddLivingRoomCount('');
    setAddBedroomCount('');
    setAddKitchenCount('');
    setAddBathroomCount('');
    setAddServiceIds(getAutoSelectedServiceIds(defaultServices, defaultBuildingId));
    setAddImagePreviews([]);
    setAddImageFiles([]);
    setAddImageError(null);
    setAddDescription('');
    setAddFieldErrors({});
    setAddError(null);
    setAddAmenities(uniqueAssetNames(defaultAssets));
    setShowAddModal(true);
  };

  useEffect(() => {
    if (!addRoomRequest) return;
    openAddModal(addRoomRequest.floorId);
  }, [addRoomRequest?.id]);

  const handleAddSubmit = async () => {
    if (Object.values(addFieldErrors).some(Boolean)) {
      setAddError('Vui lòng sửa các trường sai định dạng trước khi thêm phòng');
      return;
    }
    if (!addRoomCode.trim() || !addArea || !addPrice || !addMaxPeople) {
      setAddError('Vui lòng điền mã phòng, diện tích, số người tối đa và giá thuê');
      return;
    }
    const areaValue = Number(addArea);
    const maxPeopleValue = Number(addMaxPeople);
    const priceMillionsValue = Number(addPrice);
    const validationErrors: Record<string, string> = {};
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      validationErrors.area = 'Diện tích phải là số lớn hơn 0';
    }
    if (!Number.isInteger(maxPeopleValue) || maxPeopleValue < 1) {
      validationErrors.maxPeople = 'Số người tối đa phải là số nguyên từ 1 trở lên';
    }
    if (!Number.isFinite(priceMillionsValue) || priceMillionsValue <= 0) {
      validationErrors.price = 'Giá phòng phải là số lớn hơn 0';
    }
    if (Object.keys(validationErrors).length > 0) {
      setAddFieldErrors((current) => ({ ...current, ...validationErrors }));
      setAddError('Vui lòng kiểm tra lại các trường được cảnh báo');
      return;
    }
    if (!addFloorId) {
      setAddError('Vui lòng chọn tầng');
      return;
    }
    if (addRoomType === 'apartment' && (!addLivingRoomCount || !addBedroomCount || !addKitchenCount || !addBathroomCount)) {
      setAddError('Vui lòng điền đầy đủ số phòng khách, ngủ, bếp và vệ sinh');
      return;
    }
    setAddLoading(true); setAddError(null);
    try {
      const imageUrls = await Promise.all(addImageFiles.map((file) => fileService.upload(file)));

      await roomService.create({
        floorId: addFloorId,
        roomCode: addRoomCode.trim(),
        address: addAddress.trim() || undefined,
        area: areaValue,
        maxOccupants: maxPeopleValue,
        defaultRentPrice: addPriceVnd,
        status: addStatus,
        roomType: addRoomType,
        hasPrivateBathroom: addRoomType === 'single' ? addHasPrivateBathroom : false,
        livingRoomCount: addRoomType === 'apartment' ? parseInt(addLivingRoomCount, 10) : null,
        bedroomCount: addRoomType === 'apartment' ? parseInt(addBedroomCount, 10) : null,
        kitchenCount: addRoomType === 'apartment' ? parseInt(addKitchenCount, 10) : null,
        bathroomCount: addRoomType === 'apartment' ? parseInt(addBathroomCount, 10) : null,
        imageUrls,
        description: addDescription,
        amenities: addAmenities,
        serviceIds: addServiceIds,
        servicePrices: [],
      } as any);

      await fetchRooms();
      onRoomsChange?.();
      setShowAddModal(false);
    } catch (err: any) { setAddError(err.message || 'Có lỗi xảy ra'); }
    finally { setAddLoading(false); }
  };

  const openEditModal = async (room: RoomData) => {
    const [{ services }, latestRoom] = await Promise.all([
      loadReferenceData(),
      roomService.getById(room.id).catch(() => room),
    ]);
    const roomDetail = normalizeRoom(latestRoom);

    setSelectedRoom(roomDetail);
    setEditRoomCode(roomDetail.code);
    setEditArea(String(roomDetail.area));
    setEditMaxPeople(String(roomDetail.maxPeople || ''));
    setEditPrice(String(roomDetail.price));
    setEditStatus(roomDetail.status);
    setEditRoomType((roomDetail.type || 'single') as 'single' | 'apartment');
    setEditAddress(roomDetail.address || roomDetail.buildingAddress || '');
    setEditLatitude(roomDetail.latitude ?? null);
    setEditLongitude(roomDetail.longitude ?? null);
    setEditLocationMeta(null);
    setEditHasPrivateBathroom(!!roomDetail.hasPrivateBathroom);
    setEditLivingRoomCount(roomDetail.rooms?.living != null ? String(roomDetail.rooms.living) : '');
    setEditBedroomCount(roomDetail.rooms?.bedroom != null ? String(roomDetail.rooms.bedroom) : '');
    setEditKitchenCount(roomDetail.rooms?.kitchen != null ? String(roomDetail.rooms.kitchen) : '');
    setEditBathroomCount(roomDetail.rooms?.bathroom != null ? String(roomDetail.rooms.bathroom) : '');
    setEditDescription(roomDetail.description ?? '');
    const roomImagePreviews = (roomDetail.imageUrls ?? []).slice(0, ROOM_IMAGE_LIMIT).map((url) => resolveRoomImageUrl(url)).filter(Boolean);
    setEditImagePreviews(roomImagePreviews);
    setEditImageFiles(roomImagePreviews.map(() => null));
    setEditImageError(null);
    setEditAmenities(roomDetail.amenities ?? []);
    const roomBuildingId = floors.find(f => f.id === roomDetail.floorId)?.buildingId ?? null;
    const roomAvailableServices = getAvailableServicesForBuilding(services, roomBuildingId);
    setEditServiceIds(normalizeExclusiveMeterServiceIds(
      Array.from(new Set(roomDetail.serviceIds ?? [])),
      roomAvailableServices,
    ));
    setEditError(null);

    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedRoom || !editRoomCode.trim() || !editArea || !editPrice) { setEditError('Vui lòng điền đầy đủ thông tin'); return; }
    setEditLoading(true); setEditError(null);
    try {
      const maxPeopleValue = editMaxPeople ? parseInt(editMaxPeople, 10) : 0;
      const imageUrls: string[] = [];
      for (let index = 0; index < editImagePreviews.length; index++) {
        const file = editImageFiles[index];
        const preview = editImagePreviews[index];
        if (file) {
          imageUrls.push(await fileService.upload(file));
        } else if (preview) {
          imageUrls.push(preview);
        }
      }
      await roomService.update(selectedRoom.id, {
        roomCode: editRoomCode.trim(),
        address: editAddress.trim() || undefined,
        latitude: editLatitude ?? undefined,
        longitude: editLongitude ?? undefined,
        normalizedAddress: editLocationMeta?.address || editAddress.trim() || undefined,
        goongPlaceId: editLocationMeta?.placeId,
        locationSource: editLocationMeta?.source,
        locationAccuracy: editLocationMeta?.accuracy,
        manualScanRadiusMeters: editLocationMeta?.source === 'manual-nearby-scan' ? 5 : selectedRoom.manualScanRadiusMeters,
        area: parseFloat(editArea),
        maxOccupants: maxPeopleValue,
        defaultRentPrice: parseFloat(editPrice),
        status: editStatus,
        roomType: editRoomType,
        hasPrivateBathroom: editRoomType === 'single' ? editHasPrivateBathroom : false,
        livingRoomCount: editRoomType === 'apartment' ? parseInt(editLivingRoomCount, 10) : null,
        bedroomCount: editRoomType === 'apartment' ? parseInt(editBedroomCount, 10) : null,
        kitchenCount: editRoomType === 'apartment' ? parseInt(editKitchenCount, 10) : null,
        bathroomCount: editRoomType === 'apartment' ? parseInt(editBathroomCount, 10) : null,
        description: editDescription,
        imageUrls,
        amenities: editAmenities,
        serviceIds: editServiceIds,
      } as any);

      await fetchRooms();
      onRoomsChange?.();
      setShowEditModal(false);
    } catch (err: any) { setEditError(err.message || 'Có lỗi xảy ra'); }
    finally { setEditLoading(false); }
  };

  const openDeleteModal = (room: RoomData) => {
    if (isRentedRoomStatus(room.status)) {
      setBlockedDeleteRoom(room);
      setShowCannotDeleteModal(true);
      return;
    }

    setDeleteRoom(room); setDeleteError(null); setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteRoom) return;
    setDeleteLoading(true); setDeleteError(null);
    try {
      await roomService.delete(deleteRoom.id);
      await fetchRooms();
      onRoomsChange?.();
      setShowDeleteModal(false);
    } catch (err: any) { setDeleteError(err.message || 'Có lỗi xảy ra'); }
    finally { setDeleteLoading(false); }
  };

  const openDetailModal = async (room: RoomData) => {
    try {
      const latestRoom = await roomService.getById(room.id);
      setDetailRoom(normalizeRoom(latestRoom));
    } catch {
      setDetailRoom(rooms.find((item) => item.id === room.id) ?? room);
    }
    await loadReferenceData();
  };

  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải danh sách phòng...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button onClick={fetchRooms} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded">
      <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="table-section-title">
            {selectedFloorId
              ? (() => { const f = floors.find(fl => fl.id === selectedFloorId); return f ? `Tầng ${f.floorNumber}${f.buildingName ? ` - ${f.buildingName}` : ''} - ` : ''; })()
              : selectedBuildingId
              ? (() => { const f = floors.find(fl => fl.buildingId === selectedBuildingId); return f?.buildingName ? `${f.buildingName} - ` : ''; })()
              : ''}Danh sách phòng - {filteredRooms.length} phòng
          </h2>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <FilterSelect value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-1 text-sm bg-white focus:outline-none">
              <option value="all">Tất cả</option>
              <option value="empty">Trống</option>
              <option value="rented">Đã thuê</option>
              <option value="maintenance">Bảo trì</option>
            </FilterSelect>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => { void openAddModal(); }} className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700">
            <Plus size={16} /><span>Thêm Phòng</span>
          </button>
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Home size={48} className="text-gray-300" />
          <p className="text-gray-500">Không tìm thấy phòng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã phòng</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Diện tích (m²)</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Số người tối đa</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Giá thuê (VNĐ/tháng)</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600 sticky right-0 bg-gray-50">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map(room => {
                const cfg = getStatusConfig(room.status);
                return (
                  <tr
                    key={room.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => { void openDetailModal(room); }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <div className="font-semibold">{room.code || room.roomNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{room.area}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{room.maxPeople || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-right">{room.price.toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="admin-status-badge inline-block rounded px-3 py-1 text-xs font-semibold" style={{ backgroundColor: cfg.bgColor, color: cfg.textColor, border: `1px solid ${cfg.borderColor}` }}>{cfg.label}</span>
                    </td>
                    <td className="px-6 py-4 text-center sticky right-0 bg-white" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => { void openDetailModal(room); }} className="p-2 hover:bg-gray-100 rounded" title="Xem chi tiết"><Eye size={16} className="text-gray-600" /></button>
                        <button onClick={() => openEditModal(room)} className="p-2 hover:bg-gray-100 rounded" title="Sửa"><Edit2 size={16} className="text-gray-600" /></button>
                        <button onClick={() => openDeleteModal(room)} className="p-2 hover:bg-gray-100 rounded" title="Xóa"><Trash2 size={16} className="text-gray-600" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filteredRooms.length > 0 && (
        <TablePaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {showAddModal && (
        <div className={inlineForms ? "border border-[var(--brand-border)] bg-white shadow-sm" : "admin-content-modal-overlay"}>
          <div className={inlineForms ? "w-full bg-white" : "admin-content-modal-panel"}>
            <div className={`admin-content-modal-header flex items-center justify-between border-b border-gray-300 px-5 py-3 ${inlineForms ? 'bg-[var(--brand-surface)]' : ''}`}>
              <div className="flex items-center space-x-2">
                <Home size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Thêm Phòng mới</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vị trí:</strong> {addLocationLabel}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h4>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ảnh phòng</label>
                  <input
                    id="add-room-image"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleAddImageChange(e.target.files);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                  <RoomImageGrid
                    inputId="add-room-image"
                    previews={addImagePreviews}
                    onRemove={removeAddImage}
                    onPreview={(_, index) => {
                      setPreviewImage({ images: addImagePreviews, index, titlePrefix: 'Ảnh phòng' });
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">Đã chọn {addImagePreviews.length}/{ROOM_IMAGE_LIMIT} ảnh</p>
                    <p className="text-xs text-gray-500">Có thể chọn tối đa 6 ảnh cùng lúc. JPG, PNG, tối đa 5MB/ảnh.</p>
                  </div>
                  {addImageError && (
                    <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {addImageError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tầng *</label>
                  <select
                    value={addFloorId}
                    onChange={e => handleAddFloorChange(parseInt(e.target.value))}
                    disabled={lockedAddFloorId !== null}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700"
                  >
                    {selectableFloors.length === 0 ? <option value={0}>Chưa có tầng nào</option> : selectableFloors.map(f => <option key={f.id} value={f.id}>Tầng {f.floorNumber}{f.buildingName ? ` - ${f.buildingName}` : ''}</option>)}
                  </select>
                </div>

                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <label className="block text-sm text-gray-700 mb-2">Địa chỉ theo tòa nhà</label>
                  <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-gray-100 text-gray-700">
                    {selectedAddFloor?.buildingAddress || 'Chưa cập nhật địa chỉ tòa nhà'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                    <input
                      type="text"
                      placeholder="VD: A-109"
                      value={addRoomCode}
                      onChange={e => setAddRoomCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                    {addFieldErrors.area && (
                      <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.area}</p>
                    )}
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="VD: 45"
                      value={addArea}
                      onChange={(e) => setDecimalField('area', e.target.value, setAddArea)}
                      className={`w-full px-3 py-2 text-sm border rounded focus:outline-none ${addFieldErrors.area ? 'border-red-400' : 'border-gray-300 focus:border-gray-500'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số người tối đa *</label>
                    {addFieldErrors.maxPeople && (
                      <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.maxPeople}</p>
                    )}
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="VD: 4"
                      value={addMaxPeople}
                      onChange={(e) => handleAddMaxPeopleChange(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded focus:outline-none ${addFieldErrors.maxPeople ? 'border-red-400' : 'border-gray-300 focus:border-gray-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Loại phòng *</label>
                    <select
                      value={addRoomType}
                      onChange={(e) => setAddRoomType(e.target.value as 'single' | 'apartment')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
                    >
                      <option value="single">Phòng đơn</option>
                      <option value="apartment">Căn hộ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Giá phòng (triệu VNĐ/tháng) *</label>
                    {addFieldErrors.price && (
                      <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.price}</p>
                    )}
                    <div
                      className={`flex overflow-hidden rounded border bg-white ${addFieldErrors.price ? 'border-red-400' : 'border-gray-300 focus-within:border-gray-500'}`}
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="VD: 8.5"
                        value={addPrice}
                        onChange={(e) => setDecimalField('price', e.target.value, setAddPrice)}
                        className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm focus:outline-none"
                      />
                      <span className="flex items-center border-l border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
                        triệu/tháng
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      {addPriceVnd > 0
                        ? `Tương đương ${addPriceVnd.toLocaleString('vi-VN')} VNĐ/tháng`
                        : 'Ví dụ: nhập 8.5 cho giá 8.500.000 VNĐ/tháng'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tình trạng phòng *</label>
                    <select value={addStatus} onChange={e => setAddStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      <option value="Trống">Trống</option>
                      <option value="Đã thuê">Đã thuê</option>
                      <option value="Bảo trì">Bảo trì</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Chi tiết phòng</h4>
                {addRoomType === 'single' ? (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="private-bathroom" checked={addHasPrivateBathroom} onChange={(e) => setAddHasPrivateBathroom(e.target.checked)} className="w-4 h-4" />
                    <label htmlFor="private-bathroom" className="text-sm text-gray-700">Có vệ sinh khép kín</label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng khách *</label>
                      {addFieldErrors.livingRoom && <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.livingRoom}</p>}
                      <input type="text" inputMode="numeric" placeholder="VD: 1" value={addLivingRoomCount} onChange={(e) => setIntegerField('livingRoom', e.target.value, setAddLivingRoomCount)} className={`w-full px-3 py-2 text-sm border rounded focus:outline-none ${addFieldErrors.livingRoom ? 'border-red-400' : 'border-gray-300 focus:border-gray-500'}`} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng ngủ *</label>
                      {addFieldErrors.bedroom && <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.bedroom}</p>}
                      <input type="text" inputMode="numeric" placeholder="VD: 2" value={addBedroomCount} onChange={(e) => setIntegerField('bedroom', e.target.value, setAddBedroomCount)} className={`w-full px-3 py-2 text-sm border rounded focus:outline-none ${addFieldErrors.bedroom ? 'border-red-400' : 'border-gray-300 focus:border-gray-500'}`} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng bếp *</label>
                      {addFieldErrors.kitchen && <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.kitchen}</p>}
                      <input type="text" inputMode="numeric" placeholder="VD: 1" value={addKitchenCount} onChange={(e) => setIntegerField('kitchen', e.target.value, setAddKitchenCount)} className={`w-full px-3 py-2 text-sm border rounded focus:outline-none ${addFieldErrors.kitchen ? 'border-red-400' : 'border-gray-300 focus:border-gray-500'}`} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng vệ sinh *</label>
                      {addFieldErrors.bathroom && <p className="mb-1.5 text-xs text-red-600">{addFieldErrors.bathroom}</p>}
                      <input type="text" inputMode="numeric" placeholder="VD: 2" value={addBathroomCount} onChange={(e) => setIntegerField('bathroom', e.target.value, setAddBathroomCount)} className={`w-full px-3 py-2 text-sm border rounded focus:outline-none ${addFieldErrors.bathroom ? 'border-red-400' : 'border-gray-300 focus:border-gray-500'}`} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* <h4 className="text-base font-semibold text-gray-800 border-b pb-2"></h4> */}

                <div>
                  <label className="mb-2 block text-sm text-gray-700">Phí dịch vụ cơ bản</label>
                  <div className="max-h-40 overflow-x-hidden overflow-y-auto rounded border border-gray-200">
                    {availableAddServices.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500">Chưa có dịch vụ nào cho tòa này</div>
                    ) : (
                      <table className="!min-w-0 w-full table-fixed">
                        <colgroup>
                          <col style={{ width: '32px' }} />
                          <col style={{ width: '52%' }} />
                          <col />
                        </colgroup>
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            <th className="px-1 py-1.5 text-[11px] text-gray-600"></th>
                            <th className="px-2 py-1.5 text-[11px] text-gray-600" style={{ textAlign: 'left' }}>Tên dịch vụ</th>
                            <th className="px-2 py-1.5 text-[11px] text-gray-600" style={{ textAlign: 'right' }}>Giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableAddServices.map((service) => {
                            const selected = addServiceIds.includes(service.id);
                            const defaultPrice = Number(service.currentUnitPrice ?? service.commonUnitPrice ?? 0);
                            return (
                              <tr key={service.id} className="border-t border-gray-200">
                                <td className="px-1 py-1.5" style={{ textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    id={`service-${service.id}`}
                                    className="h-3.5 w-3.5"
                                    checked={selected}
                                    onChange={() => toggleService(service.id)}
                                  />
                                </td>
                                <td className="min-w-0 px-2 py-1.5" style={{ textAlign: 'left' }}>
                                  <label htmlFor={`service-${service.id}`} className="block cursor-pointer truncate text-xs text-gray-700">
                                    {service.name}
                                    {service.unit && <span className="ml-1 text-xs text-gray-500">/{service.unit}</span>}
                                  </label>
                                </td>
                                <td className="px-2 py-1.5" style={{ textAlign: 'right' }}>
                                  <span className="text-xs text-gray-700">
                                    {defaultPrice.toLocaleString('vi-VN')} VNĐ
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tiện nghi</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200">
                    {availableAddAssets.length === 0 ? (
                      <span className="text-xs text-gray-500">Chưa có tài sản nào cho tòa này</span>
                    ) : (
                      availableAddAssets.map((asset) => (
                        <div className="flex items-center space-x-2" key={asset.id}>
                          <input
                            type="checkbox"
                            id={`amenity-${asset.id}`}
                            className="w-4 h-4"
                            checked={addAmenities.includes(asset.assetName)}
                            onChange={() => toggleAmenity(asset.assetName)}
                          />
                          <label htmlFor={`amenity-${asset.id}`} className="text-sm text-gray-700">{asset.assetName}</label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mô tả</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả chi tiết về phòng..."
                    value={addDescription}
                    onChange={e => setAddDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                </div>

              {addError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{addError}</p>
              )}
            </div>

            <div className="admin-content-modal-footer flex items-center justify-end gap-3 border-t border-gray-300 px-5 py-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addLoading}
                className="building-detail-action-button"
              >
                <span
                  className="building-detail-action-inner text-gray-700"
                  style={{
                    borderColor: '#d1d5db',
                    borderRadius: 10,
                    clipPath: 'inset(0 round 10px)',
                    overflow: 'hidden',
                  }}
                >
                  Hủy
                </span>
              </button>
              <button onClick={handleAddSubmit} disabled={addLoading} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2">
                {addLoading && <Loader2 size={14} className="animate-spin" />}<span>Xác nhận thêm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRoom && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-full max-w-[760px] max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Chi tiết phòng - {detailRoom.code || detailRoom.roomNumber}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {(() => {
                    const floor = floors.find(item => item.id === detailRoom.floorId);
                    const buildingName = detailRoom.buildingName || floor?.buildingName || 'Chưa xác định tòa';
                    const floorNumber = detailRoom.floorNumber ?? floor?.floorNumber;
                    return [floorNumber ? `Tầng ${floorNumber}` : '', buildingName].filter(Boolean).join(' • ');
                  })()}
                </p>
              </div>
              <button onClick={() => setDetailRoom(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {(() => {
                const floor = floors.find(item => item.id === detailRoom.floorId);
                const buildingName = detailRoom.buildingName || floor?.buildingName || 'Chưa xác định tòa';
                const floorNumber = detailRoom.floorNumber ?? floor?.floorNumber;
                const locationParts = [
                  floorNumber ? `Tầng ${floorNumber}` : '',
                  buildingName,
                  detailRoom.address || detailRoom.buildingAddress || '',
                ].filter(Boolean);
                const isApartment = detailRoom.type === 'apartment';
                const selectedServiceIds = detailRoom.serviceIds ?? [];
                const selectedServices = selectedServiceIds.map((serviceId) => {
                  const service = serviceCatalog.find(item => item.id === serviceId);
                  const customPrice = detailRoom.servicePrices?.find(item => item.serviceId === serviceId)?.price;
                  return {
                    id: serviceId,
                    name: service?.name || `Dịch vụ #${serviceId}`,
                    unit: service?.unit,
                    price: getMeterServiceCategory(service)
                      ? service?.currentUnitPrice ?? service?.commonUnitPrice ?? 0
                      : customPrice ?? service?.currentUnitPrice ?? service?.commonUnitPrice ?? 0,
                  };
                });

                return (
                  <>
                    <div className="bg-blue-50 border border-blue-300 p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Vị trí:</strong> {locationParts.join(' • ') || 'Chưa có vị trí địa chỉ'}
                      </p>
                    </div>

                    <section className="space-y-4">
                      <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Mã phòng</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailRoom.code || detailRoom.roomNumber || '—'}</p>
                        </div>
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Loại phòng</p>
                          <p className="mt-1 font-semibold text-gray-900">{isApartment ? 'Căn hộ' : 'Phòng đơn'}</p>
                        </div>
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Diện tích</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailRoom.area || '—'} m²</p>
                        </div>
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Số người tối đa</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailRoom.maxPeople || '—'} người</p>
                        </div>
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Giá thuê</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailRoom.price.toLocaleString('vi-VN')} VNĐ/tháng</p>
                        </div>
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Trạng thái</p>
                          <p className="mt-1 font-semibold text-gray-900">{getStatusConfig(detailRoom.status).label}</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Chi tiết phòng</h4>
                      {isApartment ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Số phòng khách</p>
                            <p className="mt-1 font-semibold text-gray-900">{detailRoom.rooms?.living ?? '—'}</p>
                          </div>
                          <div className="border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Số phòng ngủ</p>
                            <p className="mt-1 font-semibold text-gray-900">{detailRoom.rooms?.bedroom ?? '—'}</p>
                          </div>
                          <div className="border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Số phòng bếp</p>
                            <p className="mt-1 font-semibold text-gray-900">{detailRoom.rooms?.kitchen ?? '—'}</p>
                          </div>
                          <div className="border border-gray-200 bg-gray-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Số phòng vệ sinh</p>
                            <p className="mt-1 font-semibold text-gray-900">{detailRoom.rooms?.bathroom ?? '—'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Vệ sinh khép kín</p>
                          <p className="mt-1 font-semibold text-gray-900">{detailRoom.hasPrivateBathroom ? 'Có' : 'Không'}</p>
                        </div>
                      )}
                    </section>

                    {(detailRoom.imageUrls ?? []).length > 0 && (
                      <section className="space-y-4">
                        <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Ảnh phòng</h4>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {(detailRoom.imageUrls ?? []).map((url, index) => (
                            <button
                              key={`${url}-${index}`}
                              type="button"
                              onClick={() => setPreviewImage({ images: detailRoom.imageUrls ?? [], index, titlePrefix: `Ảnh phòng ${detailRoom.code}` })}
                              className="h-24 w-24 shrink-0 overflow-hidden border border-gray-300 bg-white"
                              title="Xem ảnh"
                            >
                              <img src={resolveRoomImageUrl(url)} alt={`Ảnh phòng ${index + 1}`} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="space-y-4">
                      {/* <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Dịch vụ & Tiện nghi</h4> */}
                      <div>
                        <p className="mb-2 text-sm text-gray-700">Phí dịch vụ cơ bản</p>
                        {selectedServices.length > 0 ? (
                          <div className="overflow-hidden border border-gray-200">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                  <th className="px-3 py-2 text-left">Tên dịch vụ</th>
                                  <th className="px-3 py-2 text-right">Giá</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedServices.map((service) => (
                                  <tr key={service.id} className="border-t border-gray-200">
                                    <td className="px-3 py-2 font-medium text-gray-900">
                                      {service.name}{service.unit ? ` /${service.unit}` : ''}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-800">
                                      {service.price.toLocaleString('vi-VN')} VNĐ
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">Chưa chọn dịch vụ nào</p>
                        )}
                      </div>

                      <div>
                        <p className="mb-2 text-sm text-gray-700">Tiện nghi</p>
                        {(detailRoom.amenities ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-2 border border-gray-200 bg-gray-50 p-3">
                            {(detailRoom.amenities ?? []).map((amenity) => (
                              <span key={amenity} className="border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">Chưa có tiện nghi</p>
                        )}
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Mô tả</h4>
                      <p className="min-h-[72px] whitespace-pre-wrap border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                        {detailRoom.description?.trim() || 'Chưa có mô tả'}
                      </p>
                    </section>
                  </>
                );
              })()}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => { const room = detailRoom; setDetailRoom(null); openEditModal(room); }} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedRoom && (
        <div className={inlineForms ? "border border-[var(--brand-border)] bg-white shadow-sm" : "admin-content-modal-overlay"}>
          <div className={inlineForms ? "w-full bg-white" : "bg-white rounded-lg w-full max-w-[900px] max-h-[90vh] overflow-y-auto"}>
            <div className={`border-b border-gray-300 px-6 py-4 flex items-center justify-between ${inlineForms ? 'bg-[var(--brand-surface)]' : 'sticky top-0 bg-white z-10'}`}>
              <h3 className="text-lg text-gray-800">Chỉnh sửa Phòng - {selectedRoom.code}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800">
                  <strong>Vị trí:</strong> Tầng {floors.find(f => f.id === selectedRoom.floorId)?.floorNumber ?? selectedRoom.floorId}{floors.find(f => f.id === selectedRoom.floorId)?.buildingName ? ` • ${floors.find(f => f.id === selectedRoom.floorId)?.buildingName}` : ''}
                </p>
                {selectedRoom.buildingAddress && (
                  <p className="mt-1 text-sm text-blue-800">
                    <strong>Địa chỉ:</strong> {selectedRoom.buildingAddress}
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded border border-gray-200 bg-gray-50 p-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Địa chỉ &amp; vị trí (theo toà nhà)</label>
                  <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-gray-100 text-gray-700">
                    {selectedRoom.buildingAddress || 'Chưa cập nhật địa chỉ toà nhà'}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Vị trí phòng lấy theo toà nhà, không chỉnh sửa tại đây. Muốn đổi, hãy cập nhật ở phần quản lý toà nhà.</p>
                </div>
                <LocationPicker
                  readOnly
                  lat={selectedRoom.buildingLatitude ?? null}
                  lng={selectedRoom.buildingLongitude ?? null}
                  onChange={() => { /* read-only: vị trí theo toà nhà */ }}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h4>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Ảnh phòng</label>
                  <input
                    id="edit-room-image"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleEditImageChange(e.target.files);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                  <RoomImageGrid
                    inputId="edit-room-image"
                    previews={editImagePreviews}
                    onRemove={removeEditImage}
                    onPreview={(_, index) => {
                      setPreviewImage({ images: editImagePreviews, index, titlePrefix: 'Ảnh phòng' });
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">Đã chọn {editImagePreviews.length}/{ROOM_IMAGE_LIMIT} ảnh</p>
                    <p className="text-xs text-gray-500">Có thể chọn tối đa 6 ảnh cùng lúc. JPG, PNG, tối đa 5MB/ảnh.</p>
                  </div>
                  {editImageError && (
                    <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {editImageError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Mã phòng *</label>
                    <input type="text" value={editRoomCode} onChange={e => setEditRoomCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Diện tích (m²) *</label>
                    <input type="number" value={editArea} onChange={e => setEditArea(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số người tối đa *</label>
                    <input type="number" value={editMaxPeople} onChange={e => setEditMaxPeople(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Loại phòng *</label>
                    <select value={editRoomType} onChange={e => setEditRoomType(e.target.value as 'single' | 'apartment')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      <option value="single">Phòng đơn</option>
                      <option value="apartment">Căn hộ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Giá thuê (VNĐ/tháng) *</label>
                    <MoneyInput value={editPrice} onChange={setEditPrice} defaultScale="million" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Trạng thái *</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500">
                      <option value="Trống">Trống</option>
                      <option value="Đã thuê">Đã thuê</option>
                      <option value="Bảo trì">Bảo trì</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Chi tiết phòng</h4>
                {editRoomType === 'single' ? (
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="private-bathroom-edit" checked={editHasPrivateBathroom} onChange={(e) => setEditHasPrivateBathroom(e.target.checked)} className="w-4 h-4" />
                    <label htmlFor="private-bathroom-edit" className="text-sm text-gray-700">Có vệ sinh khép kín</label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng khách *</label>
                      <input type="number" min="0" value={editLivingRoomCount} onChange={e => setEditLivingRoomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng ngủ *</label>
                      <input type="number" min="0" value={editBedroomCount} onChange={e => setEditBedroomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng bếp *</label>
                      <input type="number" min="0" value={editKitchenCount} onChange={e => setEditKitchenCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Số phòng vệ sinh *</label>
                      <input type="number" min="0" value={editBathroomCount} onChange={e => setEditBathroomCount(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* <h4 className="text-base font-semibold text-gray-800 border-b pb-2">Dịch vụ & Tiện nghi</h4> */}

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Phí dịch vụ cơ bản</label>
                  <div className="max-h-40 overflow-x-hidden overflow-y-auto rounded border border-gray-200">
                    {availableEditServices.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500">Chưa có dịch vụ nào cho tòa này</div>
                    ) : (
                      <table className="!min-w-0 w-full table-fixed">
                        <colgroup>
                          <col style={{ width: '32px' }} />
                          <col style={{ width: '52%' }} />
                          <col />
                        </colgroup>
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            <th className="px-1 py-1.5 text-[11px] text-gray-600"></th>
                            <th className="px-2 py-1.5 text-[11px] text-gray-600" style={{ textAlign: 'left' }}>Tên dịch vụ</th>
                            <th className="px-2 py-1.5 text-[11px] text-gray-600" style={{ textAlign: 'right' }}>Giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableEditServices.map((service) => {
                            const selected = editServiceIds.includes(service.id);
                            const defaultPrice = Number(service.currentUnitPrice ?? service.commonUnitPrice ?? 0);
                            return (
                              <tr key={service.id} className="border-t border-gray-200">
                                <td className="px-1 py-1.5" style={{ textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    id={`edit-service-${service.id}`}
                                    className="h-3.5 w-3.5"
                                    checked={selected}
                                    onChange={() => setEditServiceIds((currentIds) =>
                                      toggleExclusiveMeterService(service.id, currentIds, availableEditServices),
                                    )}
                                  />
                                </td>
                                <td className="min-w-0 px-2 py-1.5" style={{ textAlign: 'left' }}>
                                  <label htmlFor={`edit-service-${service.id}`} className="block cursor-pointer truncate text-xs text-gray-700">
                                    {service.name}
                                    {service.unit && <span className="ml-1 text-xs text-gray-500">/{service.unit}</span>}
                                  </label>
                                </td>
                                <td className="px-2 py-1.5" style={{ textAlign: 'right' }}>
                                  <span className="text-xs text-gray-700">
                                    {defaultPrice.toLocaleString('vi-VN')} VNĐ
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tiện nghi</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200">
                    {availableEditAssets.length === 0 ? (
                      <span className="text-xs text-gray-500">Chưa có tài sản nào cho tòa này</span>
                    ) : (
                      availableEditAssets.map((asset) => (
                        <div className="flex items-center space-x-2" key={asset.id}>
                          <input
                            type="checkbox"
                            id={`edit-amenity-${asset.id}`}
                            className="w-4 h-4"
                            checked={editAmenities.includes(asset.assetName)}
                            onChange={() => setEditAmenities(prev => prev.includes(asset.assetName) ? prev.filter(item => item !== asset.assetName) : [...prev, asset.assetName])}
                          />
                          <label htmlFor={`edit-amenity-${asset.id}`} className="text-sm text-gray-700">{asset.assetName}</label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chi tiết về phòng..."
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{editError}</p>}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end gap-3 bg-white">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editLoading}
                className="building-detail-action-button"
              >
                <span
                  className="building-detail-action-inner text-gray-700"
                  style={{
                    borderColor: '#d1d5db',
                    borderRadius: 10,
                    clipPath: 'inset(0 round 10px)',
                    overflow: 'hidden',
                  }}
                >
                  Hủy
                </span>
              </button>
              <button onClick={handleEditSubmit} disabled={editLoading} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2">
                {editLoading && <Loader2 size={14} className="animate-spin" />}<span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <ImageViewer
          images={previewImage.images}
          initialIndex={previewImage.index}
          titlePrefix={previewImage.titlePrefix}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {showDeleteModal && deleteRoom && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa phòng này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-1">
                <p className="text-sm text-gray-600 mb-2">Thông tin phòng sẽ bị xóa:</p>
                <p className="text-sm text-gray-800"><strong>Mã phòng:</strong> {deleteRoom.code}</p>
                <p className="text-sm text-gray-800"><strong>Diện tích:</strong> {deleteRoom.area}m²</p>
                <p className="text-sm text-gray-800"><strong>Giá thuê:</strong> {deleteRoom.price.toLocaleString('vi-VN')} VNĐ/tháng</p>
              </div>
              {(deleteRoom.status === 'rented' || deleteRoom.status === 'Đã thuê') && (
                <div className="bg-orange-50 border border-orange-300 rounded p-4">
                  <p className="text-sm text-orange-800"><strong>⚠️ Phòng đang có hợp đồng thuê.</strong> Vui lòng tất toán hợp đồng trước khi xóa!</p>
                </div>
              )}
              {deleteError && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{deleteError}</p>}
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="building-detail-action-button"
              >
                <span
                  className="building-detail-action-inner text-gray-700"
                  style={{
                    borderColor: '#d1d5db',
                    borderRadius: 10,
                    clipPath: 'inset(0 round 10px)',
                    overflow: 'hidden',
                  }}
                >
                  Hủy
                </span>
              </button>
              <button onClick={handleDeleteSubmit} disabled={deleteLoading || deleteRoom.status === 'rented' || deleteRoom.status === 'Đã thuê'} className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2">
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}<span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCannotDeleteModal && blockedDeleteRoom && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Không thể xóa phòng</h3>
              <button onClick={() => setShowCannotDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-orange-50 border border-orange-300 rounded p-4">
                <AlertTriangle size={24} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-800 font-bold mb-1">Phòng đang ở trạng thái Đã thuê.</p>
                  <p className="text-sm text-orange-700">Bạn không thể xóa phòng này. Vui lòng tất toán hợp đồng và chuyển phòng về trạng thái Trống trước.</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-1">
                <p className="text-sm text-gray-800"><strong>Mã phòng:</strong> {blockedDeleteRoom.code}</p>
                <p className="text-sm text-gray-800"><strong>Trạng thái:</strong> {blockedDeleteRoom.status}</p>
              </div>
            </div>
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end">
              <button onClick={() => setShowCannotDeleteModal(false)} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">Đã hiểu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomImageGrid({
  inputId,
  previews,
  onRemove,
  onPreview,
}: {
  inputId: string;
  previews: string[];
  onRemove: (index: number) => void;
  onPreview: (src: string, index: number) => void;
}) {
  return (
    <div className="flex w-full items-start gap-3 overflow-x-auto pb-1">
      <label
        htmlFor={inputId}
        className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-gray-300 bg-gray-50 text-center transition-colors hover:border-gray-400 hover:bg-gray-100"
        title="Bấm để chọn ảnh phòng"
      >
        <Upload size={22} className="text-gray-400" />
        <span className="px-2 text-xs font-medium text-gray-500">Add room image</span>
      </label>

      {Array.from({ length: ROOM_IMAGE_LIMIT }).map((_, index) => {
        const preview = previews[index];

        if (preview) {
          return (
            <div key={`${preview}-${index}`} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => onPreview(preview, index)}
                className="block h-full w-full"
                title="Xem ảnh gốc"
              >
                <img src={preview} alt={`Ảnh phòng ${index + 1}`} className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-red-600 shadow hover:bg-red-50"
                title="Bỏ ảnh"
              >
                X
              </button>
            </div>
          );
        }

        return (
          <div
            key={`empty-${index}`}
            className="h-24 w-24 shrink-0 rounded border border-gray-300 bg-white"
            aria-label={`Ô ảnh phòng trống ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
