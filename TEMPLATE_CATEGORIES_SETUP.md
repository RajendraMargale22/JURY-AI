# Template Categories Setup Guide

## Overview

This document explains how to set up and use the comprehensive template category system in JURY AI.

## Available Categories (17 Total)

1. **Sales Documents and Forms** - Sales agreements, invoices, commercial transactions
2. **Policy and Compliance Documents** - Company policies, compliance forms, regulations
3. **Letters and Notices Templates** - Formal letters, notices, correspondence
4. **Web & Technology Agreements** - Website terms, privacy policies, tech contracts
5. **Proposal Templates** - Business proposals, project bids, service offerings
6. **Financial Agreements** - Loan agreements, payment plans, financial contracts
7. **Family Law** - Family law documents, custody agreements
8. **Employment Legal Templates** - Employment contracts, offer letters, HR documents
9. **Real Estate** - Property agreements, real estate contracts
10. **B2B Legal Documents** - Business-to-business contracts, commercial agreements
11. **Business Document** - General business documents, corporate forms
12. **Last Will and Testament** - Estate planning, wills, testamentary documents
13. **Bill of Sale** - Bill of sale for various property types
14. **Power of Attorney (POA)** - Power of attorney forms, authorization documents
15. **Eviction Notice** - Eviction notices, tenant-related legal documents
16. **NDA (Non-Disclosure Agreements)** - Confidentiality agreements, non-disclosure forms
17. **Lease Agreement** - Rental agreements, lease contracts, tenancy documents

## Setup Instructions

### 1. Backend Setup

The categories are now centrally managed in:
```
jury-ai-app/backend/src/config/templateCategories.ts
```

This file contains:
- `TEMPLATE_CATEGORIES` - Array of all category names
- `CATEGORY_DESCRIPTIONS` - Detailed descriptions for each category
- `CATEGORY_ICONS` - Font Awesome icons for each category
- Helper functions: `isValidCategory()`, `getCategoryDescription()`, `getCategoryIcon()`

### 2. Seed Sample Templates

To populate your database with sample templates for all categories:

```bash
cd jury-ai-app/backend

# Make sure MongoDB is running
sudo systemctl start mongod

# Run the seed script
npm run seed:templates
```

This will create one sample template for each category with:
- Professional template content
- Dynamic field placeholders (e.g., `{{clientName}}`)
- Realistic descriptions
- Proper formatting

### 3. Frontend Updates

The frontend has been updated with all 17 categories in:
- `TemplatesPage.tsx` - Category filter sidebar
- Upload modal - Category dropdown selection

Categories are fetched dynamically from the backend API, ensuring consistency.

## API Endpoints

### GET /api/templates/categories
Returns all available categories (predefined + custom)

**Response:**
```json
[
  "Sales Documents and Forms",
  "Policy and Compliance Documents",
  "Letters and Notices Templates",
  ...
]
```

### GET /api/templates?category=Real%20Estate
Filter templates by category

**Query Parameters:**
- `category` - Category name (URL encoded)
- `search` - Search term
- `page` - Page number
- `limit` - Items per page

## Category Validation

The backend validates categories on upload:
- Accepts predefined categories
- Warns (but allows) custom categories
- Logs custom category usage for review

## Template Placeholders

Templates use `{{fieldName}}` syntax for dynamic content:

**Example:**
```
This agreement is between {{clientName}} and {{companyName}}.
The total amount is {{amount}} due on {{dueDate}}.
```

**Supported Field Types:**
- `text` - Text input
- `number` - Numeric input
- `date` - Date picker
- `select` - Dropdown selection

## Upload Requirements

**File Types:** PDF, DOC, DOCX  
**Max Size:** 10MB  
**Required Fields:**
- Title
- Description
- Category
- File

**Access:** Admin and Lawyer roles only

## Category Icons (Font Awesome)

Each category has an associated icon for better UX:

| Category | Icon |
|----------|------|
| Sales Documents | fa-file-invoice-dollar |
| Policy & Compliance | fa-clipboard-check |
| Letters & Notices | fa-envelope |
| Web & Technology | fa-laptop-code |
| Proposals | fa-file-contract |
| Financial | fa-hand-holding-usd |
| Family Law | fa-users |
| Employment | fa-briefcase |
| Real Estate | fa-home |
| B2B Legal | fa-handshake |
| Business | fa-building |
| Last Will | fa-file-signature |
| Bill of Sale | fa-receipt |
| Power of Attorney | fa-user-shield |
| Eviction Notice | fa-door-open |
| NDA | fa-user-secret |
| Lease Agreement | fa-key |

## Testing

### Test Category Filter
1. Start the application
2. Navigate to Templates page
3. Click on different categories in sidebar
4. Verify templates are filtered correctly

### Test Template Upload
1. Login as admin or lawyer
2. Click "Upload Template"
3. Select a category from dropdown
4. Fill in required fields
5. Upload a PDF/DOC file
6. Verify template appears in correct category

### Test Search
1. Enter search term in search box
2. Verify search works across title and description
3. Combine with category filter
4. Verify both filters work together

## Database Schema

Templates are stored with the following structure:

```typescript
{
  _id: ObjectId,
  title: string,
  description: string,
  category: string,  // One of TEMPLATE_CATEGORIES
  content: string,
  fields: [
    {
      name: string,
      type: 'text' | 'number' | 'date' | 'select',
      required: boolean,
      options?: string[]
    }
  ],
  downloads: number,
  createdBy: ObjectId,
  isActive: boolean,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Categories not showing
- Ensure backend is running
- Check MongoDB connection
- Run seed script: `npm run seed:templates`

### Upload failing
- Verify user role (admin/lawyer required)
- Check file size (max 10MB)
- Verify file type (PDF/DOC/DOCX only)
- Check JWT token validity

### Templates not filtering
- Clear browser cache
- Check network requests in DevTools
- Verify category name matches exactly

## Future Enhancements

Potential improvements:
- [ ] Category-specific field templates
- [ ] Multi-language support
- [ ] Template versioning
- [ ] Template reviews and ratings
- [ ] Popular templates section
- [ ] Recently added templates
- [ ] Template preview before download
- [ ] Batch template operations

## Quick Commands Reference

```bash
# Start backend
cd jury-ai-app/backend
npm start

# Start frontend
cd jury-ai-app/frontend
npm start

# Seed templates
cd jury-ai-app/backend
npm run seed:templates

# Check MongoDB
mongo
> use jury-ai
> db.templates.find().count()
> db.templates.distinct("category")
```

## Support

For issues or questions:
1. Check the logs: `jury-ai-app/backend/logs/`
2. Verify MongoDB is running: `sudo systemctl status mongod`
3. Check environment variables in `.env`
4. Review `TEMPLATE_SYSTEM_ARCHITECTURE.md` for detailed technical info

---

**Last Updated:** November 7, 2025  
**Version:** 1.0.0
