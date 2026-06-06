import { ArrowLeft, Check, Edit2, Image as ImageIcon, Megaphone, X } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { postService, type RoomOption, type PostRecord, type PostServiceLineItem } from '../services/postService';
import { serviceService } from '../services/api.service';
import { api } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';
import { API_CONFIG } from '../lib/api-config';
import { useAuth } from '../contexts/AuthContext';

interface AssetOption {
  id: number;
  assetName: string;
  assetCode: string;
}

const POST_IMAGE_LIMIT = 6;
type RoomStatusFilter = 'all' | 'empty' | 'rented';

const resolveImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [existingPosts, setExistingPosts] = useState<PostRecord[]>([]);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const location = useLocation();
  const [moveInType, setMoveInType] = useState<'immediate' | 'from-date'>('immediate');
  const [moveInDateInput, setMoveInDateInput] = useState<string>('');
  const [floodProne, setFloodProne] = useState<'yes' | 'no'>('no');
  const [contactType, setContactType] = useState<'current' | 'other'>('current');
  const [title, setTitle] = useState<string>('');
  const [landlordRequirementsInput, setLandlordRequirementsInput] = useState<string>('');
  const [contactNameInput, setContactNameInput] = useState<string>('');
  const [contactPhoneInput, setContactPhoneInput] = useState<string>('');
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null);
  const [servicePrices, setServicePrices] = useState<{ [key: string]: string }>({});
  const [localServices, setLocalServices] = useState<any[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<PostServiceLineItem[]>([]);
  const [assetCatalog, setAssetCatalog] = useState<AssetOption[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [postPreviewImage, setPostPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [showPostFormModal, setShowPostFormModal] = useState(false);
  const [roomStatusFilter, setRoomStatusFilter] = useState<RoomStatusFilter>('all');

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  const getRoomLocation = (room: RoomOption | any) => {
    const buildingName = room?.buildingName ?? room?.building ?? 'Chưa xác định';
    const floorNumber = room?.floorNumber ?? room?.floor;
    return floorNumber ? `${buildingName} - Tầng ${floorNumber}` : buildingName;
  };
  const getRoomRentText = (room: RoomOption | any) => {
    const rent = room?.defaultRentPrice ?? room?.price;
    if (rent === null || rent === undefined || rent === '') return '—';
    const numericRent = Number(rent);
    return Number.isFinite(numericRent)
      ? `${numericRent.toLocaleString('vi-VN')} VNĐ/tháng`
      : `${rent} VNĐ/tháng`;
  };
  const normalizeRoomStatus = (status?: string) => String(status ?? '').trim().toLowerCase();
  const isAvailableRoom = (room: RoomOption | any) => {
    const status = normalizeRoomStatus(room?.status);
    return status === 'trống' || status === 'trong' || status === 'available' || status === 'empty' || status === 'vacant';
  };
  const isRentedRoom = (room: RoomOption | any) => {
    const status = normalizeRoomStatus(room?.status);
    return status === 'đã thuê' || status === 'da thue' || status === 'rented' || status === 'occupied';
  };
  const getRoomStatusLabel = (room: RoomOption | any) => {
    if (isAvailableRoom(room)) return 'Trống';
    if (isRentedRoom(room)) return 'Đã thuê';
    return room?.status || 'Không rõ';
  };
  const getRoomStatusBadgeClass = (room: RoomOption | any) => {
    if (isAvailableRoom(room)) return 'bg-green-100 text-green-800';
    if (isRentedRoom(room)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-700';
  };
  const currentAccountName = user?.displayName || user?.fullName || user?.residentName || user?.phoneNumber || '';
  const currentAccountPhone = user?.phoneNumber || '';
  const currentAccountLabel = currentAccountName && currentAccountPhone
    ? `${currentAccountName} - ${currentAccountPhone}`
    : currentAccountName || currentAccountPhone || 'Chua co thong tin tai khoan';
  const selectedRoomType = String((selectedRoom as any)?.type ?? 'single');
  const isEditing = editingPostId !== null;
  const availableCatalogServices = serviceCatalog.filter((catalogItem) =>
    !localServices.some((service) => String(service.key ?? '').toLowerCase() === String(catalogItem.key).toLowerCase())
  );
  const availableAssetAmenities = assetCatalog.filter((asset) => !selectedAmenities.includes(asset.assetName));
  const postedRoomIds = useMemo(() => {
    return new Set(
      existingPosts
        .map((post) => Number(post.roomId))
        .filter((roomId) => Number.isFinite(roomId) && roomId > 0)
    );
  }, [existingPosts]);
  const roomsWithoutPosts = useMemo(() => {
    return rooms.filter((room) => !postedRoomIds.has(Number(room.id)));
  }, [rooms, postedRoomIds]);
  const roomFilterCounts = useMemo(() => ({
    all: roomsWithoutPosts.length,
    empty: roomsWithoutPosts.filter(isAvailableRoom).length,
    rented: roomsWithoutPosts.filter(isRentedRoom).length,
  }), [roomsWithoutPosts]);
  const availableRoomsForNewPost = useMemo(() => {
    if (roomStatusFilter === 'empty') return roomsWithoutPosts.filter(isAvailableRoom);
    if (roomStatusFilter === 'rented') return roomsWithoutPosts.filter(isRentedRoom);
    return roomsWithoutPosts;
  }, [roomsWithoutPosts, roomStatusFilter]);
  const roomStatusFilterOptions: { value: RoomStatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'Tất cả', count: roomFilterCounts.all },
    { value: 'empty', label: 'Phòng trống', count: roomFilterCounts.empty },
    { value: 'rented', label: 'Đã thuê', count: roomFilterCounts.rented },
  ];

  const closePostFormModal = () => {
    if (isEditing) {
      navigate('/post-management');
    } else {
      setShowPostFormModal(false);
    }
  };

  // Normalize services for the selected room and initialize servicePrices so prices show immediately
  useEffect(() => {
    if (!selectedRoom) return;
    // use normalized services from room as the standard source
    let svcList = Array.isArray(selectedRoom.services) ? selectedRoom.services : [];
    if (svcList.length === 0 && selectedRoomId) {
      const existing = existingPosts.find((p) => Number(p.roomId) === Number(selectedRoomId));
      if (existing && Array.isArray(existing.servicePrices) && existing.servicePrices.length > 0) {
        svcList = existing.servicePrices;
      }
    }

    setLocalServices((Array.isArray(svcList) ? svcList : []).map((s: any) => ({ ...s })));

    setServicePrices((prev) => {
      const next = { ...prev };
      (Array.isArray(svcList) ? svcList : []).forEach((s: any, idx: number) => {
        const key = `${selectedRoomId}-${idx}`;
        if (!(key in next)) {
          next[key] = s?.price ?? s?.unitPrice ?? s?.amount ?? '';
        }
      });
      return next;
    });
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom || isEditing) return;
    setSelectedAmenities(Array.isArray(selectedRoom.amenities) ? selectedRoom.amenities : []);
  }, [selectedRoomId, isEditing]);

  useEffect(() => {
    void (async () => {
      try {
        const [list, posts, catalog, assetsResp] = await Promise.all([
          postService.getRooms(),
          postService.getPosts(),
          serviceService.getAll().catch(() => []),
          api.get<any[]>(API_ENDPOINTS.ASSETS.BASE).catch(() => ({ data: [] })),
        ]);
        setRooms(list);
        setExistingPosts(posts);

        const normalizedCatalog: PostServiceLineItem[] = (Array.isArray(catalog) ? catalog : []).map((service: any, index: number) => ({
          key: String(service.id ?? service.serviceId ?? `catalog-${index}`),
          name: service.name ?? service.serviceName ?? service.tenDichVu ?? 'Dịch vụ',
          unit: service.unit ?? service.donVi ?? '',
          price: Number(service.commonUnitPrice ?? service.unitPrice ?? service.donGia ?? 0),
        }));
        setServiceCatalog(normalizedCatalog);

        const normalizedAssets: AssetOption[] = (Array.isArray(assetsResp.data) ? assetsResp.data : []).map((asset: any) => ({
          id: Number(asset.id ?? 0),
          assetName: String(asset.assetName ?? asset.name ?? 'Tài sản'),
          assetCode: String(asset.assetCode ?? ''),
        }));
        setAssetCatalog(normalizedAssets);
      } catch {
        // keep fallback empty
      }
    })();
  }, []);

  const handleAddServiceFromCatalog = (serviceKey: string) => {
    const selectedService = serviceCatalog.find((item) => item.key === serviceKey);
    if (!selectedService) return;
    if (localServices.some((service) => String(service.key ?? '').toLowerCase() === String(selectedService.key).toLowerCase())) {
      toast.error('Dịch vụ này đã có trong danh sách');
      return;
    }

    setLocalServices((prev) => [...prev, { ...selectedService }]);
  };

  const handleAddAmenityFromAssets = (assetId: number) => {
    const asset = assetCatalog.find((item) => item.id === assetId);
    if (!asset) return;
    if (selectedAmenities.includes(asset.assetName)) {
      toast.error('Tiện ích này đã có trong danh sách');
      return;
    }

    setSelectedAmenities((prev) => [...prev, asset.assetName]);
  };

  const handleRemoveAmenity = (name: string) => {
    setSelectedAmenities((prev) => prev.filter((item) => item !== name));
  };

  const handleRemoveService = (index: number) => {
    setLocalServices((prev) => prev.filter((_, i) => i !== index));
    setServicePrices((prev) => {
      const next = { ...prev };
      delete next[`${selectedRoomId}-${index}`];
      return next;
    });
    if (editingServiceIndex === index) {
      setEditingServiceIndex(null);
    }
  };

  // If URL has ?edit=ID then prefill form for editing
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const edit = qs.get('edit');
    if (!edit) return;
    const id = Number(edit);
    if (Number.isNaN(id)) return;
    // if posts already loaded, find it; otherwise fetch
    (async () => {
      try {
        let post = existingPosts.find((p) => p.id === id) ?? null;
        if (!post) {
          const posts = await postService.getPosts();
          post = posts.find((p) => p.id === id) ?? null;
        }
        if (!post) return;
        setEditingPostId(post.id);
        setSelectedRoomId(post.roomId);
        setShowPostFormModal(true);
        setTitle(post.title ?? '');
        setMoveInType(post.moveInType ?? 'immediate');
        setMoveInDateInput(post.moveInDate ?? '');
        setFloodProne(post.floodProne ? 'yes' : 'no');
        setContactType(post.contactType ?? 'current');
        setLandlordRequirementsInput(post.landlordRequirements ?? '');
        setContactNameInput(post.contactName ?? '');
        setContactPhoneInput(post.contactPhone ?? '');
        setSelectedAmenities(Array.isArray(post.amenities) ? post.amenities : []);
        // initialize services and prices
        const svc = Array.isArray(post.servicePrices) ? post.servicePrices : [];
        setLocalServices(svc.map((s) => ({ ...s })));
        setServicePrices((prev) => {
          const next = { ...prev };
          svc.forEach((s: any, idx: number) => {
            next[`${post.roomId}-${idx}`] = s.price?.toString() ?? '';
          });
          return next;
        });
        // initialize image previews
        if (Array.isArray(post.imageUrls) && post.imageUrls.length) {
          const previews = post.imageUrls.slice(0, POST_IMAGE_LIMIT);
          setImagePreviews(previews);
          setImageFiles(previews.map(() => null));
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, existingPosts]);

  const handleServicePriceEdit = (index: number, currentPrice: string) => {
    setEditingServiceIndex(index);
    if (!servicePrices[`${selectedRoomId}-${index}`]) {
      setServicePrices({ ...servicePrices, [`${selectedRoomId}-${index}`]: currentPrice });
    }
  };

  const handleServicePriceChange = (index: number, value: string) => {
    setServicePrices({ ...servicePrices, [`${selectedRoomId}-${index}`]: value });
  };

  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (incomingFiles.length === 0) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    const remaining = Math.max(0, POST_IMAGE_LIMIT - imagePreviews.length);
    if (remaining <= 0) {
      toast.error(`Bạn chỉ được tải tối đa ${POST_IMAGE_LIMIT} ảnh`);
      return;
    }
    if (incomingFiles.length > remaining) {
      toast.info(`Chỉ thêm ${remaining} ảnh còn lại. Mỗi bài đăng tối đa ${POST_IMAGE_LIMIT} ảnh.`);
    }
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB client-side limit
    const arr = incomingFiles.slice(0, remaining);
    const allowed: File[] = [];
    const rejected: string[] = [];
    for (const f of arr) {
      if (f.size > MAX_BYTES) {
        rejected.push(`${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        allowed.push(f);
      }
    }
    if (rejected.length) {
      toast.error(`Một số file bị bỏ: ${rejected.join(', ')} — kích thước vượt 5MB`);
    }
    const readers = allowed.map((f) => new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => res('');
      r.readAsDataURL(f);
    }));
    void Promise.all(readers).then((results) => {
      const good = results.filter(Boolean);
      setImagePreviews((prev) => {
        const next = [...prev, ...good].slice(0, POST_IMAGE_LIMIT);
        return next;
      });
      setImageFiles((prev) => {
        const next = [...prev, ...allowed].slice(0, POST_IMAGE_LIMIT);
        return next;
      });
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      handleFilesSelected(droppedFiles);
      return;
    }
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServicePriceSave = () => {
    setEditingServiceIndex(null);
  };

  const getServicePrice = (index: number, defaultPrice: string) => {
    return servicePrices[`${selectedRoomId}-${index}`] || defaultPrice;
  };

  const handleSubmit = () => {
    if (!selectedRoom) return;

    const contactName = contactType === 'current' ? currentAccountName : contactNameInput;
    const contactPhone = contactType === 'current' ? currentAccountPhone : contactPhoneInput;

    if (!title || title.trim().length === 0) {
      toast.error('Vui lòng nhập tiêu đề bài đăng');
      return;
    }

    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error('Vui long nhap du thong tin lien he');
      return;
    }

    const servicePricesPayload = localServices.map((s, i) => ({
      key: s.key ?? `s-${i}`,
      name: s.name ?? s.serviceName ?? 'Dịch vụ',
      unit: s.unit ?? '',
      price: Number(servicePrices[`${selectedRoomId}-${i}`] ?? s.price ?? 0),
    }));

    const payload = {
      roomId: selectedRoom.id,
      title: title.trim(),
      baseRentPrice: Number(selectedRoom.defaultRentPrice ?? 0),
      moveInType,
      moveInDate: moveInType === 'from-date' ? moveInDateInput : undefined,
      floodProne: floodProne === 'yes',
      landlordRequirements: landlordRequirementsInput,
      contactType,
      contactName,
      contactPhone,
      servicePrices: servicePricesPayload,
      amenities: selectedAmenities,
      imageUrls: imagePreviews,
    };

    // Upload any new files to server (api/file/upload) and replace previews with returned URLs
    void (async () => {
      try {
        const finalUrls: string[] = [];

        // helper to upload a single File with retries and server error parsing
        async function uploadFile(f: File) {
          const MAX_BYTES = 5 * 1024 * 1024; // client-side safeguard
          if (f.size > MAX_BYTES) throw new Error(`Kích thước file ${f.name} vượt quá giới hạn 5MB`);

          const form = new FormData();
          form.append('file', f);
          const token = localStorage.getItem('token');

          const maxAttempts = 3;
          let attempt = 0;
          let lastErr: any = null;
          while (attempt < maxAttempts) {
            attempt++;
            try {
              const res = await fetch('/api/file/upload', {
                method: 'POST',
                body: form,
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });
              if (!res.ok) {
                // try parse server message
                let bodyText = '';
                try { const json = await res.json(); bodyText = json?.message || JSON.stringify(json); } catch(e) { bodyText = await res.text().catch(()=>res.statusText); }
                if (res.status === 413) throw new Error(`File quá lớn (server): ${bodyText}`);
                throw new Error(`Upload failed: ${bodyText || res.statusText} (status ${res.status})`);
              }
              const data = await res.json();
              return data.url as string;
            } catch (err) {
              lastErr = err;
              // exponential backoff before retrying
              if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
            }
          }
          throw lastErr ?? new Error('Upload failed after retries');
        }

        // Convert dataURL preview to File if no File exists for that preview
        function dataUrlToFile(dataurl: string, filename = 'upload.png') {
          const arr = dataurl.split(',');
          const mimeMatch = arr[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new File([u8arr], filename, { type: mime });
        }

        for (let i = 0; i < imagePreviews.length; i++) {
          const file = imageFiles[i];
          const preview = imagePreviews[i];
          if (file) {
            const url = await uploadFile(file);
            finalUrls.push(url);
          } else if (preview && preview.startsWith('data:')) {
            // convert data URL to file and upload
            const f = dataUrlToFile(preview, `img-${Date.now()}.png`);
            const url = await uploadFile(f);
            finalUrls.push(url);
          } else if (preview) {
            // already a URL (server-side or external)
            finalUrls.push(preview);
          }
        }

        const finalPayload = { ...payload, imageUrls: finalUrls };

        if (isEditing && editingPostId) {
          await postService.updatePost(editingPostId, finalPayload as any);
          toast.success('Đã lưu thay đổi');
        } else {
          await postService.createPost(finalPayload as any);
          toast.success('Đã đăng bài');
        }
        navigate('/post-management', { state: { refresh: Date.now() } });
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message || (isEditing ? 'Không thể lưu thay đổi' : 'Không thể đăng bài'));
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center space-x-4">
        <button onClick={() => navigate('/post-management')} className="rounded p-2 hover:bg-gray-200">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-800">{isEditing ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng mới'}</h1>
          <p className="text-sm text-gray-600">{isEditing ? 'Cập nhật thông tin bài đăng' : 'Đăng tin tìm người thuê phòng'}</p>
        </div>
      </div>

      <div className="max-w-5xl rounded border-2 border-gray-300 bg-white">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {!isEditing ? (
              <>
                <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between">
                  <h4 className="text-base font-semibold text-gray-800">Chọn phòng muốn đăng</h4>
                  <div className="inline-flex w-fit rounded border border-gray-300 bg-gray-50 p-1">
                    {roomStatusFilterOptions.map((option) => {
                      const active = roomStatusFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRoomStatusFilter(option.value)}
                          className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
                            active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:bg-white hover:text-gray-900'
                          }`}
                        >
                          {option.label} ({option.count})
                        </button>
                      );
                    })}
                  </div>
                </div>
                {availableRoomsForNewPost.length === 0 ? (
                  <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Không có phòng phù hợp với bộ lọc hiện tại.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {availableRoomsForNewPost.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setShowPostFormModal(true);
                        }}
                        className={`cursor-pointer rounded border-2 p-4 transition-all ${
                          selectedRoomId === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-start space-x-3">
                            <div
                              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 ${
                                selectedRoomId === room.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                              }`}
                            >
                              {selectedRoomId === room.id && <Check size={14} className="text-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="font-semibold text-gray-800">{(room as any).roomCode ?? (room as any).code}</span>
                                <span className="text-sm text-gray-500">{getRoomLocation(room)}</span>
                                <span className={`rounded px-2 py-1 text-xs font-medium ${getRoomStatusBadgeClass(room)}`}>
                                  {getRoomStatusLabel(room)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                                <span>{room.area ?? 0} m²</span>
                                <span>Tối đa {room.maxOccupants ?? (room as any).maxPeople ?? 0} người</span>
                                <span>{getRoomRentText(room)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : selectedRoom ? (
              <div className="rounded border border-blue-200 bg-blue-50 p-4">
                <p className="mb-2 text-sm font-semibold text-blue-800">Phòng đang sửa</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-blue-900 md:grid-cols-2">
                  <div><span className="font-medium">Mã phòng:</span> {(selectedRoom as any).roomCode ?? (selectedRoom as any).code}</div>
                  <div><span className="font-medium">Vị trí:</span> {getRoomLocation(selectedRoom)}</div>
                  <div><span className="font-medium">Diện tích:</span> {selectedRoom.area ?? 0} m²</div>
                  <div><span className="font-medium">Tối đa:</span> {(selectedRoom as any).maxOccupants ?? (selectedRoom as any).maxPeople ?? 0} người</div>
                </div>
              </div>
            ) : (
              <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">Đang tải thông tin phòng...</div>
            )}
          </div>

          {selectedRoom && showPostFormModal && createPortal(
            <div className="admin-content-modal-overlay">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-post-modal-title"
                className="admin-content-modal-panel"
              >
                <div className="admin-content-modal-header flex items-start justify-between border-b border-gray-300 px-5 py-3">
                  <div className="flex items-start space-x-2">
                    <Megaphone size={20} className="mt-0.5 text-gray-800" />
                    <div>
                      <h3 id="create-post-modal-title" className="text-lg font-semibold text-gray-800">
                        {isEditing ? 'Đăng bài tìm phòng - Chỉnh sửa bài đăng' : 'Đăng bài tìm phòng - Tạo bài đăng'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {(selectedRoom as any).roomCode ?? (selectedRoom as any).code} • {getRoomLocation(selectedRoom)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closePostFormModal}
                    className="rounded p-1 text-gray-600 hover:bg-gray-100"
                    title="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-5 py-4">
                  <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Tiêu đề bài đăng</h4>
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Nhập tiêu đề bài đăng *</label>
                  <input
                    type="text"
                    placeholder="Hãy tạo điểm nhấn để người thuê ấn tượng với phòng của bạn"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    VD: "Phòng đẹp thoáng mát giá rẻ gần trường ĐH", "Căn hộ 2PN full nội thất sang trọng"
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thông tin phòng</h4>

                <div className="rounded border border-gray-300 bg-gray-50 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Mã phòng</p>
                      <p className="text-sm font-semibold text-gray-800">{(selectedRoom as any).roomCode ?? (selectedRoom as any).code}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Vị trí</p>
                      <p className="text-sm font-semibold text-gray-800">{getRoomLocation(selectedRoom)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Diện tích</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedRoom.area ?? 0} m²</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Số người tối đa</p>
                      <p className="text-sm font-semibold text-gray-800">{(selectedRoom as any).maxOccupants ?? (selectedRoom as any).maxPeople ?? 0} người</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Giá thuê</p>
                      <p className="text-sm font-semibold text-gray-800">{getRoomRentText(selectedRoom)}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Loại phòng</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedRoomType === 'single' ? 'Phòng đơn' : 'Căn hộ'}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-4">
                    <p className="mb-2 text-sm text-gray-600">Ảnh phòng</p>
                    {Array.isArray(selectedRoom.imageUrls) && selectedRoom.imageUrls.length > 0 ? (
                      <PostImagePreviewStrip
                        images={selectedRoom.imageUrls.map((url) => resolveImageUrl(url))}
                        altPrefix="Ảnh phòng"
                        onPreview={(src, index) => setPostPreviewImage({ src, title: `Ảnh phòng ${index + 1}` })}
                      />
                    ) : (
                      <PostImagePreviewStrip
                        images={[]}
                        altPrefix="Ảnh phòng"
                        onPreview={(src, index) => setPostPreviewImage({ src, title: `Ảnh phòng ${index + 1}` })}
                      />
                    )}
                  </div>

                  {selectedRoomType === 'single' ? (
                    <div className="border-t border-gray-300 pt-4">
                      <p className="text-sm text-gray-600">
                        {((selectedRoom as any).hasPrivateBathroom ?? false) ? '✓ Có vệ sinh khép kín' : '✕ Không có vệ sinh khép kín'}
                      </p>
                    </div>
                  ) : (
                    <div className="border-t border-gray-300 pt-4">
                      <p className="mb-2 text-sm text-gray-600">Cấu trúc căn hộ:</p>
                      <div className="grid grid-cols-4 gap-2 text-sm text-gray-700">
                        <div>{(selectedRoom as any).rooms?.living ?? '—'} phòng khách</div>
                        <div>{(selectedRoom as any).rooms?.bedroom ?? '—'} phòng ngủ</div>
                        <div>{(selectedRoom as any).rooms?.kitchen ?? '—'} phòng bếp</div>
                        <div>{(selectedRoom as any).rooms?.bathroom ?? '—'} phòng vệ sinh</div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-4">
                    <p className="mb-2 text-sm text-gray-600">Tiện nghi:</p>
                    {availableAssetAmenities.length > 0 && (
                      <div className="mb-3 max-h-28 overflow-y-auto rounded border border-gray-300 bg-white p-2">
                        <div className="flex flex-wrap gap-2">
                          {availableAssetAmenities.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => handleAddAmenityFromAssets(asset.id)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              {asset.assetName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedAmenities.length > 0 ? selectedAmenities.map((amenity, idx) => (
                        <span key={`${amenity}-${idx}`} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700">
                          <span>{amenity}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="text-red-600 hover:text-red-700"
                            title="Bỏ tiện nghi"
                          >
                            ×
                          </button>
                        </span>
                      )) : <span className="text-xs text-gray-500">Chưa có tiện nghi</span>}
                    </div>
                  </div>

                  <div className="border-t border-gray-300 pt-4">
                    <p className="mb-2 text-sm text-gray-600">Dịch vụ đi kèm:</p>

                    {availableCatalogServices.length > 0 && (
                      <div className="mb-3 max-h-28 overflow-y-auto rounded border border-gray-300 bg-white p-2">
                        <div className="flex flex-wrap gap-2">
                          {availableCatalogServices.map((service) => (
                            <button
                              key={service.key}
                              type="button"
                              onClick={() => handleAddServiceFromCatalog(service.key)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              {service.name} {service.unit ? `(${service.unit})` : ''} - {Number(service.price ?? 0).toLocaleString('vi-VN')} VNĐ
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="overflow-hidden rounded border border-gray-300">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-600">Tên dịch vụ</th>
                            <th className="border-b border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-600">Giá tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localServices.length === 0 ? (
                            <tr className="border-b border-gray-200 last:border-b-0">
                              <td className="px-4 py-3 text-sm text-gray-700" colSpan={2}>
                                <span className="text-sm text-gray-600">Chưa chọn dịch vụ nào từ danh mục đơn giá.</span>
                              </td>
                            </tr>
                          ) : (
                            localServices.map((service: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                                <td className="px-4 py-3 text-sm text-gray-700">{service.name}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {editingServiceIndex === idx ? (
                                      <>
                                        <input
                                          type="text"
                                          value={getServicePrice(idx, service.price ?? service.unitPrice ?? service.amount ?? '')}
                                          onChange={(e) => handleServicePriceChange(idx, e.target.value)}
                                          className="w-32 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                        <span className="text-xs text-gray-600">VNĐ/{service.unit ?? ''}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const key = `${selectedRoomId}-${idx}`;
                                            const updatedPrice = servicePrices[key] ?? '';
                                            setLocalServices((prev) => prev.map((s, i) => (i === idx ? { ...s, price: updatedPrice } : s)));
                                            handleServicePriceSave();
                                          }}
                                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                                        >
                                          Lưu
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-sm font-medium text-gray-800">
                                          {getServicePrice(idx, service.price ?? service.unitPrice ?? service.amount ?? '')}
                                        </span>
                                        <span className="text-xs text-gray-600">VNĐ/{service.unit ?? ''}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleServicePriceEdit(idx, service.price ?? service.unitPrice ?? service.amount ?? '')}
                                          className="rounded p-1 hover:bg-gray-100"
                                          title="Chỉnh sửa giá"
                                        >
                                          <Edit2 size={14} className="text-gray-600" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveService(idx)}
                                          className="rounded p-1 hover:bg-red-50"
                                          title="Bỏ dịch vụ"
                                        >
                                          <X size={14} className="text-red-600" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thời gian vào ở</h4>
                <div>
                  <label className="mb-3 block text-sm text-gray-700">Có thể vào ở *</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="movein-immediate"
                        name="movein"
                        value="immediate"
                        checked={moveInType === 'immediate'}
                        onChange={(e) => {
                          setMoveInType(e.target.value as 'immediate' | 'from-date');
                          if (e.target.value === 'immediate') {
                            setMoveInDateInput('');
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <label htmlFor="movein-immediate" className="text-sm text-gray-700">Ở luôn</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="movein-fromdate"
                        name="movein"
                        value="from-date"
                        checked={moveInType === 'from-date'}
                        onChange={(e) => setMoveInType(e.target.value as 'immediate' | 'from-date')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="movein-fromdate" className="text-sm text-gray-700">Từ</label>
                      {moveInType === 'from-date' && (
                        <input
                          type="date"
                          value={moveInDateInput}
                          onChange={(e) => setMoveInDateInput(e.target.value)}
                          className="rounded border border-gray-300 px-3 py-1 text-sm focus:border-gray-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thông tin bổ sung</h4>
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Có nằm trong khu vực dễ ngập lụt *</label>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="flood-yes" name="flood" value="yes" checked={floodProne === 'yes'} onChange={(e) => setFloodProne(e.target.value as 'yes' | 'no')} className="h-4 w-4" />
                      <label htmlFor="flood-yes" className="text-sm text-gray-700">Có</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="flood-no" name="flood" value="no" checked={floodProne === 'no'} onChange={(e) => setFloodProne(e.target.value as 'yes' | 'no')} className="h-4 w-4" />
                      <label htmlFor="flood-no" className="text-sm text-gray-700">Không</label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Yêu cầu từ chủ nhà khi cho thuê (nếu có)</label>
                  <textarea rows={3} placeholder="VD: Không nuôi thú cưng, không hút thuốc trong phòng..." value={landlordRequirementsInput} onChange={(e) => setLandlordRequirementsInput(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thông tin liên hệ</h4>
                <div>
                  <label className="mb-3 block text-sm text-gray-700">Chọn thông tin liên hệ *</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="contact-current" name="contact" value="current" checked={contactType === 'current'} onChange={(e) => setContactType(e.target.value as 'current' | 'other')} className="h-4 w-4" />
                      <label htmlFor="contact-current" className="text-sm text-gray-700">Lay tu tai khoan dang dung <span className="text-gray-500">({currentAccountLabel})</span></label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="contact-other" name="contact" value="other" checked={contactType === 'other'} onChange={(e) => setContactType(e.target.value as 'current' | 'other')} className="h-4 w-4" />
                      <label htmlFor="contact-other" className="text-sm text-gray-700">Khác (Nhập thủ công)</label>
                    </div>
                  </div>
                  {contactType === 'other' && (
                    <div className="mt-4 grid grid-cols-2 gap-4 border-l-2 border-gray-300 pl-6">
                      <div>
                        <label className="mb-2 block text-sm text-gray-700">Tên người liên hệ *</label>
                        <input type="text" placeholder="VD: Nguyễn Văn B" value={contactNameInput} onChange={(e) => setContactNameInput(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-700">Số điện thoại *</label>
                        <input type="tel" placeholder="VD: 0987654321" value={contactPhoneInput} onChange={(e) => setContactPhoneInput(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Ảnh minh họa</h4>
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Thêm ảnh (tối đa {POST_IMAGE_LIMIT} ảnh)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleFilesSelected(e.target.files);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                  <PostImageGrid
                    previews={imagePreviews}
                    onAdd={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onRemove={removeImage}
                    onPreview={(src, index) => setPostPreviewImage({ src, title: `Ảnh bài đăng ${index + 1}` })}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, JPEG — tối đa {POST_IMAGE_LIMIT} ảnh. Bạn còn {Math.max(0, POST_IMAGE_LIMIT - imagePreviews.length)} ảnh có thể thêm.
                  </p>
                </div>
              </div>
            </div>
                  </div>

                <div className="admin-content-modal-footer flex items-center justify-end space-x-3 border-t border-gray-300 px-5 py-3">
                  <button
                    onClick={closePostFormModal}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedRoomId}
                    className={`rounded px-4 py-2 text-sm text-white ${selectedRoomId ? 'bg-gray-800 hover:bg-gray-700' : 'cursor-not-allowed bg-gray-400'}`}
                  >
                    {isEditing ? 'Lưu thay đổi' : 'Đăng bài'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
      {postPreviewImage && typeof document !== 'undefined' && createPortal((
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{
            zIndex: 2147483647,
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setPostPreviewImage(null)}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ maxHeight: '72vh', maxWidth: '78vw' }}
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={postPreviewImage.src}
              alt={postPreviewImage.title}
              className="rounded bg-white object-contain shadow-2xl"
              style={{
                maxHeight: 'min(72vh, 560px)',
                maxWidth: 'min(78vw, 720px)',
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

function PostImageGrid({
  previews,
  onAdd,
  onDrop,
  onRemove,
  onPreview,
}: {
  previews: string[];
  onAdd: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onRemove: (index: number) => void;
  onPreview: (src: string, index: number) => void;
}) {
  return (
    <div
      className="flex w-full items-start gap-2 overflow-x-auto pb-1"
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={onDrop}
    >
      <button
        type="button"
        onClick={onAdd}
        className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-gray-300 bg-gray-50 text-center transition-colors hover:border-gray-400 hover:bg-gray-100"
        title="Bấm để chọn ảnh bài đăng"
      >
        <ImageIcon size={22} className="text-gray-400" />
        <span className="w-full px-1 text-[11px] font-medium leading-tight text-gray-500">Add image</span>
      </button>

      {Array.from({ length: POST_IMAGE_LIMIT }).map((_, index) => {
        const preview = previews[index];

        if (preview) {
          return (
            <div key={`${preview}-${index}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => onPreview(preview, index)}
                className="block h-full w-full"
                title="Xem chi tiết ảnh"
              >
                <img src={preview} alt={`Ảnh bài đăng ${index + 1}`} className="h-full w-full object-cover" />
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
            key={`empty-post-image-${index}`}
            className="h-24 w-24 shrink-0 rounded border border-gray-300 bg-white"
            aria-label={`Ô ảnh bài đăng trống ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

function PostImagePreviewStrip({
  images,
  altPrefix,
  onPreview,
}: {
  images: string[];
  altPrefix: string;
  onPreview: (src: string, index: number) => void;
}) {
  const normalizedImages = images.slice(0, POST_IMAGE_LIMIT);

  return (
    <div className="flex w-full items-start gap-2 overflow-x-auto pb-1">
      {Array.from({ length: POST_IMAGE_LIMIT }).map((_, index) => {
        const src = normalizedImages[index];

        if (!src) {
          return (
            <div
              key={`empty-${altPrefix}-${index}`}
              className="h-24 w-24 shrink-0 rounded border border-gray-300 bg-white"
              aria-label={`Ô ${altPrefix.toLowerCase()} trống ${index + 1}`}
            />
          );
        }

        return (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => onPreview(src, index)}
            className="h-24 w-24 shrink-0 overflow-hidden rounded border border-gray-300 bg-white"
            title="Xem chi tiết ảnh"
          >
            <img src={src} alt={`${altPrefix} ${index + 1}`} className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
