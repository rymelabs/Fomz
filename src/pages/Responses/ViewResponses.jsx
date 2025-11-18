import React, { useEffect, useState } from 'react';
import { Download, Filter, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getFormResponses, exportToCSV } from '../../services/responseService';

const ViewResponses = ({ formId, onSelectResponse }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!formId) return;
      try {
        setLoading(true);
        const data = await getFormResponses(formId);
        setResponses(data);
      } catch (error) {
        console.error('Failed to load responses', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [formId]);

  const handleExport = () => {
    const csv = exportToCSV(responses, []);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'responses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Responses</h1>
          <p className="text-gray-500">{responses.length} submissions collected.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={Filter}>Filters</Button>
          <Button variant="outline" icon={Download} onClick={handleExport}>Export</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      ) : responses.length === 0 ? (
        <Card className="text-center py-16">
          <h3 className="text-xl font-semibold text-gray-900">No responses yet</h3>
          <p className="text-gray-500 mt-2">Share your form link to start collecting data.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => (
            <Card
              key={response.id}
              hover
              onClick={() => onSelectResponse?.(response)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(response.submittedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">ID: {response.id}</p>
                </div>
                <Button variant="ghost">View details</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewResponses;
