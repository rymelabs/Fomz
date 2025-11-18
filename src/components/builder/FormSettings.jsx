import React from 'react';
import Toggle from '../ui/Toggle';
import Input from '../ui/Input';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { useFormBuilder } from '../../hooks/useFormBuilder';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

const FormSettings = () => {
  const { settings, updateSettings, id, shareId } = useFormBuilderStore((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings
  }));
  const { saveForm } = useFormBuilder();
  const { publishForm } = useFormBuilder();

  const handleCopyLink = async () => {
    if (!id) {
      toast.error('Save the form before sharing');
      return;
    }
    const link = shareId ? `${window.location.origin}/f/${shareId}` : `${window.location.origin}/forms/${id}/fill`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Form link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy form link', err);
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
    try {
      await navigator.clipboard.writeText(embed);
      toast.success('Embed snippet copied to clipboard');
    } catch (err) {
      console.error('Failed to copy embed snippet', err);
      toast.error('Failed to copy embed snippet');
    }
  };

  const handleShare = async () => {
    try {
      if (!settings.published) {
        await publishForm();
      } else {
        await saveForm();
      }
      // After publish/save, copy link
      const newShareId = shareId || id;
      const link = shareId ? `${window.location.origin}/f/${shareId}` : `${window.location.origin}/forms/${id}/fill`;
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard');
    } catch (err) {
      console.error('Failed to publish & share', err);
      toast.error('Unable to publish and share the form');
    }
  };

  return (
    <div className="space-y-4">
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
      />
      <Toggle
        label="Show progress bar"
        description="Display progress as respondents fill the form"
        checked={settings.showProgressBar}
        onChange={(value) => updateSettings({ showProgressBar: value })}
      />
      <Toggle
        label="Publish form"
        description="Allow anyone to view and respond to this form"
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
      <div className="flex gap-2 mt-4 flex-wrap">
        <Button variant="outline" onClick={() => saveForm()}>
          Save
        </Button>
        <Button onClick={handleCopyLink} disabled={!id && !shareId}>
          Copy link
        </Button>
        <Button variant="outline" onClick={handleCopyEmbed} disabled={!id && !shareId}>
          Copy embed
        </Button>
        <Button onClick={handleShare}>
          Publish & Share
        </Button>
      </div>
    </div>
  );
};

export default FormSettings;
