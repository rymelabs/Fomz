import React from 'react';
import Toggle from '../ui/Toggle';
import Input from '../ui/Input';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { AlertCircle, Cloud } from 'lucide-react';

// Share or copy function with iOS support
const shareOrCopy = async (text, title = 'Share') => {
  // On mobile, try Web Share API first (works great on iOS)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: 'Check out this form',
        url: text
      });
      return { shared: true };
    } catch (err) {
      // User cancelled or share failed, fall through to clipboard
      if (err.name === 'AbortError') {
        return { cancelled: true };
      }
    }
  }
  
  // Try modern clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { copied: true };
    } catch (err) {
      // Fall through to fallback
    }
  }
  
  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  textArea.style.opacity = '0';
  textArea.setAttribute('readonly', '');
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  
  document.body.removeChild(textArea);
  return success ? { copied: true } : { failed: true };
};

const FormSettings = () => {
  const { settings, updateSettings, id, shareId, isLocal } = useFormBuilderStore((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
    id: state.id,
    shareId: state.shareId,
    isLocal: state.isLocal
  }));
  const { saveForm, publishForm } = useFormBuilder();
  const { isAuthenticated } = useUserStore();

  const handleCopyLink = async () => {
    if (!id) {
      toast.error('Save the form before sharing');
      return;
    }
    const link = shareId ? `${window.location.origin}/f/${shareId}` : `${window.location.origin}/forms/${id}/fill`;
    const result = await shareOrCopy(link, 'Share Form');
    if (result.shared) {
      // User shared via native share sheet
    } else if (result.copied) {
      toast.success('Form link copied to clipboard');
    } else if (!result.cancelled) {
      toast.error('Failed to copy link.');
    }
  };

  const handleCopyEmbed = async () => {
    if (!id && !shareId) {
      toast.error('Save the form before embedding');
      return;
    }
    const src = shareId ? `${window.location.origin}/f/${shareId}` : `${window.location.origin}/forms/${id}/fill`;
    const embed = `<iframe src="${src}" width="100%" height="800" frameborder="0"></iframe>`;
    const result = await shareOrCopy(embed, 'Embed Code');
    if (result.shared || result.copied) {
      toast.success('Embed snippet copied');
    } else if (!result.cancelled) {
      toast.error('Failed to copy embed snippet');
    }
  };

  const handleShare = async () => {
    try {
      let currentShareId = shareId;
      let currentId = id;

      if (!settings.published) {
        const result = await publishForm();
        currentShareId = result.shareId;
        currentId = result.id;
      } else {
        const savedId = await saveForm();
        currentId = savedId;
      }
      
      // Use the updated values if available, otherwise fall back to state values
      // Note: shareId might still be undefined if saveForm didn't return it (it only returns id)
      // But if it's published, shareId should be in the store.
      // If we just saved a published form, shareId shouldn't change.
      
      const finalShareId = currentShareId || shareId;
      const finalId = currentId || id;

      if (!finalId && !finalShareId) {
        throw new Error('Could not determine form ID');
      }

      const link = finalShareId ? `${window.location.origin}/f/${finalShareId}` : `${window.location.origin}/forms/${finalId}/fill`;
      const result = await shareOrCopy(link, 'Share Form');
      if (result.shared) {
        toast.success('Form published successfully!');
      } else if (result.copied) {
        toast.success('Form published! Share link copied to clipboard');
      } else if (!result.cancelled) {
        // Still show success for publish even if copy failed
        toast.success('Form published! Link: ' + link);
      }
    } catch (err) {
      console.error('Failed to publish & share', err);
      toast.error('Unable to publish the form');
    }
  };

  return (
    <div className="space-y-4">
      {/* Local form indicator */}
      {!isAuthenticated && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-900">Local form (browser only)</p>
            <p className="text-xs text-blue-700 mt-0.5">
              This form is saved in your browser. Sign in to sync to the cloud.
            </p>
          </div>
        </div>
      )}
      
      {isLocal && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 flex items-start gap-2">
          <Cloud className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-orange-900">Form saved locally</p>
            <p className="text-xs text-orange-700 mt-0.5">
              Only accessible on this device. Sign in to save to cloud.
            </p>
          </div>
        </div>
      )}
      
      <Toggle
        label="Allow multiple submissions"
        description="Let respondents submit more than once"
        checked={settings.allowMultipleSubmissions}
        onChange={(value) => updateSettings({ allowMultipleSubmissions: value })}
      />
      <Toggle
        label="Require login"
        description="Only authenticated users can answer"
        checked={settings.requireLogin}
        onChange={(value) => updateSettings({ requireLogin: value })}
      />
      <Toggle
        label="Send confirmation email"
        description="Email respondents a copy of their answers"
        checked={settings.sendEmailReceipt}
        onChange={(value) => updateSettings({ sendEmailReceipt: value })}
        disabled={!isAuthenticated}
      />
      <Toggle
        label="Show progress bar"
        description="Display progress as respondents fill the form"
        checked={settings.showProgressBar}
        onChange={(value) => updateSettings({ showProgressBar: value })}
      />
      <Toggle
        label="Publish form"
        description={
          !isAuthenticated 
            ? "Save form locally and generate shareable link" 
            : "Allow anyone to view and respond to this form"
        }
        checked={settings.published}
        onChange={(value) => updateSettings({ published: value })}
      />

      <Input
        label="Redirect URL"
        placeholder="https://"
        value={settings.redirectUrl}
        onChange={(e) => updateSettings({ redirectUrl: e.target.value })}
        helpText="Optional link after submission"
      />
      <div className="flex gap-2 mt-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => saveForm()}>
          {!isAuthenticated ? 'Save Locally' : 'Save'}
        </Button>
        <Button size="sm" onClick={handleCopyLink} disabled={!id && !shareId}>
          Copy link
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyEmbed} disabled={!id && !shareId}>
          Copy embed
        </Button>
        <Button size="sm" onClick={handleShare}>
          {!isAuthenticated ? 'Publish Locally & Share' : 'Publish & Share'}
        </Button>
      </div>
    </div>
  );
};

export default FormSettings;
