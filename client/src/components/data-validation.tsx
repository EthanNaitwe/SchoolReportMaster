import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Upload, Grade } from "@shared/schema";

interface DataValidationProps {
  uploadId: number | null;
  onGeneratePDF: (uploadId: number, studentId: string) => void;
}

export default function DataValidation({ uploadId, onGeneratePDF }: DataValidationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: upload } = useQuery<Upload>({
    queryKey: ["/api/uploads", uploadId],
    enabled: !!uploadId,
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/uploads", uploadId, "grades"],
    enabled: !!uploadId,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/uploads/${id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload approved",
        description: "The upload has been successfully approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval failed",
        description: error.message || "Failed to approve upload.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/uploads/${id}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload rejected",
        description: "The upload has been rejected.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection failed",
        description: error.message || "Failed to reject upload.",
        variant: "destructive",
      });
    },
  });

  if (!uploadId || !upload) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-academic-text">
            Data Validation
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Select an upload to review data validation results
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <X className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No upload selected</p>
            <p className="text-sm">Choose an upload from the recent uploads list to view validation details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validationResults = upload.validationResults as any;
  const errors = validationResults?.errors || [];
  const validGrades = grades.filter(g => g.isValid);
  const invalidGrades = grades.filter(g => !g.isValid);

  // Get unique students for individual PDF generation
  const uniqueStudents = grades.reduce((acc, grade) => {
    if (!acc.find(s => s.studentId === grade.studentId)) {
      acc.push({
        studentId: grade.studentId,
        studentName: grade.studentName,
      });
    }
    return acc;
  }, [] as { studentId: string; studentName: string }[]);

  return (
    <Card className="bg-white border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-academic-text">
          Data Validation
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Review uploaded data before approval
        </p>
      </CardHeader>
      
      <CardContent>
        {grades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">Loading validation results...</div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-approval-green">{validGrades.length}</div>
                  <div className="text-sm text-gray-600">Valid Records</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-academic-error">{invalidGrades.length}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-academic-text">{grades.length}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.slice(0, 10).map((grade) => (
                    <tr key={grade.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                        {grade.studentId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                        {grade.studentName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                        {grade.subject}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                        {grade.numericGrade || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={grade.isValid ? "text-academic-text" : "text-academic-error"}>
                          {grade.grade}
                        </span>
                        {grade.validationError && (
                          <div className="text-xs text-academic-error mt-1">
                            {grade.validationError}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={`text-xs ${
                          grade.isValid 
                            ? 'bg-approval-green text-white' 
                            : 'bg-academic-error text-white'
                        }`}>
                          {grade.isValid ? 'Valid' : 'Error'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {grade.isValid && upload.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGeneratePDF(upload.id, grade.studentId)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {grades.length > 10 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing first 10 of {grades.length} records
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 p-4 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="text-approval-green font-medium">{validGrades.length} valid</span> • 
                <span className="text-academic-error font-medium ml-1">{invalidGrades.length} errors</span> • 
                <span className="text-academic-text ml-1">{grades.length} total records</span>
              </div>
              <div className="space-x-3">
                {upload.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => rejectMutation.mutate(upload.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="bg-approval-green hover:bg-green-700 text-white"
                      onClick={() => approveMutation.mutate(upload.id)}
                      disabled={approveMutation.isPending || invalidGrades.length > 0}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {approveMutation.isPending ? 'Approving...' : 'Approve Data'}
                    </Button>
                  </>
                )}
                {upload.status === 'approved' && uniqueStudents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Generate individual reports:</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueStudents.slice(0, 5).map((student) => (
                        <Button
                          key={student.studentId}
                          size="sm"
                          variant="outline"
                          onClick={() => onGeneratePDF(upload.id, student.studentId)}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          {student.studentName}
                        </Button>
                      ))}
                      {uniqueStudents.length > 5 && (
                        <span className="text-sm text-gray-500 self-center">
                          +{uniqueStudents.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
