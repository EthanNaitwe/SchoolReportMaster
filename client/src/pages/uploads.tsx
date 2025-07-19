import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/upload-zone";
import DataValidation from "@/components/data-validation";
import WorkflowStatus from "@/components/workflow-status";
import PDFPreviewModal from "@/components/pdf-preview-modal";

export default function Uploads() {
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
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-academic-text">File Uploads & Validation</h1>
            <p className="text-gray-600 mt-2">Upload Excel files and validate student grade data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
    </>
  );
}