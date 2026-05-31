import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type ResumeDropzoneProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  busy?: boolean;
  selectedFileName?: string | null;
};

export default function ResumeDropzone({
  onFileSelect,
  disabled = false,
  busy = false,
  selectedFileName,
}: ResumeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file || disabled || busy) return;
      onFileSelect(file);
    },
    [busy, disabled, onFileSelect],
  );

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled || busy ? -1 : 0}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !busy) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          'rounded-2xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
          dragOver ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 bg-sand/40',
          disabled || busy ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-primary/60',
        ].join(' ')}
      >
        <Upload className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-charcoal">
          {busy ? 'Processing your resume…' : 'Drag and drop your resume here'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          or tap to browse — PDF, DOC, or DOCX
        </p>
        {selectedFileName ? (
          <p className="mt-3 text-xs text-brand-primary font-medium">{selectedFileName}</p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
