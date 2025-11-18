import React, { useState } from 'react';
import { Upload, X, File } from 'lucide-react';
import Button from '../ui/Button';

const FileUpload = ({ 
  question, 
  value, 
  onChange, 
  error,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx']
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    onChange(file);
  };

  const removeFile = () => {
    onChange(null);
  };

  return (
    <div>
      {!value ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
          }`}
        >
          <input
            type="file"
            onChange={handleChange}
            disabled={disabled}
            accept={acceptedTypes.join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            Max file size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{value.name}</p>
              <p className="text-xs text-gray-500">
                {(value.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={removeFile}
            disabled={disabled}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
