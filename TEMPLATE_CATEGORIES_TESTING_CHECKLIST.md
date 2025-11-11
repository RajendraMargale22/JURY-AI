# Template Categories Testing Checklist

## ✅ Pre-Testing Setup

- [ ] MongoDB is running: `sudo systemctl status mongod`
- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] Seed script has been run: `npm run seed:templates`
- [ ] At least one admin/lawyer user exists in database

## 📋 Test Cases

### 1. Category Display
- [ ] Open Templates page
- [ ] Verify sidebar shows "All Categories" option
- [ ] Verify all 17 categories are listed in sidebar:
  - [ ] Sales Documents and Forms
  - [ ] Policy and Compliance Documents
  - [ ] Letters and Notices Templates
  - [ ] Web & Technology Agreements
  - [ ] Proposal Templates
  - [ ] Financial Agreements
  - [ ] Family Law
  - [ ] Employment Legal Templates
  - [ ] Real Estate
  - [ ] B2B Legal Documents
  - [ ] Business Document
  - [ ] Last Will and Testament
  - [ ] Bill of Sale
  - [ ] Power of Attorney (POA)
  - [ ] Eviction Notice
  - [ ] NDA (Non-Disclosure Agreements)
  - [ ] Lease Agreement

### 2. Category Filtering
- [ ] Click "All Categories" - displays all templates
- [ ] Click "Sales Documents and Forms" - filters to only that category
- [ ] Click "Real Estate" - filters to only Real Estate templates
- [ ] Click "Employment Legal Templates" - filters correctly
- [ ] Click "NDA (Non-Disclosure Agreements)" - handles parentheses correctly
- [ ] Selected category is highlighted/active in sidebar
- [ ] Template count updates based on filter

### 3. Search Functionality
- [ ] Search with no category filter - searches all templates
- [ ] Select category + search - searches within that category only
- [ ] Search for "agreement" - returns relevant results
- [ ] Search for "rental" - returns relevant results
- [ ] Search is case-insensitive
- [ ] Clear search box - returns to full category view

### 4. Template Upload (Admin/Lawyer Only)
- [ ] Login as admin or lawyer user
- [ ] "Upload Template" button is visible
- [ ] Click "Upload Template" button
- [ ] Modal opens with upload form
- [ ] Category dropdown shows all 17 categories
- [ ] Select "Sales Documents and Forms" from dropdown
- [ ] Fill in template title: "Test Sales Agreement"
- [ ] Fill in description: "Test description for sales agreement"
- [ ] Select a PDF file (< 10MB)
- [ ] Click "Upload Template" button
- [ ] Success toast appears
- [ ] Modal closes
- [ ] New template appears in "Sales Documents and Forms" category
- [ ] Template counter increments

### 5. Template Upload Validation
- [ ] Try to upload without title - shows error
- [ ] Try to upload without description - shows error
- [ ] Try to upload without category - shows error
- [ ] Try to upload without file - shows error
- [ ] Try to upload file > 10MB - shows error
- [ ] Try to upload invalid file type (.txt) - shows error
- [ ] Valid upload works correctly

### 6. Template Card Display
- [ ] Template cards show correct title
- [ ] Template cards show category badge
- [ ] Template cards show download counter
- [ ] Template cards show last updated date
- [ ] "Generate Document" button is visible
- [ ] "Preview Template" link is visible
- [ ] Card hover effect works (lifts up)
- [ ] Grid pattern background is visible
- [ ] Geometric shape is visible

### 7. Template Preview
- [ ] Click "Preview Template" on any template
- [ ] Preview modal opens
- [ ] Shows template title
- [ ] Shows category
- [ ] Shows description
- [ ] Shows download count
- [ ] Shows preview content
- [ ] "Close" button works
- [ ] "Download" buttons are visible (if logged in)

### 8. Template Download (Authenticated Users)
- [ ] Login as any user
- [ ] Click "Generate Document" on a template
- [ ] File download starts
- [ ] File downloads successfully
- [ ] File opens correctly (PDF/DOC/DOCX)
- [ ] Download counter increments by 1
- [ ] Success toast appears

### 9. Template Download (Unauthenticated Users)
- [ ] Logout or use incognito mode
- [ ] Browse templates (should work)
- [ ] Click "Generate Document"
- [ ] Redirected to login page OR "Login to Download" button shows
- [ ] After login, can download successfully

### 10. API Endpoints
- [ ] Test GET /api/templates - returns all templates
- [ ] Test GET /api/templates?category=Real%20Estate - filters by category
- [ ] Test GET /api/templates?search=agreement - searches templates
- [ ] Test GET /api/templates/categories - returns all 17 categories
- [ ] Test GET /api/templates/:id - returns specific template
- [ ] Test POST /api/templates/upload - uploads template (with auth)
- [ ] Test GET /api/templates/:id/file - downloads file (with auth)

### 11. Responsive Design
- [ ] Open on desktop (1920px) - looks good
- [ ] Open on laptop (1366px) - looks good
- [ ] Open on tablet (768px) - sidebar collapses or adjusts
- [ ] Open on mobile (375px) - cards stack vertically
- [ ] Touch interactions work on mobile

### 12. Error Handling
- [ ] Backend down - shows friendly error message
- [ ] MongoDB down - shows error message
- [ ] Invalid template ID - shows 404 error
- [ ] File not found - shows error message
- [ ] Network error during upload - shows error, deletes file
- [ ] Invalid JWT token - redirects to login

### 13. Performance
- [ ] Page loads in < 3 seconds
- [ ] Category filter is instant
- [ ] Search returns results quickly
- [ ] File upload shows progress
- [ ] File download streams efficiently
- [ ] No console errors in browser
- [ ] No memory leaks

### 14. Security
- [ ] Non-admin/lawyer users cannot upload templates
- [ ] Unauthenticated users cannot download templates
- [ ] File type validation works (only PDF/DOC/DOCX)
- [ ] File size validation works (max 10MB)
- [ ] Category validation logs custom categories
- [ ] XSS protection in template descriptions
- [ ] SQL injection protection in search

### 15. Database Verification
```bash
# MongoDB Shell
mongo
> use jury-ai
> db.templates.count()              # Should show 17+ templates
> db.templates.distinct("category") # Should show all 17 categories
> db.templates.find({category: "Real Estate"}).count()
> db.templates.find().sort({downloads: -1}).limit(5)
```

### 16. Logs & Monitoring
- [ ] Backend logs show no errors
- [ ] Category validation warnings appear for custom categories
- [ ] File upload logs show success
- [ ] Download logs show increments
- [ ] No 500 errors in logs

## 🐛 Known Issues to Check

- [ ] Apostrophes in category names (e.g., "Power of Attorney (POA)")
- [ ] Special characters in template titles
- [ ] Long category names in mobile view
- [ ] Multiple simultaneous downloads
- [ ] Concurrent uploads
- [ ] Category filter state after page refresh

## 📊 Test Results Summary

| Test Category | Pass | Fail | Notes |
|---------------|------|------|-------|
| Category Display | [ ] | [ ] | |
| Category Filtering | [ ] | [ ] | |
| Search Functionality | [ ] | [ ] | |
| Template Upload | [ ] | [ ] | |
| Upload Validation | [ ] | [ ] | |
| Template Card Display | [ ] | [ ] | |
| Template Preview | [ ] | [ ] | |
| Template Download (Auth) | [ ] | [ ] | |
| Template Download (Unauth) | [ ] | [ ] | |
| API Endpoints | [ ] | [ ] | |
| Responsive Design | [ ] | [ ] | |
| Error Handling | [ ] | [ ] | |
| Performance | [ ] | [ ] | |
| Security | [ ] | [ ] | |
| Database | [ ] | [ ] | |
| Logs & Monitoring | [ ] | [ ] | |

## 🚀 Final Checklist

- [ ] All tests passed
- [ ] No console errors
- [ ] No backend errors
- [ ] Documentation is accurate
- [ ] Seed script works correctly
- [ ] Ready for production deployment

## 📝 Notes

**Tested By:** _________________  
**Date:** _________________  
**Environment:** Dev / Staging / Production  
**Browser:** _________________  
**OS:** _________________  

**Issues Found:**
1. 
2. 
3. 

**Recommendations:**
1. 
2. 
3. 

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed
