# JURY-AI System Diagrams

## Table of Contents
1. [UML Class Diagram](#1-uml-class-diagram)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram-erd)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Data Flow Diagram](#4-data-flow-diagram-dfd)
5. [Flowchart - User Journey](#5-flowchart---user-journey)
6. [Sequence Diagrams](#6-sequence-diagrams)

---

## 1. UML Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String role [user|lawyer|admin]
        +String avatar
        +Boolean isVerified
        +Boolean isActive
        +Date lastLogin
        +Profile profile
        +Date createdAt
        +Date updatedAt
        +comparePassword(password) Boolean
        +toJSON() Object
    }

    class Profile {
        +String phone
        +String address
        +String bio
    }

    class Lawyer {
        +ObjectId _id
        +String userId
        +String[] specialization
        +Number experience
        +String barId
        +Boolean verified
        +Number rating
        +Number totalCases
        +Number completedCases
        +Documents documents
        +Availability availability
        +Number consultationFee
        +Date createdAt
        +Date updatedAt
    }

    class Documents {
        +String license
        +String[] certificates
    }

    class Availability {
        +String hours
        +String[] days
    }

    class Chat {
        +ObjectId _id
        +String userId
        +String lawyerId
        +String type [ai|lawyer]
        +String title
        +Message[] messages
        +String status [active|closed|pending]
        +String category
        +Date createdAt
        +Date updatedAt
    }

    class Message {
        +String sender [user|ai|lawyer]
        +String message
        +Date timestamp
        +String[] attachments
    }

    class Template {
        +ObjectId _id
        +String title
        +String description
        +String category
        +String content
        +Field[] fields
        +Number downloads
        +ObjectId createdBy
        +Boolean isActive
        +String filePath
        +String fileName
        +Number fileSize
        +String mimeType
        +Date createdAt
        +Date updatedAt
    }

    class Field {
        +String name
        +String type [text|number|date|select]
        +Boolean required
        +String[] options
    }

    class Document {
        +ObjectId _id
        +String userId
        +String filename
        +String originalName
        +String fileType
        +Number fileSize
        +String filePath
        +String analysisStatus [pending|processing|completed|failed]
        +AnalysisResult analysisResult
        +Date createdAt
        +Date updatedAt
    }

    class AnalysisResult {
        +String documentType
        +String[] keyPoints
        +String riskLevel [low|medium|high]
        +String[] suggestions
        +String summary
    }

    class LegalQuery {
        +ObjectId _id
        +String userId
        +String query
        +String aiResponse
        +Number confidence
        +Source[] sources
        +String feedback
        +Date timestamp
    }

    class Source {
        +String text
        +Object metadata
    }

    class Analytics {
        +ObjectId _id
        +String userId
        +String eventType
        +Object eventData
        +String userAgent
        +String ipAddress
        +Date timestamp
    }

    User "1" --o "1" Profile : has
    User "1" --o "0..1" Lawyer : extends
    Lawyer "1" --o "1" Documents : has
    Lawyer "1" --o "1" Availability : has
    User "1" --o "*" Chat : creates
    User "1" --o "*" Template : creates
    User "1" --o "*" Document : uploads
    User "1" --o "*" LegalQuery : makes
    Chat "1" --o "*" Message : contains
    Template "1" --o "*" Field : contains
    Document "1" --o "0..1" AnalysisResult : has
    LegalQuery "1" --o "*" Source : references
    User "1" --o "*" Analytics : generates
```

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ CHAT : creates
    USER ||--o{ TEMPLATE : creates
    USER ||--o{ DOCUMENT : uploads
    USER ||--o{ LEGAL_QUERY : makes
    USER ||--o| LAWYER : "can be"
    USER ||--o{ ANALYTICS : generates
    LAWYER ||--o{ CHAT : "consults in"
    CHAT ||--|{ MESSAGE : contains
    TEMPLATE ||--|{ FIELD : contains
    DOCUMENT ||--o| ANALYSIS_RESULT : has
    LEGAL_QUERY ||--|{ SOURCE : references

    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        String role
        String avatar
        Boolean isVerified
        Boolean isActive
        Date lastLogin
        Object profile
        Date createdAt
        Date updatedAt
    }

    LAWYER {
        ObjectId _id PK
        String userId FK
        String_Array specialization
        Number experience
        String barId UK
        Boolean verified
        Number rating
        Number totalCases
        Number completedCases
        Object documents
        Object availability
        Number consultationFee
        Date createdAt
        Date updatedAt
    }

    CHAT {
        ObjectId _id PK
        String userId FK
        String lawyerId FK
        String type
        String title
        String status
        String category
        Date createdAt
        Date updatedAt
    }

    MESSAGE {
        String sender
        String message
        Date timestamp
        String_Array attachments
    }

    TEMPLATE {
        ObjectId _id PK
        String title
        String description
        String category
        String content
        Number downloads
        ObjectId createdBy FK
        Boolean isActive
        String filePath
        String fileName
        Number fileSize
        String mimeType
        Date createdAt
        Date updatedAt
    }

    FIELD {
        String name
        String type
        Boolean required
        String_Array options
    }

    DOCUMENT {
        ObjectId _id PK
        String userId FK
        String filename
        String originalName
        String fileType
        Number fileSize
        String filePath
        String analysisStatus
        Date createdAt
        Date updatedAt
    }

    ANALYSIS_RESULT {
        String documentType
        String_Array keyPoints
        String riskLevel
        String_Array suggestions
        String summary
    }

    LEGAL_QUERY {
        ObjectId _id PK
        String userId
        String query
        String aiResponse
        Number confidence
        String feedback
        Date timestamp
    }

    SOURCE {
        String text
        Object metadata
    }

    ANALYTICS {
        ObjectId _id PK
        String userId FK
        String eventType
        Object eventData
        String userAgent
        String ipAddress
        Date timestamp
    }
```

---

## 3. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>Port: 3000]
        A1[User Interface]
        A2[Admin Dashboard]
        A3[Lawyer Portal]
    end

    subgraph "API Gateway Layer"
        B[Express.js Backend<br/>Port: 5000]
        B1[Authentication Middleware]
        B2[Rate Limiting]
        B3[CORS Middleware]
        B4[Error Handler]
    end

    subgraph "Application Services"
        C1[Auth Service]
        C2[Chat Service]
        C3[Template Service]
        C4[Admin Service]
        C5[Document Service]
    end

    subgraph "AI/ML Services"
        D[FastAPI Chatbot Backend<br/>Port: 8000]
        D1[LLM Service<br/>Google Gemini]
        D2[Vector Store<br/>Pinecone]
        D3[Embedding Model<br/>HuggingFace]
        D4[Document Processor]
    end

    subgraph "Data Layer"
        E[(MongoDB<br/>Primary Database)]
        E1[Users Collection]
        E2[Lawyers Collection]
        E3[Chats Collection]
        E4[Templates Collection]
        E5[Documents Collection]
        E6[Legal Queries Collection]
        E7[Analytics Collection]
    end

    subgraph "Storage Layer"
        F[File System]
        F1[Uploaded Documents]
        F2[User Avatars]
        F3[Templates]
        F4[Temp Files]
    end

    subgraph "External Services"
        G1[JWT Service]
        G2[Email Service]
        G3[Pinecone Cloud]
    end

    A --> B
    A1 --> A
    A2 --> A
    A3 --> A
    
    B --> B1
    B --> B2
    B --> B3
    B --> B4
    
    B1 --> C1
    B --> C2
    B --> C3
    B --> C4
    B --> C5
    
    C1 --> E1
    C2 --> E3
    C3 --> E4
    C4 --> E1
    C4 --> E2
    C5 --> E5
    
    A --> D
    D --> D1
    D --> D2
    D --> D3
    D --> D4
    
    D --> E6
    D --> E7
    D2 --> G3
    
    C5 --> F1
    C1 --> F2
    C3 --> F3
    D4 --> F4
    
    C1 --> G1
    C1 --> G2
    
    style A fill:#61dafb
    style B fill:#68a063
    style D fill:#009688
    style E fill:#47a248
    style F fill:#ffa500
```

---

## 4. Data Flow Diagram (DFD)

### Level 0 - Context Diagram

```mermaid
graph LR
    U[User]
    L[Lawyer]
    A[Admin]
    SYS[JURY-AI System]
    DB[(Database)]
    AI[AI Service]
    EXT[External Services]

    U -->|Authentication Requests| SYS
    U -->|Legal Queries| SYS
    U -->|Document Upload| SYS
    U -->|Template Requests| SYS
    
    L -->|Consultation| SYS
    L -->|Profile Management| SYS
    
    A -->|User Management| SYS
    A -->|System Configuration| SYS
    
    SYS -->|Responses| U
    SYS -->|Notifications| L
    SYS -->|Reports| A
    
    SYS <-->|Data Storage/Retrieval| DB
    SYS <-->|AI Processing| AI
    SYS <-->|Email/JWT| EXT
```

### Level 1 - Detailed DFD

```mermaid
graph TB
    subgraph "User Processes"
        U[User]
        U -->|Login/Register| P1[1.0 Authentication]
        U -->|Ask Question| P2[2.0 AI Chat]
        U -->|Upload Document| P3[3.0 Document Processing]
        U -->|Browse Templates| P4[4.0 Template Management]
        U -->|Chat with Lawyer| P5[5.0 Lawyer Consultation]
    end

    subgraph "Admin Processes"
        ADM[Admin]
        ADM -->|Manage Users| P6[6.0 User Management]
        ADM -->|Verify Lawyers| P7[7.0 Lawyer Verification]
        ADM -->|View Analytics| P8[8.0 Analytics]
    end

    subgraph "Data Stores"
        DS1[(D1: Users)]
        DS2[(D2: Lawyers)]
        DS3[(D3: Chats)]
        DS4[(D4: Templates)]
        DS5[(D5: Documents)]
        DS6[(D6: Legal Queries)]
        DS7[(D7: Analytics)]
    end

    subgraph "External Systems"
        EXT1[JWT Service]
        EXT2[AI/ML Engine]
        EXT3[Vector Database]
        EXT4[Email Service]
    end

    P1 <-->|User Data| DS1
    P1 -->|Generate Token| EXT1
    P1 -->|Send Verification| EXT4
    
    P2 -->|Store Query| DS6
    P2 <-->|AI Processing| EXT2
    P2 <-->|Vector Search| EXT3
    P2 -->|Track Analytics| DS7
    
    P3 -->|Store Document| DS5
    P3 -->|Analyze| EXT2
    
    P4 <-->|Template Data| DS4
    
    P5 <-->|Chat Data| DS3
    P5 <-->|Lawyer Info| DS2
    
    P6 <-->|User Data| DS1
    
    P7 <-->|Lawyer Data| DS2
    
    P8 <-->|Analytics Data| DS7
```

---

## 5. Flowchart - User Journey

### User Authentication Flow

```mermaid
flowchart TD
    Start([Start]) --> CheckAuth{Authenticated?}
    
    CheckAuth -->|No| ShowLogin[Show Login/Register Page]
    ShowLogin --> UserChoice{User Choice}
    
    UserChoice -->|Login| EnterLogin[Enter Email & Password]
    EnterLogin --> ValidateLogin{Valid Credentials?}
    ValidateLogin -->|No| LoginError[Show Error Message]
    LoginError --> ShowLogin
    ValidateLogin -->|Yes| GenerateToken[Generate JWT Token]
    
    UserChoice -->|Register| EnterRegister[Enter Name, Email, Password, Role]
    EnterRegister --> ValidateRegister{Valid Data?}
    ValidateRegister -->|No| RegisterError[Show Validation Errors]
    RegisterError --> ShowLogin
    ValidateRegister -->|Yes| CreateUser[Create User in Database]
    CreateUser --> GenerateToken
    
    GenerateToken --> SetCookie[Set HTTP-Only Cookie]
    SetCookie --> UpdateLastLogin[Update Last Login Time]
    UpdateLastLogin --> HomePage
    
    CheckAuth -->|Yes| HomePage[Show Home Page]
    HomePage --> RoleCheck{User Role?}
    
    RoleCheck -->|User| UserDash[User Dashboard]
    RoleCheck -->|Lawyer| LawyerDash[Lawyer Dashboard]
    RoleCheck -->|Admin| AdminDash[Admin Dashboard]
    
    UserDash --> UserActions{Select Action}
    UserActions -->|AI Chat| AIFlow[AI Chat Flow]
    UserActions -->|Upload Doc| DocFlow[Document Upload Flow]
    UserActions -->|Templates| TemplateFlow[Template Flow]
    UserActions -->|Lawyer Chat| LawyerFlow[Lawyer Consultation Flow]
    UserActions -->|Logout| LogoutFlow[Clear Session]
    
    LogoutFlow --> End([End])
```

### AI Chat Flow

```mermaid
flowchart TD
    Start([User Asks Question]) --> ValidateInput{Valid Input?}
    ValidateInput -->|No| ShowError[Show Error Message]
    ShowError --> End([End])
    
    ValidateInput -->|Yes| CheckAttachment{File Attached?}
    CheckAttachment -->|Yes| ProcessFile[Store File Metadata]
    CheckAttachment -->|No| EmbedQuery
    ProcessFile --> EmbedQuery[Embed Query with AI Model]
    
    EmbedQuery --> VectorSearch[Search Pinecone Vector DB]
    VectorSearch --> GetTopK[Retrieve Top 5 Matches]
    GetTopK --> CalcConfidence[Calculate Confidence Score]
    CalcConfidence --> CreateDocs[Create Document Objects]
    
    CreateDocs --> InitLLM[Initialize LLM Chain]
    InitLLM --> QueryLLM[Query Gemini AI]
    QueryLLM --> ProcessResponse[Process AI Response]
    
    ProcessResponse --> StoreQuery{MongoDB Available?}
    StoreQuery -->|Yes| SaveToDB[Save Query & Response]
    SaveToDB --> TrackAnalytics[Track Analytics Event]
    StoreQuery -->|No| SkipDB[Skip DB Storage]
    
    TrackAnalytics --> FormatResponse[Format JSON Response]
    SkipDB --> FormatResponse
    FormatResponse --> ReturnToUser[Return Answer to User]
    
    ReturnToUser --> UserFeedback{User Provides Feedback?}
    UserFeedback -->|Yes| StoreFeedback[Update Query Feedback]
    UserFeedback -->|No| End
    StoreFeedback --> End([End])
```

### Document Upload & Analysis Flow

```mermaid
flowchart TD
    Start([User Uploads Document]) --> ValidateFile{Valid File?}
    ValidateFile -->|No| FileError[Show Error:<br/>Invalid File Type/Size]
    FileError --> End([End])
    
    ValidateFile -->|Yes| SaveFile[Save File to Server]
    SaveFile --> CreateRecord[Create Document Record in DB]
    CreateRecord --> SetStatus[Set Status: 'pending']
    
    SetStatus --> StartAnalysis[Start Document Analysis]
    StartAnalysis --> UpdateStatus1[Update Status: 'processing']
    
    UpdateStatus1 --> ExtractText[Extract Text from Document]
    ExtractText --> AnalyzeContent[Analyze Content with AI]
    
    AnalyzeContent --> IdentifyType[Identify Document Type]
    IdentifyType --> ExtractKeyPoints[Extract Key Points]
    ExtractKeyPoints --> AssessRisk[Assess Risk Level]
    AssessRisk --> GenerateSuggestions[Generate Suggestions]
    GenerateSuggestions --> CreateSummary[Create Summary]
    
    CreateSummary --> SaveAnalysis[Save Analysis Results to DB]
    SaveAnalysis --> UpdateStatus2[Update Status: 'completed']
    
    UpdateStatus2 --> NotifyUser[Notify User]
    NotifyUser --> DisplayResults[Display Analysis Results]
    
    DisplayResults --> UserOptions{User Action}
    UserOptions -->|Download| DownloadDoc[Download Document]
    UserOptions -->|Share| ShareDoc[Share with Lawyer]
    UserOptions -->|Delete| DeleteDoc[Delete Document]
    UserOptions -->|View More| ShowDetails[Show Detailed Analysis]
    
    DownloadDoc --> End
    ShareDoc --> End
    DeleteDoc --> End
    ShowDetails --> End([End])
```

### Template Management Flow

```mermaid
flowchart TD
    Start([Access Templates]) --> UserRole{User Role?}
    
    UserRole -->|User| ViewTemplates[View Available Templates]
    UserRole -->|Admin| ManageTemplates[Manage Templates]
    
    ViewTemplates --> FilterCategory{Filter by Category?}
    FilterCategory -->|Yes| ApplyFilter[Apply Category Filter]
    FilterCategory -->|No| ShowAll[Show All Templates]
    
    ApplyFilter --> ShowFiltered[Show Filtered Templates]
    ShowAll --> ShowFiltered
    
    ShowFiltered --> SelectTemplate[User Selects Template]
    SelectTemplate --> ShowDetails[Show Template Details]
    
    ShowDetails --> UserAction{User Action}
    UserAction -->|Preview| PreviewTemplate[Preview Content]
    UserAction -->|Download| DownloadTemplate[Download Template]
    UserAction -->|Fill Form| FillTemplate[Fill Template Fields]
    
    PreviewTemplate --> UserAction
    
    DownloadTemplate --> IncrementCount[Increment Download Counter]
    IncrementCount --> GenerateDoc[Generate Document]
    GenerateDoc --> SaveUserDoc[Save to User Documents]
    SaveUserDoc --> End([End])
    
    FillTemplate --> ValidateFields{All Required Fields?}
    ValidateFields -->|No| ShowFieldError[Show Missing Fields]
    ShowFieldError --> FillTemplate
    ValidateFields -->|Yes| GenerateCustomDoc[Generate Custom Document]
    GenerateCustomDoc --> SaveUserDoc
    
    ManageTemplates --> AdminOptions{Admin Action}
    AdminOptions -->|Create| CreateNew[Create New Template]
    AdminOptions -->|Edit| EditExisting[Edit Existing Template]
    AdminOptions -->|Delete| DeleteTemplate[Delete Template]
    AdminOptions -->|Upload| UploadTemplate[Upload Template File]
    
    CreateNew --> EnterDetails[Enter Template Details]
    EnterDetails --> DefineFields[Define Dynamic Fields]
    DefineFields --> SaveTemplate[Save Template to DB]
    SaveTemplate --> End
    
    EditExisting --> LoadTemplate[Load Template Data]
    LoadTemplate --> ModifyTemplate[Modify Template]
    ModifyTemplate --> SaveTemplate
    
    DeleteTemplate --> ConfirmDelete{Confirm?}
    ConfirmDelete -->|Yes| RemoveTemplate[Remove from DB]
    ConfirmDelete -->|No| ManageTemplates
    RemoveTemplate --> End
    
    UploadTemplate --> ValidateUpload{Valid File?}
    ValidateUpload -->|No| UploadError[Show Error]
    UploadError --> ManageTemplates
    ValidateUpload -->|Yes| ProcessUpload[Process File]
    ProcessUpload --> SaveTemplate
```

---

## 6. Sequence Diagrams

### User Authentication Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant M as Auth Middleware
    participant DB as MongoDB
    participant J as JWT Service

    U->>F: Enter credentials
    F->>F: Validate input
    F->>B: POST /api/auth/login
    B->>M: Check rate limit
    M->>B: Allow request
    B->>DB: Find user by email
    DB-->>B: Return user data
    B->>B: Compare password hash
    alt Password Valid
        B->>J: Generate JWT token
        J-->>B: Return token
        B->>DB: Update lastLogin
        B->>B: Set HTTP-only cookie
        B-->>F: Success + token + user data
        F->>F: Store user in context
        F-->>U: Redirect to dashboard
    else Password Invalid
        B-->>F: 401 Unauthorized
        F-->>U: Show error message
    end
```

### AI Chat Query Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend (Express)
    participant CB as Chatbot Backend (FastAPI)
    participant E as Embedding Model
    participant P as Pinecone Vector DB
    participant L as LLM (Gemini)
    participant DB as MongoDB

    U->>F: Type question
    F->>CB: POST /ask (question, userId)
    CB->>CB: Track analytics
    CB->>E: Embed query
    E-->>CB: Return embedding vector
    CB->>P: Query vector DB (top_k=5)
    P-->>CB: Return matching documents
    CB->>CB: Calculate confidence
    CB->>L: Query with context
    L-->>CB: Return AI response
    CB->>DB: Store query & response
    DB-->>CB: Confirm stored
    CB->>DB: Track success analytics
    CB-->>F: Return answer
    F-->>U: Display response
    
    opt User provides feedback
        U->>F: Click helpful/not helpful
        F->>CB: POST /feedback
        CB->>DB: Update query feedback
        DB-->>CB: Confirm updated
        CB-->>F: Success
        F-->>U: Thank you message
    end
```

### Document Upload & Analysis Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant FS as File System
    participant DB as MongoDB
    participant AI as AI Service
    participant WS as WebSocket

    U->>F: Select & upload file
    F->>F: Validate file (type, size)
    F->>B: POST /api/documents/upload (multipart)
    B->>B: Auth middleware check
    B->>FS: Save file to uploads/
    FS-->>B: File path
    B->>DB: Create document record (status: pending)
    DB-->>B: Document ID
    B-->>F: Upload success + document ID
    F-->>U: Show upload success
    
    B->>AI: Analyze document (async)
    B->>DB: Update status: processing
    AI->>AI: Extract text
    AI->>AI: Analyze content
    AI->>AI: Identify type & risks
    AI->>AI: Generate suggestions
    AI-->>B: Analysis results
    B->>DB: Update document with analysis (status: completed)
    
    alt WebSocket connected
        B->>WS: Emit analysis complete
        WS-->>F: Notify user
        F-->>U: Show notification
    else Polling
        F->>B: GET /api/documents/:id (periodic)
        B->>DB: Get document status
        DB-->>B: Document data
        B-->>F: Document with analysis
        F-->>U: Update UI with results
    end
```

### Template Download Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    participant FS as File System

    U->>F: Browse templates
    F->>B: GET /api/templates?category=contract
    B->>DB: Find templates by category
    DB-->>B: Return templates
    B-->>F: Template list
    F-->>U: Display templates
    
    U->>F: Click template
    F->>B: GET /api/templates/:id
    B->>DB: Find template by ID
    DB-->>B: Template details
    B-->>F: Template data
    F-->>U: Show template preview
    
    alt Fill Dynamic Fields
        U->>F: Enter field values
        F->>F: Validate required fields
        F->>B: POST /api/templates/:id/generate
        B->>B: Replace placeholders
        B->>FS: Generate custom document
        FS-->>B: Generated file path
    else Direct Download
        U->>F: Click download
        F->>B: GET /api/templates/:id/download
    end
    
    B->>DB: Increment download counter
    DB-->>B: Updated
    B->>FS: Read file
    FS-->>B: File buffer
    B-->>F: Send file (Content-Disposition: attachment)
    F-->>U: Download file
```

### Admin - Lawyer Verification Sequence

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    participant E as Email Service

    A->>F: Login as admin
    F->>B: POST /api/auth/login
    B-->>F: Success (role: admin)
    F-->>A: Show admin dashboard
    
    A->>F: View pending lawyers
    F->>B: GET /api/admin/lawyers?status=pending
    B->>B: Check admin role
    B->>DB: Find lawyers (verified: false)
    DB-->>B: Pending lawyers list
    B-->>F: Lawyers data
    F-->>A: Display pending list
    
    A->>F: Select lawyer to review
    F->>B: GET /api/admin/lawyers/:id
    B->>DB: Get lawyer details
    DB-->>B: Lawyer + user data
    B-->>F: Full lawyer profile
    F-->>A: Show lawyer details
    
    alt Approve Lawyer
        A->>F: Click approve
        F->>B: PUT /api/admin/lawyers/:id/verify
        B->>DB: Update lawyer (verified: true)
        B->>DB: Update user role to 'lawyer'
        DB-->>B: Updated
        B->>E: Send approval email
        E-->>B: Email sent
        B-->>F: Success message
        F-->>A: Show success notification
    else Reject Lawyer
        A->>F: Enter rejection reason
        F->>B: PUT /api/admin/lawyers/:id/reject
        B->>DB: Update verification notes
        B->>E: Send rejection email
        E-->>B: Email sent
        B-->>F: Success
        F-->>A: Lawyer rejected
    end
```

---

## Technology Stack

### Frontend
- **Framework**: React.js with TypeScript
- **State Management**: React Context API
- **Routing**: React Router
- **HTTP Client**: Axios
- **UI Components**: Custom components
- **Styling**: CSS/Styled Components

### Backend (Express)
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer
- **WebSocket**: Socket.io

### Backend (FastAPI - AI Service)
- **Framework**: FastAPI (Python)
- **LLM**: Google Gemini AI
- **Embeddings**: HuggingFace Models
- **Vector Store**: Pinecone
- **Document Processing**: LangChain
- **Async Processing**: Python asyncio

### Database
- **Primary DB**: MongoDB with Mongoose
- **Collections**: 
  - Users
  - Lawyers
  - Chats
  - Templates
  - Documents
  - Legal Queries
  - Analytics

### File Storage
- **Strategy**: File System (local storage)
- **Directories**:
  - `/uploads/avatars`
  - `/uploads/documents`
  - `/uploads/templates`
  - `/uploads/temp`

### External Services
- **Vector Database**: Pinecone Cloud
- **AI Model**: Google Gemini API
- **Email**: Email service (configurable)

---

## Key Features

1. **Multi-Role Authentication System**
   - User, Lawyer, and Admin roles
   - JWT-based authentication
   - Role-based access control

2. **AI-Powered Legal Assistant**
   - Natural language query processing
   - Vector-based document search
   - Context-aware responses
   - Confidence scoring

3. **Document Management**
   - Upload and storage
   - AI-powered analysis
   - Risk assessment
   - Key point extraction

4. **Template System**
   - Category-based organization
   - Dynamic field filling
   - Download tracking
   - Admin management

5. **Chat System**
   - AI chat for legal queries
   - Lawyer consultation
   - Message history
   - File attachments

6. **Admin Dashboard**
   - User management
   - Lawyer verification
   - Analytics and reporting
   - System configuration

7. **Analytics & Monitoring**
   - Query tracking
   - User behavior analytics
   - System health monitoring
   - Performance metrics

---

## Security Features

- **Authentication**: JWT tokens with HTTP-only cookies
- **Password Security**: bcrypt hashing with salt
- **Rate Limiting**: Request throttling per IP
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **Input Validation**: Request data validation
- **File Upload Security**: File type and size validation
- **Role-Based Access**: Middleware-based authorization

---

## Deployment Considerations

### Backend (Express)
- Port: 5000
- Environment: development/production
- Database: MongoDB connection string
- JWT Secret: Secure random string
- File Storage: Persistent volume

### Chatbot Backend (FastAPI)
- Port: 8000
- Python: 3.8+
- Dependencies: requirements.txt
- API Keys: Pinecone, Google Gemini
- Model Cache: In-memory caching

### Frontend
- Port: 3000
- Build: Production-optimized bundle
- Environment Variables: API endpoints
- Static Assets: CDN/Server

### Database
- MongoDB Atlas or self-hosted
- Replica set for production
- Regular backups
- Index optimization

---

## API Endpoints Summary

### Authentication (`/api/auth`)
- POST `/register` - User registration
- POST `/login` - User login
- POST `/logout` - User logout
- GET `/profile` - Get user profile
- PUT `/profile` - Update profile

### Admin (`/api/admin`)
- GET `/users` - List users
- GET `/lawyers` - List lawyers
- PUT `/lawyers/:id/verify` - Verify lawyer
- DELETE `/users/:id` - Delete user
- GET `/stats` - System statistics

### Chat (`/api/chat`)
- GET `/` - Get user chats
- POST `/` - Create new chat
- GET `/:id` - Get chat details
- POST `/:id/messages` - Send message

### Templates (`/api/templates`)
- GET `/` - List templates
- GET `/:id` - Get template
- POST `/` - Create template (admin)
- PUT `/:id` - Update template (admin)
- DELETE `/:id` - Delete template (admin)
- GET `/:id/download` - Download template

### AI Chatbot (`/ask`)
- POST `/` - Ask question
- POST `/feedback` - Submit feedback
- GET `/history/:userId` - Query history
- GET `/analytics` - Analytics summary

---

## Performance Optimizations

1. **Model Caching**: Pre-loaded AI models for faster queries
2. **Vector Search**: Efficient similarity search with Pinecone
3. **Connection Pooling**: MongoDB connection optimization
4. **Compression**: Response compression middleware
5. **Rate Limiting**: Prevents abuse and overload
6. **Lazy Loading**: On-demand resource loading
7. **Index Optimization**: Database query performance

---

## Future Enhancements

1. Real-time collaboration features
2. Video consultation integration
3. Payment gateway for consultations
4. Advanced analytics dashboard
5. Mobile application
6. Multi-language support
7. Document comparison tool
8. Case law database integration

---

*Generated for JURY-AI Legal Assistant Platform*
*Date: November 9, 2025*
