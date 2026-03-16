'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { APP_CONFIG } from '../lib/config';
import { auth } from '../lib/firebase-app';
import type { UserProfile } from '../lib/types';
import { onAuthStateChanged } from 'firebase/auth';
import { ImageUpload } from './ui/image-upload';
import { aiClassifier } from '../lib/ai-classifier';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import 'react-phone-number-input/style.css';

interface CreateTicketFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTicketForm({ isOpen, onClose, onSuccess }: CreateTicketFormProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    contactPhone: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(''); // Upload status message
  const [error, setError] = useState('');

  const inputBaseClass =
    'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

  const normalizeToE164 = (phone: string): string => {
    const trimmed = phone.trim();
    if (!trimmed) return '';

    // Already E.164-like
    if (trimmed.startsWith('+')) {
      return trimmed;
    }

    // Try parsing legacy local numbers with default country.
    const parsed = parsePhoneNumberFromString(trimmed, 'IN');
    return parsed?.isValid() ? parsed.number : '';
  };

  const phoneInputValue = normalizeToE164(formData.contactPhone);

  useEffect(() => {
    // Auto-migrate existing non-E.164 values to E.164 while opening the modal.
    if (!isOpen || !formData.contactPhone) return;

    const normalized = normalizeToE164(formData.contactPhone);
    if (normalized && normalized !== formData.contactPhone) {
      setFormData((prev) => ({ ...prev, contactPhone: normalized }));
    }
  }, [isOpen, formData.contactPhone]);

  // Load user profile - reload whenever modal opens to get latest building info
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user profile from localStorage (updated when joining building)
          const profileStr = localStorage.getItem('userProfile');
          if (profileStr) {
            const profile = JSON.parse(profileStr);

            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || profile.name || profile.displayName || '',
              role: profile.role || 'resident',
              buildingId: profile.buildingId || undefined,
              buildingName: profile.buildingName || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
            });

            console.log('CreateTicketForm - Loaded profile:', {
              uid: user.uid,
              buildingId: profile.buildingId,
              buildingName: profile.buildingName,
              hasBuildingId: !!profile.buildingId,
            });
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen]); // Reload profile whenever modal opens

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    const normalizedContactPhone = normalizeToE164(formData.contactPhone);

    if (!normalizedContactPhone) {
      setError('Contact phone is required and must include a country code');
      setLoading(false);
      return;
    }

    if (!isValidPhoneNumber(normalizedContactPhone)) {
      setError('Please enter a valid phone number for the selected country');
      setLoading(false);
      return;
    }

    // Reload user profile from localStorage to get latest building info
    const profileStr = localStorage.getItem('userProfile');
    let currentProfile = userProfile;

    if (profileStr) {
      try {
        const freshProfile = JSON.parse(profileStr);
        currentProfile = {
          uid: freshProfile.uid || freshProfile.firebaseUid,
          email: freshProfile.email || '',
          name: freshProfile.name || freshProfile.displayName || '',
          role: freshProfile.role || 'resident',
          buildingId: freshProfile.buildingId || undefined,
          buildingName: freshProfile.buildingName || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };
        setUserProfile(currentProfile);
      } catch (err) {
        console.error('Error parsing user profile:', err);
      }
    }

    if (!currentProfile) {
      setError('User profile not found. Please sign in again.');
      setLoading(false);
      return;
    }

    if (!currentProfile.buildingId) {
      setError(
        'You must join a building before creating tickets. Please join a building from your profile or settings.'
      );
      setLoading(false);
      return;
    }

    try {
      // Upload images to Cloudinary first
      const uploadedImages: { secure_url: string; public_id: string }[] = [];

      if (images.length > 0) {
        setUploadProgress(`Uploading images (0/${images.length})...`);
        
        // 1. Get a signature for upload (we can reuse one signature for batch, or fetch per file)
        // Here we fetch new signature just to keep it simple and fresh per batch
        const signRes = await fetch('/api/upload/sign');
        const signResult = await signRes.json();
        
        if (!signResult.success) {
           throw new Error('Failed to start upload session');
        }
        
        const { apiKey, cloudName, folder, signature, timestamp } = signResult.data;
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        for (let i = 0; i < images.length; i++) {
          setUploadProgress(`Uploading images (${i + 1}/${images.length})...`);

          const formDataUpload = new FormData();
          formDataUpload.append('file', images[i]);
          formDataUpload.append('api_key', apiKey);
          formDataUpload.append('timestamp', timestamp.toString());
          formDataUpload.append('signature', signature);
          formDataUpload.append('folder', folder);

          // Direct Client-Side Upload to Cloudinary
          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            body: formDataUpload,
          });

          if (!uploadRes.ok) {
             throw new Error(`Failed to upload ${images[i].name} to cloud storage`);
          }

          const uploadData = await uploadRes.json();
          // Cloudinary response has 'secure_url' and 'public_id'
          
          uploadedImages.push({
            secure_url: uploadData.secure_url,
            public_id: uploadData.public_id,
          });
        }

        setUploadProgress('');
      }

      const ticketData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: 'medium', // Default priority, will be updated by admin/ML model
        status: 'open',
        location: currentProfile.buildingName || 'Building Location',
        contactPhone: normalizedContactPhone,
        imageUrls: uploadedImages.map((img) => img.secure_url),
        imagePublicIds: uploadedImages.map((img) => img.public_id),
        createdByName: currentProfile.name,
        buildingId: currentProfile.buildingId,
        uid: currentProfile.uid,
      };

      console.log('Creating ticket with data:', {
        ...ticketData,
        hasTitle: !!ticketData.title,
        hasDescription: !!ticketData.description,
        hasCategory: !!ticketData.category,
        hasBuildingId: !!ticketData.buildingId,
        hasUid: !!ticketData.uid,
      });

      // Call API route to create ticket
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      const responseContentType = response.headers.get('content-type') || '';
      let result: {
        success?: boolean;
        error?: string;
        details?: Record<string, string[] | string>;
        data?: { id?: string };
      } = {};

      if (responseContentType.includes('application/json')) {
        result = await response.json();
      } else {
        const responseText = await response.text();
        throw new Error(
          responseText?.trim() || 'Server returned an unexpected non-JSON response'
        );
      }

      if (!result.success) {
        console.error('API error response:', JSON.stringify(result, null, 2));
        
        // Format validation errors for user-friendly display
        if (result.details && typeof result.details === 'object') {
          const errorMessages = Object.entries(result.details)
            .map(([field, messages]) => {
              const messageArray = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${messageArray.join(', ')}`;
            })
            .join('; ');
          throw new Error(errorMessages || result.error || 'Failed to create ticket');
        }
        
        throw new Error(result.error || 'Failed to create ticket');
      }

      console.log('Ticket created successfully:', result.data?.id);

      setFormData({
        title: '',
        description: '',
        category: '',
        contactPhone: '',
      });
      setImages([]);
      setImagePreviews([]);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-linear-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xl transition-all">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/60">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Create New Ticket
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please provide detailed information about the maintenance issue
                  </p>
                </div>

                <div className="p-6">

                {error && (
                  <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
                    <svg
                      className="w-5 h-5 mt-0.5 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className={inputBaseClass}
                      placeholder="e.g., Leaking faucet in bathroom"
                      maxLength={100}
                      minLength={3}
                    />
                    <p className={`mt-1 text-xs ${
                      formData.title.length < 3
                        ? 'text-red-500 dark:text-red-400'
                        : formData.title.length >= 3
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formData.title.length}/100 characters (minimum 3)
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className={`${inputBaseClass} resize-none`}
                      placeholder="Provide detailed information about the issue, including when it started and any relevant details..."
                      maxLength={2000}
                      minLength={10}
                    />
                    <p className={`mt-1 text-xs ${
                      formData.description.length < 10
                        ? 'text-red-500 dark:text-red-400'
                        : formData.description.length >= 10
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formData.description.length}/2000 characters (minimum 10)
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between items-center">
                      <span>
                        Category <span className="text-red-500">*</span>
                      </span>
                      {isClassifying && (
                        <span className="text-xs font-normal text-blue-600 dark:text-blue-400 flex items-center animate-pulse">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                          </svg>
                          Detecting category...
                        </span>
                      )}
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={inputBaseClass}
                    >
                      <option value="">Select category</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="hvac">HVAC</option>
                      <option value="carpentry">Carpentry</option>
                      <option value="painting">Painting</option>
                      <option value="appliance">Appliance</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="landscaping">Landscaping</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Priority will be automatically assigned by the system
                    </p>
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <div className={`${inputBaseClass} ticket-phone-input-container`}>
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={phoneInputValue || undefined}
                        onChange={(value) =>
                          setFormData({ ...formData, contactPhone: value || '' })
                        }
                        defaultCountry="IN"
                        international
                        countryCallingCodeEditable={false}
                        className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    {formData.contactPhone && !isValidPhoneNumber(formData.contactPhone) && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        Phone number length/format is invalid for the selected country.
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Include country extension (e.g. +91, +1). Length is validated by country.
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Location will be set from your building:{' '}
                      {userProfile?.buildingName || 'Not assigned'}
                    </p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Attach Images
                    </label>
                    <ImageUpload
                      images={images}
                      imagePreviews={imagePreviews}
                      onImagesChange={async (files, previews) => {
                        setImages(files);
                        setImagePreviews(previews);

                        // Auto-classify first image if added and no category is selected
                        if (files.length > 0 && !formData.category) {
                          setIsClassifying(true);
                          try {
                            const result = await aiClassifier.classifyFile(files[0]);
                            if (result && result.category !== 'other') {
                              setFormData((prev) => ({ ...prev, category: result.category }));
                            }
                          } catch (err) {
                            console.error('Image classification failed:', err);
                          } finally {
                            setIsClassifying(false);
                          }
                        }
                      }}
                      maxFiles={APP_CONFIG.uploads.maxFiles}
                      maxFileSize={APP_CONFIG.uploads.maxFileSize}
                      allowedTypes={APP_CONFIG.uploads.allowedTypes}
                      onError={setError}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>{uploadProgress || 'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Create Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <style jsx global>{`
                  .ticket-phone-input-container {
                    padding-top: 0.625rem !important;
                    padding-bottom: 0.625rem !important;
                  }

                  .ticket-phone-input-container .PhoneInput {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    background: transparent !important;
                    border: none !important;
                    padding: 0 !important;
                    width: 100%;
                  }

                  .ticket-phone-input-container:focus-within {
                    border-color: rgb(59 130 246 / 1);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
                  }

                  .ticket-phone-input-container .PhoneInputCountry {
                    display: flex !important;
                    align-items: center !important;
                    margin-right: 0.75rem;
                    flex-shrink: 0;
                    order: -1;
                  }

                  .ticket-phone-input-container .PhoneInputCountryCallingCode {
                    color: #ffffff !important;
                    font-size: 0.95rem;
                  }
                  .dark .ticket-phone-input-container .PhoneInputCountryCallingCode {
                    color: #ffffff !important;
                  }

                  .ticket-phone-input-container .PhoneInputInput {
                    background: transparent !important;
                    outline: none !important;
                    border: none !important;
                    padding: 0 !important;
                    color: #ffffff !important;
                    flex: 1 1 auto !important;
                    min-width: 0;
                    width: 100% !important;
                    font-size: 1rem;
                    line-height: 1.5rem;
                  }
                  .dark .ticket-phone-input-container .PhoneInputInput {
                    color: #ffffff !important;
                  }
                  .ticket-phone-input-container .PhoneInputInput::placeholder {
                    color: #9ca3af;
                  }

                  .ticket-phone-input-container .PhoneInputCountryIcon {
                    width: 1.5rem;
                    height: 1rem;
                    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
                    border-radius: 2px;
                    flex-shrink: 0;
                  }
                  .dark .ticket-phone-input-container .PhoneInputCountryIcon {
                    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
                  }

                  .ticket-phone-input-container .PhoneInputCountrySelect {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    width: 100%;
                    z-index: 1;
                    border: 0;
                    opacity: 0;
                    cursor: pointer;
                  }

                  .ticket-phone-input-container .PhoneInputCountrySelect option {
                    color: #111827;
                    background-color: #ffffff;
                  }

                  .dark .ticket-phone-input-container .PhoneInputCountrySelect option {
                    color: #f9fafb;
                    background-color: #111827;
                  }

                  .ticket-phone-input-container .PhoneInputCountrySelectArrow {
                    display: block;
                    margin-left: 0.35rem;
                    width: 0.35rem;
                    height: 0.35rem;
                    border-style: solid;
                    border-color: #6b7280;
                    border-top-width: 0;
                    border-bottom-width: 1.5px;
                    border-left-width: 0;
                    border-right-width: 1.5px;
                    transform: rotate(45deg);
                  }
                  .dark .ticket-phone-input-container .PhoneInputCountrySelectArrow {
                    border-color: #9ca3af;
                  }
                `}</style>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
