import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:8000';

const UploadSidebar: React.FC = () => {
  const { user } = useAuth();
  const canUploadKnowledgeBase = user?.role === 'admin' || user?.role === 'lawyer';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!canUploadKnowledgeBase) {
      setUploadMessage('Only lawyer or admin can upload to knowledge base.');
      return;
    }

    if (!selectedFile) return;
    setUploading(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUploadMessage('Please login as admin or lawyer.');
        return;
      }

      const response = await fetch(`${CHATBOT_API_URL}/upload_pdfs/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadMessage('Upload successful!');
      } else {
        setUploadMessage(data.error || 'Upload failed.');
      }
    } catch (err) {
      setUploadMessage('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3 border-end bg-light" style={{ minWidth: 250 }}>
      <h5>Upload PDF</h5>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button className="btn btn-primary mt-2" onClick={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {!canUploadKnowledgeBase && <div className="mt-2 text-warning">Only lawyer/admin can upload.</div>}
      {uploadMessage && <div className="mt-2 text-info">{uploadMessage}</div>}
    </div>
  );
};

export default UploadSidebar;
