import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, X } from "lucide-react";
import type { Upload, Grade } from "@shared/schema";

interface DataValidationProps {
  uploadId: number | null;
  onGeneratePDF: (uploadId: number, studentId: string) => void;
}

export default function DataValidation({ uploadId, onGeneratePDF }: DataValidationProps) {
  const { data: upload } = useQuery<Upload>({
    queryKey: ["/api/uploads", uploadId],
    enabled: !!uploadId,
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/uploads", uploadId, "grades"],
    enabled: !!uploadId,
  });

  if (!uploadId || !upload) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-academic-text">
            Data Validation Results
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Select an upload to view student data and validation results
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

  // Get unique students for counting and individual PDF generation
  const uniqueStudents = grades.reduce((acc, grade) => {
    if (!acc.find(s => s.studentId === grade.studentId)) {
      acc.push({
        studentId: grade.studentId,
        studentName: grade.studentName,
      });
    }
    return acc;
  }, [] as { studentId: string; studentName: string }[]);

  // Count unique students with valid/invalid grades
  const studentsWithValidGrades = new Set();
  const studentsWithInvalidGrades = new Set();
  grades.forEach(grade => {
    if (grade.isValid) {
      studentsWithValidGrades.add(grade.studentId);
    } else {
      studentsWithInvalidGrades.add(grade.studentId);
    }
  });

  // Group grades by student for table display
  const studentData = grades.reduce((acc, grade) => {
    const existing = acc.find(s => s.studentId === grade.studentId);
    if (existing) {
      existing.subjects[grade.subject] = {
        score: grade.numericGrade || '-',
        grade: grade.grade,
        isValid: grade.isValid,
        validationError: grade.validationError,
        status: (grade as any).status || 'pending',
        rejectionReason: (grade as any).rejectionReason
      };
      // Update overall student status
      if ((grade as any).status === 'rejected') {
        existing.status = 'rejected';
        existing.rejectionReason = (grade as any).rejectionReason;
      } else if ((grade as any).status === 'approved' && existing.status !== 'rejected') {
        existing.status = 'approved';
      }
    } else {
      acc.push({
        studentId: grade.studentId,
        studentName: grade.studentName,
        class: grade.class || '-',
        status: (grade as any).status || 'pending',
        rejectionReason: (grade as any).rejectionReason,
        subjects: {
          [grade.subject]: {
            score: grade.numericGrade || '-',
            grade: grade.grade,
            isValid: grade.isValid,
            validationError: grade.validationError,
            status: (grade as any).status || 'pending',
            rejectionReason: (grade as any).rejectionReason
          }
        }
      });
    }
    return acc;
  }, [] as any[]);

  // Get all unique subjects for column headers
  const allSubjects = [...new Set(grades.map(g => g.subject))].sort();

  return (
    <Card className="bg-white border border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-academic-text">
          Data Validation Results
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          View uploaded student data and validation results
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
                  <div className="text-2xl font-bold text-approval-green">{studentsWithValidGrades.size}</div>
                  <div className="text-sm text-gray-600">Students with Valid Data</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-academic-error">{studentsWithInvalidGrades.size}</div>
                  <div className="text-sm text-gray-600">Students with Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-academic-text">{uniqueStudents.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
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
                      Class
                    </th>
                    {allSubjects.map(subject => (
                      <th key={subject} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {subject}
                      </th>
                    ))}
                    {allSubjects.map(subject => (
                      <th key={`${subject}-grade`} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {subject} Grade
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentData.slice(0, 10).map((student) => {
                    const hasErrors = Object.values(student.subjects).some((sub: any) => !sub.isValid);
                    return (
                      <tr key={student.studentId}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                          {student.studentId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                          {student.studentName}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-academic-text">
                          {student.class}
                        </td>
                        {/* Subject scores */}
                        {allSubjects.map(subject => {
                          const subjectData = student.subjects[subject];
                          return (
                            <td key={subject} className="px-4 py-4 whitespace-nowrap text-sm text-center">
                              <span className={subjectData && !subjectData.isValid ? "text-academic-error" : "text-academic-text"}>
                                {subjectData ? subjectData.score : '-'}
                              </span>
                              {subjectData && subjectData.validationError && (
                                <div className="text-xs text-academic-error mt-1">
                                  {subjectData.validationError}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        {/* Subject grades */}
                        {allSubjects.map(subject => {
                          const subjectData = student.subjects[subject];
                          return (
                            <td key={`${subject}-grade`} className="px-4 py-4 whitespace-nowrap text-sm text-center">
                              <span className={subjectData && !subjectData.isValid ? "text-academic-error" : "text-academic-text"}>
                                {subjectData ? subjectData.grade : '-'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${
                                hasErrors 
                                  ? 'bg-academic-error text-white' 
                                  : 'bg-approval-green text-white'
                              }`}>
                                {hasErrors ? 'Has Errors' : 'Valid'}
                              </Badge>
                            </div>
                            
                            {!hasErrors && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onGeneratePDF(upload.id, student.studentId)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {uniqueStudents.length > 10 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing first 10 of {uniqueStudents.length} students
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 text-center">
                <span className="text-approval-green font-medium">{studentsWithValidGrades.size} students with valid data</span> • 
                <span className="text-academic-error font-medium ml-1">{studentsWithInvalidGrades.size} students with errors</span> • 
                <span className="text-academic-text ml-1">{uniqueStudents.length} total students</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
