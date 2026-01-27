export type ReceiptItem = {
    id: string;
    name: string;
    price: number;
    displayPrice?: string; // For editing
    assignedToUserId?: string;
    assignedToName?: string;
    splitType?: 'individual' | 'split' | 'custom';
    splitAmongIds?: string[];  // For custom splits - array of user IDs to split among
    requestedByUserId?: string;  // Track who requested item (from shopping list)
};

type ParsedReceipt = {
    items: ReceiptItem[];
};

// === RECEIPT PARSING LOGIC ===
// Designed to handle multiple store formats (Costco, Aldi, Target, Walmart, etc.)

// Price pattern: matches XX.XX format anywhere in the line
// const pricePattern = /(\d{1,3}\.\d{2})/g; // Unused in main logic but kept for reference if needed

const ignorePatterns = [
    // Store info and addresses
    /wholesale/i,
    /costco/i,
    /aldi/i,
    /walmart/i,
    /target/i,
    /kroger/i,
    /safeway/i,
    /publix/i,
    /\b(blvd|boulevard|street|st|ave|avenue|road|rd|drive|dr|lane|ln|way|parkway|pkwy)\b/i,  // Street addresses
    /\b(fort|ft)\s+worth\b/i,  // City names
    /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/,  // State + ZIP (TX 76132)
    /,\s*[A-Z]{2}\s*\d{5}/,  // City, ST 12345
    /,\s*[A-Z]{2}\s*$/,  // ends with ", TX"
    /#\d{2,}/,  // Store numbers like #489
    /store\s*#?\d/i,

    // Totals and subtotals
    /subtotal/i,
    /total/i,
    /amount\s*due/i,

    // Payment info
    /change/i,
    /balance/i,
    /debit/i,
    /credit/i,
    /cash/i,
    /payment/i,
    /tender/i,
    /visa|master|amex|discover/i,
    /\*{3,}/,  // ***1234 card numbers
    /approved/i,
    /auth|ref|seq/i,
    /\bpin\b/i,
    /aid\s+a\d/i,
    /tvr|tsi|iad/i,
    /entry\s*mode/i,

    // Receipt metadata
    /cashier/i,
    /your\s+cashier/i,
    /https?:/i,
    /www\./i,
    /thank\s*you/i,
    /member\s*\d/i,
    /self.?checkout/i,
    /^\d+\s+items?$/i,  // "11 ITEMS"
    /taxable/i,
    /^\s*[A-Z]{2,5}\s*$/,  // Just abbreviations like "FA", "ALDI"
    /^\d{2}\/\d{2}\/\d{2}/,  // Dates
    /^\d{2}:\d{2}/,  // Times
    /verified/i,
    /xxxx+/i,  // Masked card numbers
    /^[A-Z]{2,5}:[A-Z0-9]+$/i,  // Short codes like "KIN:Y"
    /^[A-Z0-9]{3,6}$/,  // Very short codes without spaces
    /dallas/i,  // Common city names
    /houston/i,
    /austin/i,
    /chicago/i,
    /new\s*york/i,
];

// Check if line should be ignored
const shouldIgnoreLine = (line: string): boolean => {
    return ignorePatterns.some(pattern => pattern.test(line));
};

// Clean up item name
const cleanItemName = (raw: string): string => {
    let name = raw
        // Remove leading letter + item code (like "E 1692325")
        .replace(/^[A-Z]\s+\d{5,}\s*/, '')
        // Remove standalone long numbers (item codes)  
        .replace(/\b\d{5,}\b/g, '')
        // Remove leading single letter codes
        .replace(/^[A-Z]\s+(?=[A-Z])/, '')
        // Remove slash-numbers
        .replace(/\/\d+/g, '')
        // Remove asterisk codes
        .replace(/\*+\w+/g, '')
        // Normalize spaces
        .replace(/\s+/g, ' ')
        .trim();

    if (name.length < 2) return '';

    // Capitalize nicely if all caps
    if (name === name.toUpperCase()) {
        name = name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    return name;
};

export const buildReceiptFromLines = (lines: string[]): ParsedReceipt => {

    // Separate lines into: item names, prices, and special lines (tax, etc.)
    const itemNameLines: { index: number; name: string }[] = [];
    const priceOnlyLines: { index: number; price: number }[] = [];
    let taxAmount: number | null = null;

    // Price-only pattern: just a price with optional suffix (like "23.99 A")
    const priceOnlyPattern = /^\s*(\d{1,3}\.\d{2})\s*[A-Za-z]?\s*$/;
    // Discount pattern: price with dash before letter (like "6.00-A" indicates discount/refund)
    const discountPattern = /^\s*\d{1,3}\.\d{2}\s*-[A-Za-z]?\s*$/;
    // Item name pattern: has letters, may have item codes
    const hasLettersPattern = /[A-Za-z]{2,}/;

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

        // Check if should ignore
        if (shouldIgnoreLine(trimmed)) {
            continue;
        }

        // Check if this is a discount line (price with dash like "6.00-A")
        if (discountPattern.test(trimmed)) {
            continue;
        }

        // Check if this is a price-only line
        const priceOnlyMatch = trimmed.match(priceOnlyPattern);
        if (priceOnlyMatch) {
            const price = parseFloat(priceOnlyMatch[1]);
            // Reasonable item price range - most grocery items are under $100
            // Prices above this are likely subtotals/totals
            if (price > 0 && price < 100) {
                priceOnlyLines.push({ index: i, price });
            }
            continue;
        }

        // Check if this line contains an item name (has letters)
        if (hasLettersPattern.test(trimmed)) {
            // Check if this line has BOTH name and price
            const inlinePrice = trimmed.match(/(\d{1,3}\.\d{2})\s*[-]?[A-Za-z]?\s*$/);
            if (inlinePrice) {
                // This line has both name and price (like Aldi format)
                const price = parseFloat(inlinePrice[1]);
                let name = trimmed.substring(0, trimmed.lastIndexOf(inlinePrice[1])).trim();
                name = cleanItemName(name);

                if (name && price > 0 && price < 100) {
                    itemNameLines.push({ index: i, name: `${name}|${price}` }); // Use | to mark inline price
                }
            } else {
                // Skip lines that look like discount/return codes (contain /NUMBERS)
                if (/\/\d{5,}/.test(trimmed)) {
                    continue;
                }

                // Name only line
                let name = cleanItemName(trimmed);
                if (name) {
                    itemNameLines.push({ index: i, name });
                }
            }
        }
    }


    // Build final items list
    const items: ReceiptItem[] = [];
    let priceIndex = 0;

    for (const itemLine of itemNameLines) {
        // Check if this already has a price (inline)
        if (itemLine.name.includes('|')) {
            const [name, priceStr] = itemLine.name.split('|');
            items.push({
                id: `${itemLine.index}-${Math.random().toString(36).slice(2, 8)}`,
                name,
                price: parseFloat(priceStr),
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

    return { items };
};
