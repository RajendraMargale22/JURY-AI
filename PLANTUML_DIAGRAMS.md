# JURY-AI PlantUML Diagrams

This document contains all PlantUML code for the JURY-AI Legal Assistant Platform diagrams.

## Table of Contents
1. [UML Class Diagram](#1-uml-class-diagram)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Data Flow Diagram](#4-data-flow-diagram)
5. [Flowcharts](#5-flowcharts)
6. [Sequence Diagrams](#6-sequence-diagrams)

---

## 1. UML Class Diagram

```plantuml
@startuml JURY-AI-Class-Diagram

skinparam classAttributeIconSize 0
skinparam backgroundColor #FFFFFF
skinparam class {
    BackgroundColor LightBlue
    BorderColor DarkBlue
    ArrowColor DarkBlue
}

class User {
    - _id: ObjectId
    - name: String
    - email: String
    - password: String
    - role: String [user|lawyer|admin]
    - avatar: String
    - isVerified: Boolean
    - isActive: Boolean
    - lastLogin: Date
    - profile: Profile
    - verificationToken: String
    - resetPasswordToken: String
    - resetPasswordExpire: Date
    - createdAt: Date
    - updatedAt: Date
    --
    + comparePassword(password: String): Boolean
    + toJSON(): Object
}

class Profile {
    - phone: String
    - address: String
    - bio: String
}

class Lawyer {
    - _id: ObjectId
    - userId: String <<FK>>
    - specialization: String[]
    - experience: Number
    - barId: String <<UK>>
    - verified: Boolean
    - rating: Number
    - totalCases: Number
    - completedCases: Number
    - documents: Documents
    - availability: Availability
    - consultationFee: Number
    - createdAt: Date
    - updatedAt: Date
}

class Documents {
    - license: String
    - certificates: String[]
}

class Availability {
    - hours: String
    - days: String[]
}

class Chat {
    - _id: ObjectId
    - userId: String <<FK>>
    - lawyerId: String <<FK>>
    - type: String [ai|lawyer]
    - title: String
    - messages: Message[]
    - status: String [active|closed|pending]
    - category: String
    - createdAt: Date
    - updatedAt: Date
}

class Message {
    - sender: String [user|ai|lawyer]
    - message: String
    - timestamp: Date
    - attachments: String[]
}

class Template {
    - _id: ObjectId
    - title: String
    - description: String
    - category: String
    - content: String
    - fields: Field[]
    - downloads: Number
    - createdBy: ObjectId <<FK>>
    - isActive: Boolean
    - filePath: String
    - fileName: String
    - fileSize: Number
    - mimeType: String
    - createdAt: Date
    - updatedAt: Date
}

class Field {
    - name: String
    - type: String [text|number|date|select]
    - required: Boolean
    - options: String[]
}

class Document {
    - _id: ObjectId
    - userId: String <<FK>>
    - filename: String
    - originalName: String
    - fileType: String
    - fileSize: Number
    - filePath: String
    - analysisStatus: String [pending|processing|completed|failed]
    - analysisResult: AnalysisResult
    - createdAt: Date
    - updatedAt: Date
}

class AnalysisResult {
    - documentType: String
    - keyPoints: String[]
    - riskLevel: String [low|medium|high]
    - suggestions: String[]
    - summary: String
}

class LegalQuery {
    - _id: ObjectId
    - userId: String
    - query: String
    - aiResponse: String
    - confidence: Number
    - sources: Source[]
    - feedback: String
    - timestamp: Date
}

class Source {
    - text: String
    - metadata: Object
}

class Analytics {
    - _id: ObjectId
    - userId: String <<FK>>
    - eventType: String
    - eventData: Object
    - userAgent: String
    - ipAddress: String
    - timestamp: Date
}

' Relationships
User "1" *-- "1" Profile : contains
User "1" o-- "0..1" Lawyer : extends
Lawyer "1" *-- "1" Documents : has
Lawyer "1" *-- "1" Availability : has
User "1" -- "*" Chat : creates
User "1" -- "*" Template : creates
User "1" -- "*" Document : uploads
User "1" -- "*" LegalQuery : makes
User "1" -- "*" Analytics : generates
Chat "1" *-- "*" Message : contains
Template "1" *-- "*" Field : contains
Document "1" o-- "0..1" AnalysisResult : has
LegalQuery "1" *-- "*" Source : references

@enduml
```

---

## 2. Entity Relationship Diagram

```plantuml
@startuml JURY-AI-ERD

!define table(x) class x << (T,#FFAAAA) >>
!define primary_key(x) <u>x</u>
!define foreign_key(x) <i>x</i>

skinparam backgroundColor #FFFFFF

table(USER) {
    primary_key(_id): ObjectId
    name: String
    email: String {unique}
    password: String
    role: String
    avatar: String
    isVerified: Boolean
    isActive: Boolean
    lastLogin: Date
    profile: Object
    createdAt: Date
    updatedAt: Date
}

table(LAWYER) {
    primary_key(_id): ObjectId
    foreign_key(userId): String
    specialization: Array<String>
    experience: Number
    barId: String {unique}
    verified: Boolean
    rating: Number
    totalCases: Number
    completedCases: Number
    documents: Object
    availability: Object
    consultationFee: Number
    createdAt: Date
    updatedAt: Date
}

table(CHAT) {
    primary_key(_id): ObjectId
    foreign_key(userId): String
    foreign_key(lawyerId): String
    type: String
    title: String
    messages: Array<Message>
    status: String
    category: String
    createdAt: Date
    updatedAt: Date
}

table(TEMPLATE) {
    primary_key(_id): ObjectId
    title: String
    description: String
    category: String
    content: String
    fields: Array<Field>
    downloads: Number
    foreign_key(createdBy): ObjectId
    isActive: Boolean
    filePath: String
    fileName: String
    fileSize: Number
    mimeType: String
    createdAt: Date
    updatedAt: Date
}

table(DOCUMENT) {
    primary_key(_id): ObjectId
    foreign_key(userId): String
    filename: String
    originalName: String
    fileType: String
    fileSize: Number
    filePath: String
    analysisStatus: String
    analysisResult: Object
    createdAt: Date
    updatedAt: Date
}

table(LEGAL_QUERY) {
    primary_key(_id): ObjectId
    userId: String
    query: String
    aiResponse: String
    confidence: Number
    sources: Array<Source>
    feedback: String
    timestamp: Date
}

table(ANALYTICS) {
    primary_key(_id): ObjectId
    foreign_key(userId): String
    eventType: String
    eventData: Object
    userAgent: String
    ipAddress: String
    timestamp: Date
}

' Relationships
USER ||--o{ CHAT : "creates"
USER ||--o{ TEMPLATE : "creates"
USER ||--o{ DOCUMENT : "uploads"
USER ||--o{ LEGAL_QUERY : "makes"
USER ||--o{ ANALYTICS : "generates"
USER ||--o| LAWYER : "can be"
LAWYER ||--o{ CHAT : "consults in"

@enduml
```

---

## 3. System Architecture Diagram

```plantuml
@startuml JURY-AI-Architecture

!define RECTANGLE class

skinparam backgroundColor #FFFFFF
skinparam component {
    BackgroundColor LightBlue
    BorderColor DarkBlue
}
skinparam database {
    BackgroundColor LightGreen
    BorderColor DarkGreen
}
skinparam cloud {
    BackgroundColor LightYellow
    BorderColor Orange
}

package "Client Layer" {
    [React Frontend\nPort: 3000] as Frontend
    [User Interface] as UI
    [Admin Dashboard] as AdminUI
    [Lawyer Portal] as LawyerUI
}

package "API Gateway Layer" {
    [Express.js Backend\nPort: 5000] as Backend
    [Authentication\nMiddleware] as AuthMW
    [Rate Limiting] as RateLimit
    [CORS Middleware] as CORS
    [Error Handler] as ErrorHandler
}

package "Application Services" {
    [Auth Service] as AuthSvc
    [Chat Service] as ChatSvc
    [Template Service] as TemplateSvc
    [Admin Service] as AdminSvc
    [Document Service] as DocSvc
}

package "AI/ML Services" {
    [FastAPI Backend\nPort: 8000] as AIBackend
    [Google Gemini\nLLM] as Gemini
    [Pinecone\nVector DB] as Pinecone
    [HuggingFace\nEmbeddings] as HF
    [Document\nProcessor] as DocProc
}

database "MongoDB\nPrimary Database" {
    folder "Collections" {
        [Users] as UsersDB
        [Lawyers] as LawyersDB
        [Chats] as ChatsDB
        [Templates] as TemplatesDB
        [Documents] as DocumentsDB
        [Legal Queries] as QueriesDB
        [Analytics] as AnalyticsDB
    }
}

cloud "External Services" {
    [JWT Service] as JWT
    [Email Service] as Email
    [Pinecone Cloud] as PineconeCloud
}

folder "File Storage" {
    [Uploaded\nDocuments] as UploadDocs
    [User Avatars] as Avatars
    [Templates] as TemplateFiles
    [Temp Files] as TempFiles
}

' Client to API Gateway
Frontend --> Backend
UI --> Frontend
AdminUI --> Frontend
LawyerUI --> Frontend

' API Gateway to Middleware
Backend --> AuthMW
Backend --> RateLimit
Backend --> CORS
Backend --> ErrorHandler

' Middleware to Services
AuthMW --> AuthSvc
Backend --> ChatSvc
Backend --> TemplateSvc
Backend --> AdminSvc
Backend --> DocSvc

' Services to Database
AuthSvc --> UsersDB
ChatSvc --> ChatsDB
TemplateSvc --> TemplatesDB
AdminSvc --> UsersDB
AdminSvc --> LawyersDB
DocSvc --> DocumentsDB

' AI Services
Frontend --> AIBackend
AIBackend --> Gemini
AIBackend --> Pinecone
AIBackend --> HF
AIBackend --> DocProc
AIBackend --> QueriesDB
AIBackend --> AnalyticsDB
Pinecone --> PineconeCloud

' External Services
AuthSvc --> JWT
AuthSvc --> Email

' File Storage
DocSvc --> UploadDocs
AuthSvc --> Avatars
TemplateSvc --> TemplateFiles
DocProc --> TempFiles

@enduml
```

---

## 4. Data Flow Diagram

### Level 0 - Context Diagram

```plantuml
@startuml JURY-AI-DFD-Level0

skinparam backgroundColor #FFFFFF

actor User
actor Lawyer
actor Admin
rectangle "JURY-AI System" as System
database "Database" as DB
cloud "AI Service" as AI
cloud "External\nServices" as External

User --> System : Authentication\nLegal Queries\nDocument Upload\nTemplate Requests
Lawyer --> System : Consultation\nProfile Management
Admin --> System : User Management\nSystem Configuration

System --> User : Responses\nTemplates\nAnalysis Results
System --> Lawyer : Notifications\nChat Messages
System --> Admin : Reports\nAnalytics

System <--> DB : Data Storage\n& Retrieval
System <--> AI : AI Processing\nVector Search
System <--> External : Email\nJWT\nFile Storage

@enduml
```

### Level 1 - Detailed DFD

```plantuml
@startuml JURY-AI-DFD-Level1

skinparam backgroundColor #FFFFFF

actor User
actor Admin

rectangle "1.0\nAuthentication" as P1
rectangle "2.0\nAI Chat" as P2
rectangle "3.0\nDocument\nProcessing" as P3
rectangle "4.0\nTemplate\nManagement" as P4
rectangle "5.0\nLawyer\nConsultation" as P5
rectangle "6.0\nUser\nManagement" as P6
rectangle "7.0\nLawyer\nVerification" as P7
rectangle "8.0\nAnalytics" as P8

database "D1: Users" as D1
database "D2: Lawyers" as D2
database "D3: Chats" as D3
database "D4: Templates" as D4
database "D5: Documents" as D5
database "D6: Legal Queries" as D6
database "D7: Analytics" as D7

cloud "JWT Service" as JWT
cloud "AI/ML Engine" as AI
cloud "Vector Database" as Vector
cloud "Email Service" as Email

' User flows
User --> P1 : Login/Register
P1 <--> D1 : User Data
P1 --> JWT : Generate Token
P1 --> Email : Verification

User --> P2 : Ask Question
P2 --> D6 : Store Query
P2 <--> AI : AI Processing
P2 <--> Vector : Vector Search
P2 --> D7 : Track Analytics

User --> P3 : Upload Document
P3 --> D5 : Store Document
P3 --> AI : Analyze

User --> P4 : Browse/Download
P4 <--> D4 : Template Data

User --> P5 : Chat Request
P5 <--> D3 : Chat Data
P5 <--> D2 : Lawyer Info

' Admin flows
Admin --> P6 : Manage Users
P6 <--> D1 : User Data

Admin --> P7 : Verify Lawyers
P7 <--> D2 : Lawyer Data

Admin --> P8 : View Analytics
P8 <--> D7 : Analytics Data

@enduml
```

---

## 5. Flowcharts

### 5.1 User Authentication Flow

```plantuml
@startuml Authentication-Flow

skinparam backgroundColor #FFFFFF
skinparam activityBackgroundColor LightBlue
skinparam activityBorderColor DarkBlue

start

:User Visits Platform;

if (Authenticated?) then (yes)
    :Show Home Page;
    
    if (User Role?) then (User)
        :User Dashboard;
    else (Lawyer)
        :Lawyer Dashboard;
    else (Admin)
        :Admin Dashboard;
    endif
    
else (no)
    :Show Login/Register;
    
    if (User Choice?) then (Login)
        :Enter Email & Password;
        
        if (Valid Credentials?) then (no)
            :Show Error Message;
            stop
        else (yes)
            :Generate JWT Token;
        endif
        
    else (Register)
        :Enter Name, Email,\nPassword, Role;
        
        if (Valid Data?) then (no)
            :Show Validation Errors;
            stop
        else (yes)
            :Create User in Database;
            :Generate JWT Token;
        endif
    endif
    
    :Set HTTP-Only Cookie;
    :Update Last Login;
    :Redirect to Dashboard;
endif

stop

@enduml
```

### 5.2 AI Chat Query Flow

```plantuml
@startuml AI-Chat-Flow

skinparam backgroundColor #FFFFFF
skinparam activityBackgroundColor LightGreen
skinparam activityBorderColor DarkGreen

start

:User Asks Question;

if (Valid Input?) then (no)
    :Show Error Message;
    stop
else (yes)
    if (File Attached?) then (yes)
        :Store File Metadata;
    endif
    
    :Embed Query with AI Model;
    :Search Pinecone Vector DB;
    :Retrieve Top 5 Matches;
    :Calculate Confidence Score;
    :Create Document Objects;
    :Initialize LLM Chain;
    :Query Gemini AI;
    :Process AI Response;
    
    if (MongoDB Available?) then (yes)
        :Save Query & Response;
        :Track Analytics Event;
    else (no)
        :Skip DB Storage;
    endif
    
    :Format JSON Response;
    :Return Answer to User;
    
    if (User Provides Feedback?) then (yes)
        :Update Query Feedback;
    endif
endif

stop

@enduml
```

### 5.3 Document Upload & Analysis Flow

```plantuml
@startuml Document-Upload-Flow

skinparam backgroundColor #FFFFFF
skinparam activityBackgroundColor LightYellow
skinparam activityBorderColor Orange

start

:User Uploads Document;

if (Valid File?) then (no)
    :Show Error:\nInvalid File Type/Size;
    stop
else (yes)
    :Save File to Server;
    :Create Document Record in DB;
    :Set Status: 'pending';
    :Start Document Analysis;
    :Update Status: 'processing';
    
    fork
        :Extract Text from Document;
    fork again
        :Analyze Content with AI;
    end fork
    
    :Identify Document Type;
    :Extract Key Points;
    :Assess Risk Level;
    :Generate Suggestions;
    :Create Summary;
    :Save Analysis Results to DB;
    :Update Status: 'completed';
    :Notify User;
    :Display Analysis Results;
    
    if (User Action?) then (Download)
        :Download Document;
    else (Share)
        :Share with Lawyer;
    else (Delete)
        :Delete Document;
    else (View More)
        :Show Detailed Analysis;
    endif
endif

stop

@enduml
```

### 5.4 Template Management Flow

```plantuml
@startuml Template-Management-Flow

skinparam backgroundColor #FFFFFF
skinparam activityBackgroundColor LightPink
skinparam activityBorderColor DarkRed

start

:Access Templates;

if (User Role?) then (User)
    :View Available Templates;
    
    if (Filter by Category?) then (yes)
        :Apply Category Filter;
        :Show Filtered Templates;
    else (no)
        :Show All Templates;
    endif
    
    :User Selects Template;
    :Show Template Details;
    
    if (User Action?) then (Preview)
        :Preview Content;
    else (Download)
        :Download Template;
        :Increment Download Counter;
        :Generate Document;
        :Save to User Documents;
    else (Fill Form)
        if (All Required Fields?) then (no)
            :Show Missing Fields;
        else (yes)
            :Generate Custom Document;
            :Save to User Documents;
        endif
    endif
    
else (Admin)
    :Manage Templates;
    
    if (Admin Action?) then (Create)
        :Enter Template Details;
        :Define Dynamic Fields;
        :Save Template to DB;
    else (Edit)
        :Load Template Data;
        :Modify Template;
        :Save Template to DB;
    else (Delete)
        if (Confirm?) then (yes)
            :Remove from DB;
        endif
    else (Upload)
        if (Valid File?) then (yes)
            :Process File;
            :Save Template to DB;
        else (no)
            :Show Error;
        endif
    endif
endif

stop

@enduml
```

---

## 6. Sequence Diagrams

### 6.1 User Authentication Sequence

```plantuml
@startuml Authentication-Sequence

skinparam backgroundColor #FFFFFF
skinparam sequenceArrowColor DarkBlue
skinparam sequenceLifeLineBorderColor DarkBlue

actor User
participant "Frontend" as F
participant "Backend" as B
participant "Auth\nMiddleware" as M
participant "MongoDB" as DB
participant "JWT\nService" as JWT

User -> F : Enter credentials
activate F
F -> F : Validate input
F -> B : POST /api/auth/login
activate B

B -> M : Check rate limit
activate M
M -> B : Allow request
deactivate M

B -> DB : Find user by email
activate DB
DB --> B : Return user data
deactivate DB

B -> B : Compare password hash

alt Password Valid
    B -> JWT : Generate JWT token
    activate JWT
    JWT --> B : Return token
    deactivate JWT
    
    B -> DB : Update lastLogin
    B -> B : Set HTTP-only cookie
    B --> F : Success + token + user data
    F -> F : Store user in context
    F --> User : Redirect to dashboard
else Password Invalid
    B --> F : 401 Unauthorized
    F --> User : Show error message
end

deactivate B
deactivate F

@enduml
```

### 6.2 AI Chat Query Sequence

```plantuml
@startuml AI-Chat-Sequence

skinparam backgroundColor #FFFFFF
skinparam sequenceArrowColor DarkGreen
skinparam sequenceLifeLineBorderColor DarkGreen

actor User
participant "Frontend" as F
participant "Express\nBackend" as B
participant "FastAPI\nChatbot" as CB
participant "Embedding\nModel" as E
participant "Pinecone\nVector DB" as P
participant "Gemini\nLLM" as L
participant "MongoDB" as DB

User -> F : Type question
activate F
F -> CB : POST /ask\n(question, userId)
activate CB

CB -> CB : Track analytics
CB -> E : Embed query
activate E
E --> CB : Return embedding vector
deactivate E

CB -> P : Query vector DB\n(top_k=5)
activate P
P --> CB : Return matching documents
deactivate P

CB -> CB : Calculate confidence
CB -> L : Query with context
activate L
L --> CB : Return AI response
deactivate L

CB -> DB : Store query & response
activate DB
DB --> CB : Confirm stored
deactivate DB

CB -> DB : Track success analytics
CB --> F : Return answer
F --> User : Display response

opt User provides feedback
    User -> F : Click helpful/not helpful
    F -> CB : POST /feedback
    CB -> DB : Update query feedback
    DB --> CB : Confirm updated
    CB --> F : Success
    F --> User : Thank you message
end

deactivate CB
deactivate F

@enduml
```

### 6.3 Document Upload & Analysis Sequence

```plantuml
@startuml Document-Upload-Sequence

skinparam backgroundColor #FFFFFF
skinparam sequenceArrowColor Orange
skinparam sequenceLifeLineBorderColor Orange

actor User
participant "Frontend" as F
participant "Backend" as B
participant "File\nSystem" as FS
participant "MongoDB" as DB
participant "AI\nService" as AI
participant "WebSocket" as WS

User -> F : Select & upload file
activate F
F -> F : Validate file\n(type, size)
F -> B : POST /api/documents/upload\n(multipart)
activate B

B -> B : Auth middleware check
B -> FS : Save file to uploads/
activate FS
FS --> B : File path
deactivate FS

B -> DB : Create document record\n(status: pending)
activate DB
DB --> B : Document ID
deactivate DB

B --> F : Upload success + document ID
F --> User : Show upload success

B -> AI : Analyze document (async)
activate AI
B -> DB : Update status: processing

AI -> AI : Extract text
AI -> AI : Analyze content
AI -> AI : Identify type & risks
AI -> AI : Generate suggestions
AI --> B : Analysis results
deactivate AI

B -> DB : Update document with analysis\n(status: completed)

alt WebSocket connected
    B -> WS : Emit analysis complete
    activate WS
    WS --> F : Notify user
    deactivate WS
    F --> User : Show notification
else Polling
    loop Periodic check
        F -> B : GET /api/documents/:id
        B -> DB : Get document status
        DB --> B : Document data
        B --> F : Document with analysis
        F --> User : Update UI with results
    end
end

deactivate B
deactivate F

@enduml
```

### 6.4 Template Download Sequence

```plantuml
@startuml Template-Download-Sequence

skinparam backgroundColor #FFFFFF
skinparam sequenceArrowColor Purple
skinparam sequenceLifeLineBorderColor Purple

actor User
participant "Frontend" as F
participant "Backend" as B
participant "MongoDB" as DB
participant "File\nSystem" as FS

User -> F : Browse templates
activate F
F -> B : GET /api/templates\n?category=contract
activate B

B -> DB : Find templates by category
activate DB
DB --> B : Return templates
deactivate DB

B --> F : Template list
F --> User : Display templates

User -> F : Click template
F -> B : GET /api/templates/:id
B -> DB : Find template by ID
activate DB
DB --> B : Template details
deactivate DB

B --> F : Template data
F --> User : Show template preview

alt Fill Dynamic Fields
    User -> F : Enter field values
    F -> F : Validate required fields
    F -> B : POST /api/templates/:id/generate
    B -> B : Replace placeholders
    B -> FS : Generate custom document
    activate FS
    FS --> B : Generated file path
    deactivate FS
else Direct Download
    User -> F : Click download
    F -> B : GET /api/templates/:id/download
end

B -> DB : Increment download counter
activate DB
DB --> B : Updated
deactivate DB

B -> FS : Read file
activate FS
FS --> B : File buffer
deactivate FS

B --> F : Send file\n(Content-Disposition: attachment)
F --> User : Download file

deactivate B
deactivate F

@enduml
```

### 6.5 Admin Lawyer Verification Sequence

```plantuml
@startuml Lawyer-Verification-Sequence

skinparam backgroundColor #FFFFFF
skinparam sequenceArrowColor Red
skinparam sequenceLifeLineBorderColor Red

actor Admin
participant "Frontend" as F
participant "Backend" as B
participant "MongoDB" as DB
participant "Email\nService" as E

Admin -> F : Login as admin
activate F
F -> B : POST /api/auth/login
activate B
B --> F : Success (role: admin)
F --> Admin : Show admin dashboard

Admin -> F : View pending lawyers
F -> B : GET /api/admin/lawyers\n?status=pending
B -> B : Check admin role
B -> DB : Find lawyers\n(verified: false)
activate DB
DB --> B : Pending lawyers list
deactivate DB

B --> F : Lawyers data
F --> Admin : Display pending list

Admin -> F : Select lawyer to review
F -> B : GET /api/admin/lawyers/:id
B -> DB : Get lawyer details
activate DB
DB --> B : Lawyer + user data
deactivate DB

B --> F : Full lawyer profile
F --> Admin : Show lawyer details

alt Approve Lawyer
    Admin -> F : Click approve
    F -> B : PUT /api/admin/lawyers/:id/verify
    
    B -> DB : Update lawyer\n(verified: true)
    activate DB
    B -> DB : Update user role to 'lawyer'
    DB --> B : Updated
    deactivate DB
    
    B -> E : Send approval email
    activate E
    E --> B : Email sent
    deactivate E
    
    B --> F : Success message
    F --> Admin : Show success notification
    
else Reject Lawyer
    Admin -> F : Enter rejection reason
    F -> B : PUT /api/admin/lawyers/:id/reject
    
    B -> DB : Update verification notes
    activate DB
    DB --> B : Updated
    deactivate DB
    
    B -> E : Send rejection email
    activate E
    E --> B : Email sent
    deactivate E
    
    B --> F : Success
    F --> Admin : Lawyer rejected
end

deactivate B
deactivate F

@enduml
```

---

## How to Use These Diagrams

### Online Tools:
1. **PlantUML Online Server**: http://www.plantuml.com/plantuml/uml/
2. **PlantText**: https://www.planttext.com/
3. **Kroki**: https://kroki.io/

### VS Code:
1. Install "PlantUML" extension
2. Create `.puml` files with the code above
3. Press `Alt+D` to preview

### Command Line:
```bash
# Install PlantUML
sudo apt-get install plantuml

# Generate PNG
plantuml diagram.puml

# Generate SVG
plantuml -tsvg diagram.puml
```

### Integration:
- Copy individual diagram codes into separate `.puml` files
- Generate images for documentation
- Include in README or wiki pages
- Use in presentations

---

*Generated for JURY-AI Legal Assistant Platform*
*Date: November 11, 2025*
