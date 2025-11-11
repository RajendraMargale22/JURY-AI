# 📋 Complete Template System Architecture & Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Data Models & Schema](#data-models--schema)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Implementation](#backend-implementation)
6. [Data Flow & Request-Response Cycles](#data-flow--request-response-cycles)
7. [Algorithms & Methodology](#algorithms--methodology)
8. [Security & Authorization](#security--authorization)
9. [File Management System](#file-management-system)
10. [API Endpoints Reference](#api-endpoints-reference)

---

## 1. System Overview

### Purpose
The Template System allows **admin** and **lawyer** users to upload legal document templates (PDF, DOC, DOCX) and enables **all authenticated users** to browse, preview, and download these templates for legal documentation purposes.

### Key Features
- ✅ **Upload Templates** (Admin/Lawyer only)
- ✅ **Browse & Search Templates** (All users)
- ✅ **Category Filtering** (Legal Documents, Property Law, Employment Law, etc.)
- ✅ **Download Templates** (Authenticated users)
- ✅ **Generate Documents** (Fill template placeholders with user data)
- ✅ **Preview Templates** (View before download)
- ✅ **Download Counter** (Track popularity)
- ✅ **Modern UI** (Grid pattern cards with animations)

### Tech Stack
- **Frontend**: React + TypeScript + Bootstrap 5 + Custom CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **File Storage**: Local filesystem (uploads/templates/)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer middleware

---

## 2. Architecture Diagrams

### 2.1 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                      JURY AI LEGAL PLATFORM                      │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┐         ┌────────────────────┐         ┌─────────────────┐
│                    │         │                    │         │                 │
│  React Frontend    │ ◄─────► │  Node.js Backend   │ ◄─────► │  MongoDB        │
│  (Port 3000)       │  HTTP   │  (Port 5000)       │  ODM    │  Database       │
│                    │  REST   │                    │         │                 │
└────────────────────┘         └────────────────────┘         └─────────────────┘
         │                              │
         │                              │
         │                              ▼
         │                     ┌─────────────────┐
         │                     │                 │
         │                     │  File System    │
         └────────────────────►│  (uploads/)     │
              File Upload       │                 │
                               └─────────────────┘
```

### 2.2 Component Architecture (Detailed)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────────┐  │
│  │                │    │                │    │                  │  │
│  │ TemplatesPage  │───►│  TemplateCard  │    │  AuthContext     │  │
│  │  (Container)   │    │  (Component)   │    │  (State Mgmt)    │  │
│  │                │    │                │    │                  │  │
│  └────────┬───────┘    └────────────────┘    └──────────────────┘  │
│           │                                                          │
│           │ Uses                                                     │
│           ▼                                                          │
│  ┌────────────────────────────────────────────────┐                 │
│  │     templateService.ts (API Layer)             │                 │
│  │  - getTemplates()                              │                 │
│  │  - getCategories()                             │                 │
│  │  - uploadTemplate()                            │                 │
│  │  - downloadTemplate()                          │                 │
│  │  - getTemplateFile()                           │                 │
│  └────────────────────────────────────────────────┘                 │
│           │                                                          │
└───────────┼──────────────────────────────────────────────────────────┘
            │
            │ HTTP Requests (axios)
            │ Authorization: Bearer <token>
            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js/Express)                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────┐             │
│  │          Routes (templates.ts)                     │             │
│  │  GET    /api/templates                             │             │
│  │  GET    /api/templates/categories                  │             │
│  │  GET    /api/templates/:id                         │             │
│  │  POST   /api/templates/upload                      │             │
│  │  POST   /api/templates/:id/download                │             │
│  │  GET    /api/templates/:id/file                    │             │
│  │  POST   /api/templates/:id/generate                │             │
│  │  PUT    /api/templates/:id                         │             │
│  │  DELETE /api/templates/:id                         │             │
│  └────────────────┬───────────────────────────────────┘             │
│                   │                                                  │
│                   ▼                                                  │
│  ┌────────────────────────────────────────────┐                     │
│  │         Middleware                         │                     │
│  │  - auth (JWT verification)                 │                     │
│  │  - multer (file upload)                    │                     │
│  │  - error handlers                          │                     │
│  └────────────────┬───────────────────────────┘                     │
│                   │                                                  │
│                   ▼                                                  │
│  ┌────────────────────────────────────────────┐                     │
│  │    Models (Mongoose)                       │                     │
│  │  - Template.ts                             │                     │
│  │  - User.ts                                 │                     │
│  └────────────────┬───────────────────────────┘                     │
│                   │                                                  │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │    MongoDB Database    │
        │   - templates          │
        │   - users              │
        └────────────────────────┘
```

### 2.3 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     TEMPLATE UPLOAD FLOW                              │
└──────────────────────────────────────────────────────────────────────┘

User (Admin/Lawyer)
      │
      │ 1. Click "Upload Template"
      ▼
┌─────────────────┐
│ Upload Modal    │
│ - Title         │
│ - Description   │
│ - Category      │
│ - File (PDF)    │
└────────┬────────┘
         │ 2. Submit Form
         ▼
┌─────────────────────────────┐
│ templateService.ts          │
│ uploadTemplate()            │
│ - FormData creation         │
│ - Authorization header      │
└────────┬────────────────────┘
         │ 3. POST /api/templates/upload
         │    (multipart/form-data)
         ▼
┌──────────────────────────────────┐
│ Backend: templates.ts            │
│ router.post('/upload')           │
├──────────────────────────────────┤
│ Step 1: auth middleware          │
│   - Verify JWT token             │
│   - Extract user from token      │
│   - Check role (admin/lawyer)    │
├──────────────────────────────────┤
│ Step 2: multer middleware        │
│   - Validate file type           │
│   - Check file size (max 10MB)   │
│   - Generate unique filename     │
│   - Save to uploads/templates/   │
├──────────────────────────────────┤
│ Step 3: Create Template doc      │
│   - new Template({...})          │
│   - Set title, desc, category    │
│   - Store filePath, fileName     │
│   - Set createdBy = user._id     │
│   - downloads = 0                │
├──────────────────────────────────┤
│ Step 4: Save to MongoDB          │
│   - await template.save()        │
│   - await template.populate()    │
└────────┬─────────────────────────┘
         │ 4. Return success response
         │    { template: {...} }
         ▼
┌─────────────────────────┐
│ Frontend                │
│ - Show success toast    │
│ - Close upload modal    │
│ - Refresh templates     │
└─────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────┐
│                     TEMPLATE DOWNLOAD FLOW                            │
└──────────────────────────────────────────────────────────────────────┘

User (Authenticated)
      │
      │ 1. Click "Generate Document"
      ▼
┌─────────────────────────┐
│ TemplateCard Component  │
│ onGenerateDocument()    │
└────────┬────────────────┘
         │ 2. Call downloadTemplate()
         ▼
┌──────────────────────────────────┐
│ templateService.ts               │
│ getTemplateFile(id, token)       │
│ - GET /api/templates/:id/file    │
│ - Authorization: Bearer token    │
│ - responseType: 'blob'           │
└────────┬─────────────────────────┘
         │ 3. HTTP GET request
         ▼
┌──────────────────────────────────┐
│ Backend: templates.ts            │
│ router.get('/:id/file')          │
├──────────────────────────────────┤
│ Step 1: auth middleware          │
│   - Verify JWT token             │
│   - Ensure user is logged in     │
├──────────────────────────────────┤
│ Step 2: Find template            │
│   - Template.findOne({           │
│       _id: id,                   │
│       isActive: true             │
│     })                           │
├──────────────────────────────────┤
│ Step 3: Validate file exists     │
│   - Check filePath               │
│   - fs.existsSync(filePath)      │
├──────────────────────────────────┤
│ Step 4: Stream file to client    │
│   - Set Content-Type header      │
│   - Set Content-Disposition      │
│   - fs.createReadStream()        │
│   - fileStream.pipe(res)         │
└────────┬─────────────────────────┘
         │ 4. Return file stream (binary)
         ▼
┌──────────────────────────────────┐
│ Frontend                         │
│ - Receive blob                   │
│ - Create object URL              │
│ - Create <a> download link       │
│ - Trigger download               │
│ - Clean up object URL            │
└──────────────────────────────────┘
```

---

## 3. Data Models & Schema

### 3.1 Template Schema (MongoDB)

```typescript
interface ITemplate {
  _id: ObjectId;                    // Unique identifier
  title: string;                    // Template name
  description: string;              // Template description
  category: string;                 // Category (e.g., "Legal Documents")
  content: string;                  // Template text content
  fields: Field[];                  // Dynamic fields for generation
  downloads: number;                // Download counter
  createdBy: ObjectId;              // User who created template
  isActive: boolean;                // Soft delete flag
  
  // File upload fields
  filePath: string;                 // Server path to file
  fileName: string;                 // Original filename
  fileSize: number;                 // File size in bytes
  mimeType: string;                 // MIME type (e.g., "application/pdf")
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface Field {
  name: string;                     // Field name (e.g., "clientName")
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];               // For select fields
}
```

### 3.2 Database Indexes

```javascript
// Compound index for search optimization
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ title: 'text', description: 'text' }); // Text search
templateSchema.index({ createdAt: -1 }); // Sort by newest
```

### 3.3 File Storage Structure

```
jury-ai-app/backend/uploads/templates/
  ├── service-agreement-1699234567890-123456789.pdf
  ├── rental-contract-1699234567891-987654321.docx
  ├── employment-agreement-1699234567892-456789123.pdf
  └── ...

Filename Pattern: {original-name}-{timestamp}-{random}.{extension}
```

---

## 4. Frontend Implementation

### 4.1 Component Hierarchy

```
TemplatesPage (Container)
  ├── Navbar (Header)
  ├── Sidebar
  │   ├── Search Input
  │   ├── Category Filter
  │   ├── Info Card
  │   └── Upload Button (Admin/Lawyer)
  ├── Main Content
  │   ├── Header
  │   └── Templates Grid
  │       └── TemplateCard (repeated)
  ├── Preview Modal
  └── Upload Modal
```

### 4.2 Key Components

#### TemplateCard Component
**Location**: `frontend/src/components/TemplateCard.tsx`

**Props Interface**:
```typescript
interface TemplateCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  downloads: number;
  lastUpdated?: Date | string;
  onGenerateDocument: () => void;
  onPreview: () => void;
}
```

**Visual Elements**:
- Grid pattern SVG background
- Corner decorations (borders)
- Geometric shape (blue triangle)
- Date badge (top-left)
- Title (centered, large)
- Metadata (category, downloads)
- "Generate Document" button
- "Preview Template" link
- Footer with name & category badge

**CSS Features**:
- `transform: translateY(-8px)` on hover
- `box-shadow` transitions
- Responsive breakpoints (768px, 480px)
- Glass-morphism effects
- Clip-path for geometric shape

#### TemplatesPage Component
**Location**: `frontend/src/pages/TemplatesPage.tsx`

**State Management**:
```typescript
const [selectedCategory, setSelectedCategory] = useState('all');
const [searchTerm, setSearchTerm] = useState('');
const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadForm, setUploadForm] = useState({
  title: '',
  description: '',
  category: 'Legal Documents',
  file: null as File | null
});
const [isUploading, setIsUploading] = useState(false);
const [templates, setTemplates] = useState<Template[]>([]);
const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
const [categories, setCategories] = useState<string[]>([...]);
```

**Key Functions**:

1. **fetchTemplates()**: Retrieves templates from API
```typescript
const fetchTemplates = async () => {
  setIsLoadingTemplates(true);
  const data = await templateService.getTemplates(
    1, 100, selectedCategory, searchTerm
  );
  setTemplates(data.templates);
  setIsLoadingTemplates(false);
};
```

2. **handleUploadSubmit()**: Uploads new template
```typescript
const handleUploadSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  // Validation
  if (file.size > 10MB) return error;
  
  // API call
  await templateService.uploadTemplate(
    title, description, category, file, token
  );
  
  // Success handling
  toast.success('Template uploaded successfully!');
  fetchTemplates(); // Refresh list
};
```

3. **downloadTemplate()**: Downloads file
```typescript
const downloadTemplate = async (template: Template, format: string) => {
  const blob = await templateService.getTemplateFile(template._id, token);
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = template.fileName;
  link.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
};
```

### 4.3 Service Layer

**Location**: `frontend/src/services/templateService.ts`

**API Methods**:

```typescript
export const templateService = {
  // GET /api/templates?page=1&limit=12&category=Legal&search=rental
  async getTemplates(page, limit, category?, search?): Promise<TemplatesResponse>
  
  // GET /api/templates/categories
  async getCategories(): Promise<string[]>
  
  // GET /api/templates/:id
  async getTemplate(id): Promise<Template>
  
  // POST /api/templates/upload (multipart/form-data)
  async uploadTemplate(title, description, category, file, token): Promise<Template>
  
  // POST /api/templates/:id/download
  async downloadTemplate(id, token): Promise<string>
  
  // GET /api/templates/:id/file (returns blob)
  async getTemplateFile(id, token): Promise<Blob>
};
```

**Request Configuration**:
```typescript
// Example: Upload request
const formData = new FormData();
formData.append('title', title);
formData.append('description', description);
formData.append('category', category);
formData.append('file', file);

axios.post(`${API_URL}/templates/upload`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${token}`,
  },
  withCredentials: true,
});
```

---

## 5. Backend Implementation

### 5.1 Route Handlers

**Location**: `backend/src/routes/templates.ts`

#### GET /api/templates
**Purpose**: Fetch all active templates with pagination and filters

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 12)
- `category` (string, optional)
- `search` (string, optional)

**Algorithm**:
```typescript
1. Parse query params (page, limit, category, search)
2. Build MongoDB query:
   - Base: { isActive: true }
   - If category !== 'all': add { category: category }
   - If search: add { $or: [
       { title: { $regex: search, $options: 'i' } },
       { description: { $regex: search, $options: 'i' } }
     ]}
3. Execute query:
   - .populate('createdBy', 'username')
   - .sort({ createdAt: -1 })
   - .limit(limit)
   - .skip((page - 1) * limit)
4. Count total documents
5. Return paginated response
```

**Response**:
```json
{
  "templates": [...],
  "totalPages": 5,
  "currentPage": 1,
  "total": 58
}
```

#### POST /api/templates/upload
**Purpose**: Upload new template (Admin/Lawyer only)

**Middleware Stack**:
1. `auth` - JWT verification
2. `upload.single('file')` - Multer file handling

**Algorithm**:
```typescript
1. Authenticate user (JWT)
2. Authorize user (role === 'admin' OR 'lawyer')
3. Validate request body (title, description, category)
4. Validate file:
   - Check file exists
   - Check MIME type (PDF, DOC, DOCX only)
   - Check file size (max 10MB)
5. Generate unique filename:
   - timestamp + random + original extension
6. Save file to disk:
   - Path: uploads/templates/{uniqueFilename}
7. Create Template document:
   - new Template({
       title, description, category,
       filePath, fileName, fileSize, mimeType,
       createdBy: user._id,
       downloads: 0,
       isActive: true
     })
8. Save to MongoDB
9. Populate createdBy field
10. Return template object
```

**Error Handling**:
```typescript
try {
  // ... upload logic
} catch (error) {
  // Delete uploaded file if database save fails
  if (req.file) {
    fs.unlinkSync(req.file.path);
  }
  return res.status(500).json({ message: 'Server error' });
}
```

#### GET /api/templates/:id/file
**Purpose**: Stream template file to client

**Algorithm**:
```typescript
1. Authenticate user
2. Find template by ID:
   - Template.findOne({ _id: id, isActive: true })
3. Validate file exists on disk:
   - fs.existsSync(template.filePath)
4. Set response headers:
   - Content-Type: template.mimeType
   - Content-Disposition: attachment; filename="..."
5. Stream file:
   - fs.createReadStream(template.filePath)
   - fileStream.pipe(res)
```

#### POST /api/templates/:id/download
**Purpose**: Record download (increment counter)

**Algorithm**:
```typescript
1. Authenticate user
2. Find template by ID
3. Increment downloads: template.downloads += 1
4. Save to database
5. Return downloadUrl: /api/templates/:id/file
```

#### POST /api/templates/:id/generate
**Purpose**: Generate document by replacing placeholders

**Request Body**:
```json
{
  "fields": {
    "clientName": "John Doe",
    "date": "2025-11-06",
    "amount": "5000"
  }
}
```

**Algorithm**:
```typescript
1. Authenticate user
2. Find template
3. Get template.content (text)
4. For each field in request.body.fields:
   - placeholder = "{{fieldName}}"
   - value = fields[fieldName] || "[fieldName]"
   - content = content.replace(new RegExp(placeholder, 'g'), value)
5. Increment downloads counter
6. Return generatedContent
```

**Example**:
```
Template content:
"This agreement is between {{clientName}} and Company."

After generation:
"This agreement is between John Doe and Company."
```

### 5.2 Multer Configuration

**Storage Configuration**:
```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/templates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});
```

**File Filter (Validation)**:
```typescript
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX allowed.'));
  }
};
```

**Upload Instance**:
```typescript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});
```

---

## 6. Data Flow & Request-Response Cycles

### 6.1 Complete Upload Cycle (Sequence Diagram)

```
User          Frontend         Backend         MongoDB      Filesystem
 |               |                |               |              |
 | Click Upload  |                |               |              |
 |-------------->|                |               |              |
 |               |                |               |              |
 |               | Fill Form      |               |              |
 |               | Select File    |               |              |
 |               |                |               |              |
 | Submit        |                |               |              |
 |-------------->|                |               |              |
 |               |                |               |              |
 |               | POST /upload   |               |              |
 |               | (FormData)     |               |              |
 |               |--------------->|               |              |
 |               |                |               |              |
 |               |                | Verify JWT    |              |
 |               |                | Check Role    |              |
 |               |                |               |              |
 |               |                | Process File  |              |
 |               |                |               |              |
 |               |                | Save File     |              |
 |               |                |------------------------------>|
 |               |                |               |              |
 |               |                | Create Doc    |              |
 |               |                |-------------->|              |
 |               |                |               |              |
 |               |                |    Save OK    |              |
 |               |                |<--------------|              |
 |               |                |               |              |
 |               |  201 Created   |               |              |
 |               |<---------------|               |              |
 |               |                |               |              |
 |  Success Toast|                |               |              |
 |<--------------|                |               |              |
 |               |                |               |              |
 |               | GET /templates |               |              |
 |               |--------------->|               |              |
 |               |                |               |              |
 |               |                | Query DB      |              |
 |               |                |-------------->|              |
 |               |                |               |              |
 |               |                |   Results     |              |
 |               |                |<--------------|              |
 |               |                |               |              |
 |               |  200 OK        |               |              |
 |               |<---------------|               |              |
 |               |                |               |              |
 | Display Cards |                |               |              |
 |<--------------|                |               |              |
```

### 6.2 Complete Download Cycle

```
User          Frontend         Backend         MongoDB      Filesystem
 |               |                |               |              |
 | Click         |                |               |              |
 | "Generate     |                |               |              |
 | Document"     |                |               |              |
 |-------------->|                |               |              |
 |               |                |               |              |
 |               | GET /:id/file  |               |              |
 |               | + JWT Token    |               |              |
 |               |--------------->|               |              |
 |               |                |               |              |
 |               |                | Verify JWT    |              |
 |               |                |               |              |
 |               |                | Find Template |              |
 |               |                |-------------->|              |
 |               |                |               |              |
 |               |                |   Template    |              |
 |               |                |<--------------|              |
 |               |                |               |              |
 |               |                | Check File    |              |
 |               |                |------------------------------>|
 |               |                |               |              |
 |               |                | Stream File   |              |
 |               |                |<------------------------------|
 |               |                |               |              |
 |               |  200 OK (blob) |               |              |
 |               |<---------------|               |              |
 |               |                |               |              |
 | Create URL    |                |               |              |
 | Trigger       |                |               |              |
 | Download      |                |               |              |
 |<--------------|                |               |              |
 |               |                |               |              |
 | File Saved    |                |               |              |
 | to Downloads  |                |               |              |
```

---

## 7. Algorithms & Methodology

### 7.1 Search Algorithm

**Type**: Case-insensitive substring matching with MongoDB regex

**Implementation**:
```typescript
if (search) {
  query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
}
```

**Complexity**: O(n) where n = number of documents (MongoDB regex scan)

**Optimization Potential**:
- Add text index: `templateSchema.index({ title: 'text', description: 'text' })`
- Use `$text` search: `{ $text: { $search: searchTerm } }`
- Complexity improves to O(log n) with indexing

### 7.2 Pagination Algorithm

**Implementation**:
```typescript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 12;

const templates = await Template.find(query)
  .limit(limit)
  .skip((page - 1) * limit);

const total = await Template.countDocuments(query);
const totalPages = Math.ceil(total / limit);
```

**Formula**:
- Skip: `(page - 1) × limit`
- Total Pages: `⌈total / limit⌉`

**Example**:
- Total documents: 58
- Limit: 12
- Page 1: Skip 0, Return documents 1-12
- Page 2: Skip 12, Return documents 13-24
- Page 5: Skip 48, Return documents 49-58
- Total Pages: ⌈58/12⌉ = 5

### 7.3 File Upload Algorithm

**Steps**:
1. **Validation Layer**:
   ```
   Input: File
   Check MIME type ∈ {PDF, DOC, DOCX}
   Check size ≤ 10MB
   If valid → Proceed
   Else → Reject (400 Bad Request)
   ```

2. **Filename Generation**:
   ```
   uniqueSuffix = timestamp + random(10^9)
   originalName = "rental-agreement.pdf"
   nameWithoutExt = "rental-agreement"
   extension = ".pdf"
   
   newFilename = nameWithoutExt + "-" + uniqueSuffix + extension
   Example: "rental-agreement-1699234567890-987654321.pdf"
   ```

3. **Atomic Save**:
   ```
   BEGIN TRANSACTION
     1. Save file to disk (filesystem)
     2. Create MongoDB document
     3. Save document to database
   COMMIT
   
   ON ERROR:
     ROLLBACK:
       - Delete file from disk (fs.unlinkSync)
       - No database record created
   ```

### 7.4 Placeholder Replacement Algorithm

**Input**: Template content with placeholders + User field values

**Algorithm**:
```typescript
function generateDocument(content: string, fields: object): string {
  let result = content;
  
  for (const [key, value] of Object.entries(fields)) {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder, 'g'); // Global flag for all occurrences
    const replacement = value || `[${key}]`; // Default if value missing
    
    result = result.replace(regex, replacement);
  }
  
  return result;
}
```

**Example**:
```
Input content:
"This rental agreement is made on {{date}} between {{landlordName}} 
(Landlord) and {{tenantName}} (Tenant) for property at {{address}}. 
The monthly rent is {{rent}}."

Input fields:
{
  "date": "November 6, 2025",
  "landlordName": "John Smith",
  "tenantName": "Jane Doe",
  "address": "123 Main St",
  "rent": "$1500"
}

Output:
"This rental agreement is made on November 6, 2025 between John Smith 
(Landlord) and Jane Doe (Tenant) for property at 123 Main St. 
The monthly rent is $1500."
```

**Complexity**: O(m × n) where m = number of fields, n = content length

### 7.5 Download Counter Algorithm

**Purpose**: Track template popularity without race conditions

**Implementation**:
```typescript
// Atomic increment using MongoDB operator
await Template.findByIdAndUpdate(
  templateId,
  { $inc: { downloads: 1 } }, // Increment by 1
  { new: true }
);
```

**Why `$inc` operator?**
- Atomic operation at database level
- Prevents race condition if multiple users download simultaneously
- No need for read-modify-write cycle

**Alternative (Race Condition Prone)**:
```typescript
// BAD: Race condition possible
const template = await Template.findById(id);
template.downloads += 1; // Another request might update here
await template.save();    // Overwrites other updates
```

---

## 8. Security & Authorization

### 8.1 Authentication Flow

```
1. User logs in → Backend verifies credentials
2. Backend generates JWT token:
   - Payload: { _id, email, role, exp }
   - Signature: HMAC-SHA256 with secret key
3. Frontend stores token:
   - localStorage.setItem('token', token)
4. Frontend includes token in requests:
   - Authorization: Bearer <token>
5. Backend auth middleware verifies:
   - jwt.verify(token, SECRET_KEY)
   - Extracts user from payload
   - Attaches to req.user
```

### 8.2 Role-Based Access Control (RBAC)

**Roles**:
- `user`: Can browse, preview, download templates
- `lawyer`: Can do everything user can + upload templates
- `admin`: Can do everything + manage all templates + toggle status

**Authorization Matrix**:

| Endpoint                       | user | lawyer | admin |
|--------------------------------|------|--------|-------|
| GET /templates                 | ✅   | ✅     | ✅    |
| GET /templates/:id             | ✅   | ✅     | ✅    |
| GET /templates/:id/file        | ✅   | ✅     | ✅    |
| POST /templates/:id/download   | ✅   | ✅     | ✅    |
| POST /templates/:id/generate   | ✅   | ✅     | ✅    |
| POST /templates/upload         | ❌   | ✅     | ✅    |
| POST /templates                | ❌   | ✅     | ✅    |
| PUT /templates/:id             | ❌   | ✅*    | ✅    |
| DELETE /templates/:id          | ❌   | ✅*    | ✅    |
| PATCH /templates/:id/status    | ❌   | ❌     | ✅    |

\* Only if creator of template

**Middleware Implementation**:
```typescript
// Check if admin or lawyer
if (req.user?.role !== 'admin' && req.user?.role !== 'lawyer') {
  return res.status(403).json({ message: 'Access denied' });
}

// Check if creator or admin
const userId = req.user?._id?.toString();
if (template.createdBy.toString() !== userId && req.user?.role !== 'admin') {
  return res.status(403).json({ message: 'Access denied' });
}
```

### 8.3 Input Validation & Sanitization

**File Upload Validation**:
```typescript
1. MIME type whitelist (prevent malicious files)
2. File size limit (prevent DoS)
3. Filename sanitization (prevent path traversal)
```

**Text Input Validation**:
```typescript
if (!title || !description || !category) {
  return res.status(400).json({ message: 'Missing required fields' });
}

if (title.length > 200) {
  return res.status(400).json({ message: 'Title too long' });
}
```

**Query Parameter Validation**:
```typescript
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
```

### 8.4 Security Best Practices Implemented

✅ **JWT Authentication**: Stateless, scalable  
✅ **Role-Based Access Control**: Granular permissions  
✅ **File Type Validation**: Only allow safe file types  
✅ **File Size Limits**: Prevent DoS attacks  
✅ **Path Sanitization**: Prevent directory traversal  
✅ **CORS Configuration**: Control cross-origin access  
✅ **Error Handling**: No sensitive data in error messages  
✅ **Atomic Operations**: Race condition prevention  

**Potential Improvements**:
🔶 Add rate limiting (e.g., express-rate-limit)  
🔶 Add virus scanning for uploaded files (e.g., ClamAV)  
🔶 Implement CSP headers  
🔶 Add request ID for audit trails  
🔶 Encrypt sensitive template content at rest  

---

## 9. File Management System

### 9.1 Directory Structure

```
jury-ai-app/backend/
  ├── uploads/
  │   ├── templates/          ← Template files
  │   │   ├── rental-1699234567890-123456.pdf
  │   │   ├── employment-1699234567891-789012.docx
  │   │   └── ...
  │   ├── documents/          ← User documents (other feature)
  │   ├── avatars/            ← Profile pictures
  │   └── temp/               ← Temporary files
  └── src/
      └── routes/
          └── templates.ts
```

### 9.2 File Operations

**Create (Upload)**:
```typescript
fs.mkdirSync(uploadDir, { recursive: true }); // Ensure dir exists
multer.diskStorage().filename(uniqueName);     // Generate unique name
// File automatically saved by multer
```

**Read (Download)**:
```typescript
const fileStream = fs.createReadStream(filePath);
fileStream.pipe(res); // Stream to HTTP response
```

**Update**:
Not directly supported (would require upload of new file + deletion of old)

**Delete**:
```typescript
fs.unlinkSync(template.filePath); // Delete from filesystem
await Template.findByIdAndDelete(id); // Delete from database
```

### 9.3 Cleanup Strategy

**When to Delete Files**:
1. Template is permanently deleted (not soft delete)
2. Upload fails (rollback)
3. Scheduled cleanup of orphaned files (cron job - not yet implemented)

**Orphaned File Detection** (Future):
```typescript
// Cron job: Find files without database records
const filesOnDisk = fs.readdirSync(uploadDir);
const templatesInDB = await Template.find({}, 'fileName');
const orphanedFiles = filesOnDisk.filter(file => 
  !templatesInDB.some(t => t.fileName === file)
);
// Delete orphanedFiles
```

---

## 10. API Endpoints Reference

### Complete Endpoint List

| Method | Endpoint                        | Auth | Role         | Description                      |
|--------|---------------------------------|------|--------------|----------------------------------|
| GET    | /api/templates                  | No   | -            | Get all templates (paginated)    |
| GET    | /api/templates/categories       | No   | -            | Get unique categories            |
| GET    | /api/templates/:id              | No   | -            | Get specific template            |
| POST   | /api/templates                  | Yes  | Admin/Lawyer | Create template (no file)        |
| POST   | /api/templates/upload           | Yes  | Admin/Lawyer | Upload template with file        |
| POST   | /api/templates/:id/download     | Yes  | Any          | Record download (increment)      |
| GET    | /api/templates/:id/file         | Yes  | Any          | Download template file           |
| POST   | /api/templates/:id/generate     | Yes  | Any          | Generate document from template  |
| PUT    | /api/templates/:id              | Yes  | Creator/Admin| Update template                  |
| DELETE | /api/templates/:id              | Yes  | Creator/Admin| Delete template                  |
| PATCH  | /api/templates/:id/status       | Yes  | Admin        | Toggle template active status    |

### Detailed Endpoint Specs

#### GET /api/templates

**Query Parameters**:
```
page      (number)  - Page number (default: 1)
limit     (number)  - Items per page (default: 12, max: 100)
category  (string)  - Filter by category (optional)
search    (string)  - Search in title/description (optional)
```

**Response** (200 OK):
```json
{
  "templates": [
    {
      "_id": "673b1234...",
      "title": "Rental Application Form",
      "description": "Standard rental application...",
      "category": "Property Law",
      "downloads": 42,
      "createdBy": {
        "_id": "672a5678...",
        "name": "John Lawyer"
      },
      "fileName": "rental-app-1699234567890.pdf",
      "fileSize": 524288,
      "createdAt": "2025-11-01T10:30:00.000Z",
      "updatedAt": "2025-11-05T14:22:00.000Z",
      "isActive": true
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 58
}
```

#### POST /api/templates/upload

**Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data**:
```
title          (string)  - Template title (required)
description    (string)  - Template description (required)
category       (string)  - Template category (required)
file           (file)    - PDF/DOC/DOCX file (required, max 10MB)
```

**Response** (201 Created):
```json
{
  "message": "Template uploaded successfully",
  "template": {
    "_id": "673b9876...",
    "title": "Service Agreement",
    "description": "Standard service agreement template",
    "category": "Business Law",
    "content": "Template file: service-agreement-1699234567890.pdf",
    "downloads": 0,
    "createdBy": {
      "_id": "672a5678...",
      "name": "Jane Lawyer",
      "email": "jane@example.com"
    },
    "filePath": "/path/to/uploads/templates/service-agreement-1699234567890.pdf",
    "fileName": "service-agreement-1699234567890.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "isActive": true,
    "createdAt": "2025-11-06T12:00:00.000Z",
    "updatedAt": "2025-11-06T12:00:00.000Z"
  }
}
```

**Error Responses**:
- 400: Missing fields or invalid file
- 403: Not authorized (not admin/lawyer)
- 500: Server error

#### GET /api/templates/:id/file

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```
Content-Type: application/pdf (or appropriate MIME type)
Content-Disposition: attachment; filename="rental-application.pdf"

[Binary file stream]
```

**Error Responses**:
- 401: Not authenticated
- 404: Template or file not found
- 500: Server error

#### POST /api/templates/:id/generate

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "fields": {
    "clientName": "John Doe",
    "date": "November 6, 2025",
    "address": "123 Main Street",
    "amount": "$5,000"
  }
}
```

**Response** (200 OK):
```json
{
  "generatedContent": "This agreement is made on November 6, 2025 between John Doe...",
  "templateTitle": "Service Agreement",
  "generatedAt": "2025-11-06T12:30:00.000Z"
}
```

---

## Summary: System Architecture Highlights

### Frontend Architecture
- **React SPA** with TypeScript
- **Component-based** design (TemplateCard, TemplatesPage)
- **Service layer** for API abstraction (templateService.ts)
- **State management** with hooks (useState, useEffect)
- **Context API** for authentication (AuthContext)
- **Modern UI** with custom CSS (grid patterns, animations)

### Backend Architecture
- **RESTful API** with Express + TypeScript
- **Middleware stack** (auth, multer, error handling)
- **MongoDB** with Mongoose ODM
- **File storage** on local filesystem
- **JWT authentication** with role-based access
- **Atomic operations** for data consistency

### Data Flow
1. **Upload**: Frontend → Multer → Filesystem + MongoDB → Success
2. **Browse**: Frontend → Backend → MongoDB → Paginated Results
3. **Download**: Frontend → Backend → Filesystem → File Stream
4. **Generate**: Frontend → Backend → Text Replace → Generated Doc

### Key Algorithms
- **Search**: MongoDB regex with case-insensitive matching
- **Pagination**: Skip-limit pattern with total count
- **File Upload**: Atomic save with rollback on error
- **Placeholder Replace**: Regex-based text substitution
- **Download Counter**: Atomic increment with `$inc`

### Security
- JWT token authentication
- Role-based authorization (user/lawyer/admin)
- File type validation (MIME whitelist)
- File size limits (10MB)
- Input sanitization
- Error handling without info leakage

---

## Quick Reference Commands

### Start Services
```bash
# Backend
cd jury-ai-app/backend
npm start

# Frontend  
cd jury-ai-app/frontend
npm start
```

### Test Endpoints
```bash
# Get templates
curl http://localhost:5000/api/templates?category=Legal&search=rental

# Upload template (requires token)
curl -X POST http://localhost:5000/api/templates/upload \
  -H "Authorization: Bearer <token>" \
  -F "title=Test Template" \
  -F "description=Test description" \
  -F "category=Legal Documents" \
  -F "file=@template.pdf"

# Download template (requires token)
curl http://localhost:5000/api/templates/<id>/file \
  -H "Authorization: Bearer <token>" \
  --output template.pdf
```

---

**End of Documentation**
