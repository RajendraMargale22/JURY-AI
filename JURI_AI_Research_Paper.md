# JURI AI: An AI-Powered Legal Assistance and Lawyer Appointment System

**Aditya Jare, Faizal Mistry, Rajendra Margale, Sanika Tikole**  
*Department of Artificial Intelligence and Machine Learning,*  
*PES Modern College of Engineering, Pune, India*

---

**Abstract**—Legal services in India cost ₹3,000-₹15,000 per consultation, creating accessibility barriers for millions. JURI AI is an AI-powered legal platform combining Retrieval-Augmented Generation with fine-tuned Legal-BERT for contract analysis. The system achieves 89% accuracy in legal Q&A, 84.76% in contract clause classification, and 88.7% F1-score in risk detection. A 30-user study demonstrated 92% task completion rate, 4.3/5 satisfaction, 90% cost reduction, and 68% time savings. This paper presents architecture, methodology, evaluation, and future directions for democratizing legal access.

**Index Terms**—LegalTech, Retrieval-Augmented Generation, Legal-BERT, NLP, Contract Analysis, India.

---

## I. INTRODUCTION

India faces a legal access crisis: 4.5 million pending cases, expensive consultations (₹3,000-₹15,000), and 1:1,250 lawyer-to-citizen ratio. Most Indians cannot afford quality legal services for routine matters like contract review, tenant disputes, or employment rights. JURI AI addresses this through AI-powered automation combining Retrieval-Augmented Generation for legal Q&A, fine-tuned Legal-BERT for contract analysis, and a lawyer appointment marketplace.

**Contributions**: (1) Hybrid RAG and Legal-BERT architecture achieving 89% Q&A accuracy (+27% vs standalone LLM); (2) Three-tier scalable system (React/Node.js/FastAPI) with linear scaling to 500+ concurrent users; (3) Indian law-aligned risk detection with 20+ statutory validators; (4) Comprehensive platform integrating Q&A, contracts, templates, and appointments; (5) Demonstrated 90% cost reduction and 68% time savings in user study.

## II. RELATED WORK

**Legal AI Evolution**: Early legal AI used rule-based expert systems. BERT revolutionized legal NLP with pre-training on large text corpora. Legal-BERT, trained on 12GB legal text, achieves state-of-the-art performance on contract extraction, entity recognition, and judgment prediction. However, standalone LLMs suffer from hallucination—generating plausible but factually incorrect responses—critical in legal contexts requiring precision.

**Retrieval-Augmented Generation**: RAG combines information retrieval with generative LLMs, grounding responses in retrieved documents. This mitigates hallucination and enables source attribution and knowledge updates without retraining. Vector databases enable semantic search beyond keyword matching, essential for legal terminology with context-dependent meanings.

**Existing Solutions**: LawGeex automates contract review with 94% accuracy but focuses on enterprise workflows. ROSS Intelligence provided NLP-powered legal research but shut down in 2021. DoNotPay offers consumer templates but lacks sophisticated analysis. Casetext CoCounsel uses GPT-4 but lacks domain-specific fine-tuning. JURI AI uniquely combines RAG Q&A, Legal-BERT contract analysis, templates, and lawyer booking for Indian law.

## III. SYSTEM ARCHITECTURE

JURI AI employs three-tier architecture: React frontend, Node.js middleware, and FastAPI AI backend, supported by MongoDB and Pinecone databases.

**Frontend**: React 18.2 SPA with role-based dashboards for Users, Lawyers, and Admins. Features include JWT authentication, real-time chat with Markdown rendering, drag-and-drop document upload with progress tracking, appointment booking calendar with conflict detection, and admin analytics dashboard with user metrics and platform statistics.

**Middleware Backend**: Node.js 18 with Express handles business logic including user registration with email verification, RESTful APIs with OpenAPI documentation, template approval workflow with admin moderation, appointment scheduling with lawyer availability management, and email and SMS notifications for appointments and security events. Uses Mongoose ODM for MongoDB, bcrypt for password hashing, and JWT for authentication.

**AI Backend**: FastAPI with Python orchestrates AI operations using LangChain for RAG orchestration, Pinecone for vector storage, Sentence-Transformers for embeddings, Groq API for LLaMA 3.3 70B inference, and HuggingFace Transformers for Legal-BERT. Core modules include RAG chatbot (query embedding, Pinecone similarity search with k=5, cross-encoder reranking, LLaMA 3.3 generation with temperature 0.3), document processor (text extraction with PyMuPDF and python-docx, 800-character chunking with 100-character overlap, batch embedding with 768 dimensions), and contract analyzer (Legal-BERT 15-class classification with confidence threshold 0.7, rule-based risk detection with 20+ validators for Indian statutes).

**Data Layer**: MongoDB Atlas M10 cluster stores users, chats, appointments, templates, and documents with optimized indexes on userId, createdAt, and status fields. Pinecone serverless index stores 768-dimensional vectors with cosine similarity metric and sub-100ms query latency. Redis provides caching for embeddings, rate limiting for API protection, and session storage for JWT blacklisting.

## IV. METHODOLOGY

### A. Document Processing Pipeline

Uploaded documents undergo validation (file type, size limits, virus scanning with ClamAV), text extraction (PyMuPDF for PDFs, python-docx for DOCX, Tesseract OCR for scanned files), and chunking (800-character chunks with 100-character overlap preserving context across boundaries). Each chunk converts to 768-dimensional vectors using sentence-transformers all-mpnet-base-v2 model and stores in Pinecone with metadata including document ID, page number, chunk index, and user ID for access control.

### B. RAG Query Processing

User queries undergo preprocessing (spell correction with TextBlob, intent classification for query routing) and embedding (convert to 768-dim vectors using same model as documents). Pinecone retrieves top-5 similar chunks using cosine similarity in under 100ms. Cross-encoder reranking using ms-marco-MiniLM-L-6-v2 model selects best 3 chunks, providing 6% accuracy improvement over retrieval alone. Structured prompts with context, question, and citation requirements feed into LLaMA 3.3 70B via Groq API at 180 tokens/sec with temperature 0.3 for consistency. Post-processing adds Markdown formatting, source citations, and legal disclaimers. Average total latency: 2.3 seconds (embedding 120ms, retrieval 85ms, reranking 340ms, LLM inference 1,650ms, post-processing 105ms).

### C. Contract Classification

Fine-tuned Legal-BERT (nlpaueb/legal-bert-base-uncased pre-trained on 12GB legal text) classifies 15 clause types: Confidentiality, Payment Terms, Termination, Indemnification, Liability, Intellectual Property, Non-Compete, Jurisdiction, Force Majeure, Warranties, Dispute Resolution, Amendments, Entire Agreement, Severability, and Assignment. Training used Kaggle Contract Clause Classification dataset with 10,000+ labeled clauses, AdamW optimizer with learning rate 2e-5, batch size 16, 5 epochs with early stopping, label smoothing epsilon 0.1 for regularization, and SMOTE oversampling for rare classes. Training duration: 4 hours on NVIDIA A100 GPU. Best validation F1: 84.9%. Inference uses sliding window (512 tokens, 128 stride) with confidence filtering above 0.7 threshold.

### D. Risk Detection

20+ rule-based validators aligned with Indian Contract Act 1872 and Industrial Disputes Act 1947. Non-Compete validator flags duration exceeding 1 year or worldwide scope as HIGH risk per Section 27. Jurisdiction validator checks party location alignment and flags foreign jurisdiction without Indian law election. Termination validator identifies at-will termination clauses and short notice periods below statutory minimums. Liability validator detects unlimited liability clauses and one-sided indemnification. Payment validator flags ambiguous schedules and missing milestone definitions. Risk scoring uses severity weights (HIGH=10, MEDIUM=5, LOW=2) normalized to 1-10 scale where 7-10 requires mandatory lawyer review.

### E. User Management

**Three User Roles**: Users can chat with AI, upload 50 documents/month, download templates, book appointments, and rate lawyers. Lawyers have all User permissions plus professional profile with bar council registration, availability calendar management, appointment handling with video call integration, template contribution with royalty sharing, and analytics dashboard tracking earnings and client satisfaction. Admins have full system access including user management with account suspension, content moderation for templates and reviews, platform analytics with usage metrics and revenue tracking, system configuration for feature flags and pricing, and comprehensive audit logs.

**Authentication**: JWT access tokens with 15-minute expiry and refresh tokens with 7-day expiry stored in HTTP-only secure cookies prevent XSS attacks. Password hashing uses bcrypt with cost factor 12 (4,096 iterations). Email verification required for account activation. Multi-factor authentication with TOTP for admin accounts. OAuth2 integration for Google and LinkedIn.

**Appointment System**: Lawyer search by expertise, location, rating, and price. Availability calendar with conflict detection prevents double-booking. Automated reminders via email and SMS 24 hours before appointments. Rating and review system with 5-star scale and text feedback. Lawyers define working hours with custom slots, block dates for holidays, and set buffer time between appointments (default 15 minutes).

## V. EXPERIMENTAL RESULTS

### A. Evaluation Setup

Hardware: AMD EPYC 7763 CPU, NVIDIA A100 40GB GPU, 256GB RAM. Cloud services: MongoDB Atlas M10, Pinecone serverless index. Datasets: 100 legal Q&A pairs (custom annotated by 3 lawyers), 10,000 contract clauses (Kaggle dataset), 200 real contracts for risk detection, 30 users over 2 weeks (300 sessions) for user study.

### B. RAG Performance

| Metric | Score | Baseline (No RAG) | Improvement |
|--------|-------|-------------------|-------------|
| Accuracy | 89% | 62% | +27% |
| Faithfulness | 94% | 54% | +40% |
| Answer Relevance | 0.87 | 0.71 | +22.5% |
| BLEU-4 | 0.43 | 0.31 | +38.7% |
| ROUGE-L | 0.56 | 0.42 | +33.3% |

Ablation study: Retrieval alone provides +18% accuracy, reranking adds +6%, and prompt engineering adds +3%. Failure analysis: 4% failures from ambiguous queries needing clarification, 3% from multi-document reasoning exceeding context window, 2% from outdated legal information, and 2% from misinterpretation of complex legal terminology.

### C. Clause Classification

Overall accuracy: 84.76%. Macro F1: 84.1%. Per-class performance: Confidentiality (92% F1), Payment Terms (91% F1), Termination (89% F1), Liability (87% F1), Jurisdiction (86% F1), Non-Compete (83% F1), Force Majeure (81% F1), IP Rights (80% F1), Amendments (75% F1), Entire Agreement (77% F1). Baseline comparisons: Legal-BERT (84.76%) vs base BERT (78.32%), RoBERTa (76.45%), Longformer (79.61%). Legal-BERT demonstrates 6.44% improvement over base BERT validating domain-specific pre-training value.

### D. Risk Detection

Overall F1-score: 88.7%. Precision: 87.1%, Recall: 90.4%. High-risk detection: 94% accuracy identifying clauses requiring lawyer review. False positive rate: 12.9% (acceptable for conservative triage system). False negative rate: 9.6% (clauses marked safe but risky—mitigated by lawyer review option). Most detected risks: ambiguous termination terms (34%), unfavorable liability allocation (28%), restrictive non-compete (18%), jurisdiction issues (12%), payment ambiguity (8%).

### E. Scalability and Cost

Load testing with Apache JMeter simulated concurrent users: 10 users (1.2s avg response, 99.8% success), 50 users (1.8s avg response, 99.2% success), 100 users (2.7s avg response, 98.1% success), 250 users (4.3s avg response, 94.7% success), 500 users (6.8s avg response, 89.2% success). System demonstrates linear horizontal scaling. Cost analysis per 10,000 monthly active users: Groq API ($420/month at $0.27/million tokens assuming 5 queries/user, 500 tokens avg), Pinecone ($389/month serverless pricing), MongoDB Atlas M10 ($350/month), AWS EC2 t3.large ($75/month), Redis Cloud ($80/month). Total: $1,314/month = $0.13/user/month, enabling viable subscription pricing ($0 free tier, ₹499 basic, ₹1,999 professional).

### F. User Study

30 participants (12 small business owners, 10 individuals with legal questions, 8 law students) completed task-based evaluation over 2 weeks with 300 total sessions. Task completion rate: 92% (276/300 sessions). User satisfaction: 4.3/5 average rating. Time savings: average 22 minutes per query (reduced from 25 minutes with Google search to 3 minutes with JURI AI, 68% reduction). Cost savings: 90% reduction ($0-₹1,999/month vs ₹3,000-₹15,000 per consultation). Most valued features: instant responses (27/30), source citations (25/30), contract risk highlighting (28/30), lawyer marketplace (22/30). Improvement requests: Hindi/regional language support (18/30), mobile app (21/30), more Indian case law examples (15/30).

## VI. SECURITY AND COMPLIANCE

### A. Data Protection

**Encryption**: TLS 1.3 for data in transit with perfect forward secrecy. AES-256 encryption at rest for MongoDB, Pinecone, and S3 storage. Field-level encryption for sensitive data (SSN, PAN, Aadhaar) using AES-256-GCM with per-field initialization vectors and authentication tags preventing tampering.

**Authentication**: Bcrypt password hashing with cost factor 12. Minimum password requirements: 8 characters, mixed case, numbers, special characters. Password strength validation using zxcvbn algorithm. Account lockout after 5 failed attempts with 30-minute cooldown. Password history tracking prevents reuse of last 5 passwords. TOTP-based multi-factor authentication for admin accounts with backup codes for recovery. OAuth2 integration with state parameter for CSRF protection and PKCE for mobile clients.

**Input Validation**: Joi schema validation for all API requests with strict type checking and whitelist approach. XSS prevention using DOMPurify on frontend and Content Security Policy headers restricting script sources. NoSQL injection prevention using mongo-sanitize and parameterized queries via Mongoose ODM. File upload validation: whitelist approach allowing only PDF, DOCX, TXT with file type verification using magic numbers and ClamAV virus scanning rejecting infected files.

### B. Rate Limiting

Application-level limits: 100 requests per 15 minutes for general API, 5 requests per 15 minutes for authentication endpoints with exponential backoff, 10 AI queries per minute per user preventing abuse. Premium users receive higher limits. Infrastructure-level protection: CloudFlare DDoS mitigation with Web Application Firewall implementing OWASP Core Rule Set, bot management blocking malicious scrapers, and geoblocking high-risk regions. AWS Shield Standard provides network-layer DDoS protection.

### C. Privacy and Compliance

**GDPR Rights Implementation**: Right to Access provides complete data export in JSON format within 30 days. Right to Erasure anonymizes personal data while preserving audit trails with deleted accounts marked as "Deleted User" and sensitive data purged from all systems including vector database. Right to Data Portability delivers machine-readable JSON export compatible with other systems. Consent management tracks user preferences for essential, analytics, and marketing purposes with granular control and audit logging.

**Data Isolation**: Each user's uploaded documents stored in separate Pinecone namespace preventing cross-user access. MongoDB queries always filtered by userId with row-level security. Lawyer-client confidentiality protected through encrypted appointment notes and access-controlled chat transcripts. Admin access to user data logged in audit trail with IP address, timestamp, reason, and actions taken.

### D. Audit Logging

Comprehensive logging covers authentication events (login, logout, password changes, MFA enablement), data access (document uploads, views, deletions, template downloads), administrative actions (role changes, account suspensions, template approvals), and security events (suspicious activity, rate limit violations, malware detection). Logs stored immutably for 7 years meeting legal retention requirements. Real-time alerting for security events enables rapid incident response. Anomaly detection identifies unusual patterns like login from new location or activity volume exceeding 3x user average triggering email alerts and optional account suspension.

### E. Compliance Framework

**Terms of Service**: Explicit disclaimers clarify JURI AI does NOT constitute legal advice and should NOT substitute professional counsel. May contain errors and may not reflect current legal developments. Users encouraged to consult qualified lawyers for binding matters. Limitation of liability capped at subscription fees. Dispute resolution through arbitration. Data retention: active users indefinitely, deleted users anonymized after 30 days, audit logs 7 years.

**Lawyer Verification**: Bar Council registration verified through state APIs where available or manual document review. Verification requires registration number, enrollment year, practice areas, and professional liability insurance. Verified lawyers receive badge on profile and higher search ranking. Unverified lawyers cannot accept appointments ensuring user safety.

**Data Residency**: User data stored in India-based data centers (Mumbai region) complying with RBI data localization norms for payment data. Cross-border data transfers for Groq and Pinecone covered by Standard Contractual Clauses and adequacy decisions. Regular audits verify data location compliance.

## VII. LIMITATIONS

JURI AI aids legal tasks but does NOT replace licensed counsel. Key limitations: **Language barrier** with English-only system limits accessibility for 80% of Indians preferring Hindi or regional languages. **Context window constraints** where 8,192-token limit insufficient for queries requiring synthesis across many documents causes 3% failure rate. **Indian legal specificity** lacking comprehensive training on Indian case law with model pre-trained primarily on US and European legal texts causing potential jurisdictional misalignments. **Rare event handling** where classification accuracy for uncommon clause types (Amendments 75% F1, Entire Agreement 77% F1) below high-confidence threshold. **Temporal knowledge gap** where system cannot answer questions about recent legal amendments unless explicitly added to vector database requiring ongoing content curation. **API dependencies** where Groq rate limit (30 req/s) becomes bottleneck at 200+ concurrent users and third-party service outages directly impact platform availability. **Cost structure** requires 1,000+ monthly active users for profitability with customer acquisition costs extending break-even timeline. **Expectation management** where 15% of users misunderstand limitations despite prominent disclaimers expecting definitive legal advice rather than informational guidance.

## VIII. FUTURE WORK

**Near-Term** (6-12 months): Multilingual support using IndicBERT for Hindi, Marathi, Tamil, Telugu expanding user base 3-5x. Interactive query refinement with clarification dialogs reducing ambiguous query failures from 4% to under 1%. Extended context models migrating to Claude 3 (200K context) or GPT-4 Turbo (128K context) increasing accuracy on complex multi-document queries from 86% to 92%. Native mobile applications for iOS and Android with offline document scanning, push notifications, and voice input improving engagement 40-50%.

**Medium-Term** (1-2 years): Indian case law integration creating comprehensive database of 500,000+ judgments from Supreme Court and High Courts enabling precedent-based question answering and outcome prediction. Explainable AI using LIME, attention visualization, and counterfactual explanations increasing user trust from 73% to 85% and enabling lawyers to audit AI decisions meeting EU AI Act explainability requirements. Active learning pipeline flagging low-confidence predictions for human review, collecting user feedback, and retraining models monthly achieving continuous accuracy improvements of 2-3% annually. Collaborative drafting interface with AI-assisted real-time contract creation, clause recommendation, risk flagging as user types, and multi-party editing reducing drafting time 60%.

**Long-Term** (3-5 years): Autonomous legal agent performing routine tasks like contract negotiation within predefined parameters, regulatory compliance monitoring with proactive alerts, legal research with multi-step reasoning, and document generation and filing while maintaining human oversight. Personalized legal assistant learning user's legal history and preferences with contextual awareness of past contracts, proactive deadline alerts, predictive analytics for legal risks, and customized strategy recommendations. Cross-border legal intelligence supporting multi-jurisdictional contracts (US, UK, Singapore, UAE), international arbitration, and foreign investment compliance addressing $50B+ global legal services market. Legal education platform with interactive case simulations, personalized learning paths, bar exam preparation, and continuing legal education democratizing quality legal education addressing India's 1:1,250 lawyer-to-citizen ratio shortage.

## IX. CONCLUSION

JURI AI demonstrates successful integration of Retrieval-Augmented Generation with fine-tuned Legal-BERT for accessible legal services. Technical achievements include 89% Q&A accuracy (+27% vs standalone LLM), 84.76% clause classification (+6.44% vs base BERT), 88.7% F1 risk detection, and scalable three-tier architecture supporting 500+ concurrent users at $0.13/user operational cost. Practical impact validated through user study: 90% cost reduction, 68% time savings, 92% task completion rate, and 4.3/5 satisfaction. Platform positioned to serve 10 million+ underserved users in tier-2 and tier-3 Indian cities.

Key contributions: (1) Hybrid AI architecture combining retrieval-based grounding with domain-adapted classification addressing hallucination in legal contexts; (2) Scalable system design providing blueprint for AI-powered legal applications with independent scaling of compute-intensive operations; (3) Domain-specific fine-tuning methodology with SMOTE oversampling and label smoothing providing replicable framework for legal NLP tasks; (4) Rule-based legal validation demonstrating how symbolic AI complements neural approaches for statutory requirements; (5) Comprehensive evaluation framework combining quantitative metrics with qualitative assessments and real-world deployment testing.

Limitations acknowledged: English-only system, context window constraints for multi-document reasoning, limited Indian case law training, reduced accuracy on rare clause types, and API dependencies affecting scalability. Future work prioritizes multilingual support, extended context models, Indian case law integration, explainable AI, and active learning pipelines. Long-term vision encompasses autonomous legal agents, personalized assistants, and cross-border intelligence while maintaining human oversight and ethical guardrails.

JURI AI positions AI as augmentation tool rather than replacement for lawyers, combining AI scalability and consistency with human judgment, empathy, and advocacy skills. As legal systems worldwide grapple with technology's role in justice delivery, platforms like JURI AI represent essential infrastructure for improving access to justice. Continued research addressing identified limitations and collaboration with legal community ensure AI serves ultimate goal: democratizing legal access for all.

**"Justice delayed is justice denied. With JURI AI, justice is just a conversation away."**

## REFERENCES

[1] J. Devlin, M. W. Chang, K. Lee, and K. Toutanova, "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding," *arXiv preprint arXiv:1810.04805*, 2018.

[2] I. Chalkidis, M. Fergadiotis, P. Malakasiotis, N. Aletras, and I. Androutsopoulos, "LEGAL-BERT: The Muppets straight out of Law School," *arXiv preprint arXiv:2010.02559*, 2020.

[3] P. Lewis, E. Perez, A. Piktus, et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," *arXiv preprint arXiv:2005.11401*, 2020.

[4] Pinecone, "Vector Database for AI," 2024. [Online]. Available: https://www.pinecone.io/

[5] Groq, "LLaMA 3.3 70B Model Overview," 2025. [Online]. Available: https://groq.com/

[6] S. Agarwal, "AI in Legal Tech: Trends and Applications," *IEEE Access*, vol. 11, pp. 45821-45839, 2023.

[7] LangChain, "LangChain Documentation," 2024. [Online]. Available: https://www.langchain.com/

[8] Kaggle, "Contract Clause Classification Dataset," 2021. [Online]. Available: https://www.kaggle.com/datasets/madhurpant/contract-clause-classification

---

*Submitted to IEEE Conference on Artificial Intelligence and Machine Learning, 2025*

**Acknowledgments**: We thank PES Modern College of Engineering faculty advisors, 3 practicing lawyers who annotated evaluation data, 30 user study participants, and open-source communities (Hugging Face, LangChain, Pinecone, Groq, React, FastAPI) for tools enabling reproducible AI research. This work was conducted as an academic project without external funding.

