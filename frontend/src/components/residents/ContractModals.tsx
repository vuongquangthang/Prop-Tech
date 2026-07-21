interface ContractHistoryChange {
  label: string;
  before?: string;
  after?: string;
}

const snapshotValue = (snapshot: any, key: string) =>
  snapshot?.[key] ?? snapshot?.[key.charAt(0).toLowerCase() + key.slice(1)];

const formatHistoryDate = (value: any) => {
  if (!value) return 'Không có';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('vi-VN');
};

const formatHistoryMoney = (value: any) => `${Number(value ?? 0).toLocaleString('vi-VN')} VNĐ`;

const parseHistoryFormula = (snapshot: any) => {
  const value = snapshotValue(snapshot, 'BillingFormulaJson');
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formulaItemValue = (item: any, key: string) =>
  item?.[key] ?? item?.[key.charAt(0).toUpperCase() + key.slice(1)];

const formulaItemKey = (item: any) =>
  String(formulaItemValue(item, 'serviceId') || `${formulaItemValue(item, 'itemType')}-${formulaItemValue(item, 'serviceName')}`);

const formatFormulaItem = (item: any) => {
  const unitPrice = formatHistoryMoney(formulaItemValue(item, 'unitPrice'));
  const expression = formulaItemValue(item, 'quantityExpression');
  const quantity = expression === 'n' ? 'n' : (formulaItemValue(item, 'quantity') ?? expression ?? 1);
  return `${unitPrice} × ${quantity}`;
};

const buildContractHistoryChanges = (current: any, previous?: any): ContractHistoryChange[] => {
  if (!previous) {
    return [{ label: 'Phiên bản', after: 'Bản hợp đồng ban đầu' }];
  }

  const changes: ContractHistoryChange[] = [];
  const compareField = (
    key: string,
    label: string,
    formatter: (value: any) => string = (value) => String(value ?? 'Không có'),
  ) => {
    const beforeValue = snapshotValue(previous, key);
    const afterValue = snapshotValue(current, key);
    if (JSON.stringify(beforeValue ?? null) !== JSON.stringify(afterValue ?? null)) {
      changes.push({ label, before: formatter(beforeValue), after: formatter(afterValue) });
    }
  };

  compareField('StartDate', 'Ngày bắt đầu', formatHistoryDate);
  compareField('ExpectedEndDate', 'Ngày kết thúc', formatHistoryDate);
  compareField('ActualRentPrice', 'Giá thuê', formatHistoryMoney);
  compareField('DepositAmount', 'Tiền cọc', formatHistoryMoney);
  compareField('DepositPaid', 'Trạng thái tiền cọc', (value) => value ? 'Đã trả' : 'Chưa trả');
  compareField('PaymentDayOfMonth', 'Ngày thanh toán', (value) => value ? `Ngày ${value}` : 'Theo cấu hình chung');

  const previousResidents: any[] = Array.isArray(snapshotValue(previous, 'Residents')) ? snapshotValue(previous, 'Residents') : [];
  const currentResidents: any[] = Array.isArray(snapshotValue(current, 'Residents')) ? snapshotValue(current, 'Residents') : [];
  const residentLabel = (resident: any) =>
    `${resident.FullName ?? resident.fullName ?? `Cư dân #${resident.ResidentId ?? resident.residentId}`} (${resident.ResidencyRole ?? resident.residencyRole ?? 'Thành viên'})`;
  const previousResidentMap = new Map<string, any>(
    previousResidents.map((resident: any): [string, any] => [String(resident.ResidentId ?? resident.residentId), resident]),
  );
  const currentResidentMap = new Map<string, any>(
    currentResidents.map((resident: any): [string, any] => [String(resident.ResidentId ?? resident.residentId), resident]),
  );

  currentResidentMap.forEach((resident: any, residentId: string) => {
    const previousResident: any = previousResidentMap.get(residentId);
    if (!previousResident) {
      changes.push({ label: 'Thêm thành viên', after: residentLabel(resident) });
    } else if ((previousResident.ResidencyRole ?? previousResident.residencyRole) !== (resident.ResidencyRole ?? resident.residencyRole)) {
      changes.push({ label: resident.FullName ?? resident.fullName ?? `Cư dân #${residentId}`, before: residentLabel(previousResident), after: residentLabel(resident) });
    }
  });
  previousResidentMap.forEach((resident: any, residentId: string) => {
    if (!currentResidentMap.has(residentId)) {
      changes.push({ label: 'Xóa thành viên', before: residentLabel(resident) });
    }
  });

  const previousFormula = parseHistoryFormula(previous)
    .filter((item: any) => formulaItemValue(item, 'itemType') !== 'TienPhong');
  const currentFormula = parseHistoryFormula(current)
    .filter((item: any) => formulaItemValue(item, 'itemType') !== 'TienPhong');
  const previousFormulaMap = new Map<string, any>(
    previousFormula.map((item: any): [string, any] => [formulaItemKey(item), item]),
  );
  const currentFormulaMap = new Map<string, any>(
    currentFormula.map((item: any): [string, any] => [formulaItemKey(item), item]),
  );

  currentFormulaMap.forEach((item: any, itemKey: string) => {
    const previousItem: any = previousFormulaMap.get(itemKey);
    const serviceName = formulaItemValue(item, 'serviceName') || 'Dịch vụ';
    if (!previousItem) {
      changes.push({ label: `Thêm dịch vụ: ${serviceName}`, after: formatFormulaItem(item) });
    } else if (formatFormulaItem(previousItem) !== formatFormulaItem(item)) {
      changes.push({ label: `Dịch vụ: ${serviceName}`, before: formatFormulaItem(previousItem), after: formatFormulaItem(item) });
    }
  });
  previousFormulaMap.forEach((item: any, itemKey: string) => {
    if (!currentFormulaMap.has(itemKey)) {
      changes.push({ label: `Xóa dịch vụ: ${formulaItemValue(item, 'serviceName') || 'Dịch vụ'}`, before: formatFormulaItem(item) });
    }
  });

  return changes.length > 0 ? changes : [{ label: 'Thông tin', after: 'Không có thay đổi dữ liệu' }];
};

export function ContractEditHistoryModal({ contract, onClose }: ContractModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contractService.getHistory(Number(contract?.id))
      .then((items: any) => setHistory(Array.isArray(items) ? items : []))
      .catch((err: any) => setError(err.message || 'Không thể tải lịch sử chỉnh sửa'))
      .finally(() => setLoading(false));
  }, [contract?.id]);

  const parsedHistory = history.map((item) => {
    let snapshot: any = {};
    try {
      snapshot = JSON.parse(item.snapshotJson || '{}');
    } catch {}
    return { ...item, snapshot };
  });
  const snapshotsByVersion = new Map<number, any>(
    parsedHistory.map((item) => [Number(item.version), item.snapshot]),
  );

  return (
    <div className="admin-content-modal-overlay z-[80]">
      <div className="admin-content-modal-panel">
        <div className="admin-content-modal-header flex items-center justify-between px-6 py-4">
          <div>
            <h3 className="text-lg text-gray-800">Lịch sử chỉnh sửa hợp đồng</h3>
            <p className="text-xs text-gray-500">{contract?.code || contract?.contractCode}</p>
          </div>
          <button onClick={onClose} className="product-action-icon" aria-label="Đóng"><X size={18} /></button>
        </div>
        <div className="admin-content-modal-body space-y-4 p-6">
          {loading && <div className="flex justify-center py-10 text-gray-600"><Loader2 className="mr-2 animate-spin" size={20} />Đang tải...</div>}
          {error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!loading && !error && history.length === 0 && (
            <p className="rounded border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">Hợp đồng chưa có lần chỉnh sửa nào.</p>
          )}
          {parsedHistory.map((item) => {
            const changes = buildContractHistoryChanges(
              item.snapshot,
              snapshotsByVersion.get(Number(item.version) - 1),
            );

            return (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Phiên bản {item.version}</span>
                  {item.isCurrent && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">Hiện tại</span>}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDisplayDateTime(item.changedAt)}
                  {item.changedByName ? ` · ${item.changedByName}` : ''}
                </p>
                <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                  {changes.map((change, index) => (
                    <div key={`${change.label}-${index}`} className="text-sm">
                      <p className="font-medium text-gray-700">{change.label}</p>
                      {change.before !== undefined && change.after !== undefined && (
                        <p className="mt-0.5 text-gray-600">
                          <span className="text-red-600 line-through">{change.before}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="text-green-700">{change.after}</span>
                        </p>
                      )}
                      {change.before !== undefined && change.after === undefined && (
                        <p className="mt-0.5 text-red-600 line-through">{change.before}</p>
                      )}
                      {change.before === undefined && change.after !== undefined && (
                        <p className="mt-0.5 text-green-700">{change.after}</p>
                      )}
                    </div>
                  ))}
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EditContractModal({ contract, onClose, onSuccess }: ContractModalProps) {
  const [contractDetail, setContractDetail] = useState<any>(null);
  const [contractRoomDetail, setContractRoomDetail] = useState<any>(null);
  const [initialFormulaItems, setInitialFormulaItems] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activePricingCatalog, setActivePricingCatalog] = useState<any[]>([]);
  const [tenantList, setTenantList] = useState<any[]>([]);
  const [selectedPrimaryResidentKey, setSelectedPrimaryResidentKey] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [durationMonths, setDurationMonths] = useState('12');
  const [durationOptions, setDurationOptions] = useState<number[]>([6, 12, 24]);
  const [appliedCustomDurationMonths, setAppliedCustomDurationMonths] = useState<string>('');
  const [showCustomDurationInput, setShowCustomDurationInput] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [customDurationUnit, setCustomDurationUnit] = useState<'months' | 'years'>('months');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [depositPaid, setDepositPaid] = useState(false);
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<number, string>>({});
  const [contractBuildingId, setContractBuildingId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditHistory, setShowEditHistory] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      if (!contract?.id) { setLoading(false); return; }
      try {
        setLoading(true); setError(null);
        const detail = await contractService.getById(Number(contract.id));
        const detailData: any = detail;
        setContractDetail(detail);
        const roomId = detail?.roomId ?? (contract as any)?.roomId;
        if (roomId) {
          try {
            const room = await roomService.getById(Number(roomId));
            setContractRoomDetail(room);
            const buildingId = (room as any)?.buildingId ?? (room as any)?.floor?.buildingId ?? (contract as any)?.buildingId;
            setContractBuildingId(buildingId ? String(buildingId) : '');
          } catch {
            const buildingId = (contract as any)?.buildingId;
            setContractBuildingId(buildingId ? String(buildingId) : '');
          }
        }
        const services = await serviceService.getAll();
        const active = Array.isArray(services) ? services : [];
        setActivePricingCatalog(active.filter((s: any) => s.isActive !== false));
        const detailStartDate = detailData?.startDate ?? detailData?.StartDate;
        const detailEndDate = detailData?.expectedEndDate ?? detailData?.ExpectedEndDate;
        const detailRent = detailData?.actualRentPrice ?? detailData?.ActualRentPrice;
        const detailDeposit = detailData?.depositAmount ?? detailData?.DepositAmount;
        const detailDepositPaid = detailData?.depositPaid ?? detailData?.DepositPaid;
        const detailPaymentDay = detailData?.paymentDayOfMonth ?? detailData?.PaymentDayOfMonth;
        const detailFormulaJson = detailData?.billingFormulaJson ?? detailData?.BillingFormulaJson;
        setStartDate(detailStartDate ? formatLocalDateInput(new Date(detailStartDate)) : '');
        setMonthlyRent(detailRent !== null && detailRent !== undefined ? String(detailRent) : '');
        setDeposit(detailDeposit !== null && detailDeposit !== undefined ? String(detailDeposit) : '');
        setDepositPaid(Boolean(detailDepositPaid));
        setPaymentDayOfMonth(detailPaymentDay ? Number(detailPaymentDay) : null);
        if (detailFormulaJson) {
          try {
            const formula = typeof detailFormulaJson === 'string' ? JSON.parse(detailFormulaJson) : detailFormulaJson;
            if (Array.isArray(formula)) {
              const serviceItems = formula.filter((item: any) => item.itemType !== 'TienPhong' && (item.serviceId || item.serviceName));
              setInitialFormulaItems(serviceItems);
              const svcIds = serviceItems.filter((item: any) => item.serviceId).map((item: any) => Number(item.serviceId));
              setSelectedServiceIds(svcIds);
              setServiceQuantities(Object.fromEntries(
                serviceItems
                  .filter((item: any) => item.serviceId && item.quantityExpression !== 'n')
                  .map((item: any) => [Number(item.serviceId), String(item.quantity ?? 1)]),
              ));
            }
          } catch (e) { console.error('Error parsing billing formula:', e); }
        }
        const residents = (detail as any)?.residents || (detail as any)?.Residents || (contract as any)?.residents || [];
        const primaryResident = residents.find((resident: any) => isPrimaryResidentRole(resident.residencyRole)) ?? residents[0];
        const members = residents.filter((resident: any) => resident !== primaryResident).map((r: any) => ({
          id: String(r.residentId || r.id || Date.now()), name: r.fullName || r.hoTen || '', relationship: r.residencyRole || 'Thành viên',
          phone: r.phoneNumber || r.soDienThoai || '', idCard: r.idCardNumber || r.soCCCD || '', email: r.email || '',
          fromDate: r.fromDate || r.FromDate || '', avatar: '👤'
        }));
        setFamilyMembers(members); setTenantList(residents);
        setSelectedPrimaryResidentKey(primaryResident ? `resident:${getResidentIdValue(primaryResident)}` : '');
        if (detailStartDate && detailEndDate) {
          const start = new Date(detailStartDate); const end = new Date(detailEndDate);
          const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
          setDurationMonths(String(months));
          setDurationOptions((current) => Array.from(new Set([...current, months])).sort((a, b) => a - b));
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải thông tin hợp đồng'); console.error('Error loading contract:', err);
      } finally { setLoading(false); }
    };
    initializeData();
  }, [contract?.id]);

  const availablePricingCatalog = useMemo(() => {
    const available = activePricingCatalog.filter((service: any) => appliesToBuilding(service, contractBuildingId));
    const serviceById = new Map(
      available.map((service: any) => [Number(service.id ?? service.serviceId ?? 0), service]),
    );

    initialFormulaItems.forEach((item: any) => {
      const serviceId = Number(item.serviceId ?? item.ServiceId ?? 0);
      if (serviceId <= 0 || serviceById.has(serviceId)) return;
      serviceById.set(serviceId, {
        id: serviceId,
        serviceId,
        name: item.serviceName ?? item.ServiceName ?? `Dịch vụ #${serviceId}`,
        serviceName: item.serviceName ?? item.ServiceName ?? `Dịch vụ #${serviceId}`,
        serviceType: item.itemType ?? item.ItemType ?? 'Theo tháng',
        currentUnitPrice: Number(item.unitPrice ?? item.UnitPrice ?? 0),
        commonUnitPrice: Number(item.unitPrice ?? item.UnitPrice ?? 0),
        isActive: false,
      });
    });

    return Array.from(serviceById.values());
  }, [activePricingCatalog, contractBuildingId, initialFormulaItems]);

  const selectedServices = useMemo(() => {
    const selected = new Set(selectedServiceIds);
    return availablePricingCatalog.filter((s: any) => selected.has(Number(s.id ?? s.serviceId ?? 0)));
  }, [availablePricingCatalog, selectedServiceIds]);

  const householdMemberCount = useMemo(() => 1 + familyMembers.length, [familyMembers.length]);
  const quantityInputServices = useMemo(
    () => selectedServices.filter(requiresManualQuantity),
    [selectedServices],
  );

  const getResidentIdValue = (resident: any) => String(resident?.residentId ?? resident?.ResidentId ?? resident?.id ?? resident?.Id ?? '');
  const getResidentDisplayName = (resident: any) => resident?.fullName ?? resident?.FullName ?? resident?.hoTen ?? resident?.name ?? 'Không rõ tên';
  const getResidentPhone = (resident: any) => resident?.phoneNumber ?? resident?.PhoneNumber ?? resident?.soDienThoai ?? resident?.phone ?? '';

  const originalPrimaryResident = useMemo(() => {
    return tenantList?.find((resident: any) => isPrimaryResidentRole(resident.residencyRole ?? resident.ResidencyRole))
      ?? tenantList?.[0]
      ?? null;
  }, [tenantList]);

  const primaryResidentOptions = useMemo(() => {
    const options: Array<{ key: string; label: string; phone: string; source: 'resident' | 'member'; data: any }> = [];
    const usedKeys = new Set<string>();

    if (originalPrimaryResident) {
      const key = `resident:${getResidentIdValue(originalPrimaryResident)}`;
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        options.push({
          key,
          label: getResidentDisplayName(originalPrimaryResident),
          phone: getResidentPhone(originalPrimaryResident),
          source: 'resident',
          data: originalPrimaryResident,
        });
      }
    }

    familyMembers.forEach((member) => {
      const key = `member:${member.id}`;
      if (usedKeys.has(key)) return;
      usedKeys.add(key);
      options.push({
        key,
        label: member.name || 'Thành viên chưa đặt tên',
        phone: member.phone || '',
        source: 'member',
        data: member,
      });
    });

    return options;
  }, [originalPrimaryResident, familyMembers]);

  const selectedPrimaryResident = useMemo(() => {
    return primaryResidentOptions.find((option) => option.key === selectedPrimaryResidentKey)
      ?? primaryResidentOptions[0]
      ?? null;
  }, [primaryResidentOptions, selectedPrimaryResidentKey]);

  useEffect(() => {
    if (primaryResidentOptions.length === 0) {
      if (selectedPrimaryResidentKey) setSelectedPrimaryResidentKey('');
      return;
    }

    if (!primaryResidentOptions.some((option) => option.key === selectedPrimaryResidentKey)) {
      setSelectedPrimaryResidentKey(primaryResidentOptions[0].key);
    }
  }, [primaryResidentOptions, selectedPrimaryResidentKey]);

  useEffect(() => {
    const availableServiceIds = new Set(
      availablePricingCatalog.map((service: any) => Number(service.id ?? service.serviceId ?? 0)),
    );
    setSelectedServiceIds((current) => normalizeExclusiveMeterServices(
      current.filter((serviceId) => availableServiceIds.has(serviceId)),
      availablePricingCatalog,
    ));
  }, [availablePricingCatalog]);

  useEffect(() => {
    setServiceQuantities((current) => {
      const next = { ...current };
      let changed = false;
      quantityInputServices.forEach((service: any) => {
        const serviceId = Number(service.id ?? service.serviceId ?? 0);
        if (serviceId > 0 && next[serviceId] === undefined) {
          next[serviceId] = '1';
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [quantityInputServices]);

  const formulaRows = useMemo<BillingFormulaRow[]>(() => {
    const rows: BillingFormulaRow[] = [{ key: 'rent', sortOrder: 1, itemType: 'TienPhong', serviceName: 'Tiền phòng', unitPrice: toNumber(monthlyRent), quantityExpression: 'fixed', quantityMode: 'fixed' }];
    selectedServices.forEach((service: any, index: number) => {
      const id = Number(service.id ?? service.serviceId ?? 0);
      const name = service.name || service.serviceName || 'Dịch vụ';
      const meter = isMeterService(service);
      const initialItem = initialFormulaItems.find((item: any) =>
        Number(item.serviceId ?? item.ServiceId ?? 0) === id,
      );
      const initialPrice = Number(initialItem?.unitPrice ?? initialItem?.UnitPrice);
      const price = meter || !Number.isFinite(initialPrice)
        ? getCurrentServicePrice(service)
        : initialPrice;
      const manualQuantity = requiresManualQuantity(service);
      const personBased = !meter && !manualQuantity && isPerPersonService(service);
      rows.push({ key: `svc-${id}`, sortOrder: index + 2, itemType: meter ? (isWaterService(service) ? 'Nuoc' : 'Dien') : 'DichVu',
        serviceId: id, serviceName: name, unitPrice: price, quantityExpression: meter ? 'n' : 'fixed', quantityMode: manualQuantity ? 'manual' : (personBased ? 'person' : 'fixed')
      });
    });
    return rows;
  }, [selectedServices, monthlyRent, initialFormulaItems]);

  const getManualServiceQuantity = (serviceId?: number) => {
    if (!serviceId) return 0;
    const parsed = parseInt(serviceQuantities[serviceId] ?? '0', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const getPersonQuantity = () => {
    return householdMemberCount;
  };

  const getRowQuantity = (row: BillingFormulaRow) => {
    if (row.quantityExpression === 'n') {
      return null;
    }

    if (row.quantityMode === 'manual') {
      return getManualServiceQuantity(row.serviceId);
    }

    if (row.quantityMode === 'person') {
      return getPersonQuantity();
    }

    return 1;
  };

  const getFormulaTotalText = (row: BillingFormulaRow) => {
    if (row.quantityExpression === 'n') {
      return `${row.unitPrice.toLocaleString('vi-VN')} x n`;
    }

    const quantity = getRowQuantity(row) ?? 0;
    return (row.unitPrice * quantity).toLocaleString('vi-VN');
  };

  const getRowFormulaText = (row: BillingFormulaRow) => {
    const unitPrice = row.unitPrice.toLocaleString('vi-VN');
    if (row.quantityExpression === 'n') {
      return `${unitPrice} x n`;
    }

    const quantity = getRowQuantity(row) ?? 0;
    return `${unitPrice} x ${quantity}`;
  };

  const monthlyFormulaExpression = useMemo(() => {
    if (!formulaRows.length) return '';

    const parts = formulaRows.map((row) => {
      return `${row.serviceName}(${getRowFormulaText(row)})`;
    });

    return parts.join(' + ');
  }, [formulaRows, serviceQuantities, householdMemberCount]);

  const toggleServiceSelection = (serviceId: number) => {
    toggleExclusiveMeterService(serviceId, availablePricingCatalog, setSelectedServiceIds);
  };

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleAddMember = (newMember: Omit<FamilyMember, 'id'>) => {
    const member: FamilyMember = { ...newMember, id: Date.now().toString() };
    setFamilyMembers([...familyMembers, member]); setShowAddMemberModal(false);
  };

  const handleSubmit = async () => {
    if (!startDate || !monthlyRent) { setError('Vui lòng điền đầy đủ: Ngày bắt đầu, Tiền thuê'); return; }
    setLoading(true); setError(null);
    try {
      const currentResidents = tenantList || contract?.residents || [];
      const mainResident = originalPrimaryResident;
      const existingResidentIds = new Set(
        currentResidents
          .map((r: any) => Number(r.residentId || r.id || 0))
          .filter((id: number) => id > 0)
      );
      const residentsPayload: any[] = [];
      const selectedPrimaryKey = selectedPrimaryResident?.key || (mainResident ? `resident:${getResidentIdValue(mainResident)}` : '');
      const ensureMemberResidentId = async (member: FamilyMember) => {
        let residentId = Number(member.id);
        const isExistingResident = Number.isFinite(residentId) && residentId > 0 && existingResidentIds.has(residentId);

        if (!isExistingResident) {
          const created: any = await residentService.create({
            fullName: member.name,
            phoneNumber: member.phone,
            idCardNumber: member.idCard,
            email: member.email || undefined,
          } as any);

          residentId = Number(created?.id ?? created?.residentId ?? created?.data?.id ?? 0);
          if (!Number.isFinite(residentId) || residentId <= 0) {
            throw new Error(`Không thể tạo cư dân thành viên: ${member.name}`);
          }
        }

        return residentId;
      };

      if (selectedPrimaryKey.startsWith('member:')) {
        const selectedMemberId = selectedPrimaryKey.replace('member:', '');
        const selectedMember = familyMembers.find((member) => member.id === selectedMemberId);
        if (selectedMember) {
          const residentId = await ensureMemberResidentId(selectedMember);
          residentsPayload.push({
            residentId,
            residencyRole: 'Người thuê chính',
            fromDate: selectedMember.fromDate || startDate,
            email: selectedMember.email || undefined,
          });
        }
      } else if (mainResident) {
        residentsPayload.push({
          residentId: mainResident.residentId || mainResident.ResidentId || mainResident.id || mainResident.Id,
          residencyRole: 'Người thuê chính',
          fromDate: mainResident.fromDate || mainResident.FromDate || startDate,
          email: mainResident.email || mainResident.Email || undefined,
        });
      }

      if (mainResident && selectedPrimaryKey !== `resident:${getResidentIdValue(mainResident)}`) {
        residentsPayload.push({
          residentId: mainResident.residentId || mainResident.ResidentId || mainResident.id || mainResident.Id,
          residencyRole: 'Người ở cùng',
          fromDate: mainResident.fromDate || mainResident.FromDate || startDate,
          email: mainResident.email || mainResident.Email || undefined,
        });
      }

      for (const member of familyMembers) {
        if (`member:${member.id}` === selectedPrimaryKey) {
          continue;
        }

        const residentId = await ensureMemberResidentId(member);
        residentsPayload.push({
          residentId,
          residencyRole: isPrimaryResidentRole(member.relationship) ? 'Người ở cùng' : (member.relationship || 'Người ở cùng'),
          fromDate: member.fromDate || startDate,
          email: member.email || undefined,
        });
      }

      await contractService.update(Number(contract.id), {
        selectedServiceIds,
        billingFormulaItems: formulaRows.map((row) => ({ sortOrder: row.sortOrder, itemType: row.itemType, serviceId: row.serviceId, serviceName: row.serviceName,
          unitPrice: row.unitPrice,
          quantity: row.quantityExpression === 'n' ? null : getRowQuantity(row),
          quantityExpression: row.quantityExpression === 'n' ? 'n' : String(getRowQuantity(row) ?? 0)
        })), residents: residentsPayload,
      } as any);
      onSuccess?.(); onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật hợp đồng');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (<div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[400px] p-10 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-600">Đang tải thông tin hợp đồng...</p>
      </div>
    </div>);
  }

  const mainResident = selectedPrimaryResident?.data ?? originalPrimaryResident;
  const displayContractCode = contractDetail?.contractCode
    ?? contractDetail?.ContractCode
    ?? contract?.code
    ?? contract?.contractCode
    ?? '';
  const displayRoomNumber = contractDetail?.roomNumber
    ?? contractDetail?.RoomNumber
    ?? contract?.room
    ?? contract?.roomNumber
    ?? '';
  const displayFloorNumber = contractRoomDetail?.floorNumber
    ?? contractRoomDetail?.FloorNumber
    ?? contractRoomDetail?.floor?.floorNumber
    ?? '';
  const displayBuildingName = contractRoomDetail?.buildingName
    ?? contractRoomDetail?.BuildingName
    ?? contractRoomDetail?.floor?.building?.buildingName
    ?? '';
  const displayBuildingAddress = contractRoomDetail?.buildingAddress
    ?? contractRoomDetail?.BuildingAddress
    ?? contractRoomDetail?.address
    ?? contractRoomDetail?.floor?.building?.address
    ?? '';

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Sửa hợp đồng: {displayContractCode}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-blue-900">
              <Home size={17} className="shrink-0" />
              <span>{displayRoomNumber || '—'}</span>
              <span>-</span>
              <span>Tầng {displayFloorNumber || '—'}</span>
              <span>-</span>
              <span>{displayBuildingName || '—'}</span>
              <span>-</span>
              <span>{displayBuildingAddress || '—'}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-900"><strong>ℹ️ Phòng {displayRoomNumber}</strong> được cố định. Nếu cần chuyển phòng, vui lòng tạo hợp đồng mới.</p>
            <p className="mt-1 text-sm text-blue-900">Giá thuê, tiền cọc và thời hạn là điều khoản đã ký nên không chỉnh tại đây. Dùng chức năng <strong>Gia hạn hợp đồng</strong> để kéo dài thời gian thuê.</p>
            <div className="mt-3 flex justify-end border-t border-blue-200 pt-3">
              <button type="button" onClick={() => setShowEditHistory(true)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Xem lịch sử chỉnh sửa
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center"><User size={16} className="mr-2" />BƯỚC 1: Thông tin chủ hộ</h4>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-2">Chọn chủ phòng / người đại diện *</label>
              <select
                value={selectedPrimaryResident?.key ?? ''}
                onChange={(event) => setSelectedPrimaryResidentKey(event.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500"
              >
                {primaryResidentOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}{option.phone ? ` - ${option.phone}` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Người được chọn sẽ có quyền thanh toán hóa đơn trên app. Người chủ phòng cũ sẽ chuyển thành thành viên ở cùng.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mainResident && (<>
                <div><label className="block text-sm text-gray-700 mb-2">Họ và tên</label>
                  <input type="text" value={getResidentDisplayName(mainResident)} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" /></div>
                <div><label className="block text-sm text-gray-700 mb-2">CMND/CCCD</label>
                  <input type="text" value={mainResident?.idCardNumber || mainResident?.IdCardNumber || mainResident?.soCCCD || mainResident?.idCard || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" /></div>
                <div><label className="block text-sm text-gray-700 mb-2">Số điện thoại</label>
                  <input type="text" value={getResidentPhone(mainResident)} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" /></div>
                <div><label className="block text-sm text-gray-700 mb-2">Email</label>
                  <input type="email" value={mainResident?.email || mainResident?.Email || ''} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" /></div>
              </>)}
            </div>
            <p className="text-xs text-gray-500 mt-3">ℹ️ Thông tin cá nhân được cố định, chỉ thay đổi người đại diện phòng bằng ô chọn phía trên.</p>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-gray-800 font-bold flex items-center"><Users size={16} className="mr-2" />BƯỚC 2: Thành viên cùng ở</h4>
              <button className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center space-x-1" onClick={() => setShowAddMemberModal(true)}>
                <Plus size={14} />Thêm</button>
            </div>
            {familyMembers.length > 0 ? (
              <div className="space-y-2">{familyMembers.map(member => (
                <div key={member.id} className="bg-white border border-gray-300 rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div><p className="text-sm text-gray-800 font-bold">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.relationship}</p></div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded" onClick={() => handleRemoveMember(member.id)}>
                      <X size={16} className="text-red-600" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-600">SĐT:</span> <span className="text-gray-800 ml-1 font-bold">{member.phone}</span></div>
                    <div><span className="text-gray-600">CMND:</span> <span className="text-gray-800 ml-1 font-bold">{member.idCard}</span></div>
                    {member.email && <div className="col-span-2"><span className="text-gray-600">Email:</span> <span className="text-gray-800 ml-1">{member.email}</span></div>}
                  </div>
                </div>
              ))}</div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center text-gray-500">
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có thành viên nào</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center"><Calendar size={16} className="mr-2" />BƯỚC 3: Điều khoản hợp đồng</h4>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm text-gray-700 mb-2">Mã hợp đồng</label>
                <input type="text" value={displayContractCode} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" /></div>
              <div><label className="block text-sm text-gray-700 mb-2">Phòng</label>
                <input type="text" value={displayRoomNumber} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100" /></div>
              <div><label className="block text-sm text-gray-700 mb-2">Ngày bắt đầu *</label>
                <DateTextInput value={startDate} onChange={setStartDate} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 text-gray-600" /></div>
              <div><label className="block text-sm text-gray-700 mb-2">Thời hạn *</label>
                <select value={durationMonths} disabled className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 text-gray-600">
                  {durationOptions.map((m) => (<option key={m} value={String(m)}>{m % 12 === 0 ? `${m / 12} năm` : `${m} tháng`}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div><label className="block text-sm text-gray-700 mb-2">Tiền thuê/tháng *</label>
                <MoneyInput value={monthlyRent} onChange={setMonthlyRent} defaultScale="million" disabled /></div>
              <div><label className="block text-sm text-gray-700 mb-2">Tiền cọc</label>
                <MoneyInput value={deposit} onChange={setDeposit} defaultScale="million" disabled /></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="border border-gray-200 bg-white px-3 py-2">
                <span className="text-gray-600">Trạng thái tiền cọc: </span>
                <span className={depositPaid ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>
                  {depositPaid ? 'Đã trả' : 'Chưa trả'}
                </span>
              </div>
              <div className="border border-gray-200 bg-white px-3 py-2">
                <span className="text-gray-600">Ngày thanh toán: </span>
                <span className="font-semibold text-gray-800">
                  {paymentDayOfMonth ? `Ngày ${paymentDayOfMonth} hàng tháng` : 'Theo cấu hình chung'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center"><DollarSign size={16} className="mr-2" />BƯỚC 4: Danh mục đơn giá</h4>
            <div className="space-y-2">
              {availablePricingCatalog.length > 0 ? (
                availablePricingCatalog.map((service: any) => {
                  const serviceId = Number(service.id ?? service.serviceId ?? 0);
                  const isSelected = selectedServiceIds.includes(serviceId);
                  return (
                    <div key={serviceId} className="bg-white border border-gray-200">
                      <button
                        type="button"
                        onClick={() => toggleServiceSelection(serviceId)}
                        className="w-full flex items-start justify-between gap-3 p-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="text-left">
                          <span className="flex items-center gap-2">
                            <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none h-4 w-4 shrink-0" />
                            <span>{service.name || service.serviceName}</span>
                          </span>
                          <span className="block pl-6 text-xs text-gray-500">Cập nhật giá: {formatServicePriceUpdatedAt(service)}</span>
                          {isMeterService(service) && (
                            <span className="block pl-6 text-xs text-amber-700">
                              Giá sẽ tự động thay đổi theo giá thị trường.
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-bold text-gray-800">
                            {getCurrentServicePrice(service).toLocaleString('vi-VN')} VNĐ{service.unit ? `/${service.unit}` : ''}
                          </span>
                          {getScheduledServicePriceLabel(service) && (
                            <span className="mt-1 block text-xs font-normal text-amber-700">
                              Sắp áp dụng: {getScheduledServicePriceLabel(service)}
                            </span>
                          )}
                        </span>
                      </button>
                      {isSelected && requiresManualQuantity(service) && (
                        <label className="flex items-center justify-between gap-4 border-t border-gray-200 px-3 py-2">
                          <span className="text-sm text-gray-700">Số lượng</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={serviceQuantities[serviceId] ?? '1'}
                            onChange={(event) => setServiceQuantities((current) => ({
                              ...current,
                              [serviceId]: event.target.value.replace(/\D/g, ''),
                            }))}
                            className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                          />
                        </label>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu danh mục đơn giá cho tòa này.</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Đã chọn: <strong>{selectedServiceIds.length}</strong> danh mục</p>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">BƯỚC 5: Công thức hóa đơn cuối tháng</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Dịch vụ</th>
                    <th className="px-3 py-2 text-right border-b border-gray-200">Đơn giá</th>
                    <th className="px-3 py-2 text-center border-b border-gray-200">Số lượng</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Công thức</th>
                    <th className="px-3 py-2 text-right border-b border-gray-200">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {formulaRows.map((row) => (
                    <tr key={row.key} className="bg-white">
                      <td className="px-3 py-2 border-b border-gray-100">{row.serviceName}</td>
                      <td className="px-3 py-2 text-right border-b border-gray-100">{row.unitPrice.toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2 text-center border-b border-gray-100">
                        {row.quantityExpression === 'n' ? (
                          <span className="font-bold">n</span>
                        ) : row.quantityMode === 'manual' ? (
                          <span className="font-bold text-blue-700">{getRowQuantity(row)}</span>
                        ) : row.quantityMode === 'person' ? (
                          <span className="font-bold text-blue-700">{getRowQuantity(row)}</span>
                        ) : (
                          <span className="font-bold text-gray-700">1</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100 text-gray-700">{getRowFormulaText(row)}</td>
                      <td className="px-3 py-2 text-right border-b border-gray-100">{getFormulaTotalText(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 bg-white border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-600 mb-1">Công thức hóa đơn tháng (để kiểm tra):</p>
              <p className="text-sm text-gray-800 font-medium break-words">
                {monthlyFormulaExpression || '(chưa có công thức)'}
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">Hủy</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            <Check size={16} />
            <span>Lưu thay đổi ({1 + familyMembers.length} người)</span>
          </button>
        </div>
      </div>
      {showAddMemberModal && createPortal(
        <AddFamilyMemberModal onClose={() => setShowAddMemberModal(false)} onAdd={handleAddMember} />,
        document.body,
      )}
      {showEditHistory && createPortal(
        <ContractEditHistoryModal contract={contract} onClose={() => setShowEditHistory(false)} />,
        document.body,
      )}
    </div>
  );
}
import { X, User, Home, Calendar, DollarSign, FileText, AlertTriangle, Check, Eye, Printer, Download, Plus, Users } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { buildingService, roomService, residentService, contractService } from '../../services/api.service';
import { Loader2 } from 'lucide-react';
import { formatDisplayDate, formatDisplayDateTime, formatLocalDateInput } from '../../lib/date-utils';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { invoiceService, serviceService } from '../../services/api.service';
import { MoneyInput } from '../ui/MoneyInput';
import { DateTextInput } from '../ui/DateTextInput';

interface ContractModalProps {
  contract?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  idCard: string;
  email?: string;
  fromDate?: string;
  avatar: string;
}

interface BillingFormulaRow {
  key: string;
  sortOrder: number;
  itemType: 'TienPhong' | 'Dien' | 'Nuoc' | 'DichVu';
  serviceId?: number;
  serviceName: string;
  unitPrice: number;
  quantityExpression: 'fixed' | 'n';
  quantityMode?: 'fixed' | 'manual' | 'person';
}

function normalizeText(value: string | undefined) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function isPrimaryResidentRole(role?: string) {
  const normalizedRole = normalizeText(role);
  return normalizedRole === 'nguoi thue chinh'
    || normalizedRole === 'chu ho'
    || normalizedRole === 'chu phong';
}

function isMeterService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  const type = normalizeText(service?.serviceType || service?.loai || '');
  return type.includes('dien') || type.includes('nuoc') || type.includes('water') || type.includes('electric')
    || name.includes('dien') || name.includes('nuoc') || name.includes('water') || name.includes('electric');
}

function isWaterService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  const type = normalizeText(service?.serviceType || service?.loai || '');
  return type.includes('nuoc') || type.includes('water') || name.includes('nuoc') || name.includes('water');
}

function isVehicleService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  const type = normalizeText(service?.serviceType || service?.loai || '');
  return type.includes('xe') || type.includes('gui xe') || name.includes('xe') || name.includes('parking');
}

function isQuantityInputService(service: any) {
  const type = normalizeText(service?.type || service?.serviceType || service?.loai || '');
  return type.includes('can nhap so luong') || type.includes('quantity');
}

function requiresManualQuantity(service: any) {
  return !isMeterService(service) && (isQuantityInputService(service) || isVehicleService(service));
}

function getServiceId(service: any) {
  return Number(service?.id ?? service?.serviceId ?? 0);
}

function normalizeExclusiveMeterServices(serviceIds: number[], catalog: any[]) {
  const serviceMap = new Map(catalog.map((service: any) => [getServiceId(service), service]));
  let hasElectricity = false;
  let hasWater = false;

  return serviceIds.filter((serviceId) => {
    const service = serviceMap.get(serviceId);
    if (!service || !isMeterService(service)) return true;

    if (isWaterService(service)) {
      if (hasWater) return false;
      hasWater = true;
      return true;
    }

    if (hasElectricity) return false;
    hasElectricity = true;
    return true;
  });
}

function toggleExclusiveMeterService(
  serviceId: number,
  catalog: any[],
  setSelection: (updater: (current: number[]) => number[]) => void,
) {
  setSelection((current) => {
    if (current.includes(serviceId)) {
      return current.filter((id) => id !== serviceId);
    }

    const selectedService = catalog.find((service: any) => getServiceId(service) === serviceId);
    if (!selectedService || !isMeterService(selectedService)) {
      return [...current, serviceId];
    }

    const next = current.filter((id) => {
      const service = catalog.find((item: any) => getServiceId(item) === id);
      if (!service || !isMeterService(service)) return true;
      return isWaterService(service) !== isWaterService(selectedService);
    });
    return [...next, serviceId];
  });
}

function isPerPersonService(service: any) {
  const name = normalizeText(service?.name || service?.serviceName || '');
  const type = normalizeText(service?.serviceType || service?.loai || '');
  const unit = normalizeText(service?.unit || service?.donVi || '');
  return unit.includes('nguoi') || unit.includes('person') || name.includes('nguoi') || type.includes('nguoi');
}

function formatServicePriceUpdatedAt(service: any) {
  const value = service?.priceUpdatedAt || service?.effectiveDate || service?.applyFrom;
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';
  return formatDisplayDate(date);
}

function getCurrentServicePrice(service: any) {
  return Number(
    service?.currentUnitPrice
    ?? service?.unitPrice
    ?? service?.commonUnitPrice
    ?? service?.price
    ?? 0,
  );
}

function getScheduledServicePrice(service: any) {
  const value = service?.scheduledUnitPrice;
  return value === null || value === undefined ? null : Number(value);
}

function getScheduledServicePriceLabel(service: any) {
  const price = getScheduledServicePrice(service);
  if (price === null) return null;
  const effectiveDate = service?.scheduledEffectiveDate
    ? formatDisplayDate(service.scheduledEffectiveDate)
    : 'ngày áp dụng';
  return `${price.toLocaleString('vi-VN')} VNĐ từ ${effectiveDate}`;
}

function toNumber(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function appliesToBuilding(item: any, buildingId?: string | number | null) {
  const targetBuildingId = buildingId == null || buildingId === '' ? '' : String(buildingId);
  if (!targetBuildingId) return true;

  const scopedBuildingIds = Array.isArray(item?.buildingIds)
    ? item.buildingIds
    : Array.isArray(item?.BuildingIds)
      ? item.BuildingIds
      : [];

  if (scopedBuildingIds.length > 0) {
    return scopedBuildingIds.map((id: any) => String(id)).includes(targetBuildingId);
  }

  const itemBuildingId = item?.buildingId ?? item?.BuildingId;
  return !itemBuildingId || String(itemBuildingId) === targetBuildingId;
}

function getNextSequence(contracts: any[], year: number) {
  const prefix = `HD-${year}-`;
  let max = 0;

  contracts.forEach((c: any) => {
    const code = String(c?.contractCode || c?.code || '').trim();
    if (!code.startsWith(prefix)) return;

    const seqText = code.slice(prefix.length);
    const seq = Number(seqText);
    if (Number.isFinite(seq) && seq > max) {
      max = seq;
    }
  });

  return max + 1;
}

export function ExtendContractModal({ contract, onClose, onSuccess }: ContractModalProps) {
  const [currentEndDate, setCurrentEndDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [extensionMonths, setExtensionMonths] = useState('12');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContract = async () => {
      try {
        setLoading(true);
        const detail: any = await contractService.getById(Number(contract?.id));
        const endDate = detail?.expectedEndDate || contract?.expectedEndDate;
        if (!endDate) throw new Error('Hợp đồng chưa có ngày kết thúc');

        const normalizedEndDate = formatLocalDateInput(new Date(endDate));
        setCurrentEndDate(normalizedEndDate);
        const extendedDate = new Date(`${normalizedEndDate}T00:00:00`);
        extendedDate.setMonth(extendedDate.getMonth() + 12);
        setNewEndDate(formatLocalDateInput(extendedDate));
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin hợp đồng');
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, [contract?.id]);

  const applyExtensionMonths = (months: string) => {
    setExtensionMonths(months);
    if (!currentEndDate) return;
    const date = new Date(`${currentEndDate}T00:00:00`);
    date.setMonth(date.getMonth() + Number(months));
    setNewEndDate(formatLocalDateInput(date));
  };

  const handleSubmit = async () => {
    if (!currentEndDate || !newEndDate || newEndDate <= currentEndDate) {
      setError('Ngày kết thúc mới phải sau ngày kết thúc hiện tại');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await contractService.extend(Number(contract.id), newEndDate);
      await onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể gia hạn hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  const minimumEndDate = currentEndDate
    ? (() => {
        const date = new Date(`${currentEndDate}T00:00:00`);
        date.setDate(date.getDate() + 1);
        return formatLocalDateInput(date);
      })()
    : undefined;

  return (
    <div className="admin-content-modal-overlay">
      <div className="admin-content-modal-panel admin-content-modal-panel--narrow">
        <div className="admin-content-modal-header flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg text-gray-800">Gia hạn hợp đồng</h3>
              <p className="text-xs text-gray-500">{contract?.code} · Phòng {contract?.room}</p>
            </div>
          </div>
          <button onClick={onClose} className="product-action-icon" aria-label="Đóng"><X size={18} /></button>
        </div>

        <div className="admin-content-modal-body space-y-5 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <Loader2 size={22} className="mr-2 animate-spin" />Đang tải hợp đồng...
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Gia hạn chỉ thay đổi ngày kết thúc. Giá thuê <strong>{Number(contract?.monthlyRent || 0).toLocaleString('vi-VN')} VNĐ/tháng</strong> và tiền cọc <strong>{Number(contract?.deposit || 0).toLocaleString('vi-VN')} VNĐ</strong> được giữ nguyên.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Ngày kết thúc hiện tại</label>
                  <DateTextInput value={currentEndDate} onChange={setCurrentEndDate} disabled className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Gia hạn thêm</label>
                  <select value={extensionMonths} onChange={(event) => applyExtensionMonths(event.target.value)} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="1">1 tháng</option>
                    <option value="3">3 tháng</option>
                    <option value="6">6 tháng</option>
                    <option value="12">1 năm</option>
                    <option value="24">2 năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-700">Ngày kết thúc mới *</label>
                <DateTextInput
                  value={newEndDate}
                  onChange={(value) => {
                    setNewEndDate(value);
                    setExtensionMonths('');
                  }}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              {error && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </>
          )}
        </div>

        <div className="admin-content-modal-footer flex justify-end gap-3 px-6 py-4">
          <button onClick={onClose} disabled={submitting} className="app-button-secondary">Hủy</button>
          <button onClick={handleSubmit} disabled={loading || submitting} className="app-button-primary">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            <span>Xác nhận gia hạn</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateContractModal({ onClose, onSuccess }: ContractModalProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activePricingCatalog, setActivePricingCatalog] = useState<any[]>([]);

  // API data
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);

  // Form state - Step 1
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  // Form state - Step 2 (tenant)
  const [tenantType, setTenantType] = useState<'new' | 'existing'>('new');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [residentSearch, setResidentSearch] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantIdCard, setTenantIdCard] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');

  // Form state - Step 3 (contract terms)
  const [startDate, setStartDate] = useState(() => formatLocalDateInput());
  const [durationMonths, setDurationMonths] = useState('12');
  const [durationOptions, setDurationOptions] = useState<number[]>([6, 12, 24]);
  const [appliedCustomDurationMonths, setAppliedCustomDurationMonths] = useState<string>('');
  const [showCustomDurationInput, setShowCustomDurationInput] = useState(false);
  const [customDurationValue, setCustomDurationValue] = useState('');
  const [customDurationUnit, setCustomDurationUnit] = useState<'months' | 'years'>('months');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [depositPaid, setDepositPaid] = useState(false);
  const [contractSequence, setContractSequence] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [serviceQuantities, setServiceQuantities] = useState<Record<number, string>>({});

  // Loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, message?: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const handleNameInput = (value: string) => {
    setTenantName(value);
    setFieldError('tenantName');
  };

  const handleDigitsInput = (field: string, value: string, setter: (next: string) => void, label: string, maxLength?: number) => {
    const digitsOnly = value.replace(/\D/g, '');
    const nextValue = maxLength ? digitsOnly.slice(0, maxLength) : digitsOnly;
    setter(nextValue);

    if (value !== digitsOnly) {
      setFieldError(field, `Sai định dạng. Vui lòng chỉ nhập số cho ${label}`);
      return;
    }

    if (maxLength && digitsOnly.length > maxLength) {
      setFieldError(field, `${label} chỉ được tối đa ${maxLength} số`);
      return;
    }

    setFieldError(field);
  };

  const handleEmailInput = (value: string) => {
    const trimmed = value.trim();
    setTenantEmail(trimmed);
    const isValid = !trimmed || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    setFieldError('tenantEmail', isValid ? undefined : 'Sai định dạng. Vui lòng nhập đúng định dạng email');
  };

  const validateCreateContractFields = () => {
    const nextErrors: Record<string, string> = {};

    if (tenantType === 'new') {
      if (tenantName.trim() && !/^[\p{L}\p{M}\s.'-]+$/u.test(tenantName.trim())) {
        nextErrors.tenantName = 'Sai định dạng. Họ tên chỉ được nhập chữ và khoảng trắng';
      }
      if (tenantIdCard && !/^\d{9}$|^\d{12}$/.test(tenantIdCard)) {
        nextErrors.tenantIdCard = 'Sai định dạng. CMND/CCCD phải gồm 9 hoặc 12 số';
      }
      if (tenantPhone && !/^0\d{9}$/.test(tenantPhone)) {
        nextErrors.tenantPhone = 'Sai định dạng. Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
      }
      if (tenantEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tenantEmail)) {
        nextErrors.tenantEmail = 'Sai định dạng. Vui lòng nhập đúng định dạng email';
      }
    }

    if (!/^\d+$/.test(durationMonths) || Number(durationMonths) <= 0) {
      nextErrors.durationMonths = 'Sai định dạng. Thời hạn phải là số nguyên dương';
    }
    if (showCustomDurationInput && customDurationValue && (!/^\d+$/.test(customDurationValue) || Number(customDurationValue) <= 0)) {
      nextErrors.customDurationValue = 'Sai định dạng. Vui lòng nhập số nguyên dương';
    }
    quantityInputServices.forEach((service: any) => {
      const serviceId = Number(service.id ?? service.serviceId ?? 0);
      const quantity = serviceQuantities[serviceId] ?? '';
      if (!/^\d+$/.test(quantity) || Number(quantity) < 0) {
        nextErrors[`serviceQuantity-${serviceId}`] = 'Số lượng phải là số nguyên không âm';
      }
    });
    if (!monthlyRent || toNumber(monthlyRent) <= 0) {
      nextErrors.monthlyRent = 'Sai định dạng. Tiền thuê phải lớn hơn 0';
    }
    if (deposit && toNumber(deposit) < 0) {
      nextErrors.deposit = 'Sai định dạng. Tiền cọc không được âm';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    buildingService.getAll().then((data: any) => setBuildings(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
    residentService.getAll().then((data: any) => setResidents(Array.isArray(data) ? data : data?.data ?? [])).catch(() => {});
    contractService.getAll().then((data: any) => {
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setContractSequence(getNextSequence(rows, new Date(startDate || Date.now()).getFullYear()));
    }).catch(() => setContractSequence(1));
    serviceService.getAll().then((data: any) => {
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setActivePricingCatalog(rows.filter((s: any) => s.isActive !== false));
    }).catch(() => setActivePricingCatalog([]));
  }, []);

  useEffect(() => {
    contractService.getAll().then((data: any) => {
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      setContractSequence(getNextSequence(rows, new Date(startDate || Date.now()).getFullYear()));
    }).catch(() => setContractSequence(1));
  }, [startDate]);

  const contractCodePreview = `HD-${new Date(startDate || Date.now()).getFullYear()}-${String(contractSequence).padStart(5, '0')}`;

  const addCustomDuration = () => {
    const n = parseInt(customDurationValue, 10);
    if (!Number.isFinite(n) || n <= 0) {
      setFieldError('customDurationValue', 'Sai định dạng. Vui lòng nhập số nguyên dương');
      return;
    }
    const months = customDurationUnit === 'years' ? n * 12 : n;
    // Custom duration is only applied for current contract, not persisted to base option list.
    setAppliedCustomDurationMonths(String(months));
    setDurationMonths(String(months));
    setFieldError('durationMonths');
    setFieldError('customDurationValue');
    setCustomDurationValue('');
    setShowCustomDurationInput(false);
  };

  const availablePricingCatalog = useMemo(() => {
    return activePricingCatalog.filter((service: any) => appliesToBuilding(service, selectedBuildingId));
  }, [activePricingCatalog, selectedBuildingId]);

  const selectedServices = useMemo(() => {
    const selected = new Set(selectedServiceIds);
    return availablePricingCatalog.filter((s: any) => selected.has(Number(s.id ?? s.serviceId ?? 0)));
  }, [availablePricingCatalog, selectedServiceIds]);

  const quantityInputServices = useMemo(
    () => selectedServices.filter(requiresManualQuantity),
    [selectedServices],
  );

  useEffect(() => {
    const availableServiceIds = new Set(
      availablePricingCatalog.map((service: any) => Number(service.id ?? service.serviceId ?? 0)),
    );
    setSelectedServiceIds((current) => normalizeExclusiveMeterServices(
      current.filter((serviceId) => availableServiceIds.has(serviceId)),
      availablePricingCatalog,
    ));
  }, [availablePricingCatalog]);

  useEffect(() => {
    setServiceQuantities((current) => {
      const next = { ...current };
      let changed = false;
      quantityInputServices.forEach((service: any) => {
        const serviceId = Number(service.id ?? service.serviceId ?? 0);
        if (serviceId > 0 && next[serviceId] === undefined) {
          next[serviceId] = '1';
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [quantityInputServices]);

  const householdMemberCount = useMemo(() => {
    // Chủ hộ ở bước 2 luôn được thêm vào hợp đồng, bước 2B là thành viên ở cùng.
    return 1 + familyMembers.length;
  }, [familyMembers.length]);

  const formulaRows = useMemo<BillingFormulaRow[]>(() => {
    const rows: BillingFormulaRow[] = [
      {
        key: 'rent',
        sortOrder: 1,
        itemType: 'TienPhong',
        serviceName: 'Tiền phòng',
        unitPrice: toNumber(monthlyRent),
        quantityExpression: 'fixed',
        quantityMode: 'fixed',
      },
    ];

    selectedServices.forEach((service: any, index: number) => {
      const id = Number(service.id ?? service.serviceId ?? 0);
      const name = service.name || service.serviceName || 'Dịch vụ';
      const price = getCurrentServicePrice(service);
      const meter = isMeterService(service);
      const manualQuantity = requiresManualQuantity(service);
      const personBased = !meter && !manualQuantity && isPerPersonService(service);

      rows.push({
        key: `svc-${id}`,
        sortOrder: index + 2,
        itemType: meter ? (isWaterService(service) ? 'Nuoc' : 'Dien') : 'DichVu',
        serviceId: id,
        serviceName: name,
        unitPrice: price,
        quantityExpression: meter ? 'n' : 'fixed',
        quantityMode: manualQuantity ? 'manual' : (personBased ? 'person' : 'fixed'),
      });
    });

    return rows;
  }, [selectedServices, monthlyRent]);

  const getManualServiceQuantity = (serviceId?: number) => {
    if (!serviceId) return 0;
    const parsed = parseInt(serviceQuantities[serviceId] ?? '0', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const getPersonQuantity = () => {
    return householdMemberCount;
  };

  const getRowQuantity = (row: BillingFormulaRow) => {
    if (row.quantityExpression === 'n') {
      return null;
    }

    if (row.quantityMode === 'manual') {
      return getManualServiceQuantity(row.serviceId);
    }

    if (row.quantityMode === 'person') {
      return getPersonQuantity();
    }

    return 1;
  };

  const getFormulaTotalText = (row: BillingFormulaRow) => {
    if (row.quantityExpression === 'n') {
      return `${row.unitPrice.toLocaleString('vi-VN')} x n`;
    }

    const quantity = getRowQuantity(row) ?? 0;
    return (row.unitPrice * quantity).toLocaleString('vi-VN');
  };

  const getRowFormulaText = (row: BillingFormulaRow) => {
    const unitPrice = row.unitPrice.toLocaleString('vi-VN');
    if (row.quantityExpression === 'n') {
      return `${unitPrice} x n`;
    }

    const quantity = getRowQuantity(row) ?? 0;
    return `${unitPrice} x ${quantity}`;
  };

  const monthlyFormulaExpression = useMemo(() => {
    if (!formulaRows.length) return '';

    const parts = formulaRows.map((row) => {
      return `${row.serviceName}(${getRowFormulaText(row)})`;
    });

    return parts.join(' + ');
  }, [formulaRows, serviceQuantities, householdMemberCount]);

  const toggleServiceSelection = (serviceId: number) => {
    toggleExclusiveMeterService(serviceId, availablePricingCatalog, setSelectedServiceIds);
  };

  useEffect(() => {
    if (tenantType !== 'existing') return;
    const r = residents.find((x: any) => String(x.id) === selectedResidentId);
    if (!r) return;
    setTenantName(r.fullName || r.hoTen || '');
    setTenantIdCard(r.idCardNumber || r.soCCCD || '');
    setTenantPhone(r.phoneNumber || r.soDienThoai || '');
    setTenantEmail(r.email || '');
  }, [tenantType, selectedResidentId, residents]);

  const filteredResidents = residents.filter((resident: any) => {
    const keyword = residentSearch.trim().toLowerCase();
    if (!keyword) return true;
    const searchableText = [
      resident.fullName,
      resident.hoTen,
      resident.phoneNumber,
      resident.soDienThoai,
      resident.idCardNumber,
      resident.soCCCD,
      resident.roomCode,
      resident.soPhong,
      resident.email,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(keyword);
  });

  useEffect(() => {
    if (selectedBuildingId) {
      roomService.getAll().then((data: any) => {
        const all = Array.isArray(data) ? data : data?.data ?? [];
        const filtered = all.filter((r: any) => {
          const floor = r.floor || r.floorId;
          return floor?.buildingId?.toString() === selectedBuildingId || r.buildingId?.toString() === selectedBuildingId;
        });
        setRooms(filtered.length ? filtered : all);
      }).catch(() => {});
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    const room = rooms.find((r: any) => String(r.id ?? r.roomId) === selectedRoomId);
    if (!room) {
      setSelectedServiceIds([]);
      return;
    }

    const defaultRent = toNumber(room.defaultRentPrice ?? room.rentPrice ?? room.monthlyRent ?? room.giaThueMacDinh);
    if (defaultRent > 0) {
      setMonthlyRent(String(defaultRent));
    }

    const roomServiceIds: any[] = Array.isArray(room.serviceIds) && room.serviceIds.length > 0
      ? room.serviceIds
      : Array.isArray(room.services)
        ? room.services.map((service: any) => service.serviceId ?? service.id)
        : [];
    const availableServiceIds = new Set<number>(
      availablePricingCatalog.map((service: any) => Number(service.id ?? service.serviceId ?? 0)),
    );
    const configuredServiceIds: number[] = Array.from(new Set<number>(
      roomServiceIds
        .map((serviceId: any) => Number(serviceId))
        .filter((serviceId: number) => serviceId > 0 && availableServiceIds.has(serviceId)),
    ));
    setSelectedServiceIds(normalizeExclusiveMeterServices(configuredServiceIds, availablePricingCatalog));
  }, [selectedRoomId, rooms, availablePricingCatalog]);

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleAddMember = (newMember: Omit<FamilyMember, 'id'>) => {
    const member: FamilyMember = { ...newMember, id: Date.now().toString() };
    setFamilyMembers([...familyMembers, member]);
    setShowAddMemberModal(false);
  };

  const handleSubmit = async () => {
    if (!validateCreateContractFields()) {
      setError('Vui lòng kiểm tra lại các trường sai định dạng');
      return;
    }

    if (!selectedRoomId || !startDate || !monthlyRent) {
      setError('Vui lòng điền đầy đủ: Phòng, Ngày bắt đầu, Tiền thuê');
      return;
    }

    if (tenantType === 'new' && (!tenantName.trim() || !tenantIdCard.trim() || !tenantPhone.trim())) {
      setError('Vui lòng điền đầy đủ: Phòng, Họ tên, CCCD, SĐT chủ hộ, Ngày bắt đầu, Tiền thuê');
      return;
    }

    if (tenantType === 'existing' && !selectedResidentId) {
      setError('Vui lòng chọn cư dân đã có làm chủ hộ');
      return;
    }

    setLoading(true); setError(null);
    try {
      // Resolve head of household resident ID
      let tenantResidentId: number | undefined;
      if (tenantType === 'existing') {
        tenantResidentId = parseInt(selectedResidentId, 10);
      } else {
        const tenantRes: any = await residentService.create({
          fullName: tenantName.trim(),
          phoneNumber: tenantPhone.trim(),
          idCardNumber: tenantIdCard.trim(),
          email: tenantEmail.trim() || undefined,
        } as any);
        tenantResidentId = tenantRes?.id ?? tenantRes?.residentId ?? tenantRes?.data?.id;
      }

      // Create family member residents
      const memberResidentIds: number[] = [];
      const memberEmailMap: Map<number, string> = new Map(); // Track email for each resident
      for (const m of familyMembers) {
        try {
          const mr: any = await residentService.create({ fullName: m.name, phoneNumber: m.phone, idCardNumber: m.idCard, email: m.email || undefined } as any);
          const mid = mr?.id ?? mr?.residentId ?? mr?.data?.id;
          if (!mid) {
            throw new Error(`Không thể tạo cư dân thành viên: ${m.name}`);
          }
          memberResidentIds.push(mid);
          if (m.email) {
            memberEmailMap.set(mid, m.email); // Store email for later use
          }
        } catch (memberErr: any) {
          throw new Error(memberErr?.message || `Không thể tạo cư dân thành viên: ${m.name}`);
        }
      }

      // Calculate expected end date
      const end = new Date(startDate);
      end.setMonth(end.getMonth() + parseInt(durationMonths));

      // Build residents array
      const residentsPayload: any[] = [];
      if (tenantResidentId) {
        residentsPayload.push({ 
          residentId: tenantResidentId, 
          residencyRole: 'Người thuê chính', 
          fromDate: startDate,
          email: tenantEmail.trim() || undefined
        });
      }
      memberResidentIds.forEach(mid => {
        const email = memberEmailMap.get(mid);
        residentsPayload.push({ 
          residentId: mid, 
          residencyRole: 'Thành viên', 
          fromDate: startDate,
          email: email || undefined
        });
      });

      await contractService.create({
        roomId: parseInt(selectedRoomId),
        startDate,
        expectedEndDate: formatLocalDateInput(end),
        actualRentPrice: parseFloat(monthlyRent.replace(/[^0-9.]/g, '')),
        depositAmount: deposit ? parseFloat(deposit.replace(/[^0-9.]/g, '')) : undefined,
        depositPaid,
        selectedServiceIds,
        billingFormulaItems: formulaRows.map((row) => ({
          sortOrder: row.sortOrder,
          itemType: row.itemType,
          serviceId: row.serviceId,
          serviceName: row.serviceName,
          unitPrice: row.unitPrice,
          quantity: row.quantityExpression === 'n' ? null : getRowQuantity(row),
          quantityExpression: row.quantityExpression === 'n' ? 'n' : String(getRowQuantity(row) ?? 0),
        })),
        residents: residentsPayload,
      } as any);

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Tạo hợp đồng mới</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Step 1: Room Selection */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <Home size={16} className="mr-2" />
              BƯỚC 1: Chọn phòng
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tòa nhà *</label>
                <select
                  value={selectedBuildingId}
                  onChange={e => { setSelectedBuildingId(e.target.value); setSelectedRoomId(''); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                >
                  <option value="">Chọn tòa nhà...</option>
                  {buildings.map((b: any) => (
                    <option key={b.id ?? b.buildingId} value={b.id ?? b.buildingId}>{b.buildingName ?? b.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  disabled={!selectedBuildingId}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 disabled:bg-gray-100"
                >
                  <option value="">Chọn phòng...</option>
                  {rooms.map((r: any) => {
                    const id = r.id ?? r.roomId;
                    const code = r.roomCode ?? r.code ?? r.name;
                    const area = r.area ? ` - ${r.area}m²` : '';
                    const status = r.status ?? '';
                    const isEmpty = status === 'Trống' || status === '' || status === 'empty';
                    return <option key={id} value={id} disabled={!isEmpty}>{code}{area} ({isEmpty ? '✅ Trống' : status})</option>;
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  🔗 Danh sách phòng từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà</strong>
                </p>
              </div>
            </div>

          </div>

          {/* Step 2: Head of Household */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <User size={16} className="mr-2" />
              BƯỚC 2: Thông tin chủ hộ (Người ký hợp đồng)
            </h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input type="radio" name="tenantType" id="newTenant" checked={tenantType === 'new'} onChange={() => { setTenantType('new'); setSelectedResidentId(''); setFieldErrors({}); }} className="w-4 h-4" />
                <label htmlFor="newTenant" className="text-sm text-gray-700 font-bold">Cư dân mới (Tự động tạo tài khoản)</label>
              </div>

              <div className="grid grid-cols-2 gap-4 ml-7">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
                  <input 
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={tenantName}
                    onChange={e => handleNameInput(e.target.value)}
                    disabled={tenantType !== 'new'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                  {fieldErrors.tenantName && <p className="mt-1 text-xs text-red-600">{fieldErrors.tenantName}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
                  <input 
                    type="text"
                    placeholder="VD: 001234567890"
                    value={tenantIdCard}
                    onChange={e => handleDigitsInput('tenantIdCard', e.target.value, setTenantIdCard, 'CMND/CCCD', 12)}
                    inputMode="numeric"
                    maxLength={12}
                    disabled={tenantType !== 'new'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                  {fieldErrors.tenantIdCard && <p className="mt-1 text-xs text-red-600">{fieldErrors.tenantIdCard}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
                  <input 
                    type="text"
                    placeholder="VD: 0912345678"
                    value={tenantPhone}
                    onChange={e => handleDigitsInput('tenantPhone', e.target.value, setTenantPhone, 'số điện thoại', 10)}
                    inputMode="numeric"
                    maxLength={10}
                    disabled={tenantType !== 'new'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                  {fieldErrors.tenantPhone && <p className="mt-1 text-xs text-red-600">{fieldErrors.tenantPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Email</label>
                  <input 
                    type="email"
                    placeholder="VD: email@example.com"
                    value={tenantEmail}
                    onChange={e => handleEmailInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  />
                  {fieldErrors.tenantEmail && <p className="mt-1 text-xs text-red-600">{fieldErrors.tenantEmail}</p>}
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="tenantType" id="existingTenant" checked={tenantType === 'existing'} onChange={() => { setTenantType('existing'); setFieldErrors({}); }} className="w-4 h-4" />
                  <label htmlFor="existingTenant" className="text-sm text-gray-700 font-bold">Chọn từ cư dân đã có</label>
                </div>
                {tenantType === 'existing' && (
                  <>
                    <div className="mt-3 rounded border border-gray-300 bg-white p-3" style={{ marginLeft: '28px', width: 'calc(100% - 28px)' }}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-xs font-bold text-gray-800">Danh sách cư dân</p>
                          <p className="text-xs text-gray-500">Chọn một cư dân có sẵn để làm chủ hộ hợp đồng</p>
                        </div>
                        <span className="text-xs text-gray-600 bg-gray-100 border border-gray-300 px-2 py-1 rounded whitespace-nowrap">
                          {filteredResidents.length}/{residents.length} cư dân
                        </span>
                      </div>

                      <input
                        type="text"
                        value={residentSearch}
                        onChange={(e) => setResidentSearch(e.target.value)}
                        placeholder="Tìm theo tên, SĐT, CCCD, phòng..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500 mb-3"
                      />

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {filteredResidents.length === 0 ? (
                          <div className="text-center text-sm text-gray-500 py-6 bg-gray-50 border border-dashed border-gray-300 rounded">
                            Không tìm thấy cư dân phù hợp
                          </div>
                        ) : (
                          filteredResidents.map((resident: any) => {
                            const residentId = String(resident.id);
                            const isSelected = selectedResidentId === residentId;
                            const name = resident.fullName || resident.hoTen || 'Chưa có tên';
                            const phone = resident.phoneNumber || resident.soDienThoai || 'Chưa có SĐT';
                            const idCard = resident.idCardNumber || resident.soCCCD || 'Chưa có CCCD';
                            const roomCode = resident.roomCode || resident.soPhong || 'Chưa có phòng';

                            return (
                              <button
                                key={resident.id}
                                type="button"
                                onClick={() => setSelectedResidentId(residentId)}
                                className={`w-full text-left rounded border px-3 py-3 transition-colors ${
                                  isSelected
                                    ? 'border-gray-800 bg-gray-100'
                                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                                    {isSelected && (
                                      <span className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded whitespace-nowrap">Đã chọn</span>
                                    )}
                                  </div>
                                  <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-gray-600">
                                    <span className="truncate">SĐT: {phone}</span>
                                    <span className="truncate">CCCD: {idCard}</span>
                                    <span className="truncate">Phòng: {roomCode}</span>
                                  </div>
                                  {resident.email && (
                                    <p className="text-xs text-blue-600 mt-1 truncate">{resident.email}</p>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2" style={{ marginLeft: '28px' }}>
                      🔗 Danh sách đồng bộ từ <strong>Cư dân & Hợp đồng → Danh sách Cư dân</strong>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 2B: Family Members */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm text-gray-800 font-bold flex items-center">
                <Users size={16} className="mr-2" />
                BƯỚC 2B: Thành viên cùng ở (Không bắt buộc)
              </h4>
              <button className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 flex items-center space-x-1" onClick={() => setShowAddMemberModal(true)}>
                <Plus size={14} />
                <span>Thêm thành viên</span>
              </button>
            </div>

            {/* Member List */}
            {familyMembers.length > 0 ? (
              <div className="space-y-2">
                {familyMembers.map(member => (
                  <div key={member.id} className="bg-white border border-gray-300 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-800 font-bold">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.relationship}</p>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Xóa thành viên" onClick={() => handleRemoveMember(member.id)}>
                        <X size={16} className="text-red-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">SĐT:</span>
                        <span className="text-gray-800 ml-1 font-bold">{member.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CMND:</span>
                        <span className="text-gray-800 ml-1 font-bold">{member.idCard}</span>
                      </div>
                      {member.email && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-gray-800 ml-1">{member.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center text-gray-500">
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Chưa có thành viên nào</p>
                <p className="text-xs mt-1">Nhấn "Thêm thành viên" để bắt đầu</p>
              </div>
            )}
          </div>

          {/* Step 3: Contract Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <Calendar size={16} className="mr-2" />
              BƯỚC 3: Điều khoản hợp đồng
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Mã hợp đồng</label>
                <input 
                  type="text"
                  value={contractCodePreview}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100 focus:outline-none"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ngày bắt đầu *</label>
                <DateTextInput
                  value={startDate}
                  onChange={setStartDate}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Thời hạn *</label>
                <div className="flex items-center gap-2">
                  <select
                    value={durationMonths}
                    onChange={e => {
                      setDurationMonths(e.target.value);
                      setFieldError('durationMonths');
                      if (appliedCustomDurationMonths && e.target.value !== appliedCustomDurationMonths) {
                        setAppliedCustomDurationMonths('');
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  >
                    {durationOptions.map((m) => (
                      <option key={m} value={String(m)}>{m % 12 === 0 ? `${m / 12} năm` : `${m} tháng`}</option>
                    ))}
                    {appliedCustomDurationMonths && !durationOptions.includes(parseInt(appliedCustomDurationMonths, 10)) && (
                      <option value={appliedCustomDurationMonths}>
                        {Number(appliedCustomDurationMonths) % 12 === 0
                          ? `${Number(appliedCustomDurationMonths) / 12} năm (tùy chọn)`
                          : `${appliedCustomDurationMonths} tháng (tùy chọn)`}
                      </option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomDurationInput(v => !v)}
                    className="px-2.5 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    title="Thêm thời hạn mới"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {showCustomDurationInput && (
                  <div className="mt-2 flex items-center gap-2 justify-center">
                    <input
                      type="number"
                      min={1}
                      value={customDurationValue}
                      onChange={e => handleDigitsInput('customDurationValue', e.target.value, setCustomDurationValue, 'thời hạn')}
                      inputMode="numeric"
                      placeholder="Thời hạn"
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                    <select
                      value={customDurationUnit}
                      onChange={e => setCustomDurationUnit(e.target.value as 'months' | 'years')}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    >
                      <option value="months">tháng</option>
                      <option value="years">năm</option>
                    </select>
                    <button
                      type="button"
                      onClick={addCustomDuration}
                      className="px-5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                      style={{ whiteSpace: 'nowrap', minWidth: 80 }}
                    >
                      Áp dụng
                    </button>
                  </div>
                )}
                {fieldErrors.durationMonths && <p className="mt-1 text-xs text-red-600">{fieldErrors.durationMonths}</p>}
                {fieldErrors.customDurationValue && <p className="mt-1 text-xs text-red-600">{fieldErrors.customDurationValue}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tiền thuê/tháng *</label>
                <MoneyInput value={monthlyRent} onChange={(value) => { setMonthlyRent(value); setFieldError('monthlyRent'); }} defaultScale="million" />
                {fieldErrors.monthlyRent && <p className="mt-1 text-xs text-red-600">{fieldErrors.monthlyRent}</p>}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm text-gray-700">Tiền cọc</label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={depositPaid}
                      onChange={(event) => setDepositPaid(event.target.checked)}
                      className="h-4 w-4"
                    />
                    <span>Đã nộp tiền cọc</span>
                  </label>
                </div>
                <MoneyInput value={deposit} onChange={(value) => { setDeposit(value); setFieldError('deposit'); }} defaultScale="million" />
                {fieldErrors.deposit && <p className="mt-1 text-xs text-red-600">{fieldErrors.deposit}</p>}
                {depositPaid && (
                  <p className="mt-1.5 text-xs text-green-700">
                    Đã ghi nhận tiền cọc, cư dân không cần nộp thêm.
                  </p>
                )}
                {!depositPaid && toNumber(deposit) > 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Tiền cọc sẽ được cộng một lần vào hóa đơn tháng đầu của hợp đồng.
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Hạn thanh toán hàng tháng đang dùng chung theo cấu hình hệ thống cho tất cả phòng.
            </p>
          </div>

          {/* Step 4: Services */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3 flex items-center">
              <DollarSign size={16} className="mr-2" />
              BƯỚC 4: Danh mục đơn giá áp dụng
            </h4>

            <div className="space-y-2">
              {availablePricingCatalog.length > 0 ? (
                availablePricingCatalog.map((service: any) => {
                  const serviceId = Number(service.id ?? service.serviceId ?? 0);
                  const isSelected = selectedServiceIds.includes(serviceId);
                  const fieldName = `serviceQuantity-${serviceId}`;
                  return (
                    <div key={serviceId} className="bg-white border border-gray-200">
                      <button
                        type="button"
                        onClick={() => toggleServiceSelection(serviceId)}
                        className="w-full flex items-start justify-between gap-3 p-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span className="cursor-pointer text-left">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="pointer-events-none h-4 w-4 shrink-0"
                            />
                            <span>{service.name || service.serviceName || 'Dịch vụ'}</span>
                          </span>
                          <span className="block pl-6 text-xs text-gray-500">Cập nhật giá: {formatServicePriceUpdatedAt(service)}</span>
                          {isMeterService(service) && (
                            <span className="block pl-6 text-xs text-amber-700">
                              Giá sẽ tự động thay đổi theo giá thị trường.
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-bold text-gray-800">
                            {getCurrentServicePrice(service).toLocaleString('vi-VN')} VNĐ{service.unit ? `/${service.unit}` : ''}
                          </span>
                          {getScheduledServicePriceLabel(service) && (
                            <span className="mt-1 block text-xs font-normal text-amber-700">
                              Sắp áp dụng: {getScheduledServicePriceLabel(service)}
                            </span>
                          )}
                        </span>
                      </button>
                      {isSelected && requiresManualQuantity(service) && (
                        <label className="flex items-start justify-between gap-4 border-t border-gray-200 px-3 py-2">
                          <span className="pt-2 text-sm text-gray-700">Số lượng</span>
                          <span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={serviceQuantities[serviceId] ?? '1'}
                              onChange={(event) => {
                                const quantity = event.target.value.replace(/\D/g, '');
                                setServiceQuantities((current) => ({ ...current, [serviceId]: quantity }));
                                setFieldError(fieldName);
                              }}
                              inputMode="numeric"
                              className="w-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                            />
                            {fieldErrors[fieldName] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[fieldName]}</span>}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">Chưa có dữ liệu danh mục đơn giá cho tòa này.</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔗 Đơn giá đồng bộ từ <strong>Quản lý Hạ tầng → Dịch vụ & Đơn giá</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Đã chọn: <strong>{selectedServiceIds.length}</strong> danh mục (tùy chọn)
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">BƯỚC 5: Công thức hóa đơn cuối tháng</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Dịch vụ</th>
                    <th className="px-3 py-2 text-right border-b border-gray-200">Đơn giá</th>
                    <th className="px-3 py-2 text-center border-b border-gray-200">Số lượng</th>
                    <th className="px-3 py-2 text-left border-b border-gray-200">Công thức</th>
                    <th className="px-3 py-2 text-right border-b border-gray-200">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {formulaRows.map((row) => (
                    <tr key={row.key} className="bg-white">
                      <td className="px-3 py-2 border-b border-gray-100">{row.serviceName}</td>
                      <td className="px-3 py-2 text-right border-b border-gray-100">{row.unitPrice.toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2 text-center border-b border-gray-100">
                        {row.quantityExpression === 'n' ? (
                          <span className="font-bold">n</span>
                        ) : row.quantityMode === 'manual' ? (
                          <span className="font-bold text-blue-700">{getRowQuantity(row)}</span>
                        ) : row.quantityMode === 'person' ? (
                          <span className="font-bold text-blue-700">{getRowQuantity(row)}</span>
                        ) : (
                          <span className="font-bold text-gray-700">1</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100 text-gray-700">{getRowFormulaText(row)}</td>
                      <td className="px-3 py-2 text-right border-b border-gray-100">{getFormulaTotalText(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 bg-white border border-gray-200 rounded p-3">
              <p className="text-xs text-gray-600 mb-1">Công thức hóa đơn tháng (để kiểm tra):</p>
              <p className="text-sm text-gray-800 font-medium break-words">
                {monthlyFormulaExpression || '(chưa có công thức)'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Công thức sẽ được lưu theo hợp đồng/phòng và áp dụng khi tính hóa đơn nháp mỗi tháng.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <Check size={16} />
            <span>Tạo hợp đồng ({1 + familyMembers.length} người)</span>
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && createPortal(
        <AddFamilyMemberModal onClose={() => setShowAddMemberModal(false)} onAdd={handleAddMember} />,
        document.body,
      )}
    </div>
  );
}

// Add Family Member Modal Component
function AddFamilyMemberModal({ onClose, onAdd }: { onClose: () => void, onAdd: (member: Omit<FamilyMember, 'id'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Vợ/Chồng',
    phone: '',
    idCard: '',
    email: '',
    avatar: '👤'
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  };

  const handleNameChange = (value: string) => {
    setFormData((current) => ({ ...current, name: value }));
    if (value.trim() && !/^[\p{L}\p{M}\s.'-]+$/u.test(value.trim())) {
      setFieldError('name', 'Sai định dạng. Họ tên chỉ được nhập chữ và khoảng trắng');
      return;
    }
    clearFieldError('name');
  };

  const handleDigitsChange = (field: 'phone' | 'idCard', value: string, maxLength: number, label: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, maxLength);
    setFormData((current) => ({ ...current, [field]: digitsOnly }));

    if (value !== value.replace(/\D/g, '')) {
      setFieldError(field, `Sai định dạng. Vui lòng chỉ nhập số cho ${label}`);
      return;
    }
    clearFieldError(field);
  };

  const handleEmailChange = (value: string) => {
    const trimmed = value.trim();
    setFormData((current) => ({ ...current, email: trimmed }));
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('email', 'Sai định dạng. Vui lòng nhập đúng định dạng email');
      return;
    }
    clearFieldError('email');
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    const name = formData.name.trim().replace(/\s+/g, ' ');

    if (!name) {
      nextErrors.name = 'Vui lòng nhập họ và tên';
    } else if (!/^[\p{L}\p{M}\s.'-]+$/u.test(name)) {
      nextErrors.name = 'Sai định dạng. Họ tên chỉ được nhập chữ và khoảng trắng';
    }
    if (!/^0\d{9}$/.test(formData.phone)) {
      nextErrors.phone = 'Sai định dạng. Số điện thoại phải gồm 10 số và bắt đầu bằng 0';
    }
    if (!/^\d{9}$|^\d{12}$/.test(formData.idCard)) {
      nextErrors.idCard = 'Sai định dạng. CMND/CCCD phải gồm 9 hoặc 12 số';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Sai định dạng. Vui lòng nhập đúng định dạng email';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onAdd({
      ...formData,
      name,
      email: formData.email.trim(),
    });
  };

  const relationshipOptions = [
    { value: 'Vợ/Chồng', label: 'Vợ/Chồng', avatar: '👤' },
    { value: 'Con', label: 'Con', avatar: '👶' },
    { value: 'Mẹ/Bố', label: 'Mẹ/Bố', avatar: '👵' },
    { value: 'Anh/Chị/Em', label: 'Anh/Chị/Em', avatar: '👤' },
    { value: 'Ông/Bà', label: 'Ông/Bà', avatar: '👴' },
    { value: 'Khác', label: 'Khác', avatar: '👤' }
  ];

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Thêm thành viên cùng ở</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">

          <div>
            <label className="block text-sm text-gray-700 mb-2">Mối quan hệ với chủ hộ *</label>
            <select 
              value={formData.relationship}
              onChange={(e) => {
                const selected = relationshipOptions.find(opt => opt.value === e.target.value);
                setFormData({ ...formData, relationship: e.target.value, avatar: selected?.avatar || '👤' });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            >
              {relationshipOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.avatar} {opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                placeholder="VD: Trần Thị B"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="VD: 001234567891"
                value={formData.idCard}
                onChange={(e) => handleDigitsChange('idCard', e.target.value, 12, 'CMND/CCCD')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              {fieldErrors.idCard && <p className="mt-1 text-xs text-red-600">{fieldErrors.idCard}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="VD: 0923456789"
                value={formData.phone}
                onChange={(e) => handleDigitsChange('phone', e.target.value, 10, 'Số điện thoại')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dùng để đăng nhập App cư dân</p>
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email (Tùy chọn)</label>
              <input 
                type="email"
                placeholder="VD: tranthib@email.com"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Thêm thành viên</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function ViewContractModal({ contract, onClose }: ContractModalProps) {
  const [contractDetail, setContractDetail] = useState<any>(contract ?? null);
  const [roomDetail, setRoomDetail] = useState<any>(null);
  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [currentDebt, setCurrentDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetailData = async () => {
      if (!contract?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch full contract detail to get billingFormulaJson and other fields
        const detail = await contractService.getById(Number(contract.id));
        setContractDetail(detail);

        const roomId = detail?.roomId || contract?.roomId;
        if (roomId) {
          try {
            const roomData = await roomService.getById(Number(roomId));
            setRoomDetail(roomData);
          } catch (e) {
            console.error('Error fetching room detail:', e);
          }
        }

        try {
          const invoices = await invoiceService.getAll();
          const relatedInvoices = (invoices || []).filter((inv: any) => {
            const cid = Number(inv.contractId || inv.hopDongId || 0);
            const rid = Number(inv.roomId || inv.phongId || 0);
            return cid === Number(contract.id) || (roomId && rid === Number(roomId));
          });

          const paid = relatedInvoices.reduce((sum: number, inv: any) => sum + Number(inv.paidAmount || 0), 0);
          const total = relatedInvoices.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || 0), 0);
          
          setTotalPaid(paid);
          setCurrentDebt(total - paid);
        } catch (e) {
          console.error('Error calculating financial data:', e);
        }

        let currentContractServices: any[] = [];
        try {
          currentContractServices = await serviceService.getByContract(Number(contract.id)) || [];
        } catch (serviceError) {
          console.error('Error fetching current contract service prices:', serviceError);
        }

        // Giữ cấu trúc công thức đã ký nhưng ghép giá dịch vụ hiện hành từ API.
        if (detail?.billingFormulaJson) {
          try {
            const formula = typeof detail.billingFormulaJson === 'string' 
              ? JSON.parse(detail.billingFormulaJson)
              : detail.billingFormulaJson;
            
            if (Array.isArray(formula)) {
              // Extract all service items (DichVu, Dien, Nuoc) - exclude TienPhong (room rent)
              const serviceItems = formula.filter((item: any) => 
                item.itemType !== 'TienPhong' && (item.serviceId || item.serviceName)
              );
              const formulaServices = Array.from(
                new Map(serviceItems.map((item: any) => [
                  item.serviceId || `${item.itemType}-${item.serviceName}`,
                  {
                    serviceId: item.serviceId || 0,
                    serviceName: item.serviceName || item.itemType,
                    commonUnitPrice: item.unitPrice,
                    unitPrice: item.unitPrice,
                    itemType: item.itemType,
                  }
                ])).values()
              ) as any[];
              const mergedServices = formulaServices.map((formulaService: any) => {
                const currentService = currentContractServices.find((service: any) =>
                  Number(service.serviceId ?? service.id) === Number(formulaService.serviceId),
                );
                return currentService
                  ? { ...formulaService, ...currentService, itemType: formulaService.itemType }
                  : formulaService;
              });
              setActiveServices(mergedServices);
            } else {
              setActiveServices(currentContractServices);
            }
          } catch (e) {
            console.error('Error parsing billing formula for services:', e);
            setActiveServices(currentContractServices);
          }
        } else {
          setActiveServices(currentContractServices);
        }
      } catch (e) {
        console.error('Error loading contract details:', e);
        setContractDetail(contract);
      } finally {
        setLoading(false);
      }
    };

    loadDetailData();
  }, [contract?.id]);

  const fmtCurrency = (v: any) => Number(v ?? 0).toLocaleString('vi-VN');
  const formatDateVi = (v: any) => {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return formatDisplayDate(d);
  };

  const displayCode = contractDetail?.code || contractDetail?.contractCode || contractDetail?.maHopDong || contract?.code || '-';
  const displayRoom = contractDetail?.room || contractDetail?.roomNumber || contractDetail?.soPhong || contract?.room || '-';
  const displayFloorNumber = roomDetail?.floorNumber
    ?? roomDetail?.FloorNumber
    ?? roomDetail?.floor?.floorNumber
    ?? '';
  const displayBuildingName = roomDetail?.buildingName
    ?? roomDetail?.BuildingName
    ?? roomDetail?.floor?.building?.buildingName
    ?? '';
  const displayBuildingAddress = roomDetail?.buildingAddress
    ?? roomDetail?.BuildingAddress
    ?? roomDetail?.address
    ?? roomDetail?.floor?.building?.address
    ?? '';
  const displayStartDate = contractDetail?.startDate ? formatDateVi(contractDetail.startDate) : contract?.startDate || '-';
  const displayEndDate = contractDetail?.expectedEndDate
    ? formatDateVi(contractDetail.expectedEndDate)
    : (contractDetail?.endDate ? formatDateVi(contractDetail.endDate) : (contract?.endDate || '-'));
  const displayRent = contractDetail?.monthlyRent ?? contractDetail?.actualRentPrice ?? contract?.monthlyRent ?? 0;
  const displayDeposit = contractDetail?.deposit ?? contractDetail?.depositAmount ?? contract?.deposit ?? 0;
  const depositPaidValue = contractDetail?.depositPaid ?? contractDetail?.DepositPaid ?? contract?.depositPaid ?? false;
  const displayDepositPaid = depositPaidValue === true || String(depositPaidValue).toLowerCase() === 'true';
  const depositStatus = Number(displayDeposit) <= 0
    ? 'Không yêu cầu'
    : displayDepositPaid
      ? 'Đã trả'
      : 'Chưa trả';
  const paidDepositAmount = displayDepositPaid ? Number(displayDeposit) : 0;
  const residentList: any[] = Array.isArray(contractDetail?.residents)
    ? contractDetail.residents
    : (Array.isArray(contract?.residents) ? contract.residents : []);
  const headOfHousehold = residentList.find((r: any) => r.residencyRole === 'Người thuê chính') || residentList[0];

  const getResidentName = (r: any) => r?.fullName || r?.hoTen || 'Không rõ';
  const getResidentPhone = (r: any) => r?.phoneNumber || r?.soDienThoai || '---';
  const getResidentIdCard = (r: any) => r?.idCardNumber || r?.soCCCD || '---';

  if (loading) {
    return (
      <div className="admin-content-modal-overlay">
        <div className="bg-white rounded-lg w-[400px] p-10 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-gray-600">Đang tải chi tiết hợp đồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Eye size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chi tiết hợp đồng - {displayCode}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-blue-900">
              <Home size={17} className="shrink-0" />
              <span>{displayRoom}</span>
              <span>-</span>
              <span>Tầng {displayFloorNumber || '—'}</span>
              <span>-</span>
              <span>{displayBuildingName || '—'}</span>
              <span>-</span>
              <span>{displayBuildingAddress || '—'}</span>
            </div>
          </div>

          {/* Status Alert */}
          {contract?.status === 'expired' && (
            <div className="bg-red-50 border border-red-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-bold mb-1">⚠️ Hợp đồng đã quá hạn {Math.abs(contract.daysLeft)} ngày!</p>
                <p className="text-sm text-red-700">Vui lòng liên hệ cư dân để gia hạn hoặc thanh lý hợp đồng.</p>
              </div>
            </div>
          )}

          {contract?.status === 'ended' && (
            <div className="bg-gray-50 border border-gray-300 rounded p-4 flex items-start space-x-3">
              <Check size={24} className="text-gray-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-800 font-bold mb-1">Hợp đồng đã tất toán/thanh lý</p>
                <p className="text-sm text-gray-700">Trạng thái hợp đồng đã kết thúc.</p>
              </div>
            </div>
          )}

          {contract?.status === 'danger' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-4 flex items-start space-x-3">
              <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-bold mb-1">⚠️ Hợp đồng sắp hết hn (còn {contract.daysLeft} ngày)</p>
                <p className="text-sm text-yellow-700">Nên liên hệ cư dân để chuẩn bị gia hạn.</p>
              </div>
            </div>
          )}

          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin hợp đồng</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã hợp đồng:</span>
                    <span className="text-gray-800 font-bold">{displayCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phòng:</span>
                    <span className="text-gray-800 font-bold">{displayRoom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày bắt đầu:</span>
                    <span className="text-gray-800">{displayStartDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày kết thúc:</span>
                    <span className="text-gray-800">{displayEndDate}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`font-bold ${
                      contract?.status === 'active' ? 'text-green-700' : 
                      contract?.status === 'ended' ? 'text-gray-700' :
                      contract?.status === 'expired' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {contract?.status === 'active' ? 'Đang hoạt động' :
                       contract?.status === 'ended' ? 'Đã hết' :
                       contract?.status === 'expired' ? `Quá hạn ${Math.abs(contract.daysLeft)} ngày` :
                       `Còn ${contract?.daysLeft} ngày`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-gray-600">Thành viên trong hộ</h4>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">{residentList.length} người</span>
                </div>
                
                {/* Head of Household */}
                <div className="space-y-2">
                  {headOfHousehold && (
                    <div className="bg-white border border-gray-300 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-800 font-bold">{getResidentName(headOfHousehold)}</p>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300">Chủ hộ</span>
                          </div>
                          <p className="text-xs text-gray-600">{getResidentPhone(headOfHousehold)} • {getResidentIdCard(headOfHousehold)}</p>
                          {headOfHousehold.email && <p className="text-xs text-blue-600">{headOfHousehold.email}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {residentList.filter((r: any) => r !== headOfHousehold).map((member: any, idx: number) => (
                    <div key={member.id || member.residentId || idx} className="bg-white border border-gray-300 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-700">{getResidentName(member)}</p>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">{member.residencyRole || 'Thành viên'}</span>
                          </div>
                          <p className="text-xs text-gray-600">{getResidentPhone(member)}</p>
                          {member.email && <p className="text-xs text-blue-600">{member.email}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                  🔗 Tất cả thành viên có tài khoản trong <strong>Danh sách Cư dân</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Chi phí</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền thuê/tháng:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(displayRent)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền cọc theo hợp đồng:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(displayDeposit)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái tiền cọc:</span>
                    <span className={`font-bold ${
                      Number(displayDeposit) <= 0
                        ? 'text-gray-600'
                        : displayDepositPaid
                          ? 'text-green-700'
                          : 'text-amber-700'
                    }`}>
                      {depositStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiền cọc đã trả:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(paidDepositAmount)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thanh toán:</span>
                    <span className="text-gray-800">Ngày 5 hàng tháng</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Công thức tính hóa đơn hàng tháng</h4>
                <div className="space-y-2 text-sm">
                  {(contractDetail?.billingFormulaJson || contractDetail?.BillingFormulaJson) ? (
                    (() => {
                      try {
                        // Support both camelCase and PascalCase from backend
                        const formulaJson = contractDetail.billingFormulaJson || contractDetail.BillingFormulaJson;
                        const formula = typeof formulaJson === 'string' 
                          ? JSON.parse(formulaJson)
                          : formulaJson;
                        
                        const items = Array.isArray(formula) ? formula : [];
                        
                        return items.length > 0 ? (
                          <>
                            {items.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item: any, idx: number) => {
                              const qtyText = item.quantityExpression === 'n' || !item.quantity 
                                ? 'n' 
                                : item.quantity;
                              const linkedService = activeServices.find((service: any) =>
                                Number(service.serviceId ?? service.id) === Number(item.serviceId),
                              );
                              const displayedUnitPrice = linkedService && isMeterService(item)
                                ? getCurrentServicePrice(linkedService)
                                : Number(item.unitPrice || 0);
                              const unitPrice = fmtCurrency(displayedUnitPrice);
                              const scheduledPriceLabel = linkedService && isMeterService(item)
                                ? getScheduledServicePriceLabel(linkedService)
                                : null;
                              
                              return (
                                <div key={idx} className="py-1">
                                  <div className="flex justify-between items-start">
                                    <span className="text-gray-700 flex-1">
                                      {idx + 1}. {item.serviceName || item.itemType}
                                    </span>
                                    <span className="text-gray-800 font-mono text-right">
                                      {unitPrice} × {qtyText}
                                    </span>
                                  </div>
                                  {isMeterService(item) && (
                                    <>
                                      {scheduledPriceLabel && (
                                        <p className="mt-0.5 text-xs text-amber-700">
                                          Sắp áp dụng: {scheduledPriceLabel}
                                        </p>
                                      )}
                                      <p className="mt-0.5 text-xs text-amber-700">
                                        Giá sẽ tự động thay đổi theo giá thị trường.
                                      </p>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                            <div className="border-t border-gray-300 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-800 font-bold">Tổng cộng</span>
                                <span className="text-blue-700 font-bold">= Σ (Đơn giá × Số lượng)</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 pt-2 border-t border-gray-300 mt-2">
                              💡 <strong>n</strong> = Số lượng thực tế sử dụng trong tháng (điện, nước: từ chỉ số đồng hồ)
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">Công thức trống</p>
                        );
                      } catch (e) {
                        console.error('Error parsing billing formula:', e);
                        return <p className="text-red-500 text-xs">Lỗi khi đọc công thức</p>;
                      }
                    })()
                  ) : (
                    <p className="text-gray-500 text-xs">
                      Sử dụng công thức mặc định từ danh sách dịch vụ đang kích hoạt
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Dịch vụ đang sử dụng</h4>
                <div className="space-y-2 text-sm">
                  {activeServices.length > 0 ? (
                    activeServices.map((service: any) => (
                      <div key={service.serviceId || service.id || service.name} className="flex justify-between items-start gap-3">
                        <span className="text-gray-700">
                          <span className="block">{service.serviceName || service.name || 'Dịch vụ'}</span>
                          <span className="block text-xs text-gray-500">Cập nhật giá: {formatServicePriceUpdatedAt(service)}</span>
                          {isMeterService(service) && (
                            <span className="block text-xs text-amber-700">
                              Giá sẽ tự động thay đổi theo giá thị trường.
                            </span>
                          )}
                        </span>
                        <span className="text-right">
                          <span className="block font-bold text-gray-800">
                            {fmtCurrency(getCurrentServicePrice(service))} VNĐ{service.unit ? `/${service.unit}` : ''}
                          </span>
                          {getScheduledServicePriceLabel(service) && (
                            <span className="mt-1 block text-xs text-amber-700">
                              Sắp áp dụng: {getScheduledServicePriceLabel(service)}
                            </span>
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Không có dữ liệu dịch vụ</p>
                  )}
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-300">
                    🔗 Đơn giá từ <strong>Dịch vụ & Đơn giá</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4">
                <h4 className="text-sm text-gray-600 mb-3">Thông tin thanh toán</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng đã thanh toán:</span>
                    <span className="text-green-700 font-bold">{fmtCurrency(totalPaid)} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Công nợ hiện tại:</span>
                    <span className={currentDebt > 0 ? 'text-red-700 font-bold' : 'text-gray-800'}>
                      {fmtCurrency(currentDebt)} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* Electricity Pricing */}
              {roomDetail?.electricityTiers && roomDetail.electricityTiers.length > 0 && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm text-gray-600 mb-3">⚡ Bảng giá điện</h4>
                  {roomDetail.electricityBasePrice && (
                    <div className="mb-3 pb-3 border-b border-gray-300">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Giá cơ bản:</span>
                        <span className="text-gray-800 font-bold">{fmtCurrency(roomDetail.electricityBasePrice)}/kWh</span>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-2 py-2 text-left text-gray-600 border-b border-gray-300">Bậc</th>
                          <th className="px-2 py-2 text-left text-gray-600 border-b border-gray-300">Khoảng (kWh)</th>
                          <th className="px-2 py-2 text-right text-gray-600 border-b border-gray-300">Đơn giá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomDetail.electricityTiers.map((tier: any) => (
                          <tr key={tier.tierNumber} className="border-b border-gray-200">
                            <td className="px-2 py-2 text-gray-700">{tier.tierNumber}</td>
                            <td className="px-2 py-2 text-gray-700">{tier.fromKwh} - {tier.toKwh || '∞'}</td>
                            <td className="px-2 py-2 text-right text-gray-800 font-bold">{fmtCurrency(tier.pricePerKwh)}/kWh</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Water Pricing */}
              {roomDetail?.waterPricePerCubicMeter && (
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <h4 className="text-sm text-gray-600 mb-3">💧 Giá nước</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đơn giá:</span>
                    <span className="text-gray-800 font-bold">{fmtCurrency(roomDetail.waterPricePerCubicMeter)}/m³</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room Details */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-600 mb-3">Thông tin phòng</h4>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Diện tích:</p>
                <p className="text-gray-800 font-bold">{roomDetail?.area ? `${roomDetail.area}m²` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Tầng:</p>
                <p className="text-gray-800 font-bold">{roomDetail?.floorNumber ? `Tầng ${roomDetail.floorNumber}` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Tòa nhà:</p>
                <p className="text-gray-800 font-bold">{roomDetail?.buildingName || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Trạng thái:</p>
                <p className="text-green-700 font-bold">{roomDetail?.status || '-'}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-gray-600 text-xs mb-2">Tiện nghi:</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(roomDetail?.assets) && roomDetail.assets.length > 0 ? (
                  roomDetail.assets.map((asset: any, idx: number) => (
                    <span key={asset.assetId || idx} className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">
                      {asset.assetName || 'Tài sản'}{asset.quantity ? ` (${asset.quantity})` : ''}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-1 bg-white border border-gray-300 text-xs rounded">Không có dữ liệu tài sản</span>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔗 Thông tin đồng bộ từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà & Quản lý kho tài sản</strong>
            </p>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-start sticky bottom-0 bg-white">
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2">
              <Printer size={16} />
              <span>In hợp đồng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrintContractModal({ contract, onClose }: ContractModalProps) {
  const residentList: any[] = Array.isArray(contract?.residents) ? contract.residents : [];
  const headOfHousehold = residentList.find((r: any) => r.residencyRole === 'Người thuê chính') || residentList[0];

  const getResidentName = (r: any) => r?.fullName || r?.hoTen || 'Không rõ';
  const getResidentPhone = (r: any) => r?.phoneNumber || r?.soDienThoai || '---';
  const getResidentIdCard = (r: any) => r?.idCardNumber || r?.soCCCD || '---';
  const getResidentEmail = (r: any) => r?.email || '---';

  return (
    <div className="admin-content-modal-overlay">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">In/Xuất hợp đồng - {contract?.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Export Options */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Chọn định dạng xuất:</h4>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Hợp đồng đầy đủ (PDF)</p>
                    <p className="text-xs text-gray-600">Bao gồm tất cả điều khoản, chữ ký số, đóng dấu</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">Bản tóm tắt (PDF)</p>
                    <p className="text-xs text-gray-600">Chỉ thông tin chính: Phòng, Cư dân, Thời hạn, Chi phí</p>
                  </div>
                </div>
                <FileText size={20} className="text-gray-600" />
              </label>

              <label className="flex items-center justify-between p-3 border border-gray-300 rounded cursor-pointer hover:bg-white">
                <div className="flex items-center space-x-3">
                  <input type="radio" name="exportFormat" className="w-4 h-4" />
                  <div>
                    <p className="text-sm text-gray-800 font-bold">File Word (DOCX)</p>
                    <p className="text-xs text-gray-600">Có thể chỉnh sửa trước khi in</p>
                  </div>
                </div>
                <Download size={20} className="text-gray-600" />
              </label>
            </div>
          </div>

          {/* Contract Preview */}
          <div className="bg-white border-2 border-gray-300 rounded p-6" style={{ minHeight: '400px' }}>
            <div className="text-center mb-6">
              <h2 className="text-xl text-gray-800 font-bold">HỢP ĐỒNG THUÊ PHÒNG</h2>
              <p className="text-sm text-gray-600 mt-2">Số: {contract?.code}</p>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-bold mb-2">BÊN CHO THUÊ (Bên A):</p>
                <p>Tên: CÔNG TY QUẢN LÝ CHUNG CƯ ABC</p>
                <p>Địa chỉ: 123 Đường XYZ, Quận ABC, TP.HCM</p>
                <p>Điện thoại: 0900123456</p>
              </div>

              <div>
                <p className="font-bold mb-2">BÊN THUÊ (Bên B):</p>
                <p>Họ tên: {headOfHousehold ? getResidentName(headOfHousehold) : contract?.tenant}</p>
                <p>CMND/CCCD: {headOfHousehold ? getResidentIdCard(headOfHousehold) : '---'}</p>
                <p>Điện thoại: {headOfHousehold ? getResidentPhone(headOfHousehold) : '---'}</p>
                <p>Email: {headOfHousehold ? getResidentEmail(headOfHousehold) : '---'}</p>
                <p className="mt-2 font-bold">Số người cùng ở: {residentList.length} người (Bao gồm chủ hộ)</p>
                {residentList.map((member: any, idx: number) => (
                  <p key={member.id || member.residentId || idx} className="ml-4">
                    {idx + 1}. {getResidentName(member)} ({member.residencyRole || 'Thành viên'}) - SĐT: {getResidentPhone(member)}
                  </p>
                ))}
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</p>
                <p>Bên A đồng ý cho Bên B thuê phòng <strong>{contract?.room}</strong></p>
                <p>Diện tích: <strong>50m²</strong>, Tầng <strong>1</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 2: THỜI HẠN THUÊ</p>
                <p>Từ ngày: <strong>{contract?.startDate}</strong></p>
                <p>Đến ngày: <strong>{contract?.endDate}</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 3: GIÁ CHO THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</p>
                <p>Tiền thuê: <strong>{contract?.monthlyRent} VNĐ/tháng</strong></p>
                <p>Tiền cọc: <strong>{contract?.deposit} VNĐ</strong></p>
                <p>Ngày thanh toán: <strong>Ngày 5 hàng tháng</strong></p>
              </div>

              <div>
                <p className="font-bold mb-2">ĐIỀU 4: DỊCH VỤ KÈM THEO</p>
                <p>• Quản lý chung cư: 25.000 VNĐ/m²</p>
                <p>• Tiền điện: 3.500 VNĐ/kWh</p>
                <p>• Tiền nước: 25.000 VNĐ/m³</p>
                <p>• Gửi xe máy: 100.000 VNĐ/tháng</p>
              </div>

              <p className="text-xs text-gray-500 text-center pt-4">
                (Còn 5 điều khoản nữa trong bản đầy đủ...)
              </p>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <h4 className="text-sm text-blue-800 font-bold mb-3">Tùy chọn bổ sung:</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Bao gồm chữ ký số của Ban quản lý</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Đóng dấu công ty (watermark)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-blue-800 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span>Gửi email bản PDF cho tất cả {residentList.length} thành viên</span>
              </label>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>In ngay</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Tải xuống PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
