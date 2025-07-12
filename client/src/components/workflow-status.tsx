import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, FileText, Upload as UploadIcon } from "lucide-react";
import type { Upload } from "@shared/schema";

interface WorkflowStatusProps {
  uploadId: number | null;
}

export default function WorkflowStatus({ uploadId }: WorkflowStatusProps) {
  const { data: upload } = useQuery<Upload>({
    queryKey: ["/api/uploads", uploadId],
    enabled: !!uploadId,
  });

  const getWorkflowSteps = (upload?: Upload) => {
    if (!upload) {
      return [
        { title: "Data Upload", status: "pending", icon: UploadIcon },
        { title: "Data Validation", status: "pending", icon: FileText },
        { title: "Admin Approval", status: "pending", icon: Check },
        { title: "PDF Generation", status: "pending", icon: FileText },
      ];
    }

    const steps = [
      { 
        title: "Data Upload", 
        status: "completed", 
        icon: UploadIcon,
        timestamp: upload.uploadedAt 
      },
      { 
        title: "Data Validation", 
        status: upload.totalCount > 0 ? "completed" : "pending", 
        icon: FileText,
        timestamp: upload.totalCount > 0 ? upload.uploadedAt : null
      },
      { 
        title: "Admin Approval", 
        status: upload.status === 'approved' ? "completed" : 
                upload.status === 'rejected' ? "failed" : "in-progress", 
        icon: Check,
        timestamp: upload.approvedAt
      },
      { 
        title: "PDF Generation", 
        status: upload.status === 'approved' ? "available" : "pending", 
        icon: FileText,
        timestamp: upload.status === 'approved' ? upload.approvedAt : null
      },
    ];

    return steps;
  };

  const getStepIcon = (status: string, IconComponent: any) => {
    const iconClass = "text-white text-xs h-3 w-3";
    
    switch (status) {
      case "completed":
        return (
          <div className="bg-approval-green p-1 rounded-full mt-1">
            <Check className={iconClass} />
          </div>
        );
      case "in-progress":
        return (
          <div className="bg-academic-warning p-1 rounded-full mt-1">
            <Clock className={iconClass} />
          </div>
        );
      case "failed":
        return (
          <div className="bg-academic-error p-1 rounded-full mt-1">
            <IconComponent className={iconClass} />
          </div>
        );
      case "available":
        return (
          <div className="bg-approval-green p-1 rounded-full mt-1">
            <IconComponent className={iconClass} />
          </div>
        );
      default:
        return (
          <div className="bg-gray-300 p-1 rounded-full mt-1">
            <IconComponent className={iconClass} />
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string | Date | null) => {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just completed";
    if (hours === 1) return "Completed 1 hour ago";
    return `Completed ${hours} hours ago`;
  };

  const steps = getWorkflowSteps(upload);

  return (
    <Card className="bg-white border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-academic-text">
          Approval Workflow
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">Track approval status</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              {getStepIcon(step.status, step.icon)}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  step.status === 'failed' ? 'text-academic-error' : 'text-academic-text'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">
                  {step.status === 'completed' && step.timestamp ? 
                    formatTimestamp(step.timestamp) :
                    step.status === 'in-progress' ? 'In progress' :
                    step.status === 'failed' ? 'Failed' :
                    step.status === 'available' ? 'Available' :
                    'Pending'
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {upload && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Upload Status:</span>
                <span className={`font-medium ${
                  upload.status === 'approved' ? 'text-approval-green' :
                  upload.status === 'rejected' ? 'text-academic-error' :
                  'text-academic-warning'
                }`}>
                  {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                </span>
              </div>
              {upload.totalCount > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Data Quality:</span>
                  <span className="font-medium text-academic-text">
                    {upload.validCount}/{upload.totalCount} valid
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
