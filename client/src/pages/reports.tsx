import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import ReportsSidebar from "@/components/reports-sidebar";
import PDFPreviewModal from "@/components/pdf-preview-modal";

export default function Reports() {
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
            <h1 className="text-2xl font-bold text-academic-text">Report Management</h1>
            <p className="text-gray-600 mt-2">Generate and manage student report cards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reports Content */}
          <div className="lg:col-span-2">
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
    </>
  );
}