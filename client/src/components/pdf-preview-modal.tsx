import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Grade, Upload } from "@shared/schema";

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadId: number | null;
  studentId: string | null;
}

export default function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  uploadId, 
  studentId 
}: PDFPreviewModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/uploads", uploadId, "grades"],
    enabled: !!uploadId && isOpen,
  });

  const { data: upload } = useQuery<Upload>({
    queryKey: ["/api/uploads", uploadId],
    enabled: !!uploadId && isOpen,
  });

  const generatePDFMutation = useMutation({
    mutationFn: async ({ uploadId, studentId }: { uploadId: number; studentId: string }) => {
      setIsGenerating(true);
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId, studentId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate PDF');
      }

      return response.blob();
    },
    onSuccess: (blob, variables) => {
      setIsGenerating(false);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const studentGrade = grades.find(g => g.studentId === variables.studentId);
      const filename = `${studentGrade?.studentName || variables.studentId}_Report_Card.pdf`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Generated",
        description: `Report card for ${studentGrade?.studentName || variables.studentId} has been downloaded.`,
      });
      
      onClose();
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate PDF report.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadPDF = () => {
    if (uploadId && studentId) {
      generatePDFMutation.mutate({ uploadId, studentId });
    }
  };

  const studentGrades = grades.filter(g => g.studentId === studentId);
  const studentInfo = studentGrades[0];

  if (!studentInfo) {
    return null;
  }

  // Calculate overall GPA
  const totalGPA = studentGrades.reduce((sum, g) => sum + parseFloat(g.gpa || '0'), 0);
  const avgGPA = studentGrades.length > 0 ? (totalGPA / studentGrades.length).toFixed(2) : '0.00';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-academic-text">
            Report Card Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* PDF Preview Content */}
          <div className="bg-white border border-gray-300 rounded-lg p-8 mx-auto max-w-2xl shadow-sm" 
               style={{ aspectRatio: '8.5/11' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-academic-text">Tamayuz Junior School</h1>
              <p className="text-lg text-gray-600 mt-2">Student Report Card</p>
              <div className="border-t border-b border-gray-300 py-2 mt-4">
                <p className="text-sm text-gray-600">
                  Academic Year {studentInfo.academicYear} • {studentInfo.term}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-academic-text mb-2">Student Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {studentInfo.studentName}</p>
                  <p><span className="font-medium">Student ID:</span> {studentInfo.studentId}</p>
                  <p><span className="font-medium">Grade:</span> 7th</p>
                  <p><span className="font-medium">Class:</span> 7-A</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-academic-text mb-2">Term Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Term:</span> {studentInfo.term}</p>
                  <p><span className="font-medium">Days Present:</span> 42/45</p>
                  <p><span className="font-medium">Attendance:</span> 93.3%</p>
                </div>
              </div>
            </div>
            
            <h3 className="font-medium text-academic-text mb-3">Academic Performance</h3>
            <table className="w-full text-sm border border-gray-300 mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Subject</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Grade</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">GPA</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((grade, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2">{grade.subject}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {grade.grade}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {grade.gpa}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex justify-between items-end">
              <div className="text-sm">
                <p className="font-medium text-academic-text">Overall GPA: {avgGPA}</p>
              </div>
              <div className="text-sm text-gray-600">
                <p>Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-academic-blue hover:bg-blue-700 text-white"
            onClick={handleDownloadPDF}
            disabled={isGenerating || generatePDFMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating || generatePDFMutation.isPending ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
