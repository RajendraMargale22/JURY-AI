import React, { useState } from 'react';

const UploadSidebar: React.FC = () => {
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
    if (!selectedFile) return;
    setUploading(true);
    setUploadMessage(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('http://localhost:8000/upload_pdfs/', {
        method: 'POST',
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
      {uploadMessage && <div className="mt-2 text-info">{uploadMessage}</div>}
    </div>
  );
};

export default UploadSidebar;
