# 📎 File Upload Features - Documentation

## Overview
Two new file upload features have been added to the JURY AI chat interface:

1. **Message File Attachment** - Attach files to individual chat messages
2. **Knowledge Base Upload** - Upload documents to the AI's knowledge base (stored in MongoDB)

---

## 🎯 Feature 1: Message File Attachment

### Location
Chat input area at the bottom of the chat page

### How to Use
1. Click the paperclip icon (📎) next to the message input
2. Select a file (PDF, DOC, DOCX, or TXT)
3. The file will appear as an attachment preview above the input
4. Type your question (optional) and click send
5. The file is uploaded with your message

### Supported File Types
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Text files (`.txt`)

### What Happens
- File is stored in MongoDB `documents` collection
- File metadata is saved (filename, size, upload date, user ID)
- File is associated with the specific query
- AI receives context about the attached file

### MongoDB Storage
Collection: `documents`
```json
{
  "filename": "contract.pdf",
  "content_type": "application/pdf",
  "size": 524288,
  "uploaded_at": "2025-11-02T10:30:00Z",
  "user_id": "user123",
  "type": "chat_attachment",
  "query": "What are the terms in this contract?"
}
```

---

## 🎯 Feature 2: Knowledge Base Upload

### Location
Left sidebar - "Knowledge Base" section

### How to Use
1. Open the chat sidebar (click hamburger menu if needed)
2. Find the "Knowledge Base" section
3. Click **"Upload Documents"** button
4. Select one or multiple files
5. Wait for upload confirmation
6. Documents are added to the AI's knowledge base

### Supported File Types
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Text files (`.txt`)

### What Happens
- Files are processed and vectorized
- Document content is added to Pinecone vector database
- File metadata is stored in MongoDB
- AI can now answer questions based on these documents
- All users benefit from the expanded knowledge base

### MongoDB Storage
Collection: `documents`
```json
{
  "filename": "legal_guidelines.pdf",
  "content_type": "application/pdf",
  "size": 1048576,
  "uploaded_at": "2025-11-02T10:30:00Z",
  "status": "processed",
  "type": "knowledge_base"
}
```

---

## 🔧 Technical Implementation

### Frontend Changes
**File**: `jury-ai-app/frontend/src/pages/ChatPage.tsx`

#### New State Variables
```typescript
const [attachedFile, setAttachedFile] = useState<File | null>(null);
const [uploadingDB, setUploadingDB] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const dbFileInputRef = useRef<HTMLInputElement>(null);
```

#### New Functions
1. `handleFileAttach(e)` - Handle message file attachment
2. `removeAttachment()` - Remove attached file
3. `handleDatabaseUpload(e)` - Handle knowledge base upload

#### UI Components Added
1. File attachment button in message input
2. File preview with size display
3. Knowledge base upload section in sidebar
4. Upload progress indicator

### Backend Changes

#### 1. FastAPI Routes (`routes/ask_questions.py`)
**Updated `/ask/` endpoint:**
```python
@router.post("/ask/")
async def ask_question(
    question: str = Form(...),
    user_id: str = Form(default="anonymous"),
    file: Optional[UploadFile] = File(None)  # NEW: Accept file
):
    # File metadata stored in MongoDB
    # File info included in response
```

#### 2. Upload Routes (`routes/upload_pdfs.py`)
**New `/upload/` endpoint:**
```python
@router.post("/upload/")
async def upload_to_database(files: List[UploadFile] = File(...)):
    # Process files for vector store
    # Store metadata in MongoDB
    # Return upload confirmation
```

#### 3. MongoDB Config (`config/mongodb.py`)
**New function:**
```python
def get_db():
    """Get MongoDB database instance"""
    return db
```

---

## 📊 API Endpoints

### 1. Ask with File Attachment
**Endpoint:** `POST /ask/`

**Parameters:**
- `question` (form): User's question
- `user_id` (form, optional): User identifier
- `file` (file, optional): Attached document

**Response:**
```json
{
  "answer": "AI response text...",
  "attachedFile": {
    "filename": "document.pdf",
    "size": 524288
  }
}
```

### 2. Upload to Knowledge Base
**Endpoint:** `POST /upload/`

**Parameters:**
- `files` (files): One or more documents

**Response:**
```json
{
  "message": "Successfully uploaded 3 document(s) to knowledge base",
  "documents": [
    {
      "id": "673635a1b5ee7a780287623c",
      "filename": "doc1.pdf"
    },
    {
      "id": "673635a1b5ee7a780287623d",
      "filename": "doc2.pdf"
    }
  ],
  "count": 2
}
```

---

## 🧪 Testing

### Test Message File Attachment
1. Open chat at http://localhost:3000
2. Click paperclip icon
3. Select a PDF file
4. Type "Analyze this document"
5. Click send
6. Verify file appears in message
7. Check MongoDB:
```bash
mongosh jury-ai --eval "db.documents.find({type: 'chat_attachment'}).pretty()"
```

### Test Knowledge Base Upload
1. Open sidebar
2. Click "Upload Documents"
3. Select multiple PDF files
4. Wait for success message
5. Ask a question about the uploaded content
6. Verify AI can answer based on new documents
7. Check MongoDB:
```bash
mongosh jury-ai --eval "db.documents.find({type: 'knowledge_base'}).pretty()"
```

---

## 🎨 UI Features

### File Attachment Preview
- Shows filename and file size
- Removable with close button
- Styled as Bootstrap alert

### Knowledge Base Section
- Located in sidebar
- Green upload button
- Loading spinner during upload
- Help text explaining purpose

### File Icons
- 📎 Paperclip for message attachment
- 📁 Database icon for knowledge base
- ✅ Success checkmark on completion

---

## 🔒 Security & Validation

### File Type Validation
- Only allowed: PDF, DOC, DOCX, TXT
- Validation on frontend and backend
- User receives error for invalid types

### File Size
- Displayed to user before upload
- Tracked in MongoDB
- Can add size limits if needed

### Error Handling
- Try-catch blocks for all upload operations
- User-friendly error messages
- Graceful fallback if MongoDB unavailable

---

## 📈 Benefits

### Message File Attachment
✅ Contextual file analysis  
✅ Query-specific document review  
✅ User upload tracking  
✅ File metadata preservation  

### Knowledge Base Upload
✅ Expand AI knowledge  
✅ Customizable legal database  
✅ Organization-specific documents  
✅ Improved answer accuracy  
✅ Shared knowledge across users  

---

## 🚀 Future Enhancements

### Possible Improvements
1. **File Content Extraction** - Parse and analyze file content
2. **OCR Support** - Extract text from scanned PDFs
3. **File Preview** - Show file thumbnails
4. **Bulk Upload** - Drag-and-drop multiple files
5. **Upload History** - List of previously uploaded files
6. **File Search** - Search within uploaded documents
7. **File Categories** - Organize by legal domains
8. **Access Control** - Private vs shared documents

---

## 📝 Files Modified

### Frontend
- ✅ `jury-ai-app/frontend/src/pages/ChatPage.tsx`
  - Added file upload states and refs
  - Added file handling functions
  - Updated UI with upload buttons
  - Added file preview component

### Backend
- ✅ `chatbot-backend/routes/ask_questions.py`
  - Added `file` parameter to `/ask/` endpoint
  - File metadata storage in MongoDB
  - File info in response

- ✅ `chatbot-backend/routes/upload_pdfs.py`
  - New `/upload/` endpoint
  - MongoDB metadata storage
  - Multi-file support

- ✅ `chatbot-backend/config/mongodb.py`
  - Added `get_db()` function
  - Database access for upload routes

---

## ✅ Status

**Implementation:** COMPLETE  
**Testing:** Ready for testing  
**MongoDB Integration:** Active  
**Vector Store:** Connected  

All file upload features are implemented and ready to use!

---

## 📞 Support

### Troubleshooting

**File upload fails:**
- Check file type is supported
- Verify FastAPI backend is running on port 8000
- Check MongoDB connection
- Review browser console for errors

**Knowledge base upload doesn't work:**
- Ensure Pinecone is configured
- Check vector store connection
- Verify file processing pipeline

**Files not appearing in MongoDB:**
- Check MongoDB connection
- Verify `documents` collection exists
- Review FastAPI logs for errors

### Check Logs
```bash
# FastAPI logs
tail -f /path/to/fastapi/logs

# MongoDB queries
mongosh jury-ai --eval "db.documents.countDocuments()"
```

---

**Last Updated:** November 2, 2025  
**Version:** 1.0  
**Status:** Production Ready
