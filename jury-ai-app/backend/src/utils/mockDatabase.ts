// Mock database types
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'lawyer' | 'admin';
  isVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Chat {
  id: string;
  userId: string;
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: 'active' | 'hidden' | 'flagged';
  views: number;
  likes: string[];
  replies: any[];
  reports: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  fields: {
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }[];
  isActive: boolean;
  createdBy: string;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Document {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory database for development
class MockDatabase {
  private users: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@juryai.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'admin',
      isVerified: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      username: 'demo_user',
      email: 'user@demo.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'user',
      isVerified: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      username: 'demo_lawyer',
      email: 'lawyer@demo.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'lawyer',
      isVerified: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private chats: Chat[] = [];
  private posts: CommunityPost[] = [];
  private templates: Template[] = [
    {
      id: '1',
      title: 'Non-Disclosure Agreement (NDA)',
      description: 'A standard non-disclosure agreement template for business use',
      category: 'Contracts',
      content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on {{date}} by and between {{party1Name}}, a {{party1Type}} ("Disclosing Party"), and {{party2Name}}, a {{party2Type}} ("Receiving Party").

WHEREAS, the Disclosing Party possesses certain confidential and proprietary information;
WHEREAS, the Receiving Party desires access to such confidential information for the purpose of {{purpose}};

NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:

1. CONFIDENTIAL INFORMATION
For purposes of this Agreement, "Confidential Information" means all non-public, proprietary, or confidential information disclosed by the Disclosing Party.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
a) Hold all Confidential Information in strict confidence
b) Not disclose any Confidential Information to third parties
c) Use the Confidential Information solely for the purpose of {{purpose}}

3. TERM
This Agreement shall remain in effect for {{duration}} years from the date first written above.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

{{party1Name}}                    {{party2Name}}
_________________                  _________________
Signature                          Signature

Date: ____________                 Date: ____________`,
      fields: [
        { name: 'date', type: 'date', label: 'Agreement Date', required: true },
        { name: 'party1Name', type: 'text', label: 'Disclosing Party Name', required: true },
        { name: 'party1Type', type: 'text', label: 'Disclosing Party Type', required: true },
        { name: 'party2Name', type: 'text', label: 'Receiving Party Name', required: true },
        { name: 'party2Type', type: 'text', label: 'Receiving Party Type', required: true },
        { name: 'purpose', type: 'textarea', label: 'Purpose of Disclosure', required: true },
        { name: 'duration', type: 'number', label: 'Duration (years)', required: true }
      ],
      isActive: true,
      createdBy: '3',
      downloads: 25,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Employment Contract',
      description: 'Standard employment agreement template',
      category: 'Employment',
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made on {{startDate}} between {{companyName}}, a {{companyType}} ("Company"), and {{employeeName}} ("Employee").

1. POSITION AND DUTIES
Employee is hired as {{jobTitle}} and will perform duties as assigned by the Company.

2. COMPENSATION
Employee will receive a salary of \${{salary}} per {{payPeriod}}, payable {{paySchedule}}.

3. BENEFITS
Employee is entitled to benefits including:
- {{benefits}}

4. TERM
This Agreement begins on {{startDate}} and continues until terminated.

5. TERMINATION
Either party may terminate this agreement with {{noticePeriod}} days written notice.

Company: {{companyName}}          Employee: {{employeeName}}
_________________                 _________________
Signature                         Signature`,
      fields: [
        { name: 'startDate', type: 'date', label: 'Start Date', required: true },
        { name: 'companyName', type: 'text', label: 'Company Name', required: true },
        { name: 'companyType', type: 'text', label: 'Company Type', required: true },
        { name: 'employeeName', type: 'text', label: 'Employee Name', required: true },
        { name: 'jobTitle', type: 'text', label: 'Job Title', required: true },
        { name: 'salary', type: 'number', label: 'Annual Salary', required: true },
        { name: 'payPeriod', type: 'select', label: 'Pay Period', required: true, options: ['year', 'month', 'hour'] },
        { name: 'paySchedule', type: 'text', label: 'Pay Schedule', required: true },
        { name: 'benefits', type: 'textarea', label: 'Benefits Description', required: false },
        { name: 'noticePeriod', type: 'number', label: 'Notice Period (days)', required: true }
      ],
      isActive: true,
      createdBy: '3',
      downloads: 18,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    }
  ];
  private documents: Document[] = [];

  // User operations
  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  findUserByUsername(username: string): User | undefined {
    return this.users.find(user => user.username === username);
  }

  findUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const user: User = {
      ...userData,
      id: (this.users.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.users[userIndex];
  }

  getAllUsers(page: number = 1, limit: number = 10, filters: any = {}): { users: User[], total: number } {
    let filteredUsers = [...this.users];
    
    if (filters.search) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    if (filters.role && filters.role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      users: filteredUsers.slice(startIndex, endIndex),
      total: filteredUsers.length
    };
  }

  // Chat operations
  createChat(chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Chat {
    const chat: Chat = {
      ...chatData,
      id: (this.chats.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chats.push(chat);
    return chat;
  }

  getChatsByUserId(userId: string): Chat[] {
    return this.chats.filter(chat => chat.userId === userId);
  }

  // Community operations
  createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'replies' | 'reports'>): CommunityPost {
    const post: CommunityPost = {
      ...postData,
      id: (this.posts.length + 1).toString(),
      views: 0,
      likes: [],
      replies: [],
      reports: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.push(post);
    return post;
  }

  getAllPosts(page: number = 1, limit: number = 10, filters: any = {}): { posts: CommunityPost[], total: number } {
    let filteredPosts = [...this.posts];
    
    if (filters.search) {
      filteredPosts = filteredPosts.filter(post => 
        post.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        post.content.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    if (filters.category && filters.category !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.category === filters.category);
    }
    
    if (filters.status && filters.status !== 'all') {
      filteredPosts = filteredPosts.filter(post => post.status === filters.status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      posts: filteredPosts.slice(startIndex, endIndex),
      total: filteredPosts.length
    };
  }

  // Template operations
  getAllTemplates(page: number = 1, limit: number = 12, filters: any = {}): { templates: Template[], total: number } {
    let filteredTemplates = [...this.templates];
    
    if (filters.search) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        template.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    if (filters.category && filters.category !== 'all') {
      filteredTemplates = filteredTemplates.filter(template => template.category === filters.category);
    }
    
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filteredTemplates = filteredTemplates.filter(template => template.isActive === isActive);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      templates: filteredTemplates.slice(startIndex, endIndex),
      total: filteredTemplates.length
    };
  }

  findTemplateById(id: string): Template | undefined {
    return this.templates.find(template => template.id === id);
  }

  updateTemplate(id: string, updates: Partial<Template>): Template | null {
    const templateIndex = this.templates.findIndex(template => template.id === id);
    if (templateIndex === -1) return null;
    
    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };
    return this.templates[templateIndex];
  }

  // Dashboard stats
  getDashboardStats() {
    const totalUsers = this.users.filter(u => u.role === 'user').length;
    const totalLawyers = this.users.filter(u => u.role === 'lawyer').length;
    const pendingVerifications = this.users.filter(u => u.role === 'lawyer' && !u.isVerified).length;
    const totalChats = this.chats.length;
    const totalPosts = this.posts.length;
    const totalTemplates = this.templates.length;
    const totalDocuments = this.documents.length;

    const recentActivity = [
      { type: 'User Registration', description: 'New user registered', timestamp: new Date().toISOString() },
      { type: 'Template Downloaded', description: 'NDA template downloaded', timestamp: new Date().toISOString() },
      { type: 'Community Post', description: 'New legal question posted', timestamp: new Date().toISOString() }
    ];

    return {
      totalUsers,
      totalLawyers,
      pendingVerifications,
      totalChats,
      totalPosts,
      totalTemplates,
      totalDocuments,
      recentActivity
    };
  }
}

export const mockDB = new MockDatabase();
