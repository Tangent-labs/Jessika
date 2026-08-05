/**
 * Addresses allowed to publish feature banners, as a comma-separated env var.
 * Fails closed: an unset or empty list authorises nobody.
 *
 * Server-side only — FEATURE_TOGGLE_ADMINS is deliberately not NEXT_PUBLIC, so this
 * reads as an empty list (and denies) if it is ever imported into a client bundle.
 */
export function isFeatureToggleAdmin(address: string): boolean {
    const admins = (process.env.FEATURE_TOGGLE_ADMINS || '')
        .split(',')
        .map((admin) => admin.trim().toLowerCase())
        .filter(Boolean);

    return admins.includes(address.toLowerCase());
}
