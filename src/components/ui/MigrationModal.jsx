import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, XCircle, Loader2, Download, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import { 
  getMigrationSummary, 
  migrateAllLocalFormsToCloud,
  backupLocalForms 
} from '../../services/migrationService';
import { useUserStore } from '../../store/userStore';
import toast from 'react-hot-toast';

const MigrationModal = ({ isOpen, onClose, onComplete }) => {
  const { user } = useUserStore();
  const [summary, setSummary] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (isOpen) {
      const migrationSummary = getMigrationSummary();
      setSummary(migrationSummary);
      setResults(null);
      setError(null);
    }
  }, [isOpen]);
  
  const handleBackup = () => {
    try {
      const blob = backupLocalForms();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fomz-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };
  
  const handleMigrate = async () => {
    if (!user) {
      setError('You must be signed in to migrate forms');
      return;
    }
    
    setMigrating(true);
    setError(null);
    
    try {
      const migrationResults = await migrateAllLocalFormsToCloud(
        user.uid,
        (progressData) => {
          setProgress(progressData);
        }
      );
      
      setResults(migrationResults);
      
      if (migrationResults.success) {
        toast.success(`Successfully migrated ${migrationResults.migratedForms} forms!`);
        setTimeout(() => {
          if (onComplete) onComplete(migrationResults);
        }, 2000);
      } else {
        toast.error('Some forms failed to migrate. See details below.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setError(error.message || 'Failed to migrate forms');
      toast.error('Migration failed');
    } finally {
      setMigrating(false);
      setProgress(null);
    }
  };
  
  const handleSkip = () => {
    if (onComplete) onComplete(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-blue-50 to-white px-6 py-5 border-b border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Migrate to Cloud</h2>
              <p className="text-sm text-gray-600 mt-1">
                Move your local forms to the cloud for safekeeping
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Summary */}
          {summary && !results && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">Ready to migrate</p>
                    <p className="text-xs text-blue-700 mt-1">
                      You have <strong>{summary.totalForms} forms</strong> with{' '}
                      <strong>{summary.totalResponses} responses</strong> stored locally.
                      Migrate them to the cloud to access from any device.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Forms List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Forms to migrate:</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {summary.forms.map((form) => (
                    <div key={form.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {form.title || 'Untitled Form'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {form.questionCount} questions • {form.responseCount} responses
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Benefits */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-semibold text-green-900 mb-2">After migration:</p>
                <ul className="space-y-1 text-xs text-green-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Access forms from any device
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Never lose your data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Unlimited AI generations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    Advanced analytics & exports
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Progress */}
          {migrating && progress && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  Migrating forms to cloud...
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {progress.current} of {progress.total} • {progress.formTitle}
                </p>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Results */}
          {results && (
            <div className="space-y-4">
              {results.success ? (
                <div className="text-center py-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">Migration Complete!</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Successfully migrated <strong>{results.migratedForms} forms</strong> with{' '}
                    <strong>{results.migratedResponses} responses</strong>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-center py-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mx-auto">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900">Partial Success</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Migrated {results.migratedForms} forms, but {results.errors.length} failed
                    </p>
                  </div>
                  
                  {results.errors.length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                      <p className="text-sm font-semibold text-red-900 mb-2">Failed forms:</p>
                      <ul className="space-y-1 text-xs text-red-800">
                        {results.errors.map((err, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <XCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span>{err.formTitle}: {err.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Migration failed</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              onClick={handleBackup}
              variant="ghost"
              size="sm"
              disabled={migrating}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Backup First
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {!results && (
                <>
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    disabled={migrating}
                    className="w-full sm:w-auto"
                  >
                    {migrating ? 'Cancel' : 'Skip for Now'}
                  </Button>
                  <Button
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-none"
                  >
                    {migrating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Migrate to Cloud
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {results && (
                <Button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationModal;
