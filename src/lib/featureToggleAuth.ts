import { keccak256, toUtf8Bytes } from 'ethers';

/** How long a signature stays usable, either side of the server's clock. */
export const SIGNATURE_MAX_AGE_MS = 2 * 60 * 1000;

export interface BannerUpload {
    slot: number;
    text: string;
    link: string;
    image: string;
    imageMime: string;
}

/**
 * Binds a signature to the exact banners it authorises. The server re-derives this
 * from the body it actually received, so a captured request cannot be replayed with
 * different images swapped in.
 */
export function hashBanners(banners: BannerUpload[]): string {
    const canonical = JSON.stringify(banners.map((banner) => [banner.slot, banner.text, banner.link, banner.imageMime, banner.image]));

    return keccak256(toUtf8Bytes(canonical));
}

export function buildUploadMessage(bannersHash: string, issuedAt: string): string {
    return ['Tangent — publish feature banners', '', 'Signing this publishes the banners listed in the dApp carousel.', `Banners: ${bannersHash}`, `Issued at: ${issuedAt}`].join('\n');
}
