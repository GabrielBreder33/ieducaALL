import { ReactNode } from 'react';
import Portal from './Portal';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  canClose?: boolean;
}

export default function Modal({ isOpen, onClose, children, canClose = true }: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (canClose && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
          {children}
        </div>
      </div>
    </Portal>
  );
}
