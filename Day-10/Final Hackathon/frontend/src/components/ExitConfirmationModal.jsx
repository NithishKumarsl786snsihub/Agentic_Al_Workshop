import React, { useState } from 'react';
import { 
  Save, 
  AlertTriangle, 
  Loader2, 
  X,
  ArrowLeft,
  FileX
} from 'lucide-react';
import clsx from 'clsx';

const ExitConfirmationModal = ({
  isOpen,
  onSave,
  onExit,
  onCancel,
  isSaving = false,
  hasUnsavedChanges = true,
  exitDestination = "Dashboard"
}) => {
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);

  // Reset discard warning when modal closes/opens
  React.useEffect(() => {
    if (!isOpen) {
      setShowDiscardWarning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExitWithoutSaving = () => {
    if (hasUnsavedChanges) {
      setShowDiscardWarning(true);
    } else {
      onExit();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardWarning(false);
    onExit();
  };

  const handleCancelDiscard = () => {
    setShowDiscardWarning(false);
  };

  const handleModalClick = (e) => {
    // Prevent closing when clicking inside the modal
    e.stopPropagation();
  };

  const handleBackdropClick = () => {
    if (!isSaving) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-300" 
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100 animate-in zoom-in-95"
        onClick={handleModalClick}
      >
        {/* Close Button */}
        {!isSaving && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Main Content */}
        {!showDiscardWarning ? (
          <div className="p-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="w-8 h-8 text-white" />
            </div>

            {/* Title and Message */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Return to {exitDestination}
            </h3>
            
            {hasUnsavedChanges ? (
              <p className="text-gray-600 mb-6">
                Do you want to save your changes before returning to {exitDestination}?
              </p>
            ) : (
              <p className="text-gray-600 mb-6">
                Are you sure you want to return to {exitDestination}?
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {hasUnsavedChanges && (
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className={clsx(
                    "w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                    isSaving 
                      ? "opacity-75 cursor-not-allowed" 
                      : "hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02]"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving & Returning...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Return
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleExitWithoutSaving}
                disabled={isSaving}
                className={clsx(
                  "w-full py-3 px-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                  hasUnsavedChanges
                    ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                {hasUnsavedChanges ? "Return Without Saving" : `Return to ${exitDestination}`}
              </button>

              <button
                onClick={onCancel}
                disabled={isSaving}
                className={clsx(
                  "w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl transition-all duration-300 hover:bg-gray-50 hover:border-gray-400",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
              >
                Cancel
              </button>
            </div>

            {/* Warning Text */}
            {hasUnsavedChanges && !isSaving && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    You have unsaved changes. Make sure to save your work before exiting.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Discard Warning */
          <div className="p-6 text-center">
            {/* Warning Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileX className="w-8 h-8 text-red-500" />
            </div>

            {/* Title and Message */}
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Confirm Discard
            </h3>
            <p className="text-red-600 font-medium mb-4">
              Unsaved code will be discarded.
            </p>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. Are you sure you want to continue?
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDiscard}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FileX className="w-4 h-4" />
                Yes, Discard
              </button>
              <button
                onClick={handleCancelDiscard}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                Keep Editing
              </button>
            </div>

            {/* Final Warning */}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ All your changes will be permanently lost!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExitConfirmationModal; 