import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { useUserStore } from '../../store/userStore';

const LogoUploader = () => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUserStore();
  const { logoUrl, logoPath, updateFormInfo } = useFormBuilderStore((state) => ({
    logoUrl: state.logoUrl,
    logoPath: state.logoPath,
    updateFormInfo: state.updateFormInfo
  }));

  const handleUpload = async (file) => {
    if (!file || !user) return;

    try {
      setUploading(true);
      setError(null);
      const path = `logos/${user.uid}/${file.name}-${Date.now()}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      updateFormInfo({ logoUrl: url, logoPath: path });
    } catch (err) {
      console.error('Logo upload failed', err);
      setError(
        err?.message || 'Upload failed. Check Storage rules and your authentication.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!logoPath && !logoUrl) return;
    try {
      const fileRef = ref(storage, logoPath || logoUrl);
      await deleteObject(fileRef);
    } catch (error) {
      // File might not exist, ignore
    } finally {
      updateFormInfo({ logoUrl: '' });
      updateFormInfo({ logoPath: '' });
    }
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-2xl">
      <p className="text-sm font-semibold text-gray-900 mb-3">Brand logo</p>
      {logoUrl ? (
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove} icon={Trash2}>
              Remove
            </Button>
            </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-xl py-10 text-gray-500 hover:border-primary-400 hover:text-primary-500 transition"
        >
          {uploading ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : (
            <>
              <Upload className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Upload logo</p>
              <p className="text-xs">PNG, JPG up to 2MB</p>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleUpload(e.target.files?.[0])}
      />
    </div>
  );
};

export default LogoUploader;
