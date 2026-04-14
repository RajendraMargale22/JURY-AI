import express, { Response } from 'express';
import { auth } from '../middleware/auth';
import Template from '../models/Template';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TEMPLATE_CATEGORIES, isValidCategory } from '../config/templateCategories';
import { getMergedSystemSettings } from '../utils/systemSettings';

interface AuthRequest extends express.Request {
  user?: any;
}

const router = express.Router();
const MAX_CONCURRENT_TEMPLATE_DOWNLOADS = 20;
const SAFE_TEMPLATE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._\- ()]*$/;
let activeTemplateDownloads = 0;

router.use(async (req, res, next) => {
  try {
    const settings = await getMergedSystemSettings();
    if (settings.templatesEnabled === false) {
      return res.status(403).json({ message: 'Template feature is currently disabled by admin settings' });
    }
    return next();
  } catch (error) {
    console.error('Template settings check failed:', error);
    return res.status(500).json({ message: 'Unable to validate template availability' });
  }
});

const normalizeTemplateFileName = (fileName?: string): string | null => {
  const safeName = path.basename((fileName || '').trim());
  if (!safeName || !SAFE_TEMPLATE_FILENAME.test(safeName)) return null;
  return safeName;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const asString = (value: unknown, maxLength = 200): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
const asPositiveInt = (value: unknown, fallback: number, max = 100): number => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

// Configure multer to use memory storage (files stored in MongoDB, not local disk)
const storage = multer.memoryStorage();

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
    const page = asPositiveInt(req.query.page, 1, 10000);
    const limit = asPositiveInt(req.query.limit, 12, 100);
    const category = asString(req.query.category, 60);
    const search = asString(req.query.search, 120);

    let query: any = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      const safeSearch = escapeRegExp(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const templates = await Template.find(query)
      .populate('createdBy', ['name', 'email'])
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
    }).populate('createdBy', ['name', 'email']);

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

// Serve template file (from MongoDB)
router.get('/:id/file', auth, async (req: AuthRequest, res: Response) => {
  if (activeTemplateDownloads >= MAX_CONCURRENT_TEMPLATE_DOWNLOADS) {
    return res.status(429).json({ message: 'Too many concurrent downloads. Please retry shortly.' });
  }

  activeTemplateDownloads += 1;
  try {
    // Use .select('+fileData') to explicitly include the fileData field
    const template = await Template.findOne({
      _id: req.params.id,
      isActive: true
    }).select('+fileData');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (!template.fileName) {
      return res.status(404).json({ message: 'Template file not found' });
    }

    // Serve from MongoDB fileData (primary)
    if (template.fileData && template.fileData.length > 0) {
      const safeFileName = (template.fileName || 'template').replace(/[\r\n"]/g, '_');
      res.setHeader('Content-Type', template.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
      res.setHeader('Content-Length', template.fileData.length);
      return res.send(template.fileData);
    }

    // Fallback: try serving from local disk (for backward compatibility)
    const safeTemplateName = normalizeTemplateFileName(template.fileName);
    if (!safeTemplateName) {
      return res.status(400).json({ message: 'Invalid template file path' });
    }

    const TEMPLATE_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/templates');
    const localFilePath = path.join(TEMPLATE_UPLOAD_DIR, safeTemplateName);

    if (fs.existsSync(localFilePath)) {
      // File exists on disk — serve it and also migrate to MongoDB
      const fileBuffer = fs.readFileSync(localFilePath);
      template.fileData = fileBuffer;
      await template.save();
      console.log(`Migrated template file to MongoDB: ${template._id}`);

      const safeFileName = safeTemplateName.replace(/[\r\n"]/g, '_');
      res.setHeader('Content-Type', template.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      return res.send(fileBuffer);
    }

    return res.status(404).json({ message: 'Template file not found. The file may not have been stored properly.' });
  } catch (error) {
    console.error('Error serving template file:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  } finally {
    activeTemplateDownloads = Math.max(0, activeTemplateDownloads - 1);
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
        const placeholder = `{{${escapeRegExp(key)}}}`;
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
    await template.populate('createdBy', ['name', 'email']);

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload template with file (admin/lawyer only) - stores file in MongoDB
router.post('/upload', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin or lawyer
    if (req.user?.role !== 'admin' && req.user?.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Admin or lawyer role required.' });
    }

    const { title, description, category } = req.body;

    if (!title || !description || !category) {
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
    let content = `Template file: ${req.file.originalname}`;
    
    // Create template record with file data stored in MongoDB
    const template = new Template({
      title,
      description,
      category,
      content,
      fields: [],
      isActive: true,
      createdBy: req.user?._id || req.user?.id,
      downloads: 0,
      filePath: req.file.originalname,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileData: req.file.buffer  // Store file binary directly in MongoDB
    });

    await template.save();
    await template.populate('createdBy', ['name', 'email']);

    // Remove fileData from response to avoid sending large binary back
    const responseTemplate = template.toObject();
    delete responseTemplate.fileData;

    res.status(201).json({
      message: 'Template uploaded successfully',
      template: responseTemplate
    });
  } catch (error) {
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
    await template.populate('createdBy', ['name', 'email']);

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
