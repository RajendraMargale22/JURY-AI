import React from 'react';
import './TemplateCard.css';

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

const TemplateCard: React.FC<TemplateCardProps> = ({
  title,
  description,
  category,
  downloads,
  lastUpdated,
  onGenerateDocument,
  onPreview
}) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="template-card">
      <div className="template-card-inner">
        {/* Grid Pattern Background */}
        <div className="template-card-background">
          <svg className="grid-pattern" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(93, 208, 255, 0.15)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Decorative Corner Elements */}
          <div className="corner-decoration corner-top-left"></div>
          <div className="corner-decoration corner-top-right"></div>
          <div className="corner-decoration corner-bottom-left"></div>
          <div className="corner-decoration corner-bottom-right"></div>
          
          {/* Geometric Shape */}
          <div className="geometric-shape"></div>
        </div>

        {/* Content */}
        <div className="template-card-content">
          {/* Date Badge */}
          <div className="template-date-badge">
            {formatDate(lastUpdated)}
          </div>

          {/* Title */}
          <h3 className="template-card-title">{title}</h3>

          {/* Category & Downloads Info */}
          <div className="template-card-meta">
            <div className="meta-item">
              <span className="meta-label">Category:</span>
              <span className="meta-value">{category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Downloads:</span>
              <span className="meta-value">{downloads}</span>
            </div>
          </div>

          {/* Description (if visible) */}
          {description && (
            <p className="template-card-description">{description}</p>
          )}

          {/* Generate Document Button */}
          <button 
            className="generate-document-btn"
            onClick={onGenerateDocument}
          >
            <span className="btn-icon">✨</span>
            <span className="btn-text">Generate Document</span>
          </button>

          {/* Preview Link */}
          <button 
            className="preview-link"
            onClick={onPreview}
          >
            Preview Template
          </button>
        </div>
      </div>

    </div>
  );
};

export default TemplateCard;
