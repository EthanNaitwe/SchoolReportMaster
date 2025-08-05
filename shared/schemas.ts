import { z } from "zod";

// Zod schemas for server-side validation
export const insertStudentSchema = z.object({
  studentId: z.string(),
  name: z.string(),
  grade: z.string(),
  class: z.string(),
});

export const insertUploadSchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  uploadedBy: z.string(),
});

export const insertGradeSchema = z.object({
  uploadId: z.number(),
  studentId: z.string(),
  studentName: z.string(),
  subject: z.string(),
  grade: z.string(),
  numericGrade: z.string().optional(),
  gpa: z.string().optional(),
  class: z.string().optional(),
  term: z.string(),
  academicYear: z.string(),
});

export const insertReportCardSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  grade: z.string(),
  class: z.string(),
  term: z.string(),
  academicYear: z.string(),
  generatedBy: z.string(),
  uploadId: z.number(),
});

export const insertUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}); 