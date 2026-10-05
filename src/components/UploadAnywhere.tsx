import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Files picked via a background click. */
  onFiles: (files: File[]) => void;
  /** Files dropped anywhere on the page. */
  onDrop: (dt: DataTransfer) => void;
  disabled?: boolean;
}

type Mode = 'hidden' | 'click' | 'drop';

// Only bare background elements opt in, so cards, buttons and text never trigger it.
const isSurface = (t: EventTarget | null) => t instanceof Element && t.hasAttribute('data-upload-surface');
const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');

const UploadAnywhere: React.FC<Props> = ({ onFiles, onDrop, disabled }) => {
  const [mode, setMode] = useState<Mode>('hidden');
  const pillRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const frame = useRef(0);
  const dragDepth = useRef(0);
  const handlers = useRef({ onFiles, onDrop, disabled });
  handlers.current = { onFiles, onDrop, disabled };

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const follow = (x: number, y: number) => {
      pos.current = { x, y };
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${pos.current.x + 16}px, ${pos.current.y + 18}px, 0)`;
        }
      });
    };

    const onMove = (e: PointerEvent) => {
      if (!finePointer || handlers.current.disabled || dragDepth.current > 0) return;
      follow(e.clientX, e.clientY);
      setMode(isSurface(e.target) ? 'click' : 'hidden');
    };
    const onLeave = () => dragDepth.current === 0 && setMode('hidden');
    const onClick = (e: MouseEvent) => {
      if (!finePointer || handlers.current.disabled || !isSurface(e.target)) return;
      inputRef.current?.click();
    };

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current += 1;
      follow(e.clientX, e.clientY);
      setMode('drop');
    };
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      follow(e.clientX, e.clientY);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setMode('hidden');
    };
    const onDropEvt = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = 0;
      setMode('hidden');
      // A drop zone inside the page already handled it.
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (e.dataTransfer && !handlers.current.disabled) handlers.current.onDrop(e.dataTransfer);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('click', onClick);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDropEvt);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('click', onClick);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDropEvt);
    };
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          if (files.length > 0) handlers.current.onFiles(files);
        }}
      />

      {/* Soft frame while dragging files over the page */}
      <div
        aria-hidden
        className={cn(
          'fixed inset-0 z-[90] pointer-events-none transition-opacity duration-150',
          mode === 'drop' ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="absolute inset-0 bg-primary/[0.06]" />
        <div className="absolute inset-3 rounded-3xl border-2 border-dashed border-primary/70" />
      </div>

      <div
        ref={pillRef}
        aria-hidden
        className="fixed left-0 top-0 z-[100] pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(-200px, -200px, 0)' }}
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-full pl-1 pr-3.5 py-1 text-[13px] font-medium shadow-lg shadow-black/10 whitespace-nowrap',
            'transition-[opacity,transform] duration-150 origin-top-left',
            mode === 'hidden' ? 'opacity-0 scale-75' : 'opacity-100 scale-100',
            mode === 'drop' ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
          )}
        >
          <span
            className={cn(
              'grid place-items-center w-6 h-6 rounded-full',
              mode === 'drop' ? 'bg-white/25' : 'bg-primary text-primary-foreground',
            )}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
          {mode === 'drop' ? 'Drop to upload' : 'Click anywhere to upload'}
        </div>
      </div>
    </>
  );
};

export default UploadAnywhere;
