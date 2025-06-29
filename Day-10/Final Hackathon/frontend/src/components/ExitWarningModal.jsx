import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  ExclamationTriangleIcon, 
  DocumentArrowDownIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import useEditorStore from '../store/editorStore';
import storageService from '../services/storageService';

/**
 * 🚨 EXIT WARNING MODAL - Professional Save Dialog
 * Shows when user tries to exit with unsaved changes
 */
const ExitWarningModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDiscard, 
  onCancel,
  unsavedChangesCount = 0 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  
  const { 
    htmlContent, 
    cssContent, 
    jsContent,
    projectName,
    description,
    sessionId,
    currentUser 
  } = useEditorStore();

  useEffect(() => {
    if (isOpen) {
      // Check when last saved
      const savedAt = useEditorStore.getState().lastSaved;
      setLastSaved(savedAt);
      setSaveError(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!currentUser) {
      setSaveError('Please log in to save your project');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await storageService.saveProject({
        sessionId,
        htmlContent,
        cssContent,
        jsContent,
        projectName: projectName || 'Untitled Project',
        description,
        metadata: {
          lastModified: new Date().toISOString(),
          wordCount: htmlContent.length + cssContent.length + jsContent.length,
          autoSave: false
        }
      });

      if (result.success) {
        // Update store
        useEditorStore.getState().markAsSaved(result.projectId, result.savedAt);
        
        // Call the success callback
        if (onSave) {
          await onSave(result);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (onDiscard) {
      await onDiscard();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const formatFileSize = (size) => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLastSaved = (date) => {
    if (!date) return 'Never saved';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900"
                      >
                        Unsaved Changes
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        {formatLastSaved(lastSaved)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Do you want to save your code before exiting?
                  </p>
                  
                  {/* Project Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Project:</span>
                        <p className="font-medium text-gray-900 truncate">
                          {projectName || 'Untitled Project'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <p className="font-medium text-gray-900">
                          {formatFileSize(unsavedChangesCount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Files:</span>
                        <p className="font-medium text-gray-900">
                          {[htmlContent && 'HTML', cssContent && 'CSS', jsContent && 'JS']
                            .filter(Boolean).length} files
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Last saved:</span>
                        <p className="font-medium text-gray-900 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatLastSaved(lastSaved)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800">
                          <strong>Your code will be deleted if you don't save it.</strong>
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Auto-save keeps temporary backups, but only manual saves are permanent.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {saveError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800">
                        <strong>Save failed:</strong> {saveError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-3">
                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !currentUser}
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Save Project
                      </>
                    )}
                  </button>

                  {/* Secondary Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDiscard}
                      disabled={isSaving}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                    >
                      Discard Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Auth Notice */}
                {!currentUser && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> You need to be logged in to save projects. 
                      <a href="/auth/login" className="underline ml-1">Sign in here</a>
                    </p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ExitWarningModal; 