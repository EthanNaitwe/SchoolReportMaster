import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, FolderOpen, FileSpreadsheet, MoreVertical, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Upload } from "@shared/schema";

interface UploadZoneProps {
  onUploadSuccess: (uploadId: number) => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: uploads = [], isLoading } = useQuery<Upload[]>({
    queryKey: ["/api/uploads"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `File uploaded successfully with ${data.grades?.length || 0} valid records.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onUploadSuccess(data.upload.id);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file.",
        variant: "destructive",
      });
      setIsUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setIsUploading(true);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-approval-green text-white';
      case 'pending':
        return 'bg-academic-warning text-white';
      case 'rejected':
        return 'bg-academic-error text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date().getTime();
    const uploadTime = new Date(date).getTime();
    const diff = now - uploadTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${Math.round(kb / 1024 * 10) / 10} MB`;
  };

  return (
    <Card className="bg-white border border-gray-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-academic-text">
          Upload Student Results
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Upload Excel files containing student grades and information
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-800 font-medium mb-1">Expected Excel columns:</p>
              <p className="text-xs text-blue-700">
                Student ID, Name, Class, Mathematics, English, Social Studies, Science
              </p>
              <p className="text-xs text-blue-400 mt-1">
                Marks (0-100) will be converted to letter grades (A+, A-, B+, ...) automatically
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 bg-white hover:bg-blue-50 border-blue-200"
              onClick={() => {
                window.open('/api/template/download', '_blank');
              }}
            >
              <Download className="mr-1 h-3 w-3" />
              Template
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive 
              ? 'border-academic-blue bg-blue-50' 
              : 'border-gray-300 hover:border-academic-blue hover:bg-blue-50'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="max-w-md mx-auto">
            <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-academic-text mb-2">
              {isDragActive ? 'Drop Excel files here' : 'Drag & Drop Excel Files'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse your computer
            </p>
            <Button 
              type="button"
              className="bg-academic-blue hover:bg-blue-700 text-white"
              disabled={isUploading}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Choose Files'}
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Supported formats: .xlsx, .xls (Max 10MB)
            </p>
          </div>
        </div>

        {/* Recent Uploads */}
        <div>
          <h4 className="text-sm font-medium text-academic-text mb-3">Recent Uploads</h4>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg" />
              ))}
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No uploads yet. Upload your first Excel file to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.slice(0, 5).map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer"
                  onClick={() => onUploadSuccess(upload.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      upload.status === 'approved' ? 'bg-green-100' :
                      upload.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <FileSpreadsheet className={`h-5 w-5 ${
                        upload.status === 'approved' ? 'text-green-600' :
                        upload.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-academic-text">
                        {upload.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(upload.uploadedAt)} • {formatFileSize(upload.fileSize)}
                        {upload.totalCount > 0 && ` • ${upload.totalCount} records`}
                      </p>
                    </div>
                  </div>
                  {/* <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getStatusColor(upload.status)}`}>
                      {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() => onUploadSuccess(upload.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div> */}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
