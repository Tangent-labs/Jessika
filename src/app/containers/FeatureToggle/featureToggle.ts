export const MAX_BANNERS = 3;
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * The dApp scales artwork to the banner's 64px height and pins it to the right edge,
 * so anything shorter than this just sits in the corner instead of filling the card.
 */
export const RECOMMENDED_IMAGE_HEIGHT = 128;

export interface BannerImage {
    /** Full data URL, used both for the preview and as the source of the base64 payload. */
    dataUrl: string;
    mime: string;
    name: string;
    bytes: number;
    width: number;
    height: number;
}

export interface BannerDraft {
    text: string;
    link: string;
    image: BannerImage | null;
}

export interface StoredBanner {
    slot: number;
    text: string;
    link: string;
    imageUrl: string;
    updatedAt: string;
}

export const emptyDraft = (): BannerDraft => ({ text: '', link: '', image: null });

export type DraftState = 'complete' | 'empty' | 'partial';

/** A group only ships if all three fields are filled; a half-filled one is flagged rather than silently dropped. */
export function draftState(draft: BannerDraft): DraftState {
    const filled = [draft.text.trim(), draft.link.trim(), draft.image ? 'image' : ''].filter(Boolean).length;

    if (filled === 3) return 'complete';
    if (filled === 0) return 'empty';
    return 'partial';
}

export function missingFields(draft: BannerDraft): string[] {
    const missing = [];
    if (!draft.text.trim()) missing.push('text');
    if (!draft.image) missing.push('image');
    if (!draft.link.trim()) missing.push('link');
    return missing;
}

export function isValidLink(link: string): boolean {
    try {
        const url = new URL(link.trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

export function readImageFile(file: File): Promise<BannerImage> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
        reader.onload = () => {
            const dataUrl = String(reader.result);

            // Decoded here so the form can flag artwork that is too small to fill the banner.
            const probe = new window.Image();
            probe.onerror = () => reject(new Error(`${file.name} could not be decoded as an image`));
            probe.onload = () =>
                resolve({
                    dataUrl,
                    mime: file.type,
                    name: file.name,
                    bytes: file.size,
                    width: probe.naturalWidth,
                    height: probe.naturalHeight,
                });
            probe.src = dataUrl;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * The API replaces every row on upload, so banners left untouched still have to be
 * resent — their stored image is pulled back down and re-encoded alongside the new ones.
 */
export async function fetchStoredImage(url: string, slot: number): Promise<BannerImage> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load the current image for slot ${slot}`);

    const blob = await response.blob();
    return readImageFile(new File([blob], `slot-${slot}-current`, { type: blob.type }));
}

export function toUploadPayload(drafts: BannerDraft[]) {
    return drafts
        .map((draft, index) => ({ draft, slot: index + 1 }))
        .filter(({ draft }) => draftState(draft) === 'complete')
        .map(({ draft, slot }) => ({
            slot,
            text: draft.text.trim(),
            link: draft.link.trim(),
            image: draft.image!.dataUrl.split(',')[1],
            imageMime: draft.image!.mime,
        }));
}
