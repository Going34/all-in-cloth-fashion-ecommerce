'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { teamActions } from '@/store/slices/team/teamSlice';
import { 
  selectTeamMembers, 
  selectTeamLoading, 
  selectTeamError
} from '@/store/slices/team/teamSelectors';
import { ShieldCheck, UserPlus, Mail, Shield, Trash2, Edit3, Lock, X, Save, Loader2 } from 'lucide-react';
import { AdminRole } from '../../types';

const Roles: React.FC = () => {
  const dispatch = useAppDispatch();
  const team = useAppSelector(selectTeamMembers);
  const loading = useAppSelector(selectTeamLoading);
  const error = useAppSelector(selectTeamError);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'Support' as AdminRole });
  const [editForm, setEditForm] = useState({ role: 'Support' as AdminRole });

  useEffect(() => {
    dispatch(teamActions.fetchTeamDataRequest());
  }, [dispatch]);

  const roleConfigs = [
    { name: 'Admin', desc: 'Full access to all modules, including roles and billing.', color: 'indigo' },
    { name: 'Ops', desc: 'Can manage products, inventory, and order fulfillment.', color: 'blue' },
    { name: 'Support', desc: 'Can view customer data and manage order status / returns.', color: 'emerald' },
  ];

  const openInviteModal = () => {
    setInviteForm({ email: '', name: '', role: 'Support' });
    setIsInviteModalOpen(true);
  };

  const openEditModal = (memberId: string, currentRole: AdminRole) => {
    setEditingMemberId(memberId);
    setEditForm({ role: currentRole });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (memberId: string) => {
    setDeletingMemberId(memberId);
    setIsDeleteModalOpen(true);
  };

  const handleInvite = () => {
    if (!inviteForm.email || !inviteForm.name) {
      alert('Please fill in all required fields');
      return;
    }

    dispatch(teamActions.inviteTeamMemberRequest({
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
    }));

    setIsInviteModalOpen(false);
    setInviteForm({ email: '', name: '', role: 'Support' });
  };

  const handleEdit = () => {
    if (editingMemberId) {
      dispatch(teamActions.updateTeamMemberRoleRequest({
        userId: editingMemberId,
        role: editForm.role,
      }));
      setIsEditModalOpen(false);
      setEditingMemberId(null);
    }
  };

  const handleDelete = () => {
    if (deletingMemberId) {
      dispatch(teamActions.removeTeamMemberRequest(deletingMemberId));
      setIsDeleteModalOpen(false);
      setDeletingMemberId(null);
    }
  };

  const editingMember = editingMemberId ? team.find(m => m.id === editingMemberId) : null;
  const deletingMember = deletingMemberId ? team.find(m => m.id === deletingMemberId) : null;

  return (
    <div className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 mt-1">Manage team access and role-based operational capabilities.</p>
        </div>
        <button 
          onClick={openInviteModal}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all shadow-lg"
        >
          <UserPlus size={18} />
          <span>Invite Member</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roleConfigs.map((role) => (
          <div key={role.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                role.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                role.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-slate-900">{role.name}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
            <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
              Configure Permissions
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-serif text-slate-900">Active Team Members</h2>
        {loading && team.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Team Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        {loading ? 'Loading team members...' : 'No team members found'}
                      </td>
                    </tr>
                  ) : (
                    team.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 uppercase">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            member.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' :
                            member.role === 'Ops' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{member.lastActiveHuman || member.lastActive}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => openEditModal(member.id, member.role)}
                              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button 
                              onClick={() => openDeleteModal(member.id)}
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
                              <Lock size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-slate-900">Invite Team Member</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Name *</label>
                <input 
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email *</label>
                <input 
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="name@allincloth.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role *</label>
                <select 
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as AdminRole })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option>Support</option>
                  <option>Ops</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleInvite}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <UserPlus size={18} />
                <span>{loading ? 'Sending...' : 'Send Invite'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-slate-900">Edit Role</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-900">{editingMember.name}</p>
                <p className="text-xs text-slate-500">{editingMember.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</label>
                <select 
                  value={editForm.role}
                  onChange={(e) => setEditForm({ role: e.target.value as AdminRole })}
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option>Support</option>
                  <option>Ops</option>
                  <option>Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEdit}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={18} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-serif text-slate-900 mb-2">Remove Team Member</h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to remove <span className="font-bold text-slate-900">{deletingMember.name}</span> from the team? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
