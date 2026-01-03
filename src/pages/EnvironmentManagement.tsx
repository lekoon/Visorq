import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Server, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { usePMOStore } from '../store/usePMOStore';
import type { EnvironmentResource, EnvironmentType } from '../types';
import { Card, Button, Badge, PageContainer, PageHeader } from '../components/ui';
import AddEnvironmentModal from '../components/AddEnvironmentModal';
import BookEnvironmentModal from '../components/BookEnvironmentModal';

const EnvironmentManagement: React.FC = () => {
    const {
        environmentResources,
        addEnvironmentResource,
        bookEnvironment,
    } = usePMOStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentResource | null>(null);
    const [filterType, setFilterType] = useState<EnvironmentType | 'all'>('all');

    const filteredEnvironments = useMemo(() => {
        if (filterType === 'all') return environmentResources;
        return environmentResources.filter((env) => env.type === filterType);
    }, [environmentResources, filterType]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'occupied':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'offline':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
        }
    };

    const getTypeIcon = (type: EnvironmentType) => {
        switch (type) {
            case 'test':
            case 'staging':
            case 'production':
            case 'integration':
                return <Server className="w-5 h-5" />;
            default:
                return <Calendar className="w-5 h-5" />;
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title="环境资源管理"
                description="管理测试环境、发布窗口等非人力资源，避免基础设施冲突"
                actions={
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        添加环境资源
                    </Button>
                }
            />

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {['all', 'test', 'staging', 'production', 'integration', 'device', 'license'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${filterType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        {type === 'all' ? '全部' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Environment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnvironments.map((env) => {
                    const activeBookings = env.bookings.filter(
                        (b) => b.status === 'active' || b.status === 'reserved'
                    );
                    const upcomingBookings = env.bookings.filter((b) => {
                        if (b.status !== 'reserved') return false;
                        const start = new Date(b.startDate);
                        const now = new Date();
                        return start > now;
                    });

                    return (
                        <Card key={env.id} className="hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            {getTypeIcon(env.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                {env.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {env.type}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={getStatusColor(env.status)}>
                                        {env.status === 'available' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {env.status === 'occupied' && <Clock className="w-3 h-3 mr-1" />}
                                        {env.status === 'maintenance' && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {env.status}
                                    </Badge>
                                </div>

                                {/* Description */}
                                {env.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        {env.description}
                                    </p>
                                )}

                                {/* Bookings Summary */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">当前使用</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            {activeBookings.length} 个预定
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">即将到来</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            {upcomingBookings.length} 个预定
                                        </span>
                                    </div>
                                </div>

                                {/* Latest Booking */}
                                {activeBookings.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                                            当前占用
                                        </p>
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            {activeBookings[0].projectName}
                                        </p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            {new Date(activeBookings[0].startDate).toLocaleDateString()} -{' '}
                                            {new Date(activeBookings[0].endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            setSelectedEnvironment(env);
                                            setShowBookingModal(true);
                                        }}
                                        variant="secondary"
                                        className="flex-1"
                                        disabled={env.status !== 'available'}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        预约
                                    </Button>
                                    <Button
                                        onClick={() => setSelectedEnvironment(env)}
                                        variant="secondary"
                                    >
                                        查看详情
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredEnvironments.length === 0 && (
                <Card className="p-12 text-center">
                    <Server className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        暂无环境资源
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                        添加测试环境、发布窗口等资源以避免冲突
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        添加第一个环境资源
                    </Button>
                </Card>
            )}

            {/* Add Environment Modal */}
            <AddEnvironmentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={(environment) => {
                    addEnvironmentResource(environment);
                }}
            />

            {/* Book Environment Modal */}
            <BookEnvironmentModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                environment={selectedEnvironment}
                onBook={(booking) => {
                    bookEnvironment(booking);
                }}
            />
        </PageContainer>
    );
};

export default EnvironmentManagement;
