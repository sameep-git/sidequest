export type ReceiptItem = {
    id: string;
    name: string;
    price: number;
    displayPrice?: string;
    assignedToUserId?: string;
    assignedToName?: string;
    splitType?: 'individual' | 'split' | 'custom';
    splitAmongIds?: string[];
    requestedByUserId?: string;
};

type ParsedReceipt = {
    items: ReceiptItem[];
    detectedStore?: DetectedStore;
};

// === STORE DETECTION ===
export type DetectedStore =
    | 'costco' | 'walmart' | 'heb' | 'aldi' | 'traderjoes'
    | 'kroger' | 'publix' | 'target' | 'samsclub' | 'wegmans'
    | 'safeway' | 'amazon' | 'shoprite' | 'winco' | 'meijer'
    | 'marketbasket' | 'woodmans' | 'unknown';

function detectStore(lines: string[]): DetectedStore {
    const header = lines.slice(0, 15).join(' ').toLowerCase();

    if (/costco|wholesale/.test(header)) return 'costco';
    if (/walmart|wal-?mart/.test(header)) return 'walmart';
    if (/h-?e-?b|h\s*e\s*b/.test(header)) return 'heb';
    if (/aldi/.test(header)) return 'aldi';
    if (/trader\s*joe/.test(header)) return 'traderjoes';
    if (/kroger|fred\s*meyer|ralphs|smith'?s|fry'?s|dillons|city\s*market/.test(header)) return 'kroger';
    if (/publix/.test(header)) return 'publix';
    if (/target/.test(header)) return 'target';
    if (/sam'?s\s*club/.test(header)) return 'samsclub';
    if (/wegmans/.test(header)) return 'wegmans';
    if (/safeway|albertsons|vons|jewel|acme|shaw'?s|star\s*market/.test(header)) return 'safeway';
    if (/amazon|whole\s*foods/.test(header)) return 'amazon';
    if (/shoprite/.test(header)) return 'shoprite';
    if (/winco/.test(header)) return 'winco';
    if (/meijer/.test(header)) return 'meijer';
    if (/market\s*basket/.test(header)) return 'marketbasket';
    if (/woodman'?s/.test(header)) return 'woodmans';

    return 'unknown';
}

// === IGNORE PATTERNS ===
// Comprehensive patterns to filter out non-item lines

const storeNamePatterns = [
    // Priority stores
    /\bh-?e-?b\b|h\s*e\s*b/i,
    /market\s*basket/i,
    /woodman'?s/i,
    /costco/i,
    /\baldi\b/i,
    /winco/i,
    /trader\s*joe'?s?/i,
    /amazon\s*(fresh)?|whole\s*foods/i,
    /wegmans/i,
    /shoprite/i,
    // Major chains
    /walmart|wal-?mart/i,
    /kroger|fred\s*meyer|ralphs|smith'?s|fry'?s|dillons/i,
    /publix/i,
    /albertsons|safeway|vons|jewel|acme|shaw'?s/i,
    /sam'?s\s*club/i,
    /\btarget\b/i,
    /meijer/i,
    /food\s*lion/i,
    /giant|stop\s*&?\s*shop/i,
    /winn-?dixie/i,
    /sprouts/i,
    /fresh\s*market/i,
    /wholesale/i,
    /supercenter|supermarket/i,
];

const addressPatterns = [
    // Street types
    /\b(blvd|boulevard|street|st|ave|avenue|road|rd|drive|dr|lane|ln|way|parkway|pkwy|circle|cir|court|ct|place|pl|highway|hwy)\b/i,
    // Address numbers at start of line
    /^\s*\d{1,5}\s+[NSEW]?\s*[A-Za-z]/i,
    // State + ZIP
    /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/,
    /,\s*[A-Z]{2}\s*\d{5}/,
    /,\s*[A-Z]{2}\s*$/,
    // Phone numbers
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /tel:|phone:/i,
    // Common cities (expanded)
    /\b(dallas|houston|austin|chicago|new\s*york|los\s*angeles|san\s*diego|phoenix|philadelphia|san\s*antonio|jacksonville|columbus|charlotte|indianapolis|seattle|denver|boston|el\s*paso|detroit|memphis|portland|las\s*vegas|baltimore|milwaukee|albuquerque|tucson|fresno|sacramento|mesa|atlanta|kansas\s*city|omaha|miami|minneapolis|tulsa|arlington|new\s*orleans|wichita|cleveland|tampa|aurora|raleigh|anaheim|honolulu|pittsburgh|lexington|anchorage|stockton|toledo|fort\s*worth)\b/i,
];

const metadataPatterns = [
    // Store/transaction IDs
    /store\s*#?\s*\d+/i,
    /#\d{3,}/,
    /receipt\s*#/i,
    /transaction\s*#?/i,
    /register|terminal|te\s*#/i,
    /cashier|operator|op\s*#/i,
    /manager/i,
    // Dates/times
    /^\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
    /^\s*\d{1,2}:\d{2}/,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d/i,
    // Member/loyalty
    /member\s*#?\d/i,
    /loyalty|rewards\s/i,
    /card\s*#/i,
    /shoppers?\s*club/i,
    // URLs
    /https?:\/\//i,
    /www\./i,
    /@\w+\.\w+/,
    // Messages
    /thank\s*you/i,
    /come\s*again/i,
    /save\s*\d+%/i,
    /survey|feedback/i,
    /scan\s*(this|qr|code)/i,
    /self.?checkout/i,
    /verified/i,
    /^\s*\d+\s+items?\s*$/i,
];

const paymentPatterns = [
    // Totals
    /\bsubtotal\b/i,
    /\btotal\b/i,
    /\bgrand\s*total\b/i,
    /amount\s*(due|paid|tendered)/i,
    /balance\s*(due|owing)?/i,
    // Tax
    /\bsales?\s*tax\b/i,
    /\btax\s+\d/i,
    /\btaxable\b/i,
    // Payment
    /\b(visa|mastercard|master|amex|discover|debit|credit)\b/i,
    /\*{3,}\d+/,
    /xxxx+\d*/i,
    /\bapproved\b/i,
    /\bauth(orization)?\s*(#|code)?/i,
    /\bref(erence)?\s*#/i,
    /\baid\s*[a0]/i,
    /entry\s*mode/i,
    /chip|contactless|swipe/i,
    /\bchange\s*(due)?\b/i,
    /\bcash\s*(back|tendered)?\b/i,
    /\btender\b/i,
    /\bpin\b/i,
    /tvr|tsi|iad/i,
];

// Short codes and misc to ignore
const miscIgnorePatterns = [
    /^\s*[A-Z]{2,5}\s*$/,           // Just abbreviations like "FA"
    /^[A-Z]{2,5}:[A-Z0-9]+$/i,      // Codes like "KIN:Y"
    /^\s*\d{7,14}\s*$/,             // Just barcodes/item codes
    /^\s*[A-Z0-9]{3,6}\s*$/,        // Very short codes
];

// Combine all ignore patterns
const shouldIgnoreLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 2) return true;

    const allPatterns = [
        ...storeNamePatterns,
        ...addressPatterns,
        ...metadataPatterns,
        ...paymentPatterns,
        ...miscIgnorePatterns,
    ];

    return allPatterns.some(pattern => pattern.test(trimmed));
};

// === DISCOUNT DETECTION ===
const isDiscountLine = (line: string): boolean => {
    const trimmed = line.trim();
    return (
        /-\s*\$?\d+\.\d{2}/.test(trimmed) ||           // Negative price
        /\bfree\b/i.test(trimmed) ||                   // FREE item
        /\bsave\s*\$?\d/i.test(trimmed) ||             // Save $X
        /\bdiscount\b/i.test(trimmed) ||
        /\bcoupon\b/i.test(trimmed) ||
        /\bmega\s*(event|save)/i.test(trimmed) ||      // Kroger MEGA
        /\bbogo\b/i.test(trimmed) ||                   // Buy one get one
        /instant\s*savings/i.test(trimmed)
    );
};

// === NAME CLEANING ===
const cleanItemName = (raw: string): string => {
    let name = raw
        // Remove leading item codes like "E 1692325" or "457"
        .replace(/^[A-Z]\s+\d{5,}\s*/, '')
        .replace(/^\d{3,7}\s+/, '')
        // Remove trailing price with tax letter like "12.99 A" or "$12.99"
        .replace(/\s+\$?\d{1,3}\.\d{2}\s*[-]?[A-Za-z]?\s*$/, '')
        // Remove dash-separated price like "- $12.99"
        .replace(/\s*-\s*\$?\d{1,3}\.\d{2}\s*$/, '')
        // Remove parenthetical price like "($12.99)"
        .replace(/\s*\(\$?\d{1,3}\.\d{2}\)\s*$/, '')
        // Remove standalone long numbers (barcodes)
        .replace(/\b\d{7,}\b/g, '')
        // Remove weight info but keep it readable
        .replace(/\s+\d+\.?\d*\s*(lb|lbs?|oz|kg|g)\b/gi, '')
        // Remove quantity prefix like "2 x" or "2x" at start
        .replace(/^\d+\s*x\s+/i, '')
        // Remove slash-numbers
        .replace(/\/\d+/g, '')
        // Remove asterisk codes
        .replace(/\*+\w+/g, '')
        // Remove trailing single letters (tax indicators)
        .replace(/\s+[A-Z]\s*$/i, '')
        // Normalize spaces
        .replace(/\s+/g, ' ')
        .trim();

    if (name.length < 2) return '';

    // Capitalize nicely if all caps
    if (name === name.toUpperCase() && name.length > 2) {
        name = name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    return name;
};

// === PRICE EXTRACTION ===
const extractPrice = (line: string): number | null => {
    // Skip discount lines
    if (isDiscountLine(line)) return null;

    // Try multiple patterns in order of specificity

    // Weight-based: "1.50 LB @ 0.79/LB $1.19" - get the final price
    const weightMatch = line.match(/(\d{1,3}\.\d{2})\s*$/);

    // Standard price at end: "ITEM NAME 12.99" or "ITEM NAME 12.99 A"
    const standardMatch = line.match(/\$?\s*(\d{1,3}\.\d{2})\s*[-]?[A-Za-z]?\s*$/);

    // Dash-separated: "Item - $12.99"
    const dashMatch = line.match(/-\s*\$?\s*(\d{1,3}\.\d{2})/);

    // Sam's Club: "Qty. 2 $2.98 $5.96 T" - get extended price (last one)
    const qtyMatch = line.match(/\$(\d{1,3}\.\d{2})\s*[A-Za-z]?\s*$/);

    // Use first valid match
    const priceStr = standardMatch?.[1] || dashMatch?.[1] || weightMatch?.[1] || qtyMatch?.[1];

    if (priceStr) {
        const price = parseFloat(priceStr);
        // Sanity check: most grocery items under $200
        if (price > 0 && price < 200) {
            return price;
        }
    }

    return null;
};

// === MAIN PARSING FUNCTION ===
export const buildReceiptFromLines = (lines: string[]): ParsedReceipt => {
    const detectedStore = detectStore(lines);

    // Separate lines into: item names with prices, price-only lines
    const itemLines: { index: number; name: string; price: number }[] = [];
    const priceOnlyLines: { index: number; price: number }[] = [];
    let taxAmount: number | null = null;

    // Price-only pattern: just "12.99" or "12.99 A"
    const priceOnlyPattern = /^\s*(\d{1,3}\.\d{2})\s*[A-Za-z]?\s*$/;
    // Item code pattern (skip these)
    const itemCodePattern = /^\s*\d{10,14}\s*$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed || trimmed.length < 2) continue;

        // Check for tax line
        if (/^\s*tax\b/i.test(trimmed)) {
            const match = trimmed.match(/(\d+\.\d{2})/);
            if (match) {
                taxAmount = parseFloat(match[1]);
            }
            continue;
        }

        // Skip ignored lines
        if (shouldIgnoreLine(trimmed)) continue;

        // Skip discount lines
        if (isDiscountLine(trimmed)) continue;

        // Skip pure item codes (barcodes)
        if (itemCodePattern.test(trimmed)) continue;

        // Check if price-only line
        const priceOnlyMatch = trimmed.match(priceOnlyPattern);
        if (priceOnlyMatch) {
            const price = parseFloat(priceOnlyMatch[1]);
            if (price > 0 && price < 200) {
                priceOnlyLines.push({ index: i, price });
            }
            continue;
        }

        // Check if line has letters (potential item name)
        if (/[A-Za-z]{2,}/.test(trimmed)) {
            const price = extractPrice(trimmed);

            if (price !== null) {
                // Line has both name and price
                const name = cleanItemName(trimmed);
                if (name) {
                    itemLines.push({ index: i, name, price });
                }
            } else {
                // Name only - will need to pair with price
                const name = cleanItemName(trimmed);
                if (name) {
                    itemLines.push({ index: i, name, price: 0 });
                }
            }
        }
    }

    // Build final items list
    const items: ReceiptItem[] = [];
    let priceIndex = 0;

    for (const itemLine of itemLines) {
        if (itemLine.price > 0) {
            // Already has price
            items.push({
                id: `${itemLine.index}-${Math.random().toString(36).slice(2, 8)}`,
                name: itemLine.name,
                price: itemLine.price,
            });
        } else if (priceIndex < priceOnlyLines.length) {
            // Match with next available price
            const price = priceOnlyLines[priceIndex].price;
            items.push({
                id: `${itemLine.index}-${Math.random().toString(36).slice(2, 8)}`,
                name: itemLine.name,
                price,
            });
            priceIndex++;
        }
    }

    // Add tax as splittable item
    if (taxAmount !== null && taxAmount > 0) {
        items.push({
            id: `tax-${Math.random().toString(36).slice(2, 8)}`,
            name: 'Tax',
            price: taxAmount,
            splitType: 'split',
            assignedToName: 'Split',
        });
    }

    return { items, detectedStore };
};
