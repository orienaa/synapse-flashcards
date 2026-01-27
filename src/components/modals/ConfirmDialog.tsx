import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: <Trash2 className="w-6 h-6 text-red-500" />,
      iconBg: "bg-red-100",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
      iconBg: "bg-orange-100",
      button: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    info: {
      icon: <AlertTriangle className="w-6 h-6 text-blue-500" />,
      iconBg: "bg-blue-100",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  };

  const styles = variantStyles[variant];

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-4 border-pink-200 overflow-hidden">
        <div className="p-6 text-center">
          <div
            className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            {styles.icon}
          </div>
          <h3 className="text-lg text-purple-600 font-medium mb-2">{title}</h3>
          <p className="text-sm text-purple-500">{message}</p>
        </div>

        <div className="p-4 border-t border-pink-100 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-purple-200 text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
