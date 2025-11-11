/**
 * Template Categories Configuration
 * Centralized list of all available template categories
 */

export const TEMPLATE_CATEGORIES = [
  'Sales Documents and Forms',
  'Policy and Compliance Documents',
  'Letters and Notices Templates',
  'Web & Technology Agreements',
  'Proposal Templates',
  'Financial Agreements',
  'Family Law',
  'Employment Legal Templates',
  'Real Estate',
  'B2B Legal Documents',
  'Business Document',
  'Last Will and Testament',
  'Bill of Sale',
  'Power of Attorney (POA)',
  'Eviction Notice',
  'NDA (Non-Disclosure Agreements)',
  'Lease Agreement'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

/**
 * Category descriptions for display purposes
 */
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Sales Documents and Forms': 'Sales agreements, invoices, and commercial transaction documents',
  'Policy and Compliance Documents': 'Company policies, compliance forms, and regulatory documents',
  'Letters and Notices Templates': 'Formal letters, notices, and correspondence templates',
  'Web & Technology Agreements': 'Website terms, privacy policies, and technology contracts',
  'Proposal Templates': 'Business proposals, project bids, and service offerings',
  'Financial Agreements': 'Loan agreements, payment plans, and financial contracts',
  'Family Law': 'Family law documents, custody agreements, and related forms',
  'Employment Legal Templates': 'Employment contracts, offer letters, and HR documents',
  'Real Estate': 'Property agreements, real estate contracts, and related documents',
  'B2B Legal Documents': 'Business-to-business contracts and commercial agreements',
  'Business Document': 'General business documents and corporate forms',
  'Last Will and Testament': 'Estate planning, wills, and testamentary documents',
  'Bill of Sale': 'Bill of sale documents for various types of property',
  'Power of Attorney (POA)': 'Power of attorney forms and authorization documents',
  'Eviction Notice': 'Eviction notices and tenant-related legal documents',
  'NDA (Non-Disclosure Agreements)': 'Confidentiality agreements and non-disclosure forms',
  'Lease Agreement': 'Rental agreements, lease contracts, and tenancy documents'
};

/**
 * Category icons for UI display (Font Awesome classes)
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Sales Documents and Forms': 'fa-file-invoice-dollar',
  'Policy and Compliance Documents': 'fa-clipboard-check',
  'Letters and Notices Templates': 'fa-envelope',
  'Web & Technology Agreements': 'fa-laptop-code',
  'Proposal Templates': 'fa-file-contract',
  'Financial Agreements': 'fa-hand-holding-usd',
  'Family Law': 'fa-users',
  'Employment Legal Templates': 'fa-briefcase',
  'Real Estate': 'fa-home',
  'B2B Legal Documents': 'fa-handshake',
  'Business Document': 'fa-building',
  'Last Will and Testament': 'fa-file-signature',
  'Bill of Sale': 'fa-receipt',
  'Power of Attorney (POA)': 'fa-user-shield',
  'Eviction Notice': 'fa-door-open',
  'NDA (Non-Disclosure Agreements)': 'fa-user-secret',
  'Lease Agreement': 'fa-key'
};

/**
 * Validate if a category is valid
 */
export function isValidCategory(category: string): boolean {
  return TEMPLATE_CATEGORIES.includes(category as TemplateCategory);
}

/**
 * Get category description
 */
export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] || 'Legal document template';
}

/**
 * Get category icon
 */
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || 'fa-file-alt';
}
