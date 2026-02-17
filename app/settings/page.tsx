'use client';

import React, { useState, useEffect } from 'react';
import { User, ChevronRight, X, Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { profileActions } from '../../store/slices/profile/profileSlice';
import { selectProfile, selectProfileLoading, selectProfileError } from '../../store/slices/profile/profileSelectors';
import { userDataActions } from '../../store/slices/userData/userDataSlice';
import { selectUserDataLoaded } from '../../store/slices/userData/userDataSelectors';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import AccountLayout from '../../components/AccountLayout';

function SettingsContent() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);
  const loading = useAppSelector(selectProfileLoading);
  const error = useAppSelector(selectProfileError);
  const userDataLoaded = useAppSelector(selectUserDataLoaded);
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    // Only fetch if userData hasn't been loaded yet (cache check)
    if (!userDataLoaded) {
      dispatch(userDataActions.fetchUserDataRequest());
    }
  }, [dispatch, userDataLoaded]);

  const handleEditClick = () => {
    if (profile) {
      setProfileFormData({
        name: profile.name || '',
        phone: profile.phone || '',
      });
    }
    setIsEditingProfile(true);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(profileActions.updateProfileRequest(profileFormData));
    setIsEditingProfile(false);
  };

  return (
    <AccountLayout>
      <div className="mb-12">
        <h1 className="text-4xl font-serif">Settings</h1>
        <p className="text-neutral-500 mt-2">Manage your profile and account information.</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white border border-neutral-100 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center space-x-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-neutral-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{profile?.name || user?.name || 'User'}</h3>
              <p className="text-sm text-neutral-500">{profile?.email || user?.email || ''}</p>
            </div>
          </div>
          <div className="divide-y divide-neutral-100">
            <button 
              onClick={handleEditClick}
              className="w-full p-4 flex justify-between items-center hover:bg-neutral-50 transition-colors"
            >
              <span className="text-sm font-medium">Edit Public Profile</span>
              <ChevronRight size={16} className="text-neutral-300" />
            </button>
            <div className="w-full p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone size={16} className="text-neutral-400" />
                  <span className="text-sm font-medium">Phone Verification</span>
                </div>
                {profile?.is_phone_verified ? (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Verified</span>
                ) : (
                  <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Not Verified</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl p-8 sm:p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-serif">Edit Profile</h3>
              <button 
                onClick={() => {
                  setIsEditingProfile(false);
                  if (profile) {
                    setProfileFormData({
                      name: profile.name || '',
                      phone: profile.phone || '',
                    });
                  }
                }} 
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X size={24} />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleUpdateProfile}>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={profileFormData.name}
                  onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone Number</label>
                <input 
                  type="text" 
                  value={profileFormData.phone}
                  onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                  className="w-full p-3 bg-neutral-50 border border-neutral-100 rounded-xl outline-none focus:ring-1 focus:ring-neutral-900" 
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-neutral-900 text-white font-bold uppercase tracking-widest rounded-xl mt-4 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

