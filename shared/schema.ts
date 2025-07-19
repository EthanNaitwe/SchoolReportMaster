import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  validationResults: jsonb("validation_results"),
  errorCount: integer("error_count").default(0),
  validCount: integer("valid_count").default(0),
  totalCount: integer("total_count").default(0),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  uploadId: integer("upload_id").references(() => uploads.id).notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  numericGrade: text("numeric_grade"),
  gpa: text("gpa"),
  class: text("class"),
  term: text("term").notNull(),
  academicYear: text("academic_year").notNull(),
  isValid: boolean("is_valid").default(true),
  validationError: text("validation_error"),
  status: text("status").default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportCards = pgTable("report_cards", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(),
  term: text("term").notNull(),
  academicYear: text("academic_year").notNull(),
  pdfPath: text("pdf_path"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  generatedBy: text("generated_by").notNull(),
  uploadId: integer("upload_id").references(() => uploads.id).notNull(),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  uploadedAt: true,
  approvedAt: true,
  validationResults: true,
  errorCount: true,
  validCount: true,
  totalCount: true,
});

export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
  isValid: true,
  validationError: true,
});

export const insertReportCardSchema = createInsertSchema(reportCards).omit({
  id: true,
  generatedAt: true,
  pdfPath: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

export type ReportCard = typeof reportCards.$inferSelect;
export type InsertReportCard = z.infer<typeof insertReportCardSchema>;

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
