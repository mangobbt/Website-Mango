/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, KeyRound, Eye, EyeOff, Check, ShieldAlert } from 'lucide-react';

interface PasswordUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

const STORAGE_KEY = 'danny_owner_password';
const DEFAULT_PASSCODE = 'mango';

export const PasswordUnlockModal: React.FC<PasswordUnlockModalProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  onUnlock,
  onLock,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError('');
      setShowPasscode(false);
      setIsChangingPasscode(false);
      setNewPasscode('');
      setConfirmPasscode('');
      setChangeSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStoredPassword = (): string => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PASSCODE;
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentCorrect = getStoredPassword();

    if (passcode.trim() === currentCorrect) {
      setError('');
      onUnlock();
      onClose();
    } else {
      setError('Incorrect passcode. Please try again.');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim()) {
      setError('New passcode cannot be empty.');
      return;
    }
    if (newPasscode.length < 3) {
      setError('Passcode should be at least 3 characters.');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setError('New passcodes do not match.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, newPasscode.trim());
    setChangeSuccess(true);
    setError('');
    setTimeout(() => {
      setIsChangingPasscode(false);
      setChangeSuccess(false);
      setNewPasscode('');
      setConfirmPasscode('');
    }, 1500);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setChangeSuccess(true);
    setError('');
    setTimeout(() => {
      setIsChangingPasscode(false);
      setChangeSuccess(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-cream-50 border border-stone-200/90 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-100/70">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl" role="img" aria-label="mango">🥭</span>
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-900 tracking-tight">
                {isUnlocked ? 'Editor Controls' : 'Owner Access'}
              </h2>
              <p className="text-xs text-stone-500">
                {isUnlocked ? 'Manage website editing permissions' : 'Unlock editing across all pages'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isUnlocked ? (
            /* Locked state: enter passcode */
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-3 shadow-sm">
                  <Lock size={22} />
                </div>
                <p className="text-sm text-stone-600">
                  Enter your owner passcode to unlock editing, adding, and deleting entries across Food, Library, Photos, Travel, and Notes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter passcode..."
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600/30 focus:border-forest-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center space-x-1">
                    <ShieldAlert size={13} className="shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-200/60 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-forest-800 hover:bg-forest-900 text-cream-50 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Unlock size={15} />
                  <span>Unlock Editor</span>
                </button>
              </div>
            </form>
          ) : (
            /* Unlocked state: options to lock or change password */
            <div className="space-y-5">
              <div className="flex items-center space-x-3 p-3.5 bg-forest-50 border border-forest-200/80 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-forest-600 text-white flex items-center justify-center shrink-0">
                  <Check size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-forest-950">Editor Access Active</h3>
                  <p className="text-xs text-forest-700/90">
                    You can edit, create, and delete content across all journal sections.
                  </p>
                </div>
              </div>

              {!isChangingPasscode ? (
                <div className="space-y-3 pt-1">
                  <button
                    onClick={() => {
                      onLock();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-medium rounded-lg border border-stone-200/90 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Lock size={15} />
                    <span>Lock & Return to Viewer Mode</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsChangingPasscode(true);
                      setError('');
                    }}
                    className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-lg border border-stone-200/90 transition-colors flex items-center justify-center space-x-2"
                  >
                    <KeyRound size={15} />
                    <span>Change Owner Passcode</span>
                  </button>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-200/60 rounded-lg transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Change passcode form */
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Set New Passcode
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsChangingPasscode(false)}
                      className="text-xs text-forest-700 hover:underline"
                    >
                      Back
                    </button>
                  </div>

                  {changeSuccess ? (
                    <div className="p-3 bg-forest-50 border border-forest-200 text-forest-800 rounded-lg text-xs flex items-center space-x-2">
                      <Check size={16} />
                      <span>Passcode updated successfully!</span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          New Passcode
                        </label>
                        <input
                          type="password"
                          value={newPasscode}
                          onChange={(e) => setNewPasscode(e.target.value)}
                          placeholder="Enter new passcode"
                          className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">
                          Confirm New Passcode
                        </label>
                        <input
                          type="password"
                          value={confirmPasscode}
                          onChange={(e) => setConfirmPasscode(e.target.value)}
                          placeholder="Confirm new passcode"
                          className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                        />
                      </div>

                      {error && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <ShieldAlert size={13} className="shrink-0" />
                          <span>{error}</span>
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={handleResetToDefault}
                          className="text-xs text-stone-500 hover:text-stone-800 underline"
                        >
                          Reset to default
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsChangingPasscode(false)}
                            className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-200/60 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs bg-forest-800 hover:bg-forest-900 text-cream-50 rounded-md font-medium"
                          >
                            Save Passcode
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
