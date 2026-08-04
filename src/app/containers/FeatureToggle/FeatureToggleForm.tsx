'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BannerImageDropzone from './BannerImageDropzone';
import { BannerDraft, MAX_BANNERS, StoredBanner, draftState, emptyDraft, fetchStoredImage, isValidLink, missingFields, toUploadPayload } from './featureToggle';

interface FeatureToggleFormProps {
    className?: string;
}

export default function FeatureToggleForm({ className }: FeatureToggleFormProps) {
    const [drafts, setDrafts] = useState<BannerDraft[]>(() => Array.from({ length: MAX_BANNERS }, emptyDraft));

    const [isLoading, setIsLoading] = useState(true);
    const [loadingImages, setLoadingImages] = useState<number[]>([]);
    const [loadError, setLoadError] = useState('');

    const [isConfirming, setIsConfirming] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadedAt, setUploadedAt] = useState('');

    const updateDraft = (index: number, patch: Partial<BannerDraft>) => {
        setUploadedAt('');
        setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
    };

    const load = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');
        setUploadedAt('');

        try {
            const response = await fetch('/api/feature-toggle', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Request failed with ${response.status}`);

            const banners: StoredBanner[] = result.banners;
            setDrafts(
                Array.from({ length: MAX_BANNERS }, (_, index) => {
                    const stored = banners.find((banner) => banner.slot === index + 1);
                    return stored ? { text: stored.text, link: stored.link, image: null } : emptyDraft();
                })
            );
            setLoadingImages(banners.map((banner) => banner.slot));
            setIsLoading(false);

            // Images come down one by one so the form is editable while they land.
            await Promise.all(
                banners.map(async (banner) => {
                    try {
                        const version = banner.imageUrl.split('?v=')[1] || '';
                        const image = await fetchStoredImage(`/api/feature-toggle/image/${banner.slot}?v=${version}`, banner.slot);
                        setDrafts((current) => current.map((draft, i) => (i === banner.slot - 1 ? { ...draft, image } : draft)));
                    } catch {
                        setLoadError(`Could not load the current image for slot ${banner.slot} — re-upload it before saving.`);
                    } finally {
                        setLoadingImages((current) => current.filter((slot) => slot !== banner.slot));
                    }
                })
            );
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Could not load the current banners');
            setIsLoading(false);
            setLoadingImages([]);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const partialIndexes = drafts.map((draft, index) => ({ draft, index })).filter(({ draft }) => draftState(draft) === 'partial');
    const invalidLinkIndexes = drafts.map((draft, index) => ({ draft, index })).filter(({ draft }) => draft.link.trim() && !isValidLink(draft.link));
    const payload = toUploadPayload(drafts);
    const canUpload = !isLoading && loadingImages.length === 0 && partialIndexes.length === 0 && invalidLinkIndexes.length === 0;

    const upload = async () => {
        setIsUploading(true);
        setUploadError('');

        try {
            const response = await fetch('/api/feature-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banners: payload }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || `Request failed with ${response.status}`);

            setIsConfirming(false);
            setUploadedAt(new Date().toLocaleTimeString());
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={className}>
            <div className="container mx-auto flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Feature toggle</h1>
                        <p className="text-sm text-muted-foreground">
                            The {MAX_BANNERS} banners the dApp carousel rotates through, in order. Saving replaces all of them — a group is only published once its text, image and link are all filled
                            in.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => void load()} disabled={isLoading || isUploading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Reload
                    </Button>
                </div>

                {loadError && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {loadError}
                    </div>
                )}

                {drafts.map((draft, index) => {
                    const state = draftState(draft);
                    const isLinkInvalid = Boolean(draft.link.trim()) && !isValidLink(draft.link);

                    return (
                        <Card key={index}>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <CardTitle>Slot {index + 1}</CardTitle>
                                {state === 'complete' && <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary">Will be published</span>}
                                {state === 'empty' && <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">Empty — skipped</span>}
                                {state === 'partial' && (
                                    <span className="rounded-md bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">Missing {missingFields(draft).join(' and ')}</span>
                                )}
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium" htmlFor={`text-${index}`}>
                                        Text
                                    </label>
                                    <Input
                                        id={`text-${index}`}
                                        value={draft.text}
                                        maxLength={80}
                                        placeholder="New pool cbBTC/WBTC"
                                        onChange={(event) => updateDraft(index, { text: event.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium">Image</label>
                                    <BannerImageDropzone image={draft.image} isLoading={loadingImages.includes(index + 1)} onChange={(image) => updateDraft(index, { image })} />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium" htmlFor={`link-${index}`}>
                                        Link
                                    </label>
                                    <Input
                                        id={`link-${index}`}
                                        value={draft.link}
                                        placeholder="https://tangent.finance/..."
                                        onChange={(event) => updateDraft(index, { link: event.target.value })}
                                        className={isLinkInvalid ? 'border-destructive' : ''}
                                    />
                                    {isLinkInvalid && <p className="text-sm text-destructive">Must be a full http or https URL</p>}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                        {uploadedAt ? (
                            <span className="flex items-center gap-2 text-primary">
                                <CheckCircle2 className="h-4 w-4" />
                                Published at {uploadedAt} — {payload.length} banner{payload.length === 1 ? '' : 's'} live
                            </span>
                        ) : (
                            `${payload.length} of ${MAX_BANNERS} slots will be published`
                        )}
                    </div>

                    <Button onClick={() => setIsConfirming(true)} disabled={!canUpload}>
                        <Upload className="mr-2 h-4 w-4" />
                        Save and publish
                    </Button>
                </div>

                {!canUpload && !isLoading && (partialIndexes.length > 0 || invalidLinkIndexes.length > 0) && (
                    <p className="text-right text-sm text-destructive">
                        {partialIndexes.length > 0 && `Slot ${partialIndexes.map(({ index }) => index + 1).join(', ')} is half-filled — complete or clear it. `}
                        {invalidLinkIndexes.length > 0 && `Slot ${invalidLinkIndexes.map(({ index }) => index + 1).join(', ')} has an invalid link.`}
                    </p>
                )}
            </div>

            <Dialog open={isConfirming} onOpenChange={(open) => !isUploading && setIsConfirming(open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish to the dApp?</DialogTitle>
                        <DialogDescription>
                            This replaces every banner currently live. {payload.length === 0 ? 'All slots are empty, so the carousel will fall back to the static Points campaign card.' : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <ul className="flex flex-col gap-2 text-sm">
                        {payload.map((banner) => (
                            <li key={banner.slot} className="rounded-md border border-input px-3 py-2">
                                <span className="font-medium">Slot {banner.slot}</span> — {banner.text}
                                <span className="block truncate text-xs text-muted-foreground">{banner.link}</span>
                            </li>
                        ))}
                    </ul>

                    {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirming(false)} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button onClick={() => void upload()} disabled={isUploading}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
