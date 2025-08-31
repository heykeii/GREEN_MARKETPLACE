import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

const ReportForm = ({ 
  reportedItemType, 
  reportedItemId, 
  reportedItemName, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidence: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = {
    product: [
      { value: 'inappropriate_content', label: 'Inappropriate Content' },
      { value: 'fake_product', label: 'Fake Product' },
      { value: 'poor_quality', label: 'Poor Quality' },
      { value: 'wrong_item', label: 'Wrong Item' },
      { value: 'scam', label: 'Scam' },
      { value: 'copyright_violation', label: 'Copyright Violation' },
      { value: 'other', label: 'Other' }
    ],
    user: [
      { value: 'harassment', label: 'Harassment' },
      { value: 'scam', label: 'Scam' },
      { value: 'spam', label: 'Spam' },
      { value: 'inappropriate_content', label: 'Inappropriate Content' },
      { value: 'other', label: 'Other' }
    ],
    review: [
      { value: 'inappropriate_content', label: 'Inappropriate Content' },
      { value: 'spam', label: 'Spam' },
      { value: 'fake_review', label: 'Fake Review' },
      { value: 'harassment', label: 'Harassment' },
      { value: 'other', label: 'Other' }
    ],
    order: [
      { value: 'wrong_item', label: 'Wrong Item' },
      { value: 'poor_quality', label: 'Poor Quality' },
      { value: 'scam', label: 'Scam' },
      { value: 'other', label: 'Other' }
    ]
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEvidenceChange = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...urls]
    }));
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reportedItemType,
          reportedItemId,
          reason: formData.reason,
          description: formData.description,
          evidence: formData.evidence
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Report submitted successfully');
        onSuccess && onSuccess(data.report);
        onClose && onClose();
      } else {
        toast.error(data.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemTypeLabel = (type) => {
    switch (type) {
      case 'product': return 'Product';
      case 'user': return 'User';
      case 'review': return 'Review';
      case 'order': return 'Order';
      default: return type;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Report {getItemTypeLabel(reportedItemType)}</CardTitle>
        <CardDescription>
          Help us maintain a safe and trustworthy marketplace by reporting issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium text-gray-600">Reporting:</Label>
          <div className="mt-1">
            <Badge variant="secondary" className="mr-2">
              {getItemTypeLabel(reportedItemType)}
            </Badge>
            <span className="text-sm">{reportedItemName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Report *
            </Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => handleInputChange('reason', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons[reportedItemType]?.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide detailed information about the issue..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-1"
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </div>
          </div>

          <div>
            <Label htmlFor="evidence" className="text-sm font-medium">
              Evidence (Optional)
            </Label>
            <Input
              id="evidence"
              type="file"
              multiple
              accept="image/*"
              onChange={handleEvidenceChange}
              className="mt-1"
            />
            <div className="text-xs text-gray-500 mt-1">
              Upload screenshots or images as evidence (max 5 files)
            </div>
          </div>

          {formData.evidence.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Uploaded Evidence:</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.evidence.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Evidence ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0"
                      onClick={() => removeEvidence(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;
