import express, { Response } from 'express';
import { auth } from '../middleware/auth';
import Template from '../models/Template';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TEMPLATE_CATEGORIES, isValidCategory } from '../config/templateCategories';

interface AuthRequest extends express.Request {
  user?: any;
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/templates');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF and Word documents
  const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Get all templates with pagination
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const category = req.query.category as string;
    const search = req.query.search as string;

    let query: any = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const templates = await Template.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Template.countDocuments(query);

    res.json({
      templates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get template categories
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    // Return predefined categories + any custom categories from database
    const dbCategories = await Template.distinct('category', { isActive: true });
    
    // Combine predefined categories with database categories (remove duplicates)
    const allCategories = Array.from(new Set([...TEMPLATE_CATEGORIES, ...dbCategories]));
    
    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific template
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('createdBy', 'username');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download template (increment download count)
router.post('/:id/download', auth, async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Increment download count
    template.downloads += 1;
    await template.save();

    res.json({
      template,
      downloadUrl: `/api/templates/${template._id}/file`
    });
  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve template file
router.get('/:id/file', auth, async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (!template.filePath || !fs.existsSync(template.filePath)) {
      return res.status(404).json({ message: 'Template file not found' });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', template.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${template.fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(template.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving template file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate document from template
router.post('/:id/generate', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { fields } = req.body;

    const template = await Template.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Replace placeholders in template content with user-provided values
    let generatedContent = template.content;
    
    if (fields) {
      Object.keys(fields).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = fields[key] || `[${key}]`;
        generatedContent = generatedContent.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    // Increment download count
    template.downloads += 1;
    await template.save();

    res.json({
      generatedContent,
      templateTitle: template.title,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new template (admin/lawyer only)
router.post('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, content, fields } = req.body;

    // Check if user is admin or lawyer
    if (req.user?.role !== 'admin' && req.user?.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Admin or lawyer role required.' });
    }

    if (!title || !description || !category || !content) {
      return res.status(400).json({ message: 'Title, description, category, and content are required' });
    }

    // Validate category (optional: warn but allow custom categories)
    if (!isValidCategory(category)) {
      console.warn(`Custom category used: ${category}`);
    }

    const template = new Template({
      title,
      description,
      category,
      content,
      fields: fields || [],
      isActive: true,
      createdBy: req.user?._id || req.user?.id,
      downloads: 0
    });

    await template.save();
    await template.populate('createdBy', 'username');

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload template with file (admin/lawyer only)
router.post('/upload', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or lawyer
    if (req.user?.role !== 'admin' && req.user?.role !== 'lawyer') {
      // Delete uploaded file if user is not authorized
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Access denied. Admin or lawyer role required.' });
    }

    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    // Validate category (optional: warn but allow custom categories)
    if (!isValidCategory(category)) {
      console.warn(`Custom category used: ${category}`);
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Template file is required' });
    }

    // Read file content to extract preview text (basic implementation)
    let content = `Template file: ${req.file.filename}`;
    
    // Create template record
    const template = new Template({
      title,
      description,
      category,
      content,
      fields: [],
      isActive: true,
      createdBy: req.user?._id || req.user?.id,
      downloads: 0,
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await template.save();
    await template.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Template uploaded successfully',
      template
    });
  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading template:', error);
    res.status(500).json({ message: 'Server error while uploading template' });
  }
});

// Update template (creator or admin only)
router.put('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, content, fields } = req.body;

    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user is the creator or admin
    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    if (template.createdBy.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    template.title = title || template.title;
    template.description = description || template.description;
    template.category = category || template.category;
    template.content = content || template.content;
    template.fields = fields || template.fields;
    template.updatedAt = new Date();

    await template.save();
    await template.populate('createdBy', 'username');

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete template (creator or admin only)
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user is the creator or admin
    const userId = req.user?._id?.toString() || req.user?.id?.toString();
    if (template.createdBy.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Template.findByIdAndDelete(req.params.id);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle template status (admin only)
router.patch('/:id/status', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    template.isActive = isActive;
    template.updatedAt = new Date();

    await template.save();

    res.json({ message: `Template ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error updating template status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
