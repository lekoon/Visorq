/**
 * Resource Detail Modal
 * Comprehensive modal for editing resource details, members, and skills
 */

import React, { useState, useEffect } from 'react';
import { X, User, Trash2, Plus, Save, Mail, Phone, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { ResourcePoolItem, TeamMember, Skill } from '../types';

interface ResourceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceId: string;
}

type Tab = 'basic' | 'members' | 'skills';

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({ isOpen, onClose, resourceId }) => {
    const { resourcePool, updateResource } = useStore();
    const resource = resourcePool.find(r => r.id === resourceId);

    const [activeTab, setActiveTab] = useState<Tab>('basic');
    const [formData, setFormData] = useState<Partial<ResourcePoolItem>>({});
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);

    // Member editing state
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        if (resource) {
            setFormData({
                name: resource.name,
                totalQuantity: resource.totalQuantity,
                costPerUnit: resource.costPerUnit,
            });
            setMembers(resource.members || []);
            setSkills(resource.skills || []);
        }
    }, [resource]);

    const handleSaveBasic = () => {
        if (!resource) return;
        updateResource(resource.id, {
            ...formData,
            totalQuantity: parseInt(formData.totalQuantity?.toString() || '0'),
        });
        alert('基本信息已保存');
    };

    const handleSaveMembers = () => {
        if (!resource) return;
        updateResource(resource.id, { members });
        alert('成员列表已保存');
    };

    const handleSaveSkills = () => {
        if (!resource) return;
        updateResource(resource.id, { skills });
        alert('技能列表已保存');
    };

    const handleAddMember = () => {
        const newMember: TeamMember = {
            id: `member-${Date.now()}`,
            name: '新成员',
            role: resource?.name || 'Engineer',
            skills: [],
            availability: 100,
            assignments: [],
            joinDate: new Date().toISOString().split('T')[0],
        };
        setMembers([...members, newMember]);
        setEditingMember(newMember);
    };

    const handleDeleteMember = (memberId: string) => {
        if (confirm('确定要删除这位成员吗？')) {
            setMembers(members.filter(m => m.id !== memberId));
            if (editingMember?.id === memberId) {
                setEditingMember(null);
            }
        }
    };

    const handleUpdateMember = (id: string, updates: Partial<TeamMember>) => {
        setMembers(members.map(m => m.id === id ? { ...m, ...updates } : m));
        if (editingMember?.id === id) {
            setEditingMember({ ...editingMember, ...updates });
        }
    };

    if (!isOpen || !resource) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{resource.name}</h2>
                            <p className="text-sm text-slate-500">资源详情管理</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        基本信息
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        成员管理 ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('skills')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'skills' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        技能定义 ({skills.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {activeTab === 'basic' && (
                        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold mb-4">基本配置</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">资源名称</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">总容量 (人数)</label>
                                    <input
                                        type="number"
                                        value={formData.totalQuantity || 0}
                                        onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">注意：修改总容量不会自动添加或删除成员记录。</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">单位成本 (每人月)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-slate-500">$</span>
                                        <input
                                            type="number"
                                            value={formData.costPerUnit || 0}
                                            onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button
                                        onClick={handleSaveBasic}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Save size={18} />
                                        <span>保存更改</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="flex h-full gap-6">
                            {/* Member List */}
                            <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-900">成员列表</h3>
                                    <button
                                        onClick={handleAddMember}
                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {members.map(member => (
                                        <div
                                            key={member.id}
                                            onClick={() => setEditingMember(member)}
                                            className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${editingMember?.id === member.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-slate-900">{member.name}</div>
                                                    <div className="text-xs text-slate-500">{member.role}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMember(member.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {members.length === 0 && (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            暂无成员，点击右上角添加
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Member Details */}
                            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
                                {editingMember ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-slate-900">编辑成员信息</h3>
                                            <button
                                                onClick={handleSaveMembers}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Save size={16} />
                                                <span>保存列表</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
                                                <input
                                                    type="text"
                                                    value={editingMember.name}
                                                    onChange={(e) => handleUpdateMember(editingMember.id, { name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">职位/角色</label>
                                                <input
                                                    type="text"
                                                    value={editingMember.role}
                                                    onChange={(e) => handleUpdateMember(editingMember.id, { role: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                    <input
                                                        type="email"
                                                        value={editingMember.email || ''}
                                                        onChange={(e) => handleUpdateMember(editingMember.id, { email: e.target.value })}
                                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg"
                                                        placeholder="email@example.com"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">电话</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                    <input
                                                        type="text"
                                                        value={editingMember.phone || ''}
                                                        onChange={(e) => handleUpdateMember(editingMember.id, { phone: e.target.value })}
                                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">入职日期</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                                    <input
                                                        type="date"
                                                        value={editingMember.joinDate || ''}
                                                        onChange={(e) => handleUpdateMember(editingMember.id, { joinDate: e.target.value })}
                                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">可用性 (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={editingMember.availability}
                                                    onChange={(e) => handleUpdateMember(editingMember.id, { availability: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">技能 (逗号分隔)</label>
                                            <textarea
                                                value={editingMember.skills.join(', ')}
                                                onChange={(e) => handleUpdateMember(editingMember.id, { skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg h-24"
                                                placeholder="React, TypeScript, Node.js..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <User size={48} className="mb-4 opacity-20" />
                                        <p>选择左侧成员进行编辑</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'skills' && (
                        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">技能定义</h3>
                                <button
                                    onClick={() => {
                                        const newSkill: Skill = {
                                            id: `skill-${Date.now()}`,
                                            name: 'New Skill',
                                            level: 'intermediate'
                                        };
                                        setSkills([...skills, newSkill]);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Plus size={16} />
                                    <span>添加技能</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {skills.map((skill, index) => (
                                    <div key={skill.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={skill.name}
                                                onChange={(e) => {
                                                    const newSkills = [...skills];
                                                    newSkills[index].name = e.target.value;
                                                    setSkills(newSkills);
                                                }}
                                                className="w-full px-2 py-1 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none font-medium"
                                            />
                                        </div>
                                        <select
                                            value={skill.level}
                                            onChange={(e) => {
                                                const newSkills = [...skills];
                                                newSkills[index].level = e.target.value as any;
                                                setSkills(newSkills);
                                            }}
                                            className="px-2 py-1 bg-white border border-slate-200 rounded text-sm"
                                        >
                                            <option value="beginner">初级</option>
                                            <option value="intermediate">中级</option>
                                            <option value="advanced">高级</option>
                                            <option value="expert">专家</option>
                                        </select>
                                        <button
                                            onClick={() => setSkills(skills.filter(s => s.id !== skill.id))}
                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {skills.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        暂无技能定义
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSaveSkills}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Save size={18} />
                                    <span>保存技能</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceDetailModal;
