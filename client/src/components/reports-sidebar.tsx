import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Plus, CheckSquare, FolderOutput, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ReportCard, Upload } from "@shared/types";

interface ReportsSidebarProps {
  onGeneratePDF: (uploadId: number, studentId: string) => void;
}

export default function ReportsSidebar({ onGeneratePDF }: ReportsSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery<ReportCard[]>({
    queryKey: ["/api/reports"],
  });

  const { data: uploads = [] } = useQuery<Upload[]>({
    queryKey: ["/api/uploads"],
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      const response = await apiRequest('POST', `/api/reports/bulk/${uploadId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk reports generated",
        description: `Generated ${data.reportCards?.length || 0} report cards successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate bulk reports.",
        variant: "destructive",
      });
    },
  });

  const approvedUploads = uploads.filter(upload => upload.status === 'approved');

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date().getTime();
    const reportTime = new Date(date).getTime();
    const diff = now - reportTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Group reports by upload
  const reportsByUpload = reports.reduce((acc, report) => {
    const key = `${report.grade}-${report.term}-${report.academicYear}`;
    if (!acc[key]) {
      acc[key] = {
        title: `${report.grade} - ${report.term} Reports`,
        count: 0,
        reports: [],
        latestDate: report.generatedAt,
      };
    }
    acc[key].count++;
    acc[key].reports.push(report);
    if (new Date(report.generatedAt) > new Date(acc[key].latestDate)) {
      acc[key].latestDate = report.generatedAt;
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      {/* Generated Reports */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-medium text-academic-text">
                Generated Reports
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Download report cards</p>
            </div>
            <Button variant="ghost" size="icon" className="text-academic-blue hover:text-blue-700">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {Object.keys(reportsByUpload).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">No reports generated yet</p>
              <p className="text-xs">Approve uploads to generate reports</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(reportsByUpload).slice(0, 3).map((group: any, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-academic-text">{group.title}</p>
                    <p className="text-xs text-gray-500">
                      {group.count} students • {formatTimeAgo(group.latestDate)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-academic-blue hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {approvedUploads.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    className="w-full bg-academic-blue hover:bg-blue-700 text-white"
                    onClick={() => {
                      const latestApproved = approvedUploads[0];
                      if (latestApproved) {
                        bulkGenerateMutation.mutate(latestApproved.id);
                      }
                    }}
                    disabled={bulkGenerateMutation.isPending}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {bulkGenerateMutation.isPending ? 'Generating...' : 'Generate New Reports'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-academic-text">
            Quick Actions
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto hover:bg-gray-50"
              disabled={uploads.filter(u => u.status === 'pending').length === 0}
            >
              <div className="bg-approval-green bg-opacity-10 p-2 rounded-lg mr-3">
                <CheckSquare className="h-4 w-4 text-approval-green" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-academic-text">Bulk Approve</p>
                <p className="text-xs text-gray-500">Approve multiple uploads</p>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto hover:bg-gray-50"
              disabled={reports.length === 0}
            >
              <div className="bg-academic-blue bg-opacity-10 p-2 rounded-lg mr-3">
                <FolderOutput className="h-4 w-4 text-academic-blue" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-academic-text">Export Data</p>
                <p className="text-xs text-gray-500">Download as Excel/CSV</p>
              </div>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 h-auto hover:bg-gray-50"
              disabled={reports.length === 0}
            >
              <div className="bg-gray-600 bg-opacity-10 p-2 rounded-lg mr-3">
                <Printer className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-academic-text">Print Reports</p>
                <p className="text-xs text-gray-500">Print-ready format</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
