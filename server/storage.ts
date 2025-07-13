import { 
  students, uploads, grades, reportCards,
  type Student, type InsertStudent,
  type Upload, type InsertUpload,
  type Grade, type InsertGrade,
  type ReportCard, type InsertReportCard
} from "@shared/schema";

export interface IStorage {
  // Students
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  
  // Uploads
  getUpload(id: number): Promise<Upload | undefined>;
  getAllUploads(): Promise<Upload[]>;
  getUploadsByStatus(status: string): Promise<Upload[]>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  updateUpload(id: number, upload: Partial<Upload>): Promise<Upload | undefined>;
  
  // Grades
  getGrade(id: number): Promise<Grade | undefined>;
  getGradesByUpload(uploadId: number): Promise<Grade[]>;
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
  createMultipleGrades(grades: InsertGrade[]): Promise<Grade[]>;
  updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined>;
  
  // Report Cards
  getReportCard(id: number): Promise<ReportCard | undefined>;
  getReportCardsByStudent(studentId: string): Promise<ReportCard[]>;
  getReportCardsByUpload(uploadId: number): Promise<ReportCard[]>;
  getAllReportCards(): Promise<ReportCard[]>;
  createReportCard(reportCard: InsertReportCard): Promise<ReportCard>;
  updateReportCard(id: number, reportCard: Partial<ReportCard>): Promise<ReportCard | undefined>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalUploads: number;
    pendingApproval: number;
    reportsGenerated: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private students: Map<number, Student>;
  private uploads: Map<number, Upload>;
  private grades: Map<number, Grade>;
  private reportCards: Map<number, ReportCard>;
  private currentStudentId: number;
  private currentUploadId: number;
  private currentGradeId: number;
  private currentReportCardId: number;

  constructor() {
    this.students = new Map();
    this.uploads = new Map();
    this.grades = new Map();
    this.reportCards = new Map();
    this.currentStudentId = 1;
    this.currentUploadId = 1;
    this.currentGradeId = 1;
    this.currentReportCardId = 1;
  }

  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(s => s.studentId === studentId);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const student: Student = { 
      ...insertStudent, 
      id, 
      createdAt: new Date() 
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...student };
    this.students.set(id, updated);
    return updated;
  }

  // Uploads
  async getUpload(id: number): Promise<Upload | undefined> {
    return this.uploads.get(id);
  }

  async getAllUploads(): Promise<Upload[]> {
    return Array.from(this.uploads.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getUploadsByStatus(status: string): Promise<Upload[]> {
    return Array.from(this.uploads.values())
      .filter(upload => upload.status === status)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = this.currentUploadId++;
    const upload: Upload = { 
      ...insertUpload,
      status: insertUpload.status || 'pending',
      id, 
      uploadedAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      validationResults: null,
      errorCount: 0,
      validCount: 0,
      totalCount: 0
    };
    this.uploads.set(id, upload);
    return upload;
  }

  async updateUpload(id: number, upload: Partial<Upload>): Promise<Upload | undefined> {
    const existing = this.uploads.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...upload };
    this.uploads.set(id, updated);
    return updated;
  }

  // Grades
  async getGrade(id: number): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async getGradesByUpload(uploadId: number): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.uploadId === uploadId);
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return Array.from(this.grades.values()).filter(grade => grade.studentId === studentId);
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = this.currentGradeId++;
    const grade: Grade = { 
      ...insertGrade,
      gpa: insertGrade.gpa || null,
      numericGrade: insertGrade.numericGrade || null,
      class: insertGrade.class || null,
      id, 
      createdAt: new Date(),
      isValid: true,
      validationError: null,
      status: 'pending',
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null
    };
    this.grades.set(id, grade);
    return grade;
  }

  async createMultipleGrades(insertGrades: InsertGrade[]): Promise<Grade[]> {
    const createdGrades: Grade[] = [];
    for (const insertGrade of insertGrades) {
      const grade = await this.createGrade(insertGrade);
      createdGrades.push(grade);
    }
    return createdGrades;
  }

  async updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined> {
    const existing = this.grades.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...grade };
    this.grades.set(id, updated);
    return updated;
  }

  // Report Cards
  async getReportCard(id: number): Promise<ReportCard | undefined> {
    return this.reportCards.get(id);
  }

  async getReportCardsByStudent(studentId: string): Promise<ReportCard[]> {
    return Array.from(this.reportCards.values()).filter(rc => rc.studentId === studentId);
  }

  async getReportCardsByUpload(uploadId: number): Promise<ReportCard[]> {
    return Array.from(this.reportCards.values()).filter(rc => rc.uploadId === uploadId);
  }

  async getAllReportCards(): Promise<ReportCard[]> {
    return Array.from(this.reportCards.values()).sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  async createReportCard(insertReportCard: InsertReportCard): Promise<ReportCard> {
    const id = this.currentReportCardId++;
    const reportCard: ReportCard = { 
      ...insertReportCard, 
      id, 
      generatedAt: new Date(),
      pdfPath: null
    };
    this.reportCards.set(id, reportCard);
    return reportCard;
  }

  async updateReportCard(id: number, reportCard: Partial<ReportCard>): Promise<ReportCard | undefined> {
    const existing = this.reportCards.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...reportCard };
    this.reportCards.set(id, updated);
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalUploads: number;
    pendingApproval: number;
    reportsGenerated: number;
    successRate: number;
  }> {
    const allUploads = Array.from(this.uploads.values());
    const allReportCards = Array.from(this.reportCards.values());
    
    const totalUploads = allUploads.length;
    const pendingApproval = allUploads.filter(u => u.status === 'pending').length;
    const reportsGenerated = allReportCards.length;
    
    const approvedUploads = allUploads.filter(u => u.status === 'approved').length;
    const successRate = totalUploads > 0 ? (approvedUploads / totalUploads) * 100 : 0;
    
    return {
      totalUploads,
      pendingApproval,
      reportsGenerated,
      successRate: Math.round(successRate * 10) / 10
    };
  }
}

export const storage = new MemStorage();
