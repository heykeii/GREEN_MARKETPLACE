import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import ReportForm from './ReportForm';

const ReportButton = ({ 
  reportedItemType, 
  reportedItemId, 
  reportedItemName, 
  variant = "outline",
  size = "sm",
  children = "Report",
  className = "",
  onSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (report) => {
    setIsOpen(false);
    if (onSuccess) {
      onSuccess(report);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
        >
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ReportForm
          reportedItemType={reportedItemType}
          reportedItemId={reportedItemId}
          reportedItemName={reportedItemName}
          onClose={() => setIsOpen(false)}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ReportButton;
