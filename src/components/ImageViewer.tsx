import { X } from 'lucide-react';

interface Props {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export function ImageViewer({ imageUrl, title, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors p-2"
          aria-label="닫기"
        >
          <X size={28} />
        </button>

        <img
          src={imageUrl}
          alt={title}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />

        <div className="mt-3 text-center text-white/70 text-sm">
          {title}
        </div>
      </div>
    </div>
  );
}
