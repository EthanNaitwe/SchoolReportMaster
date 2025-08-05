// Type definitions that can be safely shared between client and server
export interface Student {
  id: number;
  studentId: string;
  name: string;
  grade: string;
  class: string;
  createdAt: Date;
}

export interface Upload {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedBy: string;
  uploadedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  validationResults?: any;
  errorCount: number;
  validCount: number;
  totalCount: number;
}

export interface Grade {
  id: number;
  uploadId: number;
  studentId: string;
  studentName: string;
  subject: string;
  grade: string;
  numericGrade?: string;
  gpa?: string;
  class?: string;
  term: string;
  academicYear: string;
  isValid: boolean;
  validationError?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface ReportCard {
  id: number;
  studentId: string;
  studentName: string;
  grade: string;
  class: string;
  term: string;
  academicYear: string;
  pdfPath?: string;
  generatedAt: Date;
  generatedBy: string;
  uploadId: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Type definitions for insert operations (without zod)
export interface InsertStudent {
  studentId: string;
  name: string;
  grade: string;
  class: string;
}

export interface InsertUpload {
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
}

export interface InsertGrade {
  uploadId: number;
  studentId: string;
  studentName: string;
  subject: string;
  grade: string;
  numericGrade?: string;
  gpa?: string;
  class?: string;
  term: string;
  academicYear: string;
}

export interface InsertReportCard {
  studentId: string;
  studentName: string;
  grade: string;
  class: string;
  term: string;
  academicYear: string;
  generatedBy: string;
  uploadId: number;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}
