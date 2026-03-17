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
import { startOfMonth, addMonths, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isToday, subMonths, format, addDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { syncFeishuData } from '../services/feishuService';
import type { BayResource, MachineResource, BaySize, ResourceBooking, ReplacementRecord, ResourceStatus, SoftwareHistoryRecord } from '../types';

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

// --- Config Constants ---
// PLATFORMS is now derive dynamically from data


const BayMachineResource: React.FC = () => {
    const {
        projects,
        user,
        physicalBays,
        physicalMachines,
        setPhysicalBays,
        setPhysicalMachines,
        updatePhysicalResource,
        deletePhysicalBay,
        deletePhysicalMachine,
        feishuConfig,
        addProject,
        addResource,
        setLastSyncTime: setGlobalLastSyncTime
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
        // Initial data is now handled by the persistent store's default values.
        // This effect can be used for any other page-level initialization if needed.
    }, []);

    const setBays = (updater: any) => {
        const next = typeof updater === 'function' ? updater(physicalBays) : updater;
        setPhysicalBays(next);
    };

    const setMachines = (updater: any) => {
        const next = typeof updater === 'function' ? updater(physicalMachines) : updater;
        setPhysicalMachines(next);
    };

    const dynamicPlatforms = useMemo(() => {
        const set = new Set<string>();
        machines.forEach(m => {
            if (m.platform) set.add(m.platform);
        });
        // Default platforms if none exist yet, or just sort the current ones
        const list = Array.from(set).sort();
        return list.length > 0 ? list : ['Default'];
    }, [machines]);

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
    const isPMO = user?.role === 'admin' || user?.role === 'pmo';
    const isPM = user?.role === 'manager';
    const isUser = user?.role === 'user';

    const canManageResource = (resource: BayResource | MachineResource) => {
        if (isPMO) return true; // PMO/Admin has full management rights
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
        bindToBayId: '',
        softwareVersion: ''
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
        // Removed redundant state updates that could cause stale closure bugs
        if (tab === 'risk' || tab === 'maintenance') {
            setLastSyncTime(format(new Date(), 'HH:mm:ss'));
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

        const softwareRecord: SoftwareHistoryRecord | null = bookingExtra.softwareVersion ? {
            id: `sw-init-${Date.now()}`,
            version: bookingExtra.softwareVersion,
            date: format(new Date(), 'yyyy-MM-dd HH:mm'),
            changedBy: user?.id || 'currentUser',
            changedByName: user?.name || '未知用户',
            notes: '初始预定绑定版本'
        } : null;

        let updates: any = {
            status: 'occupied',
            currentProjectId: selectedProject.id,
            currentProjectName: selectedProject.name,
            bookings: [newBooking, ...resource.bookings],
            softwareVersion: bookingExtra.softwareVersion || resource.softwareVersion,
            softwareHistory: softwareRecord ? [softwareRecord, ...(resource.softwareHistory || [])] : resource.softwareHistory
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
            setBookingExtra({ dept: '', purpose: '', reservedByName: user?.name || '', statusChecked: false, bindToBayId: '', softwareVersion: '' });
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

    const handleUpdateSoftware = (version: string, notes: string = '手动更新版本') => {
        if (!selectedResource) return;

        const newRecord: SoftwareHistoryRecord = {
            id: `sw-${Date.now()}`,
            version,
            date: format(new Date(), 'yyyy-MM-dd HH:mm'),
            changedBy: user?.id || 'currentUser',
            changedByName: user?.name || '当前用户',
            notes
        };

        const updates = {
            softwareVersion: version,
            softwareHistory: [newRecord, ...(selectedResource.softwareHistory || [])]
        };

        updateResourcePool(selectedResource.id, updates, (selectedResource as any).version);
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
                type: r.id.startsWith('mach') ? ('machine' as const) : ('bay' as const),
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

            {/* Header Area: Optimized for High-End Dashboard feel */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[32px] border border-white/20 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-lg shadow-blue-500/30 text-white">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            物理资源智能管控中心
                            <Badge variant="success" className="animate-pulse px-3 py-1 text-[10px]">LIVE</Badge>
                        </h1>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm font-medium text-slate-500">AI 驱动的资产调度与健康监控核心</p>
                            <div className="h-4 w-px bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 underline decoration-blue-500/30 underline-offset-4 flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                                <RefreshCw size={10} className={isTabRefreshing ? 'animate-spin' : ''} />
                                最后采样: {lastSyncTime}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Tab Switcher: Redesigned for High-End aesthetic */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1.5 rounded-2xl flex items-center shadow-inner">
                        {[
                            { id: 'monitor', label: '实时监控', icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-white' },
                            { id: 'risk', label: '风险预警', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-white' },
                            { id: 'maintenance', label: '维保管理', icon: Hammer, color: 'text-amber-600', bg: 'bg-white' },
                            { id: 'calendar', label: '资源日历', icon: Calendar, color: 'text-emerald-600', bg: 'bg-white' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewTab === tab.id ? `${tab.bg} dark:bg-slate-700 shadow-md ${tab.color} scale-105 z-10` : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.id === 'risk' && stats.conflictCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full ring-2 ring-white font-black">
                                        {stats.conflictCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden xl:block mx-1" />

                    <div className="flex items-center gap-2">
                        {isPMO && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
                                <div className="flex bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-slate-50 text-slate-500 border-r border-slate-100" title="导入配置"><Upload size={18} /></button>
                                    <button onClick={handleExportExcel} className="p-3 hover:bg-slate-50 text-slate-500" title="导出报告"><Download size={18} /></button>
                                </div>
                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => setShowAddResourceModal(true)}
                                    className="h-12 px-6 bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 rounded-2xl font-black shadow-xl shadow-slate-900/10"
                                >
                                    新增资产
                                </Button>
                            </>
                        )}
                        <Button
                            variant="outline"
                            className={`h-12 px-6 rounded-2xl font-black border-slate-200 hover:bg-slate-50 transition-all ${isFeishuSyncing ? 'animate-pulse' : ''}`}
                            onClick={async () => {
                                if (!isPMO || !feishuConfig.appId) return;
                                setIsFeishuSyncing(true);
                                try {
                                    const result = await syncFeishuData(feishuConfig);
                                    if (result.success && result.data) {
                                        result.data.projects.forEach(p => {
                                            if (!projects.find(existing => existing.id === p.id)) {
                                                addProject(p);
                                            }
                                        });
                                        result.data.resources.forEach(r => {
                                            if (!physicalBays.find(existing => existing.id === r.id) && 
                                                !physicalMachines.find(existing => existing.id === r.id)) {
                                                // Assuming simple resource add for demo
                                                addResource(r);
                                            }
                                        });
                                        setLastSyncTime(format(new Date(), 'HH:mm:ss'));
                                        setGlobalLastSyncTime(new Date().toLocaleString());
                                    }
                                } catch (e) {
                                    console.error('Feishu sync failed', e);
                                } finally {
                                    setIsFeishuSyncing(false);
                                }
                            }}
                        >
                            <RefreshCw size={16} className={`mr-2 ${isFeishuSyncing ? 'animate-spin' : ''}`} />
                            同步
                        </Button>
                    </div>
                </div>
            </div>

            {/* Smart Stats Grid: More visual and data-rich */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: '资产健康度', value: '84%', icon: Activity, color: 'blue', detail: '平均在线健康指数' },
                    { label: '占用冲突', value: `${stats.conflictCount} 项`, icon: AlertTriangle, color: 'red', detail: '关键路径排程干扰' },
                    { label: '待保养资产', value: `${stats.maintenanceCount} 台`, icon: Hammer, color: 'amber', detail: '已超过预警阈值' },
                    { label: '调度建议', value: '12 份', icon: CheckCircle2, color: 'emerald', detail: 'AI 自动生成优化方案' }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                    >
                        <Card className={`p-6 border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-gradient-to-br ${stat.color === 'blue' ? 'from-blue-50 to-white' : stat.color === 'red' ? 'from-red-50 to-white' : stat.color === 'amber' ? 'from-amber-50 to-white' : 'from-emerald-50 to-white'} dark:from-slate-800 dark:to-slate-900 overflow-hidden relative group`}>
                            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                                <stat.icon size={80} />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm text-${stat.color}-600`}>
                                    <stat.icon size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                                <div className={`text-[10px] font-bold text-${stat.color}-600`}>↑ 4.2%</div>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">{stat.detail}</p>
                            {stat.color === 'blue' && (
                                <div className="mt-4 h-1.5 w-full bg-slate-200/50 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-blue-600" />
                                </div>
                            )}
                        </Card>
                    </motion.div>
                ))}
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
                        <Card className="p-8 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[40px] overflow-hidden">
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10">
                                <div className="space-y-6 w-full xl:w-auto">
                                    <div className="flex items-center gap-4">
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit shadow-inner">
                                            {['bay', 'machine'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setResourceType(type as any)}
                                                    className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${resourceType === type ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {type === 'bay' ? 'BAY 测试位' : 'EQUIP 生产设备'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="h-8 w-px bg-slate-200" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">分类筛选:</span>
                                            <div className="flex gap-2">
                                                {resourceType === 'bay' ? (
                                                    ['all', 'S', 'M', 'L'].map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setSizeFilter(size as any)}
                                                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${sizeFilter === size ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                        >
                                                            {size === 'all' ? '全部规格' : `SIZE ${size}`}
                                                        </button>
                                                    ))
                                                ) : (
                                                    ['all', ...dynamicPlatforms].map(platform => (
                                                        <button
                                                            key={platform}
                                                            onClick={() => setPlatformFilter(platform)}
                                                            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${platformFilter === platform ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                        >
                                                            {platform === 'all' ? '全部平台' : platform}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">实时状态:</span>
                                        <div className="flex gap-2">
                                            {['all', 'available', 'occupied', 'maintenance'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => setStatusFilter(status as any)}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${statusFilter === status ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-blue-50/50 text-blue-600/60 hover:bg-blue-50'}`}
                                                >
                                                    {status === 'all' ? '全部监控' : status === 'available' ? '仅看可用' : status === 'occupied' ? '已占用' : '维护周期'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-6 w-full xl:w-auto">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="relative flex-1 xl:w-80 group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                            <input
                                                type="text"
                                                placeholder="智慧搜索资产名称、项目编号或负责人..."
                                                className="w-full pl-12 pr-6 py-4 rounded-[24px] border-none bg-slate-100/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 shadow-inner focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-medium transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[20px] shadow-inner">
                                            <button onClick={() => setViewMode('visual')} className={`p-3 rounded-xl transition-all ${viewMode === 'visual' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 scale-110' : 'text-slate-400'}`}><MapIcon size={20} /></button>
                                            <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 scale-110' : 'text-slate-400'}`}><ListIcon size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 px-4">
                                        {[
                                            { color: 'bg-emerald-500', label: '可用 (READY)', count: filteredItems.filter(i => i.status === 'available').length },
                                            { color: 'bg-blue-500', label: '锁定 (IN USE)', count: filteredItems.filter(i => i.status === 'occupied').length },
                                            { color: 'bg-amber-500', label: '维保 (MAINT)', count: filteredItems.filter(i => i.status === 'maintenance').length }
                                        ].map(dot => (
                                            <div key={dot.label} className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${dot.color} shadow-sm shadow-${dot.color}/50`} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dot.label}</span>
                                                <span className="text-xs font-mono text-slate-300 ml-1">{dot.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {viewMode === 'visual' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
                                    {filteredItems.map((item, i) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            key={item.id}
                                            onClick={() => setSelectedResource(item)}
                                            className={`relative min-h-[420px] p-6 rounded-[32px] border-2 transition-all cursor-pointer group flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 ${item.status === 'occupied' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' :
                                                item.status === 'maintenance' ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' :
                                                    'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-500'
                                                }`}
                                        >
                                            {/* Glow effect for cards */}
                                            {item.status === 'available' && (
                                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity" />
                                            )}

                                            <div>
                                                <div className="flex justify-between items-start z-10">
                                                    <div className={`p-3 rounded-2xl shadow-sm ${item.status === 'available' ? 'bg-slate-100 dark:bg-slate-700 text-blue-600' : 'bg-white/20 text-white'
                                                        }`}>
                                                        {resourceType === 'bay' ? <Box size={20} /> : <Cpu size={20} />}
                                                    </div>
                                                    <div className={`text-[9px] font-black underline underline-offset-4 tracking-widest ${item.status === 'available' ? 'text-slate-400' : 'text-white/60'
                                                        }`}>
                                                        {item.id.split('-')[1]}
                                                    </div>
                                                </div>

                                                {isPMO && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`确定要删除 ${item.name} 吗？`)) {
                                                                if (resourceType === 'bay') deletePhysicalBay(item.id);
                                                                else deletePhysicalMachine(item.id);
                                                            }
                                                        }}
                                                        className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 z-30"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}

                                                <div className="z-10 mt-5">
                                                    <div className={`text-[9px] font-black uppercase tracking-[0.1em] mb-1 ${item.status === 'available' ? 'text-slate-400' : 'text-white/60'
                                                        }`}>
                                                        {resourceType === 'bay' ? (item as BayResource).size + ' CLASS' : (item as MachineResource).platform}
                                                    </div>
                                                    <div className="text-lg font-black leading-tight mb-2 truncate">
                                                        {item.name}
                                                    </div>

                                                    {/* Health Bar on card */}
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex-1 h-1 rounded-full overflow-hidden ${item.status === 'available' ? 'bg-slate-100' : 'bg-white/20'}`}>
                                                            <div className={`h-full ${item.health > 70 ? 'bg-emerald-400' : item.health > 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${item.health}%` }} />
                                                        </div>
                                                        <span className={`text-[9px] font-mono font-bold ${item.status === 'available' ? 'text-slate-500' : 'text-white'}`}>
                                                            {Math.round(item.health)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col justify-end gap-3 mt-4 z-10">
                                                {/* Binding Relationship Visualization */}
                                                <div className="space-y-2">
                                                    {resourceType === 'bay' && (item as BayResource).currentMachineName && (
                                                        <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                                            <div className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 uppercase">
                                                                <Cpu size={10} /> 绑定机器
                                                            </div>
                                                            <div className="text-[10px] font-black truncate text-emerald-700 dark:text-emerald-300">{(item as BayResource).currentMachineName}</div>
                                                        </div>
                                                    )}

                                                    {resourceType === 'machine' && (item as MachineResource).currentBayName && (
                                                        <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                                            <div className="text-[8px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 uppercase">
                                                                <Box size={10} /> 所在 Bay 位
                                                            </div>
                                                            <div className="text-[10px] font-black truncate text-blue-700 dark:text-blue-300">{(item as MachineResource).currentBayName}</div>
                                                        </div>
                                                    )}

                                                    {(item as any).softwareVersion && (
                                                        <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30">
                                                            <div className="text-[8px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 uppercase">
                                                                <Activity size={10} /> 当前版本 (SW)
                                                            </div>
                                                            <div className="text-[10px] font-black truncate text-indigo-700 dark:text-indigo-300">{(item as any).softwareVersion}</div>
                                                        </div>
                                                    )}

                                                    {item.currentProjectName ? (
                                                        <div className="p-2 rounded-xl bg-slate-900/10 dark:bg-white/10 border border-current/10">
                                                            <div className={`text-[8px] font-black uppercase opacity-60 tracking-tighter`}>正在执行项目任务</div>
                                                            <div className="text-[10px] font-black truncate">{item.currentProjectName}</div>
                                                        </div>
                                                    ) : (
                                                        <div className={`text-[9px] font-black py-1.5 px-4 rounded-full w-fit shadow-sm flex items-center gap-2 ${item.status === 'maintenance' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'maintenance' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                                                            {item.status === 'maintenance' ? '定期维护中' : '全天候可预约'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Background ID Watermark */}
                                            <div className={`absolute -bottom-4 -right-4 text-7xl font-black opacity-[0.03] select-none pointer-events-none group-hover:opacity-[0.08] transition-opacity`}>
                                                {item.id.split('-')[1]}
                                            </div>

                                            {item.conflicts && item.conflicts.length > 0 && (
                                                <div className="absolute top-4 right-12 bg-red-500 text-white rounded-full p-1.5 shadow-lg ring-2 ring-white animate-bounce">
                                                    <AlertTriangle size={12} />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-slate-100/50 dark:border-slate-800 rounded-[32px] overflow-hidden bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm shadow-inner">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                            <tr>
                                                <th className="px-8 py-5">资源标识</th>
                                                <th className="px-8 py-5">软件版本 (SW)</th>
                                                <th className="px-8 py-5">系统健康指数</th>
                                                <th className="px-8 py-5">当前运行状态</th>
                                                <th className="px-8 py-5">逻辑绑定关系</th>
                                                <th className="px-8 py-5">分配/调度记录</th>
                                                <th className="px-8 py-5">下次维保基准</th>
                                                {isPMO && <th className="px-8 py-5">操作</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/30 dark:divide-slate-800/30">
                                            {filteredItems.map(item => (
                                                <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer" onClick={() => setSelectedResource(item)}>
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                {resourceType === 'bay' ? <Box size={20} /> : <Cpu size={20} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-black tracking-tighter uppercase mb-0.5">ID: {item.id.split('-')[1]}</span>
                                                                <span className="font-black text-sm">{item.name}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <Badge variant="neutral" className="font-mono text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100">
                                                            {(item as any).softwareVersion || '---'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div className={`h-full ${item.health > 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : item.health > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.health}%` }} />
                                                            </div>
                                                            <span className="text-xs font-mono font-bold">{Math.round(item.health)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <Badge variant={item.status === 'available' ? 'success' : item.status === 'occupied' ? 'primary' : 'warning'} className="font-black px-4 py-1.5 rounded-full">
                                                            {item.status === 'available' ? 'READY / 可用' : item.status === 'occupied' ? 'LOCKED / 占用' : 'MAINT / 维保'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {resourceType === 'bay' ? (
                                                            (item as BayResource).currentMachineName ? (
                                                                <div className="flex items-center gap-2 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl w-fit">
                                                                    <Cpu size={14} /> {(item as BayResource).currentMachineName}
                                                                </div>
                                                            ) : <span className="text-xs text-slate-300 font-medium">无绑定设备</span>
                                                        ) : (
                                                            (item as MachineResource).currentBayName ? (
                                                                <div className="flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl w-fit">
                                                                    <Box size={14} /> {(item as MachineResource).currentBayName}
                                                                </div>
                                                            ) : <span className="text-xs text-slate-300 font-medium">未入 Bay</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {item.conflicts && item.conflicts.length > 0 ? (
                                                            <div className="flex items-center gap-2 text-red-500 font-black text-xs bg-red-50 px-3 py-1.5 rounded-xl w-fit">
                                                                <AlertTriangle size={14} /> 发现调度冲突
                                                            </div>
                                                        ) : item.currentProjectName ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">占用项目</span>
                                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.currentProjectName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 italic font-medium">全时段空闲</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5 text-xs font-mono font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        {item.nextMaintenance}
                                                    </td>
                                                    {isPMO && (
                                                        <td className="px-8 py-5">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`确定要删除 ${item.name} 吗？`)) {
                                                                        if (resourceType === 'bay') deletePhysicalBay(item.id);
                                                                        else deletePhysicalMachine(item.id);
                                                                    }
                                                                }}
                                                                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )
                }

                {
                    viewTab === 'risk' && (
                        <motion.div
                            key="risk"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Left: Risk Summary & Filters */}
                                <Card className="p-8 lg:col-span-1 space-y-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-none shadow-xl rounded-[40px]">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            风险分级过滤
                                        </h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: '极高风险', count: risks.filter(r => r.riskScore > 80).length, color: 'bg-red-500', active: true },
                                                { label: '中高风险', count: risks.filter(r => r.riskScore > 60 && r.riskScore <= 80).length, color: 'bg-orange-500', active: false },
                                                { label: '一般风险', count: risks.filter(r => r.riskScore > 50 && r.riskScore <= 60).length, color: 'bg-amber-500', active: false },
                                                { label: '潜在风险', count: 0, color: 'bg-blue-500', active: false },
                                            ].map(f => (
                                                <div key={f.label} className={`flex items-center justify-between p-4 rounded-[20px] border transition-all cursor-pointer group ${f.active ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md ring-1 ring-slate-100 dark:ring-slate-800' : 'border-transparent hover:bg-white/40'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${f.color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{f.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{f.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                            <Zap size={14} className="text-blue-500" />
                                            智能诊断报告 (AI)
                                        </h4>
                                        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-[32px] border border-blue-100/50 dark:border-blue-900/30 relative overflow-hidden group">
                                            <div className="absolute -right-4 -top-4 text-blue-500/10 group-hover:scale-125 transition-transform duration-700">
                                                <Activity size={80} />
                                            </div>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-bold relative z-10">
                                                检测到 <span className="underline decoration-blue-500/30 underline-offset-4">Bay 04</span> 与 <span className="underline decoration-blue-500/30 underline-offset-4">Bay 07</span> 存在长期占用冲突，建议将 <span className="italic font-black text-indigo-800 dark:text-indigo-200">Project Apollo</span> 的部分测试迁移至研发二号楼。
                                            </p>
                                            <Button variant="ghost" size="sm" className="mt-4 text-blue-600 dark:text-blue-400 font-black p-0 h-auto hover:bg-transparent flex items-center gap-2 group/btn">
                                                生成调优方案库
                                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Middle: Active Risk List */}
                                <Card className="p-10 lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-none shadow-xl rounded-[40px] overflow-hidden">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-3xl shadow-sm">
                                                <AlertTriangle size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight">关键冲突与风险清单</h3>
                                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">REAL-TIME RISK MONITORING</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-red-500 border-red-200 px-4 py-1.5 rounded-full font-black text-[10px]">待处理: {risks.length}</Badge>
                                    </div>

                                    <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 scrollbar-hide">
                                        {risks.length > 0 ? risks.map((r, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={r.id}
                                                className="group p-6 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-[35px] hover:shadow-2xl hover:border-red-200 dark:hover:border-red-900/30 transition-all cursor-pointer overflow-hidden relative"
                                                onClick={() => setSelectedResource(r)}
                                            >
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                                    <AlertTriangle size={120} />
                                                </div>

                                                <div className="flex items-start justify-between relative z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="shrink-0 w-16 h-16 bg-red-50 dark:bg-red-500/5 rounded-[24px] flex flex-col items-center justify-center border border-red-100/50 dark:border-red-900/20 group-hover:scale-105 transition-transform shadow-sm">
                                                            <span className="text-[9px] font-black text-red-400 tracking-widest">SCORE</span>
                                                            <span className="text-2xl font-black text-red-600">{(r as any).riskScore}</span>
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-lg font-black text-slate-900 dark:text-slate-100">{r.name}</span>
                                                                <Badge variant="neutral" size="sm" className="text-[9px] font-black uppercase tracking-widest">{(r as any).model || (r as any).size}</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1.5 text-xs font-bold text-slate-400">
                                                                <span className="flex items-center gap-1.5 text-blue-500"><Activity size={12} /> {r.status}</span>
                                                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                <span className="flex items-center gap-1.5"><Calendar size={12} /> 最后维保: {r.lastMaintenance}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="p-3 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl">
                                                        <MoreVertical size={20} className="text-slate-400" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-6">
                                                    <div className="p-4 bg-red-50/40 dark:bg-red-900/5 rounded-2xl border border-red-50/50 dark:border-red-900/10">
                                                        <div className="text-[9px] uppercase font-black text-red-400 tracking-widest mb-1.5">重叠预定冲突</div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                            <AlertTriangle size={14} className="text-red-500" />
                                                            {r.conflicts?.length ? `${r.conflicts.length} 个关键重叠` : '检测到潜在逻辑冲突'}
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-amber-50/40 dark:bg-amber-900/5 rounded-2xl border border-amber-50/50 dark:border-amber-900/10">
                                                        <div className="text-[9px] uppercase font-black text-amber-500 tracking-widest mb-1.5">系统健康警报</div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${r.health < 40 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                                            健康度 {Math.round(r.health)}% {r.health < 40 ? '· 紧急维护' : ''}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mt-6">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[11px] h-11 font-black rounded-2xl hover:shadow-lg transition-all"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedResource(r); }}
                                                    >
                                                        调配处理明细
                                                    </Button>
                                                    {r.health < 60 ? (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="flex-1 bg-amber-500 hover:bg-amber-600 border-none text-[11px] h-11 font-black rounded-2xl shadow-lg shadow-amber-500/20"
                                                            onClick={(e) => { e.stopPropagation(); handleMaintenance(r.id); }}
                                                            disabled={isActionLoading || !canManageResource(r)}
                                                        >
                                                            {isActionLoading ? '处理中...' : '一键维保修复'}
                                                        </Button>
                                                    ) : (
                                                        <Button variant="primary" size="sm" className="flex-1 bg-red-600 hover:bg-red-700 border-none text-[11px] h-11 font-black rounded-2xl shadow-lg shadow-red-500/20">紧急召回/联系 PM</Button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                                                <CheckCircle2 size={64} className="opacity-20 mb-6" />
                                                <p className="font-black text-lg opacity-40 uppercase tracking-widest">所有系统运行稳定</p>
                                                <p className="text-sm mt-2 opacity-30">未检测到高等级风险与调度冲突</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Right: AI & Trends */}
                                <div className="lg:col-span-1 space-y-8">
                                    <Card className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none shadow-2xl relative overflow-hidden rounded-[40px]">
                                        <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                                        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />

                                        <h4 className="font-black text-xl mb-6 flex items-center gap-3 relative z-10">
                                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                                <Zap size={20} className="text-yellow-400 fill-yellow-400" />
                                            </div>
                                            AI 自动调优引擎
                                        </h4>
                                        <p className="text-sm text-slate-300 mb-8 leading-relaxed italic relative z-10 opactiy-80">
                                            "基于当前项目优先级排行（Priority Stack），我为您找到了 2 个可调用的冗余资源。"
                                        </p>

                                        <div className="space-y-4 relative z-10">
                                            <div className="p-5 bg-white/5 hover:bg-white/10 rounded-[28px] border border-white/10 backdrop-blur-2xl transition-all cursor-pointer group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">策略方案 A</span>
                                                    <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-none h-5 text-[9px] font-black px-2">建议采纳</Badge>
                                                </div>
                                                <div className="text-xs font-bold leading-relaxed transition-all group-hover:text-blue-300">
                                                    将 [uCT 510 #2] 的维护时间提前 2 天，可完全释放 [Project Mars] 的上电窗口。
                                                </div>
                                            </div>
                                            <Button className="w-full bg-white text-indigo-950 border-none font-black hover:bg-slate-100 mt-6 rounded-[20px] py-7 text-sm shadow-xl shadow-black/10">执行自动化调优方案</Button>
                                        </div>
                                    </Card>

                                    <Card className="p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-none shadow-xl rounded-[40px]">
                                        <h4 className="font-black mb-8 flex items-center gap-3 underline decoration-blue-500/30 underline-offset-8">
                                            <TrendingUp size={20} className="text-blue-500" />
                                            资源负载预测 (30D)
                                        </h4>
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-end gap-2 h-40">
                                                {[30, 45, 85, 95, 70, 50, 40, 35, 60, 90, 80, 55].map((h, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                                        <div className="relative w-full h-full flex items-end">
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${h}%` }}
                                                                transition={{ duration: 1, delay: i * 0.05 }}
                                                                className={`w-full rounded-t-xl transition-all duration-500 ${h >= 90 ? 'bg-red-500' : h >= 70 ? 'bg-amber-500' : 'bg-blue-500'} group-hover:scale-y-110 group-hover:brightness-110 shadow-sm`}
                                                            />
                                                        </div>
                                                        <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors uppercase">W{i + 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-slate-100/50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3 text-xs font-black text-slate-700 dark:text-slate-200">
                                                    <Info size={16} className="text-blue-500" />
                                                    W4 预测负载峰值 95%
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">受 [大里程碑交付] 影响，建议提前一周锁定备用物理机以应对突发需求。</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {
                    viewTab === 'maintenance' && (
                        <motion.div
                            key="maintenance"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Left: Quick Stats */}
                                <Card className="p-8 lg:col-span-1 space-y-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-none shadow-xl rounded-[40px]">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        维保状态概览
                                    </h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: '待处理请求', count: 6, color: 'from-amber-400 to-orange-500', icon: AlarmClock },
                                            { label: '正在维保中', count: stats.maintenanceCount, color: 'from-blue-400 to-indigo-600', icon: Hammer },
                                            { label: '本月已完成', count: 12, color: 'from-emerald-400 to-teal-600', icon: ShieldCheck },
                                        ].map(stat => (
                                            <div key={stat.label} className="p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[32px] border border-white/20 dark:border-slate-700/30 shadow-sm group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                                    <stat.icon size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                                <div className={`text-2xl font-black bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>{stat.count}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full h-14 rounded-2xl font-black bg-white/40 hover:bg-white/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 border-none flex items-center gap-3 group mt-4"
                                        onClick={() => setShowMaintSchedule(true)}
                                    >
                                        <CalendarDays size={20} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                                        维保排期总揽
                                    </Button>
                                </Card>

                                {/* Middle: Active Pipeline */}
                                <Card className="p-10 lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-none shadow-xl rounded-[40px] overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
                                        <Truck size={200} />
                                    </div>
                                    <div className="flex justify-between items-center mb-10 relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-3xl shadow-sm">
                                                <History size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight">资产维保流水线</h3>
                                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">REAL-TIME MAINTENANCE QUEUE</p>
                                            </div>
                                        </div>
                                        <Badge variant="neutral" className="px-4 py-1.5 rounded-full font-black text-[10px]">实时更新: {lastSyncTime}</Badge>
                                    </div>

                                    <div className="space-y-4 relative z-10 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                                        {maintScheduleData.slice(0, 10).map((plan, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                key={plan.id}
                                                className="p-6 bg-white/60 dark:bg-slate-800/60 rounded-[30px] border border-white/40 dark:border-slate-700/40 hover:border-blue-200 dark:hover:border-blue-900/30 transition-all flex items-center justify-between group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-110 shadow-sm">
                                                        {plan.type === 'bay' ? <Box size={24} className="text-blue-500" /> : <Cpu size={24} className="text-amber-500" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-900 dark:text-slate-100">{plan.name}</span>
                                                            <Badge variant="neutral" size="sm" className="text-[9px] font-black uppercase tracking-widest h-5">ROUTINE</Badge>
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 mt-1 font-bold flex items-center gap-2">
                                                            <Activity size={10} className="text-blue-400" /> 下次维保: {plan.nextMaintenance}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl">
                                                    <ChevronRight size={18} className="text-slate-300" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Right: MRO & Metrics */}
                                <div className="lg:col-span-1 space-y-8">
                                    <Card className="p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-none shadow-xl rounded-[40px]">
                                        <h4 className="font-black mb-6 flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                                <Settings2 size={16} className="text-blue-600" />
                                            </div>
                                            关键备件库 (MRO)
                                        </h4>
                                        <div className="space-y-4">
                                            {[
                                                { name: '激光校准器 A-12', stock: 2, min: 2, status: 'urgent' },
                                                { name: '传感器电芯', stock: 45, min: 20, status: 'good' },
                                                { name: '机架散热模组', stock: 8, min: 10, status: 'warning' },
                                            ].map(item => (
                                                <div key={item.name} className="space-y-2">
                                                    <div className="flex justify-between items-center text-xs font-black px-1">
                                                        <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                                                        <span className={item.status === 'urgent' ? 'text-red-500' : item.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>{item.stock}</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className={`h-full ${item.status === 'urgent' ? 'bg-red-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(item.stock / 50) * 100}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="outline" className="w-full mt-6 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black h-12 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800">MRO 管理</Button>
                                    </Card>

                                    <Card className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-2xl rounded-[40px] relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                                        <h4 className="font-black text-lg mb-6 relative z-10">维保合规率</h4>
                                        <div className="flex items-center justify-center py-4 relative z-10">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="64" cy="64" r="58" stroke="white" strokeWidth="12" fill="transparent" strokeOpacity="0.1" />
                                                    <circle cx="64" cy="64" r="58" stroke="white" strokeWidth="12" fill="transparent" strokeDasharray="364.4" strokeDashoffset="43.7" />
                                                </svg>
                                                <span className="absolute text-3xl font-black">88%</span>
                                            </div>
                                        </div>
                                        <Button className="w-full bg-white/20 hover:bg-white/30 border-none text-white font-black h-12 rounded-2xl backdrop-blur-md">档案详情</Button>
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {
                    viewTab === 'calendar' && (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                                <Card className="p-10 xl:col-span-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-none shadow-xl rounded-[40px] overflow-hidden">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-3xl shadow-sm">
                                                <Calendar size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight">资源可用性日历</h3>
                                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">GLOBAL AVAILABILITY</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[22px] border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm"><ChevronLeft size={20} /></button>
                                            <span className="font-black px-6 text-sm tracking-tight">{format(currentMonth, 'yyyy年 M月')}</span>
                                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm"><ChevronRight size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800/50 rounded-[35px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative z-10">
                                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                                            <div key={d} className="bg-white dark:bg-slate-900/80 p-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
                                        ))}
                                        {calendarDays.map((day, i) => {
                                            const available = getAvailableResourcesForDate(day);
                                            const isCurrentMonth = format(day, 'M') === format(currentMonth, 'M');
                                            const bayCount = available.filter(r => r.id.startsWith('bay')).length;
                                            const machineCount = available.filter(r => r.id.startsWith('mach')).length;
                                            const isCurrentSelected = selectedCalendarDate && format(day, 'yyyy-MM-dd') === format(selectedCalendarDate, 'yyyy-MM-dd');

                                            return (
                                                <motion.div
                                                    key={i}
                                                    whileHover={{ zIndex: 10 }}
                                                    onClick={() => setSelectedCalendarDate(day)}
                                                    className={`min-h-[140px] p-5 bg-white dark:bg-slate-900 transition-all cursor-pointer border-2 relative group overflow-hidden ${!isCurrentMonth ? 'opacity-20 grayscale' : 'border-transparent'} ${isCurrentSelected ? 'border-emerald-500 bg-emerald-50/10 shadow-2xl z-20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-4 relative z-10">
                                                        <span className={`text-sm font-black transition-all ${isToday(day) ? 'bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-2xl shadow-lg' : isCurrentSelected ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>{format(day, 'd')}</span>
                                                        {isCurrentMonth && (bayCount + machineCount) > 40 && (
                                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 relative z-10">
                                                        <div className="flex items-center justify-between text-[9px] font-black p-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl text-blue-600 border border-blue-100/30">
                                                            <span className="flex items-center gap-1.5"><Box size={10} /> BAY</span>
                                                            <span className="text-xs">{bayCount}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[9px] font-black p-2 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl text-amber-600 border border-amber-100/30">
                                                            <span className="flex items-center gap-1.5"><Cpu size={10} /> 设备</span>
                                                            <span className="text-xs">{machineCount}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </Card>

                                <div className="lg:col-span-1">
                                    <Card className="p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-none shadow-xl rounded-[40px] flex flex-col h-full min-h-[600px]">
                                        {selectedCalendarDate ? (
                                            <>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-3xl">
                                                        <TrendingUp size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-lg">{format(selectedCalendarDate, 'MM月 dd日')}</h4>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">当日详情</p>
                                                    </div>
                                                </div>

                                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
                                                    <button
                                                        onClick={() => setCalendarDetailTab('bay')}
                                                        className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${calendarDetailTab === 'bay' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                                                    >
                                                        Bay 位
                                                    </button>
                                                    <button
                                                        onClick={() => setCalendarDetailTab('machine')}
                                                        className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${calendarDetailTab === 'machine' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                                                    >
                                                        机器设备
                                                    </button>
                                                </div>

                                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                                                    {getAvailableResourcesForDate(selectedCalendarDate)
                                                        .filter(r => calendarDetailTab === 'bay' ? r.id.startsWith('bay') : r.id.startsWith('mach'))
                                                        .map((res) => (
                                                            <div key={res.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                                                                <span className="text-xs font-black">{res.name}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 px-3 text-[10px] font-black text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => {
                                                                        setSelectedResource(res);
                                                                        setShowBookingForm(true);
                                                                    }}
                                                                >
                                                                    预定
                                                                </Button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                                <TrendingUp size={28} className="text-slate-300 mb-4" />
                                                <p className="font-black text-slate-400 text-sm uppercase">选择日期查看详情</p>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Detail Drawer Simulation */}
            <AnimatePresence>
                {
                    selectedResource && (
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
                                                        if (selectedResource) {
                                                            updateResourcePool(selectedResource.id, { name: editingNameValue }, (selectedResource as any).version);
                                                            setIsEditingName(false);
                                                        }
                                                    }}>保存</Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-2xl font-black">{selectedResource?.name}</h2>
                                                    {isPMO && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-[10px] font-black uppercase text-slate-400 p-0 h-auto hover:text-blue-600"
                                                            onClick={() => {
                                                                if (selectedResource) {
                                                                    setEditingNameValue(selectedResource.name);
                                                                    setIsEditingName(true);
                                                                }
                                                            }}
                                                        >
                                                            [编辑名称]
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={selectedResource?.status === 'available' ? 'success' : selectedResource?.status === 'occupied' ? 'primary' : 'warning'}>
                                                    {selectedResource?.status === 'available' ? '可用' : selectedResource?.status === 'occupied' ? '占用' : '维护'}
                                                </Badge>
                                                <span className="text-xs text-slate-400 font-mono">ID: {selectedResource?.id}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isPMO && selectedResource && (
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
                                            <div className={`text-xl font-black ${selectedResource ? getHealthColor(selectedResource.health) : ''} inline-block px-3 py-1 rounded-lg`}>
                                                {selectedResource ? Math.round(selectedResource.health) : 0} / 100
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
                                                    {selectedResource?.id.startsWith('bay') ? (
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
                                                            if (selectedResource) {
                                                                const updates: any = selectedResource.id.startsWith('bay')
                                                                    ? { size: editClassificationValue.size }
                                                                    : { platform: editClassificationValue.platform, model: editClassificationValue.model };
                                                                updateResourcePool(selectedResource.id, updates, (selectedResource as any).version);
                                                                setIsEditingClassification(false);
                                                            }
                                                        }}>保存更改</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        {selectedResource?.id.startsWith('bay') ? (
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
                                                    {isPMO && selectedResource && (
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
                                        <Activity size={16} /> 软件包/固件版本 (Software)
                                    </h4>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 mb-8">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-xs text-slate-400">当前运行版本:</div>
                                            <Badge variant="primary" className="font-mono">{(selectedResource as any)?.softwareVersion || '未部署'}</Badge>
                                        </div>
                                        {selectedResource && canManageResource(selectedResource) && (
                                            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="输入新版本号，回车保存..."
                                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                        id="sw-update-input"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = (e.target as HTMLInputElement).value;
                                                                if (val) {
                                                                    handleUpdateSoftware(val);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <Button size="sm" onClick={() => {
                                                        const el = document.getElementById('sw-update-input') as HTMLInputElement;
                                                        if (el.value) {
                                                            handleUpdateSoftware(el.value);
                                                            el.value = '';
                                                        }
                                                    }}>变更</Button>
                                                </div>
                                            </div>
                                        )}
                                        {/* Software History */}
                                        {(selectedResource as any)?.softwareHistory && (selectedResource as any)?.softwareHistory.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                                                    <History size={12} /> 版本变更追踪周期
                                                </div>
                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                                                    {(selectedResource as any).softwareHistory.map((h: SoftwareHistoryRecord) => (
                                                        <div key={h.id} className="text-[10px] flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-blue-600 dark:text-blue-400">{h.version}</span>
                                                                <span className="text-[9px] text-slate-400 font-medium">{h.notes}</span>
                                                            </div>
                                                            <div className="text-right flex flex-col items-end">
                                                                <span className="text-slate-500 font-bold">{h.changedByName}</span>
                                                                <span className="text-[9px] text-slate-400">{h.date}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <Zap size={16} /> 快速操作
                                    </h4>
                                    <div className="space-y-4">
                                        {selectedResource?.status === 'occupied' ? (
                                            selectedResource && canManageResource(selectedResource) ? (
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
                                                        onClick={() => {
                                                            if (selectedResource) {
                                                                handleRelease(selectedResource.id, (window as any)._returnStatus || false);
                                                            }
                                                        }}
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
                                        ) : selectedResource?.status === 'available' ? (
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                                                {!showBookingForm ? (
                                                    <Button
                                                        variant="primary"
                                                        className="w-full py-6 text-sm font-black shadow-lg shadow-blue-500/20"
                                                        onClick={() => setShowBookingForm(true)}
                                                        disabled={!canBook || selectedResource?.status !== 'available'}
                                                    >
                                                        {canBook ? (selectedResource?.status === 'available' ? '立即为项目预定' : '资源不可用') : '暂无预定权限'}
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
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">软件包/固件版本</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="如: V2.5.0-Release"
                                                                    className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                                                                    value={bookingExtra.softwareVersion}
                                                                    onChange={(e) => setBookingExtra({ ...bookingExtra, softwareVersion: e.target.value })}
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

                                                        {!selectedResource?.id.startsWith('bay') && (
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
                                                                onClick={() => selectedResource && handleBooking(selectedResource)}
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
                                            onClick={() => selectedResource && handleMaintenance(selectedResource.id)}
                                            disabled={isActionLoading || !selectedResource || !canManageResource(selectedResource)}
                                        >
                                            {isActionLoading ? '正在同步维保数据...' : (selectedResource && canManageResource(selectedResource)) ? '执行一键维保/校准' : '仅限PMO管理未占用设备'}
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
                    )
                }

                {
                    selectedCalendarDate && (
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
                    )
                }

                {
                    showFeishuConnect && (
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
                    )
                }

                {
                    showMaintSchedule && (
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
                                                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest px-3 border-l border-slate-200">申请人: {plan.applicant}</div>
                                                                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest px-3 border-l border-slate-200">{plan.applicantDept}</div>
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
                    )
                }
            </AnimatePresence>
            {/* Add Resource Modal */}
            <AnimatePresence>
                {
                    showAddResourceModal && (
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
                    )
                }
            </AnimatePresence>
        </div>
    );
};

export default BayMachineResource;
