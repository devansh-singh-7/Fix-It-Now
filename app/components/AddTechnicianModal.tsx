"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface AddTechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminBuildingId: string;
  adminBuildingName: string;
}

export default function AddTechnicianModal({
  isOpen,
  onClose,
  onSuccess,
  adminBuildingId,
  adminBuildingName,
}: AddTechnicianModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    specialty: "general",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.phoneNumber) {
      setError("Phone number is required");
      setLoading(false);
      return;
    }

    try {
      // Create a pending user in MongoDB
      // We generate a pending UID that starts with 'pending_' so it can be claimed later
      const pendingUid = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: pendingUid,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber,
          name: formData.name,
          displayName: formData.name,
          role: "technician",
          buildingId: adminBuildingId,
          buildingName: adminBuildingName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create technician");
      }

      onSuccess();
      onClose();
      setFormData({ name: "", email: "", phoneNumber: "", specialty: "general" });
    } catch (err) {
      console.error("Error creating technician:", err);
      setError(err instanceof Error ? err.message : "Failed to create technician");
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl transition-all border border-gray-200 dark:border-gray-800">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-gray-900 dark:text-white mb-2"
                >
                  Add New Technician
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Add a new technician to <strong>{adminBuildingName || "your building"}</strong>.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                        placeholder="e.g. Alex Johnson"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number *
                      </label>
                      <div className="phone-input-container">
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={formData.phoneNumber}
                          onChange={(value) => setFormData({ ...formData, phoneNumber: value || "" })}
                          defaultCountry="US"
                          className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Technician must sign up using this phone number.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                        placeholder="technician@example.com"
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Adding...</span>
                          </>
                        ) : (
                          "Add Technician"
                        )}
                      </button>
                    </div>
                  </form>
                  <style jsx global>{`
                    .PhoneInput {
                      display: flex;
                      align-items: center;
                      background-color: white;
                      border: 1px solid #e5e7eb;
                      border-radius: 0.5rem; /* rounded-lg */
                      padding: 0.5rem 1rem; /* lx-4 py-2 equivalent approx */
                      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .PhoneInput:focus-within {
                      border-color: #3b82f6; /* blue-500 */
                      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* ring-2 mechanism */
                    }
                    .dark .PhoneInput {
                      background-color: #1f2937; /* gray-800 */
                      border-color: #374151; /* gray-700 */
                      color: white;
                    }
                    
                    .PhoneInputInput {
                      background: transparent;
                      outline: none;
                      border: none;
                      padding: 0;
                      color: inherit;
                      flex: 1;
                      min-width: 0;
                    }
                    
                    .PhoneInputCountry {
                      margin-right: 0.75rem;
                      display: flex;
                      align-items: center;
                    }
                    
                    .PhoneInputCountrySelect {
                      position: relative;
                      z-index: 1;
                      cursor: pointer;
                      border: none;
                      background-color: transparent;
                      color: #111827;
                      font-size: 0.875rem;
                      padding: 0.25rem;
                      padding-right: 1.5rem;
                      border-radius: 0.25rem;
                      outline: none;
                      -webkit-appearance: none;
                      -moz-appearance: none;
                      appearance: none;
                      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
                      background-position: right 0.25rem center;
                      background-repeat: no-repeat;
                      background-size: 1rem 1rem;
                    }

                    .PhoneInputCountrySelect:focus {
                      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
                    }

                    .PhoneInputCountrySelect option {
                      background-color: white;
                      color: #111827;
                      padding: 0.5rem;
                    }

                    /* Dark mode styling for the select dropdown */
                    .dark .PhoneInputCountrySelect {
                      color-scheme: dark;
                      color: white;
                      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
                    }

                    .dark .PhoneInputCountrySelect option {
                      background-color: #1f2937;
                      color: white;
                    }
                    
                    /* Adjust the icon opacity/color in dark mode if needed */
                    .PhoneInputCountryIcon {
                      width: 1.5rem;
                      height: 1rem;
                      box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
                    }
                    .dark .PhoneInputCountryIcon {
                      box-shadow: 0 0 0 1px rgba(255,255,255,0.2);
                    }

                    /* Arrow alignment */
                    .PhoneInputCountrySelectArrow {
                      margin-left: 0.35rem;
                      border-color: currentColor;
                      border-top-width: 1.5px;
                      border-right-width: 1.5px;
                      width: 0.45rem;
                      height: 0.45rem;
                      transform: rotate(45deg);
                      opacity: 0.5;
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

