import React, { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onDrop: (dt: DataTransfer) => void | Promise<void>;
}

const hasFiles = (e: DragEvent) =>
  !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');

const GlobalDropOverlay: React.FC<Props> = ({ onDrop }) => {
  const [active, setActive] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      counter.current += 1;
      setActive(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setActive(false);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onDropEvt = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      counter.current = 0;
      setActive(false);
      if (e.dataTransfer) onDrop(e.dataTransfer);
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('dragover', onOver);
    window.addEventListener('drop', onDropEvt);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('drop', onDropEvt);
    };
  }, [onDrop]);


  return (
    <div
      aria-hidden={!active}
      className={cn(
        'fixed inset-0 z-[100] pointer-events-none flex items-center justify-center transition-opacity duration-150',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
      <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-primary/80" />
      <div className="relative flex flex-col items-center gap-4 text-primary">
        <div className="p-6 rounded-full bg-primary/20 border border-primary/40">
          <Upload className="w-12 h-12" />
        </div>
        <p className="text-2xl md:text-3xl font-semibold text-glow">Drop anywhere to share</p>
        <p className="text-sm text-primary/80">Release to upload to this room</p>
      </div>
    </div>
  );
};

export default GlobalDropOverlay;
