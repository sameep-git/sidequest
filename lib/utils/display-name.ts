/**
 * Get a display name with simple fallback.
 * Prioritizes: display_name → characters before @ in email → fallback
 */
export function getDisplayName(
    displayName: string | null | undefined,
    email: string | null | undefined,
    fallback: string = 'Roommate'
): string {
    // Use display name if set
    if (displayName && displayName.trim()) {
        return displayName.trim();
    }

    // Extract characters before @ from email
    if (email) {
        const localPart = email.split('@')[0];
        if (localPart && localPart.length > 0) {
            return localPart;
        }
    }

    return fallback;
}
