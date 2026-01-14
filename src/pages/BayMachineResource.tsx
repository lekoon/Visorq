import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    Box,
    Cpu,
    Calendar,
    Search,
    CheckCircle2,
    Hammer,
    Map as MapIcon,
    List as ListIcon,
    TrendingUp,
    AlertTriangle,
    Activity,
    Zap,
    History,
    MoreVertical,
    CalendarDays,
    Settings2,
    LayoutDashboard,
    Info,
    ShieldCheck,
    Truck,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    AlarmClock,
    Plus,
    Trash2,
    Download,
    Upload
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    addDays,
    addMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isToday,
    subMonths
} from 'date-fns';
import { useStore } from '../store/useStore';
import type { BayResource, MachineResource, BaySize, ResourceBooking, ReplacementRecord, ResourceStatus } from '../types';

// --- Smart Utils ---
const getHealthColor = (health: number) => {
    if (health > 80) return 'text-emerald-500 bg-emerald-500/10';
    if (health > 50) return 'text-amber-500 bg-amber-500/10';
    return 'text-red-500 bg-red-500/10';
};

const calculateRiskScore = (resource: BayResource | MachineResource) => {
    let score = 0;
    if (resource.health < 30) score += 40;
    if (resource.status === 'maintenance') score += 20;
    if (resource.conflicts && resource.conflicts.length > 0) score += 40;
    const nextMaint = new Date(resource.nextMaintenance);
    const today = new Date();
    const daysUntilMaint = Math.ceil((nextMaint.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilMaint < 7) score += 30;
    return Math.min(score, 100);
};

// --- Mock Data ---
const MACHINE_MODELS = ['uCT 760', 'uCT 510', 'uCT 860', 'uMR 770', 'uMR 580', 'uX-ray 500'];
const PLATFORMS = ['Falcon', 'Eagle', 'Titan', 'Zeus'];

const MOCK_BAYS: BayResource[] = Array.from({ length: 16 }).map((_, i) => ({
    id: `bay-${i + 1}`,
    name: `Bay ${String(i + 1).padStart(2, '0')}`,
    size: (['S', 'M', 'L'] as BaySize[])[i % 3],
    status: 'available',
    currentProjectId: undefined,
    currentProjectName: undefined,
    currentMachineId: undefined,
    currentMachineName: undefined,
    health: 95 + Math.random() * 5,
    lastMaintenance: format(addMonths(new Date(), -1), 'yyyy-MM-dd'),
    nextMaintenance: format(addDays(new Date(), 30 + i), 'yyyy-MM-dd'),
    bookings: [],
    conflicts: [],
    replacementHistory: [],
    maintenancePlans: [],
    usageHistory: [],
    version: 1
} as any));

const MOCK_MACHINES: MachineResource[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `mach-${i + 1}`,
    name: `${MACHINE_MODELS[i % MACHINE_MODELS.length]} #${String(i + 1).padStart(2, '0')}`,
    model: MACHINE_MODELS[i % MACHINE_MODELS.length],
    platform: PLATFORMS[i % PLATFORMS.length],
    health: 98 + Math.random() * 2,
    status: 'available',
    currentProjectId: undefined,
    currentProjectName: undefined,
    currentBayId: undefined,
    currentBayName: undefined,
    lastMaintenance: format(addMonths(new Date(), -1), 'yyyy-MM-dd'),
    nextMaintenance: format(addDays(new Date(), 45 + i), 'yyyy-MM-dd'),
    bookings: [],
    conflicts: [],
    replacementHistory: [],
    maintenancePlans: [], // Start with no plans as per requirement
    usageHistory: [],
    version: 1
} as any));

const BayMachineResource: React.FC = () => {
    const {
        projects,
        user,
        physicalBays,
        physicalMachines,
        setPhysicalBays,
        setPhysicalMachines,
        updatePhysicalResource
    } = useStore();
    const [viewTab, setViewTab] = useState<'monitor' | 'risk' | 'maintenance' | 'calendar'>('monitor');
    const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
    const [resourceType, setResourceType] = useState<'bay' | 'machine'>('bay');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResource, setSelectedResource] = useState<BayResource | MachineResource | null>(null);

    // Use local state but sync with global store for initial data if needed
    const bays = physicalBays;
    const machines = physicalMachines;

    React.useEffect(() => {
        if (physicalBays.length === 0 && physicalMachines.length === 0) {
            setPhysicalBays(MOCK_BAYS);
            setPhysicalMachines(MOCK_MACHINES);
        }
    }, []);

    const setBays = (updater: any) => {
        const next = typeof updater === 'function' ? updater(physicalBays) : updater;
        setPhysicalBays(next);
    };

    const setMachines = (updater: any) => {
        const next = typeof updater === 'function' ? updater(physicalMachines) : updater;
        setPhysicalMachines(next);
    };
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
    const [calendarDetailTab, setCalendarDetailTab] = useState<'bay' | 'machine'>('bay');
    const [sizeFilter, setSizeFilter] = useState<'all' | BaySize>('all');
    const [platformFilter, setPlatformFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | ResourceStatus>('all');

    // Feishu Integration State
    const [showFeishuConnect, setShowFeishuConnect] = useState(false);
    const [isFeishuSyncing, setIsFeishuSyncing] = useState(false);

    // Permission Helpers
    const isPMO = user?.role === 'admin';
    const isPM = user?.role === 'manager';
    const isUser = user?.role === 'user';

    const canManageResource = (resource: BayResource | MachineResource) => {
        if (isPMO) {
            // PMO can manage unbooked resources (maintenance, etc)
            // If booked, they can oversee but usually PM manages the booking. 
            // The prompt says "PMO has management rights for unbooked machines".
            return resource.status !== 'occupied';
        }
        if (isPM || isUser) {
            // Manage only their own bookings. For mock, we check if current project matches.
            // Or if they are the one who reserved it. 
            const activeBooking = resource.bookings.find(b => b.status === 'active');
            return activeBooking?.reservedBy === user?.id || activeBooking?.reservedBy === 'currentUser';
        }
        return false;
    };

    const canBook = isPM || isUser || isPMO;

    // Action States
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [bookingData, setBookingData] = useState({
        projectId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd')
    });
    const [bookingExtra, setBookingExtra] = useState({
        reservedByName: user?.name || '',
        dept: '',
        purpose: '',
        statusChecked: false,
        bindToBayId: ''
    });

    // Tab Refreshing State
    const [isTabRefreshing, setIsTabRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>(format(new Date(), 'HH:mm:ss'));

    const handleTabChange = async (tab: typeof viewTab) => {
        if (tab === viewTab) return;

        setIsTabRefreshing(true);
        setViewTab(tab);

        // Simulate background data pull / real-time re-calculation
        await new Promise(resolve => setTimeout(resolve, 600));

        // Subtle randomization to simulate "latest" content
        if (tab === 'risk' || tab === 'maintenance') {
            setBays((prev: BayResource[]) => [...prev]); // Trigger re-memoization of risks/maint
            setMachines((prev: MachineResource[]) => [...prev]);
        }

        setLastSyncTime(format(new Date(), 'HH:mm:ss'));
        setIsTabRefreshing(false);
    };
    const [maintenanceLogData, setMaintenanceLogData] = useState({
        partName: '',
        reason: '',
        performedBy: user?.name || ''
    });
    const [maintenanceReservation, setMaintenanceReservation] = useState({
        type: 'routine' as any,
        description: '',
        date: format(addDays(new Date(), 1), 'yyyy-MM-dd')
    });
    const [maintScheduleOffset, setMaintScheduleOffset] = useState(0); // For swiping history
    const [showMaintSchedule, setShowMaintSchedule] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingNameValue, setEditingNameValue] = useState('');
    const [conflictError, setConflictError] = useState<string | null>(null);

    const [showAddResourceModal, setShowAddResourceModal] = useState(false);
    const [newResourceData, setNewResourceData] = useState({
        type: 'bay' as 'bay' | 'machine',
        name: '',
        size: 'S' as BaySize,
        model: '',
        platform: ''
    });

    const handleAddResource = () => {
        if (!isPMO) return;

        const id = newResourceData.type === 'bay' ? `bay-${Date.now()}` : `mach-${Date.now()}`;
        const commonData = {
            id,
            name: newResourceData.name || (newResourceData.type === 'bay' ? `New Bay ${bays.length + 1}` : `New Machine ${machines.length + 1}`),
            status: 'available' as ResourceStatus,
            health: 100,
            lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
            nextMaintenance: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
            bookings: [],
            conflicts: [],
            replacementHistory: [],
            maintenancePlans: [],
            usageHistory: [],
            version: 1
        };

        if (newResourceData.type === 'bay') {
            const newBay: BayResource = {
                ...commonData,
                size: newResourceData.size,
            } as BayResource;
            setBays((prev: BayResource[]) => [...prev, newBay]);
        } else {
            const newMachine: MachineResource = {
                ...commonData,
                model: newResourceData.model || 'Generic Model',
                platform: newResourceData.platform || 'General',
            } as MachineResource;
            setMachines((prev: MachineResource[]) => [...prev, newMachine]);
        }
        setShowAddResourceModal(false);
        setNewResourceData({ type: 'bay', name: '', size: 'S', model: '', platform: '' });
    };

    const handleDeleteResource = (id: string) => {
        if (!isPMO) return;
        if (!window.confirm('确定要删除此资源吗？该操作不可撤销。')) return;

        if (id.startsWith('bay')) {
            setBays((prev: BayResource[]) => prev.filter(b => b.id !== id));
        } else {
            setMachines((prev: MachineResource[]) => prev.filter(m => m.id !== id));
        }
        setSelectedResource(null);
    };

    // Editing classification state
    const [isEditingClassification, setIsEditingClassification] = useState(false);
    const [editClassificationValue, setEditClassificationValue] = useState({
        size: '' as BaySize,
        platform: '',
        model: ''
    });

    const updateResourcePool = (id: string, updates: any, originalVersion?: number) => {
        const pool = id.startsWith('bay') ? bays : machines;
        const currentItem = pool.find(i => i.id === id);

        // Concurrency Check: Optimistic Locking simulation
        if (originalVersion !== undefined && currentItem && (currentItem as any).version !== originalVersion) {
            setConflictError(`检测到并发修改冲突：该资源 (ID: ${id}) 的状态刚刚已被其他调度员更新。请刷新页面获取最新状态。`);
            return false;
        }

        const nextVersion = (currentItem as any)?.version ? (currentItem as any).version + 1 : 1;
        const fullUpdates = { ...updates, version: nextVersion };

        updatePhysicalResource(id, fullUpdates);

        if (selectedResource?.id === id) {
            setSelectedResource((prev: any) => ({ ...prev, ...fullUpdates }));
        }
        return true;
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportExcel = () => {
        const data = [
            ...bays.map(b => ({
                '类型': 'Bay',
                'ID': b.id,
                '名称': b.name,
                '规格/型号': b.size,
                '平台': '-',
                '状态': b.status === 'available' ? '可用' : b.status === 'occupied' ? '已占用' : '维护中',
                '关联项目': b.currentProjectName || '-',
                '绑定资源': b.currentMachineName || '-',
                '健康度': `${b.health}%`,
                '下次维保': b.nextMaintenance
            })),
            ...machines.map(m => ({
                '类型': '机器',
                'ID': m.id,
                '名称': m.name,
                '规格/型号': m.model,
                '平台': m.platform || '-',
                '状态': m.status === 'available' ? '可用' : m.status === 'occupied' ? '已占用' : '维护中',
                '关联项目': m.currentProjectName || '-',
                '绑定资源': m.currentBayName || '-',
                '健康度': `${m.health}%`,
                '下次维保': m.nextMaintenance
            }))
        ];

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "资源监控数据");

        // Auto-size columns
        worksheet["!cols"] = [{ wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }];

        XLSX.writeFile(workbook, `物理资源监控导出_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            const newBays: BayResource[] = [];
            const newMachines: MachineResource[] = [];

            data.forEach((row, index) => {
                const type = row['类型'];
                const statusMap: Record<string, ResourceStatus> = {
                    '可用': 'available',
                    '已占用': 'occupied',
                    '维护中': 'maintenance'
                };

                const common = {
                    id: row['ID'] || (type === 'Bay' ? `bay-imp-${index}` : `mach-imp-${index}`),
                    name: row['名称'] || '未命名资源',
                    status: statusMap[row['状态']] || 'available',
                    health: parseInt(row['健康度']) || 100,
                    lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
                    nextMaintenance: row['下次维保'] || format(addDays(new Date(), 90), 'yyyy-MM-dd'),
                    bookings: [],
                    conflicts: [],
                    replacementHistory: [],
                    maintenancePlans: [],
                    usageHistory: [],
                    version: 1
                };

                if (type === 'Bay') {
                    newBays.push({
                        ...common,
                        size: (row['规格/型号'] || 'S') as BaySize,
                        currentProjectName: row['关联项目'] !== '-' ? row['关联项目'] : undefined,
                        currentMachineName: row['绑定资源'] !== '-' ? row['绑定资源'] : undefined,
                    } as BayResource);
                } else {
                    newMachines.push({
                        ...common,
                        model: row['规格/型号'] || 'Unknown',
                        platform: row['平台'] !== '-' ? row['平台'] : 'General',
                        currentProjectName: row['关联项目'] !== '-' ? row['关联项目'] : undefined,
                        currentBayName: row['绑定资源'] !== '-' ? row['绑定资源'] : undefined,
                    } as MachineResource);
                }
            });

            if (newBays.length > 0) setBays(newBays);
            if (newMachines.length > 0) setMachines(newMachines);

            // Re-sync selected resource if it was updated
            if (selectedResource) {
                const updated = [...newBays, ...newMachines].find(r => r.id === selectedResource.id);
                if (updated) setSelectedResource(updated);
            }

            setLastSyncTime(format(new Date(), 'HH:mm:ss'));
            if (fileInputRef.current) fileInputRef.current.value = '';
            alert(`成功导入 ${data.length} 条资源信息`);
        };
        reader.readAsBinaryString(file);
    };

    const handleMaintenance = async (id: string) => {
        if (!isPMO && !canManageResource(selectedResource!)) return;

        setIsActionLoading(true);
        // Simulate background sync
        await new Promise(resolve => setTimeout(resolve, 1500));

        const success = updateResourcePool(id, {
            status: 'available',
            health: 100,
            lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
            nextMaintenance: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
            replacementHistory: [
                {
                    id: `new-rep-${Date.now()}`,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    partName: '系统全面巡检',
                    reason: '自动化维保流程触发',
                    performedBy: user?.name || 'System Auto'
                },
                ...(selectedResource?.replacementHistory || [])
            ]
        }, (selectedResource as any)?.version);

        setIsActionLoading(false);
        if (success) {
            // Optional: Show success toast
        }
    };

    const handleBooking = (resource: BayResource | MachineResource) => {
        if (!canBook) return;
        if (resource.status !== 'available') {
            setConflictError("该资源当前不可预定（已被占用或在维护中）。");
            return;
        }
        const selectedProject = projects.find(p => p.id === bookingData.projectId);
        if (!selectedProject) return;

        const newBooking: ResourceBooking = {
            id: `book-${Date.now()}`,
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            startDate: bookingData.startDate,
            endDate: bookingData.endDate,
            reservedBy: user?.id || 'currentUser',
            reservedByName: bookingExtra.reservedByName,
            reservedByDept: bookingExtra.dept,
            purpose: bookingExtra.purpose,
            usageType: 'test',
            status: 'active',
            initialStatusConfirmed: bookingExtra.statusChecked
        };

        let updates: any = {
            status: 'occupied',
            currentProjectId: selectedProject.id,
            currentProjectName: selectedProject.name,
            bookings: [newBooking, ...resource.bookings]
        };

        // Handle Binding during machine booking
        if (!resource.id.startsWith('bay') && bookingExtra.bindToBayId) {
            const selectedBay = bays.find(b => b.id === bookingExtra.bindToBayId);
            if (selectedBay && selectedBay.status === 'available') {
                updates.currentBayId = selectedBay.id;
                updates.currentBayName = selectedBay.name;

                // Update Sibling Bay
                updateResourcePool(selectedBay.id, {
                    status: 'occupied',
                    currentProjectId: selectedProject.id,
                    currentProjectName: selectedProject.name,
                    currentMachineId: resource.id,
                    currentMachineName: resource.name,
                    bookings: [newBooking, ...selectedBay.bookings]
                });
            }
        }

        const success = updateResourcePool(resource.id, updates, (resource as any).version);

        if (success) {
            setShowBookingForm(false);
            setBookingExtra({ dept: '', purpose: '', reservedByName: user?.name || '', statusChecked: false, bindToBayId: '' });
        }
    };

    const handleRelease = (id: string, normalStatus: boolean) => {
        if (!canManageResource(selectedResource!)) return;

        const resource = selectedResource!;
        const updatedHistory = (resource.bookings || []).map(b =>
            b.status === 'active' ? { ...b, status: 'completed' as const, returnStatusConfirmed: normalStatus } : b
        );

        // Handle Unbinding
        if (!resource.id.startsWith('bay') && (resource as MachineResource).currentBayId) {
            const bayId = (resource as MachineResource).currentBayId!;
            updateResourcePool(bayId, {
                status: 'available',
                currentProjectId: undefined,
                currentProjectName: undefined,
                currentMachineId: undefined,
                currentMachineName: undefined
                // Note: We don't necessarily close the bay's booking here if it was separate, 
                // but if they were bound during booking, we release both.
            });
        } else if (resource.id.startsWith('bay') && (resource as BayResource).currentMachineId) {
            const machId = (resource as BayResource).currentMachineId!;
            updateResourcePool(machId, {
                status: 'available',
                currentProjectId: undefined,
                currentProjectName: undefined,
                currentBayId: undefined,
                currentBayName: undefined
            });
        }

        updateResourcePool(id, {
            status: 'available',
            currentProjectId: undefined,
            currentProjectName: undefined,
            bookings: updatedHistory,
            currentMachineId: undefined, // ensure both cleared
            currentMachineName: undefined,
            currentBayId: undefined,
            currentBayName: undefined
        }, (resource as any)?.version);
    };

    const handleMaintenanceReservation = () => {
        if (!selectedResource) return;

        const newPlan: any = {
            id: `plan-${Date.now()}`,
            resourceId: selectedResource.id,
            resourceName: selectedResource.name,
            applicant: user?.name || 'Unknown',
            applicantDept: '研发部',
            plannedDate: maintenanceReservation.date,
            type: maintenanceReservation.type,
            description: maintenanceReservation.description,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        updateResourcePool(selectedResource.id, {
            maintenancePlans: [newPlan, ...(selectedResource.maintenancePlans || [])]
        }, (selectedResource as any).version);

        setMaintenanceReservation({ type: 'routine', description: '', date: format(addDays(new Date(), 1), 'yyyy-MM-dd') });
    };

    const handleApproveMaintenance = (resourceId: string, planId: string, status: 'accepted' | 'rejected', remarks: string) => {
        const resource = resourceId.startsWith('bay') ? bays.find(b => b.id === resourceId) : machines.find(m => m.id === resourceId);
        if (!resource) return;

        const updatedPlans = (resource.maintenancePlans || []).map(p =>
            p.id === planId ? { ...p, status, approvalRemarks: remarks, approver: user?.name } : p
        );

        updateResourcePool(resourceId, { maintenancePlans: updatedPlans }, (resource as any).version);
    };

    const handleAddMaintenanceLog = () => {
        if (!selectedResource) return;

        const newRecord: ReplacementRecord = {
            id: `rep-manual-${Date.now()}`,
            date: format(new Date(), 'yyyy-MM-dd'),
            partName: maintenanceLogData.partName,
            reason: maintenanceLogData.reason,
            performedBy: maintenanceLogData.performedBy || user?.name || 'Unknown'
        };

        updateResourcePool(selectedResource.id, {
            replacementHistory: [newRecord, ...(selectedResource.replacementHistory || [])]
        }, (selectedResource as any).version);

        setShowMaintenanceForm(false);
        setMaintenanceLogData({ partName: '', reason: '', performedBy: user?.name || '' });
    };

    const filteredItems = useMemo(() => {
        const pool = resourceType === 'bay' ? bays : machines;
        return pool.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.currentProjectName?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            if (resourceType === 'bay') {
                const matchesSize = sizeFilter === 'all' || (item as BayResource).size === sizeFilter;
                return matchesSearch && matchesSize && matchesStatus;
            } else {
                const matchesPlatform = platformFilter === 'all' || (item as MachineResource).platform === platformFilter;
                return matchesSearch && matchesPlatform && matchesStatus;
            }
        });
    }, [resourceType, searchTerm, bays, machines, sizeFilter, platformFilter, statusFilter]);

    const risks = useMemo(() => {
        const allResources = [...bays, ...machines];
        return allResources
            .map(r => ({ ...r, riskScore: calculateRiskScore(r) }))
            .filter(r => r.riskScore > 50)
            .sort((a, b) => b.riskScore - a.riskScore);
    }, [bays, machines]);

    const maintScheduleData = useMemo(() => {
        const allResources = [...bays, ...machines];
        return allResources
            .map(r => ({
                id: r.id,
                name: r.name,
                type: (r as any).model ? 'machine' : 'bay',
                nextMaintenance: r.nextMaintenance,
                health: r.health,
                status: r.status
            }))
            .sort((a, b) => new Date(a.nextMaintenance).getTime() - new Date(b.nextMaintenance).getTime());
    }, [bays, machines]);

    const stats = useMemo(() => {
        const total = bays.length + machines.length;
        const lowHealth = [...bays, ...machines].filter(r => r.health < 30).length;
        const maintenanceCount = [...bays, ...machines].filter(r => r.status === 'maintenance').length;
        const conflictCount = [...bays, ...machines].filter(r => r.conflicts && r.conflicts.length > 0).length;

        return { total, lowHealth, maintenanceCount, conflictCount };
    }, [bays, machines]);

    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getAvailableResourcesForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return [...bays, ...machines].filter(r => {
            if (r.status === 'maintenance') return false;
            const isBooked = r.bookings.some(b => {
                return dateStr >= b.startDate && dateStr <= b.endDate;
            });
            return !isBooked;
        });
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10 relative">
            {/* Concurrency Conflict Notification */}
            <AnimatePresence>
                {conflictError && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl"
                    >
                        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-red-500 ring-4 ring-red-500/20">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="shrink-0" size={24} />
                                <p className="text-sm font-bold leading-tight">{conflictError}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 whitespace-nowrap"
                                onClick={() => {
                                    setConflictError(null);
                                    // In real app, we would re-fetch. Here we just close notice.
                                }}
                            >
                                我知道了
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Activity className="text-blue-600" size={32} />
                        物理资源智能管控中心
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500">AI 驱动的 Bay 位分配、机器健康监控与冲突预警系统</p>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 ml-2">
                            <RefreshCw size={10} className={isTabRefreshing ? 'animate-spin' : ''} />
                            实时同步中: {lastSyncTime}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 mr-2">
                        <Badge variant="outline" className="border-slate-200 text-slate-500 bg-slate-50">
                            当前身份: {isPMO ? 'PMO核心管理' : isPM ? '项目经理' : '普通协作员'}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`border-blue-200 text-blue-600 hover:bg-blue-50 font-black flex items-center gap-2 ${isFeishuSyncing ? 'animate-pulse' : ''}`}
                            onClick={() => {
                                if (!isPMO) return;
                                setIsFeishuSyncing(true);
                                setTimeout(() => {
                                    setIsFeishuSyncing(false);
                                    setShowFeishuConnect(true);
                                }, 1200);
                            }}
                            disabled={!isPMO || isFeishuSyncing}
                        >
                            <RefreshCw size={14} className={isFeishuSyncing ? 'animate-spin' : ''} />
                            {isFeishuSyncing ? '正在拉取多维表格...' : isPMO ? '同步飞书多维表格' : '仅限 PMO 同步数据'}
                        </Button>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex w-full lg:w-auto overflow-x-auto shrink-0 relative">
                        {isTabRefreshing && (
                            <div className="absolute inset-0 bg-white/20 dark:bg-slate-900/20 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                                <RefreshCw size={14} className="animate-spin text-blue-600" />
                            </div>
                        )}
                        <button
                            onClick={() => handleTabChange('monitor')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewTab === 'monitor' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            <LayoutDashboard size={18} /> 实时监控
                        </button>
                        <button
                            onClick={() => handleTabChange('risk')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewTab === 'risk' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600 font-black' : 'text-slate-500'}`}
                        >
                            <AlertTriangle size={18} /> 风险预警
                            {stats.conflictCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                        </button>
                        <button
                            onClick={() => handleTabChange('maintenance')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewTab === 'maintenance' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-500'}`}
                        >
                            <Hammer size={18} /> 维护保养
                        </button>
                        <button
                            onClick={() => handleTabChange('calendar')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewTab === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                        >
                            <Calendar size={18} /> 空闲日历
                        </button>
                    </div>
                    {isPMO && (
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImportExcel}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                icon={Upload}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                导入 Excel
                            </Button>
                            <Button
                                variant="outline"
                                icon={Download}
                                onClick={handleExportExcel}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                导出 Excel
                            </Button>
                            <Button
                                variant="primary"
                                icon={Plus}
                                onClick={() => setShowAddResourceModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                            >
                                新增资产
                            </Button>
                        </div>
                    )}
                    <Button variant="outline" className="hidden sm:flex border-slate-200 text-slate-500" icon={Zap}>一键智能排期</Button>
                </div>
            </div>

            {/* Smart Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">资源健康度 (平均)</span>
                        <Activity size={18} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">84%</div>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: '84%' }} />
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">占用冲突</span>
                        <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <div className="text-2xl font-bold">{stats.conflictCount} 项</div>
                    <p className="text-xs text-red-500 mt-1 font-medium italic">涉及 4 个重点项目</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">近期维护</span>
                        <Hammer size={18} className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono">{stats.maintenanceCount} 台</div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">未来 7 天内需保养</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-2 text-emerald-600">
                        <span className="text-sm font-medium">推荐可用</span>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="text-2xl font-bold">12 份建议</div>
                    <p className="text-xs text-emerald-500 mt-1">系统已找到最优替换方案</p>
                </Card>
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
                {viewTab === 'monitor' && (
                    <motion.div
                        key="monitor"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="flex flex-col gap-4 w-full md:w-auto">
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                                        <button
                                            onClick={() => setResourceType('bay')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resourceType === 'bay' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                                        >
                                            Bay 状态
                                        </button>
                                        <button
                                            onClick={() => setResourceType('machine')}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${resourceType === 'machine' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                                        >
                                            机器状态
                                        </button>
                                    </div>

                                    {/* Sub-filters for Size/Platform/Status */}
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">分类:</span>
                                            {resourceType === 'bay' ? (
                                                <div className="flex gap-2">
                                                    {['all', 'S', 'M', 'L'].map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setSizeFilter(size as any)}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${sizeFilter === size ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                                                        >
                                                            {size === 'all' ? '全部尺寸' : `SIZE ${size}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    {['all', ...PLATFORMS].map(platform => (
                                                        <button
                                                            key={platform}
                                                            onClick={() => setPlatformFilter(platform)}
                                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${platformFilter === platform ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}
                                                        >
                                                            {platform === 'all' ? '全部平台' : platform}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">状态:</span>
                                            <div className="flex gap-2">
                                                {['all', 'available', 'occupied', 'maintenance'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setStatusFilter(status as any)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${statusFilter === status ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {status === 'all' ? '全部' : status === 'available' ? '可用' : status === 'occupied' ? '已占用' : '维护中'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="搜索资源或项目..."
                                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                            <button onClick={() => setViewMode('visual')} className={`p-2.5 ${viewMode === 'visual' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><MapIcon size={18} /></button>
                                            <button onClick={() => setViewMode('list')} className={`p-2.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500'}`}><ListIcon size={18} /></button>
                                        </div>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" />可用</div>
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" />已锁定</div>
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" />维护中</div>
                                    </div>
                                </div>
                            </div>

                            {viewMode === 'visual' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                    {filteredItems.map(item => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            onClick={() => setSelectedResource(item)}
                                            className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${item.status === 'occupied' ? 'bg-blue-50/40 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50 shadow-sm' :
                                                item.status === 'maintenance' ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50 shadow-sm' :
                                                    'bg-slate-50/40 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700'
                                                } hover:shadow-xl hover:scale-[1.02] hover:border-blue-400`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2 rounded-xl ${item.status === 'available' ? 'bg-emerald-100 text-emerald-600' :
                                                    item.status === 'maintenance' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {resourceType === 'bay' ? <Box size={18} /> : <Cpu size={18} />}
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.health < 40 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {Math.round(item.health)}%
                                                </div>
                                            </div>

                                            <div className="text-sm font-black truncate text-slate-900 dark:text-slate-100">{item.name}</div>

                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {resourceType === 'bay' ? (
                                                    <Badge variant="primary" size="sm" className="text-[9px] px-1.5 h-4 py-0 leading-none">SIZE: {(item as BayResource).size}</Badge>
                                                ) : (
                                                    <>
                                                        <Badge variant="primary" size="sm" className="text-[9px] px-1.5 h-4 py-0 leading-none">PLAT: {(item as MachineResource).platform}</Badge>
                                                        <Badge variant="neutral" size="sm" className="text-[9px] px-1.5 h-4 py-0 leading-none">MOD: {(item as MachineResource).model}</Badge>
                                                    </>
                                                )}
                                            </div>

                                            {/* Binding Relationship Visualization */}
                                            <div className="mt-4 space-y-2">
                                                {resourceType === 'bay' && (item as BayResource).currentMachineName && (
                                                    <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 uppercase">
                                                            <Cpu size={10} /> 绑定机器
                                                        </div>
                                                        <div className="text-[11px] font-black truncate text-emerald-700 dark:text-emerald-300">{(item as BayResource).currentMachineName}</div>
                                                    </div>
                                                )}

                                                {resourceType === 'machine' && (item as MachineResource).currentBayName && (
                                                    <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                                        <div className="text-[9px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 uppercase">
                                                            <Box size={10} /> 所在 Bay 位
                                                        </div>
                                                        <div className="text-[11px] font-black truncate text-blue-700 dark:text-blue-300">{(item as MachineResource).currentBayName}</div>
                                                    </div>
                                                )}

                                                {item.currentProjectName ? (
                                                    <div className="p-2 rounded-lg bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                                                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">项目任务</div>
                                                        <div className="text-[11px] font-bold truncate text-slate-800 dark:text-slate-200">{item.currentProjectName}</div>
                                                    </div>
                                                ) : (
                                                    <div className={`text-[10px] font-black py-1 px-3 rounded-full w-fit ${item.status === 'maintenance' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm'}`}>
                                                        {item.status === 'maintenance' ? '正在维护' : '可预约'}
                                                    </div>
                                                )}
                                            </div>

                                            {item.conflicts && item.conflicts.length > 0 && (
                                                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg ring-2 ring-white animate-bounce">
                                                    <AlertTriangle size={12} />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">资源名称</th>
                                                <th className="px-6 py-4">健康度</th>
                                                <th className="px-6 py-4">状态</th>
                                                <th className="px-6 py-4">绑定信息</th>
                                                <th className="px-6 py-4">归属记录</th>
                                                <th className="px-6 py-4">下个维保</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {filteredItems.map(item => (
                                                <tr key={item.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-colors group cursor-pointer" onClick={() => setSelectedResource(item)}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:text-blue-500">
                                                                {resourceType === 'bay' ? <Box size={18} /> : <Cpu size={18} />}
                                                            </div>
                                                            <span className="font-bold">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div className={`h-full ${item.health > 70 ? 'bg-emerald-500' : item.health > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.health}%` }} />
                                                            </div>
                                                            <span className="text-xs font-mono">{Math.round(item.health)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant={item.status === 'available' ? 'success' : item.status === 'occupied' ? 'primary' : 'warning'}>
                                                            {item.status === 'available' ? '可用' : item.status === 'occupied' ? '占用' : '维护'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {resourceType === 'bay' ? (
                                                            (item as BayResource).currentMachineName ? (
                                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                                                                    <Cpu size={12} /> {(item as BayResource).currentMachineName}
                                                                </div>
                                                            ) : '-'
                                                        ) : (
                                                            (item as MachineResource).currentBayName ? (
                                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                                    <Box size={12} /> {(item as MachineResource).currentBayName}
                                                                </div>
                                                            ) : '-'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {item.conflicts && item.conflicts.length > 0 ? (
                                                            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                                                                <AlertTriangle size={14} /> 预定冲突
                                                            </div>
                                                        ) : item.currentProjectName ? (
                                                            <span className="text-sm font-medium">{item.currentProjectName}</span>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 italic">空闲</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                        {item.nextMaintenance}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {viewTab === 'risk' && (
                    <motion.div
                        key="risk"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Left: Risk Summary & Filters */}
                            <Card className="p-6 lg:col-span-1 space-y-6">
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">风险分级过滤</h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: '极高风险', count: 2, color: 'bg-red-500', active: true },
                                            { label: '中高风险', count: 5, color: 'bg-orange-500', active: false },
                                            { label: '一般风险', count: 8, color: 'bg-amber-500', active: false },
                                            { label: '潜在风险', count: 12, color: 'bg-blue-500', active: false },
                                        ].map(f => (
                                            <div key={f.label} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${f.active ? 'bg-slate-50 border-blue-200 ring-1 ring-blue-100' : 'border-transparent hover:bg-slate-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${f.color}`} />
                                                    <span className="text-sm font-bold text-slate-700">{f.label}</span>
                                                </div>
                                                <span className="text-xs font-mono text-slate-400">{f.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">智能诊断报告</h4>
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                            检测到 <span className="font-black">Bay 04</span> 与 <span className="font-black">Bay 07</span> 存在长期占用冲突，建议将 <span className="underline italic">Project Apollo</span> 的部分测试迁移至研发二号楼空置区域。
                                        </p>
                                        <Button variant="ghost" size="sm" className="mt-3 text-blue-600 font-black p-0 h-auto hover:bg-transparent">生成调优方案库 →</Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Middle: Active Risk List */}
                            <Card className="p-6 lg:col-span-2">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <AlertTriangle size={24} className="text-red-500" />
                                        关键冲突与风险清单
                                    </h3>
                                    <Badge variant="outline" className="text-red-500 border-red-200">待处理: {risks.length}</Badge>
                                </div>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                                    {risks.map((r) => (
                                        <div key={r.id} className="group p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl hover:shadow-xl hover:border-red-200 transition-all flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex flex-col items-center justify-center border border-red-200">
                                                        <span className="text-[10px] font-black text-red-600 line-height-1">SCORE</span>
                                                        <span className="text-lg font-black text-red-700">{(r as any).riskScore}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 dark:text-slate-100">{r.name}</span>
                                                            <Badge variant="neutral" size="sm" className="text-[10px]">{(r as any).model || (r as any).size}</Badge>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-0.5 font-medium">
                                                            当前状态: <span className="text-blue-500">{r.status}</span> · 最后维护: {r.lastMaintenance}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="p-2"><MoreVertical size={16} /></Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-red-50/30 dark:bg-red-900/5 rounded-2xl border border-red-50 dark:border-red-900/10">
                                                    <div className="text-[10px] uppercase font-black text-red-400 mb-1">预定冲突</div>
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                                        {r.conflicts?.length ? `${r.conflicts.length} 个重叠预定` : '暂无显著冲突'}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-amber-50/30 dark:bg-amber-900/5 rounded-2xl border border-amber-50 dark:border-amber-900/10">
                                                    <div className="text-[10px] uppercase font-black text-amber-400 mb-1">健康警报</div>
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        健康度 {Math.round(r.health)}% {r.health < 40 ? '· 建议停机检修' : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 bg-white text-[11px] h-9"
                                                    onClick={() => setSelectedResource(r)}
                                                >
                                                    调配处理明细
                                                </Button>
                                                {r.health < 40 ? (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="flex-1 bg-amber-500 border-none text-[11px] h-9"
                                                        onClick={() => handleMaintenance(r.id)}
                                                        disabled={isActionLoading || !canManageResource(r)}
                                                    >
                                                        {isActionLoading ? '执行中...' : canManageResource(r) ? '一键维保修复' : '权限受限'}
                                                    </Button>
                                                ) : (
                                                    <Button variant="primary" size="sm" className="flex-1 bg-red-600 border-none text-[11px] h-9">紧急联系 PM</Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Right: AI & Trends */}
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="p-6 bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-none shadow-2xl relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                                    <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                                        <Zap size={20} className="text-yellow-400 fill-current" />
                                        AI 自动调优引擎
                                    </h4>
                                    <p className="text-sm text-slate-300 mb-6 leading-relaxed italic">
                                        "基于当前项目优先级（Priority Score），我为您找到了 2 个可调用的冗余资源。"
                                    </p>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-indigo-300 uppercase">策略 A</span>
                                                <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-none h-4 text-[9px]">建议采纳</Badge>
                                            </div>
                                            <div className="text-xs font-bold leading-relaxed transition-all hover:text-blue-300 cursor-pointer">
                                                将 [uCT 510 #2] 的维护时间提前 2 天，可完全释放 [Project Mars] 的上电窗口。
                                            </div>
                                        </div>
                                        <Button className="w-full bg-white text-indigo-950 border-none font-black hover:bg-slate-100 mt-4 rounded-xl py-5">执行自动化调优</Button>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h4 className="font-bold mb-6 flex items-center gap-2 underline decoration-blue-500/30 underline-offset-4">
                                        <TrendingUp size={18} className="text-blue-500" />
                                        资源负载预测 (30D)
                                    </h4>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end gap-1.5 h-32">
                                            {[30, 45, 85, 95, 70, 50, 40, 35, 60, 90, 80, 55].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="relative w-full h-full flex items-end">
                                                        <div
                                                            className={`w-full rounded-t-lg transition-all duration-700 ${h >= 90 ? 'bg-red-500' : h >= 70 ? 'bg-amber-500' : 'bg-blue-400'} group-hover:scale-y-110 group-hover:brightness-110`}
                                                            style={{ height: `${h}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-400">W{i + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                                <Info size={14} className="text-blue-500" />
                                                W4 预测负载峰值 95%
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1">受 [大里程碑交付] 影响，建议提前锁定备用物理机。</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewTab === 'maintenance' && (
                    <motion.div
                        key="maintenance"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Maintenance Stats */}
                            <Card className="p-6 lg:col-span-3 bg-white dark:bg-slate-800 border-none shadow-sm flex flex-wrap items-center justify-between gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl">
                                        <Settings2 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black">维护与资产生命周期</h3>
                                        <p className="text-slate-400 text-sm">当前共有 <span className="text-amber-600 font-bold">6</span> 台设备处于待保养状态</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-12">
                                    <div className="text-center">
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">本月完成度</div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100">92%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">备件库存</div>
                                        <div className="text-2xl font-black text-emerald-500">充足</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">平均停机时长</div>
                                        <div className="text-2xl font-black text-blue-500">4.2h</div>
                                    </div>
                                    <Button
                                        variant="primary"
                                        icon={CalendarDays}
                                        className="bg-amber-500 border-none"
                                        onClick={() => setShowMaintSchedule(true)}
                                    >
                                        查看保养排期表
                                    </Button>
                                </div>
                            </Card>

                            {/* Maintenance Pipeline */}
                            <Card className="p-6 lg:col-span-2">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                    <History size={16} /> 待处理任务流水线 (Pipeline)
                                </h4>
                                <div className="space-y-4">
                                    {[...bays, ...machines].filter(r => r.health < 60).slice(0, 5).map((r) => (
                                        <div key={r.id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                                                        {(r as any).model ? <Cpu size={24} className="text-slate-400" /> : <Box size={24} className="text-slate-400" />}
                                                    </div>
                                                    {r.health < 40 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 dark:text-slate-100">{r.name}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge variant="outline" size="sm" className="text-[10px] opacity-60">最近保养: {r.lastMaintenance}</Badge>
                                                        <span className="text-[10px] text-slate-400 font-mono">ID: {r.id}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-amber-500 uppercase">下期计划</div>
                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">{r.nextMaintenance}</div>
                                                </div>
                                                <div className="w-16">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">健康度</div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${r.health < 40 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${r.health}%` }} />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setSelectedResource(r)}
                                                    >
                                                        <Info size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={`font-black h-9 text-xs transition-all ${r.health < 40 && canManageResource(r) ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-white border-slate-200 text-amber-600'}`}
                                                        onClick={() => handleMaintenance(r.id)}
                                                        disabled={isActionLoading || !canManageResource(r)}
                                                    >
                                                        {isActionLoading ? '处理中...' : canManageResource(r) ? '执行维保' : '权限受限'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Inventory & Support */}
                            <div className="space-y-6 lg:col-span-1">
                                <Card className="p-6">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                        <Truck size={16} /> 备机与配件状态
                                    </h4>
                                    <div className="space-y-4">
                                        {[
                                            { name: '测试机架备件', status: '充足', stock: 12 },
                                            { name: 'CT 球管 (通用)', status: '低库存', stock: 2 },
                                            { name: '高压屏蔽线', status: '缺货', stock: 0 },
                                            { name: '精密电源模块', status: '充足', stock: 8 },
                                        ].map(item => (
                                            <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400">当前剩余: {item.stock} 套</div>
                                                </div>
                                                <Badge variant={item.status === '充足' ? 'success' : item.status === '低库存' ? 'warning' : 'danger'} size="sm">
                                                    {item.status}
                                                </Badge>
                                            </div>
                                        ))}
                                        <Button variant="ghost" size="sm" className="w-full text-blue-600 font-black mt-2">申请备件采购 →</Button>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-emerald-600 text-white border-none shadow-xl">
                                    <h4 className="font-black text-lg mb-4 flex items-center gap-2">
                                        <ShieldCheck size={24} />
                                        维保合同总控
                                    </h4>
                                    <p className="text-xs text-emerald-100 leading-relaxed mb-6">
                                        检测到 8 台 <span className="font-black underline italic">uCT 系列</span> 设备本月即将保修到期，建议立即启动续签。
                                    </p>
                                    <div className="py-2 border-y border-white/20 mb-6">
                                        <div className="flex justify-between text-xs font-bold py-1">
                                            <span>合同总值</span>
                                            <span>¥ 1,240,000</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold py-1 text-emerald-200">
                                            <span>生效中</span>
                                            <span>14 份</span>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-white text-emerald-600 border-none font-black hover:bg-emerald-50 rounded-xl">管理所有服务合同</Button>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewTab === 'calendar' && (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-8">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-black flex items-center gap-3">
                                        <Calendar size={28} className="text-emerald-500" />
                                        资源预约可用性日历
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">展示每日未被占用的实验室 Bay 位与高价值机器</p>
                                </div>
                                <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"><ChevronLeft size={20} /></button>
                                    <span className="font-black px-4">{format(currentMonth, 'yyyy年 M月')}</span>
                                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(d => (
                                    <div key={d} className="bg-slate-50 dark:bg-slate-900 p-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>
                                ))}
                                {calendarDays.map((day, i) => {
                                    const available = getAvailableResourcesForDate(day);
                                    const isCurrentMonth = format(day, 'M') === format(currentMonth, 'M');
                                    const bayCount = available.filter(r => r.id.startsWith('bay')).length;
                                    const machineCount = available.filter(r => r.id.startsWith('mach')).length;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedCalendarDate(day)}
                                            className={`min-h-[140px] p-4 bg-white dark:bg-slate-900 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-2 cursor-pointer border-2 ${!isCurrentMonth ? 'opacity-30 grayscale' : 'border-transparent'} ${selectedCalendarDate && format(day, 'yyyy-MM-dd') === format(selectedCalendarDate, 'yyyy-MM-dd') ? 'border-emerald-500 shadow-lg scale-[1.02] z-10' : 'hover:border-slate-100 dark:hover:border-slate-700'}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className={`text-sm font-black ${isToday(day) ? 'bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full ring-4 ring-blue-500/20' : 'text-slate-700 dark:text-slate-300'}`}>{format(day, 'd')}</span>
                                                {available.length > 20 && <Badge variant="success" size="sm" className="bg-emerald-500/10 text-emerald-500 border-none px-1.5 h-4 text-[9px]">资源充足</Badge>}
                                            </div>

                                            <div className="mt-2 space-y-1.5">
                                                <div className="flex items-center justify-between text-[10px] font-bold p-1.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg text-blue-600">
                                                    <span className="flex items-center gap-1"><Box size={10} /> Bay 位可用</span>
                                                    <span>{bayCount}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-bold p-1.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg text-amber-600">
                                                    <span className="flex items-center gap-1"><Cpu size={10} /> 机器可用</span>
                                                    <span>{machineCount}</span>
                                                </div>
                                            </div>

                                            {isCurrentMonth && (
                                                <div className="mt-auto pt-2">
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {available.slice(0, 3).map((r, idx) => (
                                                            <div key={idx} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-black text-slate-500">
                                                                {r.name.split(' ')[0][0]}
                                                            </div>
                                                        ))}
                                                        {available.length > 3 && (
                                                            <div className="text-[10px] text-slate-400 font-bold ml-1.5 flex items-center">+{available.length - 3}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Drawer Simulation */}
            <AnimatePresence>
                {selectedResource && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedResource(null);
                                setShowBookingForm(false);
                            }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 block"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 z-[60] shadow-2xl overflow-y-auto p-10"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-blue-100 text-blue-600 rounded-3xl">
                                        {(selectedResource as any).model ? <Cpu size={32} /> : <Box size={32} />}
                                    </div>
                                    <div className="flex-1">
                                        {isEditingName && isPMO ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    className="text-2xl font-black bg-white dark:bg-slate-800 border-b-2 border-blue-500 outline-none w-full"
                                                    value={editingNameValue}
                                                    onChange={(e) => setEditingNameValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            updateResourcePool(selectedResource.id, { name: editingNameValue }, (selectedResource as any).version);
                                                            setIsEditingName(false);
                                                        }
                                                    }}
                                                />
                                                <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => {
                                                    updateResourcePool(selectedResource.id, { name: editingNameValue }, (selectedResource as any).version);
                                                    setIsEditingName(false);
                                                }}>保存</Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-black">{selectedResource.name}</h2>
                                                {isPMO && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[10px] font-black uppercase text-slate-400 p-0 h-auto hover:text-blue-600"
                                                        onClick={() => {
                                                            setEditingNameValue(selectedResource.name);
                                                            setIsEditingName(true);
                                                        }}
                                                    >
                                                        [编辑名称]
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant={selectedResource.status === 'available' ? 'success' : selectedResource.status === 'occupied' ? 'primary' : 'warning'}>
                                                {selectedResource.status === 'available' ? '可用' : selectedResource.status === 'occupied' ? '占用' : '维护'}
                                            </Badge>
                                            <span className="text-xs text-slate-400 font-mono">ID: {selectedResource.id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isPMO && (
                                        <button
                                            onClick={() => handleDeleteResource(selectedResource.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                            title="删除资源"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button onClick={() => {
                                        setSelectedResource(null);
                                        setIsEditingName(false);
                                    }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                        <div className="text-xs text-slate-400 mb-1">健康指数</div>
                                        <div className={`text-xl font-black ${getHealthColor(selectedResource.health)} inline-block px-3 py-1 rounded-lg`}>
                                            {Math.round(selectedResource.health)} / 100
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                        <div className="text-xs text-slate-400 mb-1">本月运行时长</div>
                                        <div className="text-xl font-black">168 小时</div>
                                    </div>
                                </div>

                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Settings2 size={16} /> 资源配置信息
                                </h4>
                                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 mb-8">
                                    <div className="space-y-4">
                                        {isEditingClassification && isPMO ? (
                                            <div className="space-y-4">
                                                {selectedResource.id.startsWith('bay') ? (
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bay 尺寸</label>
                                                        <div className="flex gap-2 mt-1">
                                                            {['S', 'M', 'L'].map(sz => (
                                                                <button
                                                                    key={sz}
                                                                    onClick={() => setEditClassificationValue({ ...editClassificationValue, size: sz as BaySize })}
                                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${editClassificationValue.size === sz ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                                                                >
                                                                    {sz}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">平台分类</label>
                                                            <input
                                                                type="text"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={editClassificationValue.platform}
                                                                onChange={(e) => setEditClassificationValue({ ...editClassificationValue, platform: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">设备型号</label>
                                                            <input
                                                                type="text"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={editClassificationValue.model}
                                                                onChange={(e) => setEditClassificationValue({ ...editClassificationValue, model: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 pt-2">
                                                    <Button variant="ghost" className="flex-1 text-xs" onClick={() => setIsEditingClassification(false)}>取消</Button>
                                                    <Button variant="primary" className="flex-1 text-xs" onClick={() => {
                                                        const updates: any = selectedResource.id.startsWith('bay')
                                                            ? { size: editClassificationValue.size }
                                                            : { platform: editClassificationValue.platform, model: editClassificationValue.model };
                                                        updateResourcePool(selectedResource.id, updates, (selectedResource as any).version);
                                                        setIsEditingClassification(false);
                                                    }}>保存更改</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    {selectedResource.id.startsWith('bay') ? (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-400">尺寸分类:</span>
                                                            <Badge variant="primary" size="sm">{(selectedResource as BayResource).size}</Badge>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-slate-400">平台:</span>
                                                                <Badge variant="primary" size="sm">{(selectedResource as MachineResource).platform}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-slate-400">型号:</span>
                                                                <Badge variant="neutral" size="sm">{(selectedResource as MachineResource).model}</Badge>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {isPMO && (
                                                    <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => {
                                                        setEditClassificationValue({
                                                            size: (selectedResource as any).size || 'S',
                                                            platform: (selectedResource as any).platform || '',
                                                            model: (selectedResource as any).model || ''
                                                        });
                                                        setIsEditingClassification(true);
                                                    }}>编辑</Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Zap size={16} /> 快速操作
                                </h4>
                                <div className="space-y-4">
                                    {selectedResource.status === 'occupied' ? (
                                        canManageResource(selectedResource) ? (
                                            <div className="space-y-3 p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100">
                                                <p className="text-xs font-bold text-red-600 mb-1">设备归还确认</p>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        id="return-status"
                                                        className="w-4 h-4"
                                                        onChange={(e) => (window as any)._returnStatus = e.target.checked}
                                                    />
                                                    <label htmlFor="return-status" className="text-[11px] font-bold text-slate-600">确认设备各项功能正常，无损坏</label>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 py-6 text-sm font-black"
                                                    onClick={() => handleRelease(selectedResource.id, (window as any)._returnStatus || false)}
                                                >
                                                    确认归还并释放
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 text-center">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">权限受限</p>
                                                <p className="text-xs text-slate-500 mt-1">仅预定人可以管理或释放此设备</p>
                                            </div>
                                        )
                                    ) : selectedResource.status === 'available' ? (
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                                            {!showBookingForm ? (
                                                <Button
                                                    variant="primary"
                                                    className="w-full py-6 text-sm font-black shadow-lg shadow-blue-500/20"
                                                    onClick={() => setShowBookingForm(true)}
                                                    disabled={!canBook || selectedResource.status !== 'available'}
                                                >
                                                    {canBook ? (selectedResource.status === 'available' ? '立即为项目预定' : '资源不可用') : '暂无预定权限'}
                                                </Button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">关联项目 *</label>
                                                        <select
                                                            className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={bookingData.projectId}
                                                            onChange={(e) => setBookingData({ ...bookingData, projectId: e.target.value })}
                                                        >
                                                            <option value="">请选择项目...</option>
                                                            {projects.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="col-span-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">预订人姓名 *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="请输入您的姓名"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={bookingExtra.reservedByName}
                                                                onChange={(e) => setBookingExtra({ ...bookingExtra, reservedByName: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">使用部门</label>
                                                            <input
                                                                type="text"
                                                                placeholder="如: 硬件研发部"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={bookingExtra.dept}
                                                                onChange={(e) => setBookingExtra({ ...bookingExtra, dept: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">使用用途</label>
                                                            <input
                                                                type="text"
                                                                placeholder="如: 信号噪声测试"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={bookingExtra.purpose}
                                                                onChange={(e) => setBookingExtra({ ...bookingExtra, purpose: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">开始日期</label>
                                                            <input
                                                                type="date"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={bookingData.startDate}
                                                                onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">结束日期</label>
                                                            <input
                                                                type="date"
                                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                value={bookingData.endDate}
                                                                onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>

                                                    {!selectedResource.id.startsWith('bay') && (
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 mb-2">
                                                                <Box size={12} /> 绑定测试 Bay 位 (可选)
                                                            </label>
                                                            <select
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                                value={bookingExtra.bindToBayId}
                                                                onChange={(e) => setBookingExtra({ ...bookingExtra, bindToBayId: e.target.value })}
                                                            >
                                                                <option value="">不绑定 Bay 位</option>
                                                                {bays.filter(b => b.status === 'available').map(bay => (
                                                                    <option key={bay.id} value={bay.id}>{bay.name} ({bay.size}型)</option>
                                                                ))}
                                                            </select>
                                                            <p className="text-[9px] text-slate-400 mt-2 italic">* 绑定后，该 Bay 位将同步变更为“已占用”状态</p>
                                                        </div>
                                                    )}
                                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id="status-check"
                                                            className="w-4 h-4"
                                                            checked={bookingExtra.statusChecked}
                                                            onChange={(e) => setBookingExtra({ ...bookingExtra, statusChecked: e.target.checked })}
                                                        />
                                                        <label htmlFor="status-check" className="text-[11px] font-bold text-blue-700">确认当前设备状态良好，可支撑测试任务</label>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="flex-1 text-xs"
                                                            onClick={() => setShowBookingForm(false)}
                                                        >
                                                            取消
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            className="flex-1 text-xs"
                                                            disabled={!bookingData.projectId || !bookingExtra.statusChecked || !bookingExtra.reservedByName}
                                                            onClick={() => handleBooking(selectedResource)}
                                                        >
                                                            确认预定
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                            <p className="text-xs text-amber-600 font-medium text-center italic">设备维护中，暂不可用</p>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        icon={Hammer}
                                        className="w-full justify-center py-4 text-xs font-bold"
                                        onClick={() => handleMaintenance(selectedResource.id)}
                                        disabled={isActionLoading || !canManageResource(selectedResource)}
                                    >
                                        {isActionLoading ? '正在同步维保数据...' : canManageResource(selectedResource) ? '执行一键维保/校准' : '仅限PMO管理未占用设备'}
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-4">
                                    <Calendar size={16} /> 预定排程周期
                                    <Badge variant="neutral" className="ml-auto text-[10px]">{selectedResource.bookings.length} 记录</Badge>
                                </h4>
                                <div className="space-y-3">
                                    {selectedResource.bookings.map(b => (
                                        <div key={b.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-blue-200 transition-colors">
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.projectName}</div>
                                                <div className="text-xs text-slate-400">{b.startDate} 至 {b.endDate}</div>
                                            </div>
                                            <Badge variant="outline" className="opacity-60 group-hover:opacity-100 transition-opacity">已确认</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <AlarmClock size={16} /> 维保预约申请
                                </h4>
                                <div className="p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">维保类型</label>
                                            <select
                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                value={maintenanceReservation.type}
                                                onChange={(e) => setMaintenanceReservation({ ...maintenanceReservation, type: e.target.value as any })}
                                            >
                                                <option value="routine">常规保养</option>
                                                <option value="breakdown">故障报修</option>
                                                <option value="upgrade">性能升级</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">拟定日期</label>
                                            <input
                                                type="date"
                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                value={maintenanceReservation.date}
                                                onChange={(e) => setMaintenanceReservation({ ...maintenanceReservation, date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">详细描述</label>
                                        <textarea
                                            placeholder="请说明维保需求或故障现象..."
                                            className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs h-20"
                                            value={maintenanceReservation.description}
                                            onChange={(e) => setMaintenanceReservation({ ...maintenanceReservation, description: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="w-full h-10 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 border-none"
                                        disabled={!maintenanceReservation.description}
                                        onClick={handleMaintenanceReservation}
                                    >
                                        提交维保预约请求
                                    </Button>
                                </div>

                                {/* Display existing plans for this resource */}
                                {selectedResource.maintenancePlans && selectedResource.maintenancePlans.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {selectedResource.maintenancePlans.map(plan => (
                                            <div key={plan.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">{plan.type === 'routine' ? '常规保养' : plan.type === 'breakdown' ? '故障报修' : '性能升级'}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{plan.plannedDate}</div>
                                                    </div>
                                                    <Badge variant={plan.status === 'pending' ? 'warning' : plan.status === 'accepted' ? 'success' : 'danger'} size="sm">
                                                        {plan.status === 'pending' ? '待审核' : plan.status === 'accepted' ? '已通过' : '已拒绝'}
                                                    </Badge>
                                                </div>
                                                {plan.approvalRemarks && (
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-l-4 border-slate-300">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">审批反馈 ({plan.approver})</p>
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">"{plan.approvalRemarks}"</p>
                                                    </div>
                                                )}
                                                <p className="text-[11px] text-slate-500 line-clamp-2">申请摘录: {plan.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <History size={16} /> 变更与维护日志
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-[10px] font-black uppercase text-blue-600 p-0 h-auto"
                                        onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                                    >
                                        {showMaintenanceForm ? '取消录入' : '+ 手动录入记录'}
                                    </Button>
                                </div>

                                {showMaintenanceForm && (
                                    <div className="mb-6 p-5 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 space-y-4 animate-fadeIn">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">部件/项目名称</label>
                                                <input
                                                    type="text"
                                                    placeholder="例如: 传感器组件"
                                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                    value={maintenanceLogData.partName}
                                                    onChange={(e) => setMaintenanceLogData({ ...maintenanceLogData, partName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">执行人员</label>
                                                <input
                                                    type="text"
                                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                    value={maintenanceLogData.performedBy}
                                                    onChange={(e) => setMaintenanceLogData({ ...maintenanceLogData, performedBy: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">详情描述 / 变更原因</label>
                                            <textarea
                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs h-20"
                                                value={maintenanceLogData.reason}
                                                onChange={(e) => setMaintenanceLogData({ ...maintenanceLogData, reason: e.target.value })}
                                            />
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="w-full h-10 text-xs rounded-xl"
                                            disabled={!maintenanceLogData.partName || !maintenanceLogData.reason}
                                            onClick={handleAddMaintenanceLog}
                                        >
                                            确认保存并追加日志
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {selectedResource.replacementHistory?.map(rec => (
                                        <div key={rec.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-amber-500">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-black text-amber-600 uppercase">部件更换</span>
                                                <span className="text-[10px] text-slate-400">{rec.date}</span>
                                            </div>
                                            <div className="text-sm font-black text-slate-900 dark:text-slate-100">{rec.partName}</div>
                                            <div className="text-xs text-slate-500 mt-1">原因: {rec.reason}</div>
                                            <div className="text-[10px] text-slate-400 mt-2 font-medium">执行人: {rec.performedBy}</div>
                                        </div>
                                    ))}
                                    {(!selectedResource.replacementHistory || selectedResource.replacementHistory.length === 0) && (
                                        <div className="text-sm text-slate-400 italic p-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                            暂无重大部件更换记录
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}

                {selectedCalendarDate && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedCalendarDate(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 block"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-slate-900 z-[60] shadow-2xl overflow-y-auto p-10"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-3xl">
                                        <Calendar size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">{format(selectedCalendarDate, 'yyyy年 MM月 dd日')}</h2>
                                        <div className="text-xs text-slate-400 mt-1 font-bold italic uppercase tracking-widest">
                                            当日空闲资源明细
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedCalendarDate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setCalendarDetailTab('bay')}
                                        className={`p-5 rounded-3xl border-2 transition-all text-left ${calendarDetailTab === 'bay' ? 'bg-blue-50/50 border-blue-500 ring-4 ring-blue-500/10' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 opacity-60'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase ${calendarDetailTab === 'bay' ? 'text-blue-500' : 'text-slate-400'}`}>可用 Bay 位</span>
                                            <Box size={14} className={calendarDetailTab === 'bay' ? 'text-blue-500' : 'text-slate-400'} />
                                        </div>
                                        <div className={`text-2xl font-black ${calendarDetailTab === 'bay' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>
                                            {getAvailableResourcesForDate(selectedCalendarDate).filter(r => r.id.startsWith('bay')).length} 组
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setCalendarDetailTab('machine')}
                                        className={`p-5 rounded-3xl border-2 transition-all text-left ${calendarDetailTab === 'machine' ? 'bg-amber-50/50 border-amber-500 ring-4 ring-amber-500/10' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 opacity-60'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase ${calendarDetailTab === 'machine' ? 'text-amber-500' : 'text-slate-400'}`}>可用机器</span>
                                            <Cpu size={14} className={calendarDetailTab === 'machine' ? 'text-amber-500' : 'text-slate-400'} />
                                        </div>
                                        <div className={`text-2xl font-black ${calendarDetailTab === 'machine' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>
                                            {getAvailableResourcesForDate(selectedCalendarDate).filter(r => r.id.startsWith('mach')).length} 台
                                        </div>
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {calendarDetailTab === 'bay' ? (
                                        <motion.div
                                            key="bay-list"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <Box size={16} /> 可用 Bay 位列表
                                                </h4>
                                                <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-500">
                                                    {getAvailableResourcesForDate(selectedCalendarDate).filter(r => r.id.startsWith('bay')).length} 组
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {getAvailableResourcesForDate(selectedCalendarDate)
                                                    .filter(r => r.id.startsWith('bay'))
                                                    .map((r: any) => (
                                                        <div key={r.id} className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-900 transition-all flex items-center justify-between group shadow-sm hover:shadow-md">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center font-black text-blue-600 text-sm ring-1 ring-blue-100 transition-transform group-hover:scale-110">
                                                                    {r.size}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 dark:text-slate-100">{r.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">尺寸规格: {r.size} 型实验室</div>
                                                                </div>
                                                            </div>
                                                            <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-600 border-none px-3">空闲</Badge>
                                                        </div>
                                                    ))}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="mach-list"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <Cpu size={16} /> 可用机器列表
                                                </h4>
                                                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-500">
                                                    {getAvailableResourcesForDate(selectedCalendarDate).filter(r => r.id.startsWith('mach')).length} 台
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {getAvailableResourcesForDate(selectedCalendarDate)
                                                    .filter(r => r.id.startsWith('mach'))
                                                    .map((r: any) => (
                                                        <div key={r.id} className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-900 transition-all flex items-center justify-between group shadow-sm hover:shadow-md">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center font-black text-amber-600 text-[10px] text-center p-1 leading-none ring-1 ring-amber-100 transition-transform group-hover:scale-110 shrink-0">
                                                                    {r.model.includes(' ') ? <>{r.model.split(' ')[0]}<br />{r.model.split(' ')[1]}</> : r.model}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{r.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">型号参数: {r.model}</div>
                                                                </div>
                                                            </div>
                                                            <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-600 border-none px-3 shrink-0">就绪</Badge>
                                                        </div>
                                                    ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-10 p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border-2 border-dashed border-emerald-500/30 flex flex-col items-center text-center">
                                <Zap className="text-emerald-500 mb-2" size={32} />
                                <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">快速抢占预约</div>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-500/60 mt-1 max-w-[240px]">由于这些资源当日处于空闲状态，您可以直接发起临时锁定请求。</p>
                                <Button className="mt-5 bg-emerald-600 border-none text-xs h-10 px-8 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">发起快速预约</Button>
                            </div>
                        </motion.div>
                    </>
                )}

                {showFeishuConnect && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowFeishuConnect(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] block"
                        />
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl rounded-[40px] overflow-hidden p-10 border border-white/20 pointer-events-auto"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                            <RefreshCw size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black">接入飞书多维表格 (Bitable)</h2>
                                            <p className="text-slate-400 mt-1 font-medium">通过飞书 API 实时同步 Bay 位与设备状态信息</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowFeishuConnect(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">连接配置</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">APP ACCESS TOKEN</label>
                                                    <input type="password" value="************************" readOnly className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 ml-1">BITABLE APP ID</label>
                                                    <input type="text" value="bascn****************" readOnly className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono" />
                                                </div>
                                                <Button variant="primary" className="w-full h-11 text-xs">重新验证连接</Button>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 flex items-start gap-3">
                                            <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                                                数据同步采用 <span className="font-black italic">Incremental Sync</span> 增量模式。检测到多维表格中字段定义已自动对齐。
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">操作步骤说明</h4>
                                        {[
                                            { step: '01', title: '创建自建应用', desc: '在飞书开放平台创建一个企业自建应用，并开启“多维表格”权限。' },
                                            { step: '02', title: '获取凭证', desc: '获取 App ID 和 App Secret，并在“应用发布”中进行版本发布。' },
                                            { step: '03', title: '添加表格引用', desc: '在需要同步的 Bitable 顶部点击“更多-添加文档助手”，将该应用添加为协同者。' },
                                            { step: '04', title: '字段映射', desc: '确保表格包含：[资源ID]、[当前状态]、[健康度]、[锁定项目] 等关键列。' },
                                        ].map(s => (
                                            <div key={s.step} className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                                                <div className="text-lg font-black text-blue-200 group-hover:text-blue-500 transition-colors uppercase font-mono">{s.step}</div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-slate-100">{s.title}</div>
                                                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">{s.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-10 flex gap-4">
                                    <Button variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={() => setShowFeishuConnect(false)}>稍后配置</Button>
                                    <Button variant="primary" className="flex-[2] h-12 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20" onClick={() => setShowFeishuConnect(false)}>立即保存并激活同步</Button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}

                {showMaintSchedule && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowMaintSchedule(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] block"
                        />
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 shadow-2xl rounded-[40px] overflow-hidden flex flex-col border border-white/20 pointer-events-auto"
                            >
                                <div className="p-10 pb-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                            <CalendarDays size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black">资产维保管理中心</h2>
                                            <p className="text-slate-400 mt-1 font-medium">维护计划审批与历史追溯</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                            <button
                                                onClick={() => setMaintScheduleOffset(0)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${maintScheduleOffset === 0 ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                                            >
                                                未来两周
                                            </button>
                                            <button
                                                onClick={() => setMaintScheduleOffset(-14)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${maintScheduleOffset < 0 ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                                            >
                                                历史记录
                                            </button>
                                        </div>
                                        <button onClick={() => setShowMaintSchedule(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 pt-6">
                                    <div className="space-y-8">
                                        {/* Visual Timeline Module */}
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                    <TrendingUp size={14} /> 维保负载与排期视图 (Load View)
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={() => setMaintScheduleOffset(prev => prev - 7)}><ChevronLeft size={16} /></Button>
                                                    <span className="text-[10px] font-black text-slate-500">{maintScheduleOffset === 0 ? '当前两周' : `偏移 ${maintScheduleOffset} 天`}</span>
                                                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={() => setMaintScheduleOffset(prev => prev + 7)}><ChevronRight size={16} /></Button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end h-20 gap-1">
                                                {Array.from({ length: 14 }).map((_, i) => {
                                                    const date = addDays(addDays(new Date(), maintScheduleOffset), i);
                                                    const dateStr = format(date, 'yyyy-MM-dd');
                                                    const dayPlans = [...bays, ...machines].flatMap(r => (r.maintenancePlans || []).filter(p => p.plannedDate === dateStr));
                                                    const count = dayPlans.length;
                                                    const isTodayDate = isToday(date);

                                                    return (
                                                        <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer min-w-0">
                                                            <div className="relative w-full flex flex-col items-center">
                                                                {count > 0 && (
                                                                    <div
                                                                        className={`w-full max-w-[12px] rounded-t-lg transition-all group-hover:brightness-110 ${count > 2 ? 'bg-red-500' : count > 1 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                                                        style={{ height: `${Math.min(count * 15, 60)}px` }}
                                                                    >
                                                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-900 dark:text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                                            {count} 项
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 mt-1 rounded-full overflow-hidden">
                                                                {isTodayDate && <div className="h-full bg-blue-600 w-full animate-pulse" />}
                                                            </div>
                                                            <div className={`mt-2 text-[9px] font-bold ${isTodayDate ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                {format(date, 'MM/dd')}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Maintenance Plans List */}
                                        <div className="space-y-6">
                                            {(() => {
                                                const allPlans: any[] = [];
                                                [...bays, ...machines].forEach(r => {
                                                    if (r.maintenancePlans) {
                                                        allPlans.push(...r.maintenancePlans.map(p => ({ ...p, resourceId: r.id })));
                                                    }
                                                });

                                                const now = new Date();
                                                const targetStart = addDays(now, maintScheduleOffset);
                                                const targetEnd = addDays(targetStart, 14);

                                                const filteredPlans = allPlans.filter(p => {
                                                    const d = new Date(p.plannedDate);
                                                    // Allow showing historical if offset is negative
                                                    return d >= targetStart && d <= targetEnd;
                                                }).sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

                                                if (filteredPlans.length === 0) {
                                                    return (
                                                        <div className="text-center py-20 opacity-40">
                                                            <Calendar size={48} className="mx-auto mb-4" />
                                                            <p className="font-black text-lg">该时段暂无维保计划</p>
                                                            <p className="text-sm mt-2">您可以调整上方的时间轴或返回历史记录查看</p>
                                                        </div>
                                                    );
                                                }

                                                return filteredPlans.map(plan => (
                                                    <div key={plan.id} className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border border-slate-100 dark:border-slate-700 hover:border-amber-300 transition-all group relative overflow-hidden">
                                                        {plan.status === 'accepted' && <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />}
                                                        {plan.status === 'rejected' && <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />}

                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="flex gap-5">
                                                                <div className={`p-4 rounded-2xl shadow-sm ${plan.type === 'breakdown' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {plan.resourceId.startsWith('bay') ? <Box size={28} /> : <Cpu size={28} />}
                                                                </div>
                                                                <div>
                                                                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{plan.resourceName}</div>
                                                                    <div className="flex items-center gap-4 mt-1">
                                                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{plan.resourceId}</div>
                                                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest px-3 border-l border-slate-200">{plan.applicantDept}</div>
                                                                        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest px-3 border-l border-slate-200">申请人: {plan.applicant}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Badge variant={plan.status === 'pending' ? 'warning' : plan.status === 'accepted' ? 'success' : 'danger'} size="lg" className="px-5 py-2 text-sm font-black">
                                                                {plan.status === 'pending' ? '待 PMO 审批' : plan.status === 'accepted' ? '已排入计划' : '已拒绝请求'}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm">
                                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">预约维保日期</div>
                                                                <div className="flex items-center gap-2">
                                                                    <CalendarDays size={18} className="text-blue-500" />
                                                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">{plan.plannedDate}</div>
                                                                </div>
                                                            </div>
                                                            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-sm md:col-span-3">
                                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">维保需求描述</div>
                                                                <div className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{plan.description}</div>
                                                            </div>
                                                        </div>

                                                        {plan.status === 'pending' && isPMO && (
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
                                                                <div className="md:col-span-2">
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">审批备注 (必填意见)</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="请输入审批意见或调整建议..."
                                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl h-12 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                                        id={`remarks-${plan.id}`}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    variant="outline"
                                                                    className="h-12 border-red-200 text-red-600 hover:bg-red-50 font-black rounded-2xl"
                                                                    onClick={() => handleApproveMaintenance(plan.resourceId, plan.id, 'rejected', (document.getElementById(`remarks-${plan.id}`) as HTMLInputElement).value)}
                                                                >
                                                                    驳回申请
                                                                </Button>
                                                                <Button
                                                                    variant="primary"
                                                                    className="h-12 bg-emerald-600 hover:bg-emerald-700 border-none font-black rounded-2xl shadow-lg shadow-emerald-500/20"
                                                                    onClick={() => handleApproveMaintenance(plan.resourceId, plan.id, 'accepted', (document.getElementById(`remarks-${plan.id}`) as HTMLInputElement).value)}
                                                                >
                                                                    核准计划
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {(plan.status === 'accepted' || plan.status === 'rejected') && plan.approvalRemarks && (
                                                            <div className="mt-4 p-6 bg-slate-100/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-700">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <ShieldCheck size={16} className="text-slate-400" />
                                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PMO 最终审批意见 (审批人: {plan.approver || '系统'})</div>
                                                                </div>
                                                                <div className="text-sm font-bold italic text-slate-600 dark:text-slate-400 leading-relaxed">"{plan.approvalRemarks}"</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                    <div>当前系统共有 {maintScheduleData.length} 台注册资产</div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> 运行良好</div>
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full" /> 建议维保</div>
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full" /> 紧急维护</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
            {/* Add Resource Modal */}
            <AnimatePresence>
                {showAddResourceModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddResourceModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-8 pb-4 flex justify-between items-center">
                                <h3 className="text-xl font-black">新增物理资产</h3>
                                <button onClick={() => setShowAddResourceModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-8 pt-2 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">资源类型</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                                            <button
                                                onClick={() => setNewResourceData({ ...newResourceData, type: 'bay' })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${newResourceData.type === 'bay' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                                            >
                                                测试 Bay 位
                                            </button>
                                            <button
                                                onClick={() => setNewResourceData({ ...newResourceData, type: 'machine' })}
                                                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${newResourceData.type === 'machine' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                                            >
                                                生产设备/机器
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">资产名称 *</label>
                                        <input
                                            type="text"
                                            placeholder="如: Bay-20 或 uCT 760 #15"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-14 px-6 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                            value={newResourceData.name}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, name: e.target.value })}
                                        />
                                    </div>

                                    {newResourceData.type === 'bay' ? (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Bay 尺寸分类</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['S', 'M', 'L'].map(size => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setNewResourceData({ ...newResourceData, size: size as BaySize })}
                                                        className={`py-3 rounded-xl text-xs font-black border transition-all ${newResourceData.size === size ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}
                                                    >
                                                        {size === 'S' ? '小型 (S)' : size === 'M' ? '中型 (M)' : '大型 (L)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">所属平台</label>
                                                <input
                                                    type="text"
                                                    placeholder="Falcon/Eagle..."
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-12 px-5 text-xs font-bold outline-none"
                                                    value={newResourceData.platform}
                                                    onChange={(e) => setNewResourceData({ ...newResourceData, platform: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">型号代码</label>
                                                <input
                                                    type="text"
                                                    placeholder="uCT 760..."
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl h-12 px-5 text-xs font-bold outline-none"
                                                    value={newResourceData.model}
                                                    onChange={(e) => setNewResourceData({ ...newResourceData, model: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black" onClick={() => setShowAddResourceModal(false)}>取消</Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1 h-14 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                                        onClick={handleAddResource}
                                        disabled={!newResourceData.name}
                                    >
                                        确认添加资产
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BayMachineResource;
