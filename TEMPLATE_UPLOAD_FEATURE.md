# Template Upload Feature Implementation

## Overview
Implemented a comprehensive template upload system allowing lawyers and admins to upload legal document templates that users can browse and download.

## Features Implemented

### 1. **Upload Template Button (Sidebar)**
- **Location**: Templates Page - Left Sidebar
- **Visibility**: Only visible to users with `admin` or `lawyer` roles
- **Functionality**: Opens upload modal for adding new templates

### 2. **Upload Modal**
The upload form includes:
- **Template Name** (required): Title of the legal document
- **Category** (required): Dropdown with predefined categories:
  - Legal Documents
  - Property Law
  - Employment Law
  - Business Law
  - Estate Planning
  - Family Law
- **Description/Summary** (required): Brief explanation of the template (up to 500 characters)
- **File Upload** (required): Accept PDF, DOC, DOCX files (max 10MB)

### 3. **Backend Implementation**

#### File Upload Configuration
- **Storage**: Files stored in `uploads/templates/` directory
- **File Types**: PDF (.pdf), Word (.doc, .docx)
- **Max Size**: 10MB per file
- **Naming**: Unique timestamp-based filenames to prevent conflicts

#### Database Schema
Updated `Template` model with:
```typescript
{
  title: String (required)
  description: String (required)
  category: String (required)
  content: String (required)
  downloads: Number (default: 0)
  createdBy: ObjectId (required, ref: User)
  isActive: Boolean (default: true)
  filePath: String (optional)
  fileName: String (optional)
  fileSize: Number (optional)
  mimeType: String (optional)
  timestamps: true
}
```

#### API Endpoints

1. **POST /api/templates/upload**
   - **Auth**: Required (JWT token)
   - **Role**: Admin or Lawyer only
   - **Body**: FormData with title, description, category, file
   - **Response**: Created template object

2. **GET /api/templates**
   - **Auth**: Optional
   - **Query Params**: page, limit, category, search
   - **Response**: Paginated list of templates

3. **GET /api/templates/categories**
   - **Auth**: Optional
   - **Response**: Array of distinct categories

4. **POST /api/templates/:id/download**
   - **Auth**: Required
   - **Response**: Download URL and incremented download count

5. **GET /api/templates/:id/file**
   - **Auth**: Required
   - **Response**: File stream for download

### 4. **Frontend Implementation**

#### Template Service (`templateService.ts`)
Created API service with methods:
- `getTemplates()` - Fetch templates with filters
- `getCategories()` - Get available categories
- `uploadTemplate()` - Upload new template
- `downloadTemplate()` - Download template file
- `getTemplateFile()` - Get template file blob

#### Templates Page Updates
- **Real-time data**: Fetches templates from backend API
- **Loading states**: Shows spinner while loading
- **Error handling**: Toast notifications for success/error
- **Upload progress**: Shows uploading state with spinner
- **Auto-refresh**: Refreshes template list after upload/download

#### Template Cards Display
Each card shows:
- Template icon and title
- Brief description
- Category badge
- Download count
- Preview button
- Download button (PDF/Word formats)
- Last updated date
- File information (name, size)

### 5. **Security Features**
- **Role-based access**: Only admins and lawyers can upload
- **File validation**: Type and size checks on both client and server
- **JWT authentication**: All upload/download operations require auth
- **File cleanup**: Automatic cleanup on upload errors
- **Path security**: Files stored with unique names to prevent conflicts

### 6. **User Experience**
- **Responsive design**: Works on all screen sizes
- **Visual feedback**: Loading spinners, toast notifications
- **Form validation**: Client-side validation before submission
- **File preview**: Shows selected file name and size
- **Progress indicators**: Upload progress with spinner
- **Success messages**: Clear feedback on successful operations

## File Structure

```
jury-ai-app/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   └── Template.ts (Updated with file fields)
│   │   ├── routes/
│   │   │   └── templates.ts (Updated with upload endpoint)
│   │   └── types/
│   │       └── interfaces.ts (Updated ITemplate interface)
│   └── uploads/
│       └── templates/ (New directory for template files)
└── frontend/
    └── src/
        ├── pages/
        │   └── TemplatesPage.tsx (Updated with upload feature)
        └── services/
            └── templateService.ts (New API service)
```

## Setup Instructions

### 1. Install Dependencies
Backend already has `multer` installed for file uploads.

### 2. Create Upload Directory
The system automatically creates the upload directory, but you can create it manually:
```bash
mkdir -p jury-ai-app/backend/uploads/templates
```

### 3. Environment Variables
Ensure your `.env` file has:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Test the Feature
1. Login as an admin or lawyer
2. Navigate to Templates page
3. Click "Upload Template" in the sidebar
4. Fill in the form and select a file
5. Click "Upload Template"
6. Verify the template appears in the list
7. Test downloading the template

## Usage Guidelines

### For Admins/Lawyers Uploading Templates:
1. Ensure your template is legally accurate and properly formatted
2. Use clear, descriptive titles
3. Write concise descriptions (500 char max)
4. Choose the appropriate category
5. Upload only PDF or Word documents under 10MB

### For Users Downloading Templates:
1. Browse templates by category or search
2. Preview template details
3. Login to download
4. Choose PDF or Word format
5. Templates automatically track download counts

## Future Enhancements

Potential improvements:
- [ ] Template editing/updating
- [ ] Template versioning
- [ ] User ratings and reviews
- [ ] Template usage analytics
- [ ] Custom template fields/placeholders
- [ ] Template preview generation
- [ ] Bulk upload capability
- [ ] Template approval workflow
- [ ] OCR for text extraction from PDFs
- [ ] Template customization before download

## Notes

- Templates are marked as active by default (`isActive: true`)
- Download counts increment on each download
- Files are stored with unique names to prevent overwrites
- Failed uploads automatically clean up uploaded files
- Only authenticated users can download templates
- Templates list auto-refreshes after uploads/downloads
