import { useState } from "react";
import { GraduationCap, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardStats from "@/components/dashboard-stats";
import UploadZone from "@/components/upload-zone";
import DataValidation from "@/components/data-validation";
import WorkflowStatus from "@/components/workflow-status";
import ReportsSidebar from "@/components/reports-sidebar";
import PDFPreviewModal from "@/components/pdf-preview-modal";

export default function Dashboard() {
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleUploadSelect = (uploadId: number) => {
    setSelectedUploadId(uploadId);
  };

  const handleGeneratePDF = (uploadId: number, studentId: string) => {
    setSelectedUploadId(uploadId);
    setSelectedStudentId(studentId);
    setIsPDFPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-academic-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-academic-blue p-2 rounded-lg">
                <GraduationCap className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-academic-text">Academic Report System</h1>
                <p className="text-sm text-gray-500">Report Card Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* <Button className="bg-academic-blue hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                New Upload
              </Button> */}
              <Button variant="outline" size="icon" className="bg-gray-100 hover:bg-gray-200">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <UploadZone onUploadSuccess={handleUploadSelect} />
            <DataValidation 
              uploadId={selectedUploadId} 
              onGeneratePDF={handleGeneratePDF}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WorkflowStatus uploadId={selectedUploadId} />
            <ReportsSidebar onGeneratePDF={handleGeneratePDF} />
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
        uploadId={selectedUploadId}
        studentId={selectedStudentId}
      />
    </div>
  );
}
