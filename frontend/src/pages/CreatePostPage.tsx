import { ArrowLeft, Check, Edit2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { postService, type RoomOption, type PostRecord, type PostServiceLineItem } from '../services/postService';
import { serviceService } from '../services/api.service';
import { api } from '../lib/api-client';
import { API_ENDPOINTS } from '../lib/api-config';

interface AssetOption {
  id: number;
  assetName: string;
  assetCode: string;
}

export function CreatePostPage() {
  const navigate = useNavigate();
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

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  const selectedRoomType = String((selectedRoom as any)?.type ?? 'single');
  const isEditing = editingPostId !== null;
  const availableCatalogServices = serviceCatalog.filter((catalogItem) =>
    !localServices.some((service) => String(service.key ?? '').toLowerCase() === String(catalogItem.key).toLowerCase())
  );
  const availableAssetAmenities = assetCatalog.filter((asset) => !selectedAmenities.includes(asset.assetName));

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
          const previews = post.imageUrls.slice(0, 6);
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

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, 6 - imagePreviews.length);
    if (remaining <= 0) {
      toast.error('Bạn chỉ được tải tối đa 6 ảnh');
      return;
    }
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB client-side limit
    const arr = Array.from(files).slice(0, remaining);
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
        const next = [...prev, ...good].slice(0, 6);
        return next;
      });
      setImageFiles((prev) => {
        const next = [...prev, ...allowed].slice(0, 6);
        return next;
      });
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files) {
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

    const contactName = contactType === 'current' ? 'Nguyễn Văn A' : contactNameInput;
    const contactPhone = contactType === 'current' ? '0912345678' : contactPhoneInput;

    if (!title || title.trim().length === 0) {
      toast.error('Vui lòng nhập tiêu đề bài đăng');
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
            <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Chọn phòng muốn đăng</h4>

            <div className="grid grid-cols-1 gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
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
                        <div className="mb-1 flex items-center space-x-3">
                          <span className="font-semibold text-gray-800">{(room as any).roomCode ?? (room as any).code}</span>
                          <span className="text-sm text-gray-500">{(room as any).buildingName ?? (room as any).building} - {(room as any).floorNumber ?? (room as any).floor}</span>
                          <span className={`rounded px-2 py-1 text-xs font-medium ${room.status === 'Trống' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {room.status === 'Trống' ? 'Trống' : 'Đã thuê'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="mr-3">{room.area ?? 0} m²</span>
                          <span className="mr-3">Tối đa {room.maxOccupants ?? (room as any).maxPeople ?? 0} người</span>
                          <span>{room.defaultRentPrice ? `${room.defaultRentPrice.toLocaleString('vi-VN')} VNĐ/tháng` : ((room as any).price ? `${(room as any).price} VNĐ/tháng` : '—')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRoom && (
            <>
              <div className="space-y-4">
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

              <div className="space-y-4">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thông tin phòng</h4>

                <div className="rounded border border-gray-300 bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Mã phòng</p>
                      <p className="text-sm font-semibold text-gray-800">{(selectedRoom as any).roomCode ?? (selectedRoom as any).code}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Vị trí</p>
                      <p className="text-sm font-semibold text-gray-800">{(selectedRoom as any).buildingName ?? (selectedRoom as any).building} - {(selectedRoom as any).floorNumber ?? (selectedRoom as any).floor}</p>
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
                      <p className="text-sm font-semibold text-gray-800">{selectedRoom.defaultRentPrice ? `${selectedRoom.defaultRentPrice.toLocaleString('vi-VN')} VNĐ/tháng` : ((selectedRoom as any).price ?? '—')}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-gray-600">Loại phòng</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedRoomType === 'single' ? 'Phòng đơn' : 'Căn hộ'}</p>
                    </div>
                  </div>

                  {selectedRoomType === 'single' ? (
                      <div className="mt-4 border-t border-gray-300 pt-4">
                        <p className="text-sm text-gray-600">
                          {((selectedRoom as any).hasPrivateBathroom ?? false) ? '✓ Có vệ sinh khép kín' : '✕ Không có vệ sinh khép kín'}
                        </p>
                      </div>
                  ) : (
                    <div className="mt-4 border-t border-gray-300 pt-4">
                      <p className="mb-2 text-sm text-gray-600">Cấu trúc căn hộ:</p>
                      <div className="grid grid-cols-4 gap-2 text-sm text-gray-700">
                        <div>{(selectedRoom as any).rooms?.living ?? '—'} phòng khách</div>
                        <div>{(selectedRoom as any).rooms?.bedroom ?? '—'} phòng ngủ</div>
                        <div>{(selectedRoom as any).rooms?.kitchen ?? '—'} phòng bếp</div>
                        <div>{(selectedRoom as any).rooms?.bathroom ?? '—'} phòng vệ sinh</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 border-t border-gray-300 pt-4">
                    <p className="mb-2 text-sm text-gray-600">Tiện nghi:</p>
                    <div className="mb-3 max-h-28 overflow-y-auto rounded border border-gray-300 bg-white p-2">
                      {availableAssetAmenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableAssetAmenities.map((asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => handleAddAmenityFromAssets(asset.id)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              {asset.assetName}{asset.assetCode ? ` (${asset.assetCode})` : ''}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Không còn tiện ích nào để thêm</span>
                      )}
                    </div>
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

                  <div className="mt-4 border-t border-gray-300 pt-4">
                    <p className="mb-3 text-sm text-gray-600">Dịch vụ đi kèm:</p>
                    <div className="mb-3 max-h-28 overflow-y-auto rounded border border-gray-300 bg-white p-2">
                      {availableCatalogServices.length > 0 ? (
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
                      ) : (
                        <span className="text-xs text-gray-500">Không còn dịch vụ nào để thêm</span>
                      )}
                    </div>
                    <div className="overflow-hidden rounded border border-gray-300">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-600">Tên dịch vụ</th>
                            <th className="border-b border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-600">Giá tiền</th>
                            <th className="border-b border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-600">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localServices.length === 0 ? (
                            <tr className="border-b border-gray-200 last:border-b-0">
                              <td className="px-4 py-3 text-sm text-gray-700" colSpan={3}>
                                <span className="text-sm text-gray-600">Chưa chọn dịch vụ nào từ danh mục đơn giá.</span>
                              </td>
                            </tr>
                          ) : (
                            localServices.map((service: any, idx: number) => (
                            <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                              <td className="px-4 py-3 text-sm text-gray-700">{service.name}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {editingServiceIndex === idx ? (
                                    <input
                                      type="text"
                                      value={getServicePrice(idx, service.price ?? service.unitPrice ?? service.amount ?? '')}
                                      onChange={(e) => handleServicePriceChange(idx, e.target.value)}
                                      className="w-32 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-800">
                                      {getServicePrice(idx, service.price ?? service.unitPrice ?? service.amount ?? '')} {service.unit ?? ''}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingServiceIndex === idx) {
                                        // save to localServices
                                        const key = `${selectedRoomId}-${idx}`;
                                        const updatedPrice = servicePrices[key] ?? '';
                                        setLocalServices((prev) => prev.map((s, i) => (i === idx ? { ...s, price: updatedPrice } : s)));
                                        handleServicePriceSave();
                                      } else {
                                        handleServicePriceEdit(idx, service.price ?? service.unitPrice ?? service.amount ?? '');
                                      }
                                    }}
                                    className="rounded p-1 hover:bg-gray-100"
                                    title="Chỉnh sửa"
                                  >
                                    <Edit2 size={14} className="text-gray-600" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveService(idx)}
                                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                  title="Bỏ dịch vụ"
                                >
                                  Xóa
                                </button>
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

              <div className="space-y-4">
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
                          setMoveInDateInput('');
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

              <div className="space-y-4">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thông tin bổ sung</h4>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">Có nằm trong khu vực dễ ngập lụt *</label>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="flood-yes"
                        name="flood"
                        value="yes"
                        checked={floodProne === 'yes'}
                        onChange={(e) => setFloodProne(e.target.value as 'yes' | 'no')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="flood-yes" className="text-sm text-gray-700">Có</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="flood-no"
                        name="flood"
                        value="no"
                        checked={floodProne === 'no'}
                        onChange={(e) => setFloodProne(e.target.value as 'yes' | 'no')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="flood-no" className="text-sm text-gray-700">Không</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">Yêu cầu từ chủ nhà khi cho thuê (nếu có)</label>
                  <textarea
                    rows={3}
                    placeholder="VD: Không nuôi thú cưng, không hút thuốc trong phòng..."
                    value={landlordRequirementsInput}
                    onChange={(e) => setLandlordRequirementsInput(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Thông tin liên hệ</h4>

                <div>
                  <label className="mb-3 block text-sm text-gray-700">Chọn thông tin liên hệ *</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="contact-current"
                        name="contact"
                        value="current"
                        checked={contactType === 'current'}
                        onChange={(e) => setContactType(e.target.value as 'current' | 'other')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="contact-current" className="text-sm text-gray-700">
                        Lấy từ tài khoản đang dùng <span className="text-gray-500">(Nguyễn Văn A - 0912345678)</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="contact-other"
                        name="contact"
                        value="other"
                        checked={contactType === 'other'}
                        onChange={(e) => setContactType(e.target.value as 'current' | 'other')}
                        className="h-4 w-4"
                      />
                      <label htmlFor="contact-other" className="text-sm text-gray-700">Khác (Nhập thủ công)</label>
                    </div>
                  </div>

                  {contactType === 'other' && (
                    <div className="mt-4 grid grid-cols-2 gap-4 border-l-2 border-gray-300 pl-6">
                      <div>
                        <label className="mb-2 block text-sm text-gray-700">Tên người liên hệ *</label>
                            <input
                              type="text"
                              placeholder="VD: Nguyễn Văn B"
                              value={contactNameInput}
                              onChange={(e) => setContactNameInput(e.target.value)}
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm text-gray-700">Số điện thoại *</label>
                            <input
                              type="tel"
                              placeholder="VD: 0987654321"
                              value={contactPhoneInput}
                              onChange={(e) => setContactPhoneInput(e.target.value)}
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                            />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="border-b pb-2 text-base font-semibold text-gray-800">Ảnh minh họa</h4>

                <div>
                  <label className="mb-2 block text-sm text-gray-700">Thêm ảnh (tối đa 6 ảnh)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer items-center justify-center flex-col gap-2 rounded border-2 border-dashed border-gray-300 p-6 text-center hover:bg-gray-50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFilesSelected(e.target.files)}
                      className="hidden"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l5-5 5 5M12 11v10" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    </svg>
                    <div className="text-sm font-medium text-gray-700">Kéo thả ảnh vào đây hoặc bấm để chọn</div>
                    <div className="text-xs text-gray-500">PNG, JPG, JPEG — tối đa {6} ảnh. Bạn còn {Math.max(0, 6 - imagePreviews.length)} ảnh có thể thêm.</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative w-28 h-20 overflow-hidden rounded border">
                        <img src={src} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 rounded bg-white/90 px-1 py-0.5 text-xs"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-gray-300 px-6 py-4">
          <button onClick={() => navigate('/post-management')} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
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
    </div>
  );
}