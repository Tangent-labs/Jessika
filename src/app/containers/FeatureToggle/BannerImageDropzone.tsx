'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLOWED_IMAGE_MIMES, MAX_IMAGE_BYTES, RECOMMENDED_IMAGE_HEIGHT, BannerImage, readImageFile } from './featureToggle';

interface BannerImageDropzoneProps {
    image: BannerImage | null;
    isLoading?: boolean;
    onChange: (image: BannerImage | null) => void;
}

export default function BannerImageDropzone({ image, isLoading, onChange }: BannerImageDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const [error, setError] = useState('');

    const acceptFile = async (file: File | undefined) => {
        if (!file) return;

        if (!ALLOWED_IMAGE_MIMES.includes(file.type)) {
            setError(`${file.type || 'That file'} is not supported — use PNG, JPEG, WebP or GIF`);
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setError(`${(file.size / 1024 / 1024).toFixed(2)} MB is over the ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit`);
            return;
        }

        setError('');
        onChange(await readImageFile(file));
    };

    if (isLoading) {
        return (
            <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-input text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        );
    }

    if (image) {
        return (
            <div className="relative flex h-32 w-full items-center gap-4 rounded-md border border-input bg-black/20 p-3">
                <Image src={image.dataUrl} alt="" width={160} height={104} unoptimized className="h-[104px] w-40 rounded object-contain" />
                <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{image.name}</p>
                    <p className="text-muted-foreground">
                        {image.width} × {image.height} · {image.mime} · {(image.bytes / 1024).toFixed(0)} KB
                    </p>
                    {image.height < RECOMMENDED_IMAGE_HEIGHT && (
                        <p className="mt-1 text-xs text-yellow-500">
                            Small for the banner — it will sit against the right edge rather than filling it. Wide artwork at least {RECOMMENDED_IMAGE_HEIGHT}px tall works best.
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => onChange(null)}
                    className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggedOver(true);
                }}
                onDragLeave={() => setIsDraggedOver(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggedOver(false);
                    void acceptFile(event.dataTransfer.files[0]);
                }}
                className={cn(
                    'flex h-32 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm transition-colors',
                    isDraggedOver ? 'border-primary bg-primary/10 text-foreground' : 'border-input text-muted-foreground hover:border-primary/60 hover:text-foreground'
                )}
            >
                <ImagePlus className="h-6 w-6" />
                Drop an image here, or click to browse
                <span className="text-xs text-muted-foreground">
                    PNG, JPEG, WebP or GIF · up to {MAX_IMAGE_BYTES / 1024 / 1024} MB · wide artwork, {RECOMMENDED_IMAGE_HEIGHT}px tall or more
                </span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED_IMAGE_MIMES.join(',')}
                className="hidden"
                onChange={(event) => {
                    void acceptFile(event.target.files?.[0]);
                    event.target.value = '';
                }}
            />

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
    );
}
