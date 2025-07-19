import { 
  students, uploads, grades, reportCards, users,
  type Student, type InsertStudent,
  type Upload, type InsertUpload,
  type Grade, type InsertGrade,
  type ReportCard, type InsertReportCard,
  type User, type InsertUser
} from "@shared/schema";
import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import createMemoryStore from 'memorystore';

export interface IStorage {
  // Users (required for auth)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Session storage
  sessionStore: any;
  
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

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    try {
      const PostgresSessionStore = connectPg(session);
      this.sessionStore = new PostgresSessionStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
      });
    } catch (error) {
      console.warn('Failed to initialize PostgreSQL session store:', error);
      // Fallback to a simple memory store for development
      const MemoryStore = createMemoryStore(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  }

  // Users (required for auth)
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db
      .update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  // Uploads
  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async getAllUploads(): Promise<Upload[]> {
    return await db.select().from(uploads).orderBy(uploads.uploadedAt);
  }

  async getUploadsByStatus(status: string): Promise<Upload[]> {
    return await db.select().from(uploads).where(eq(uploads.status, status));
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const [upload] = await db.insert(uploads).values(insertUpload).returning();
    return upload;
  }

  async updateUpload(id: number, upload: Partial<Upload>): Promise<Upload | undefined> {
    const [updated] = await db
      .update(uploads)
      .set(upload)
      .where(eq(uploads.id, id))
      .returning();
    return updated;
  }

  // Grades
  async getGrade(id: number): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade;
  }

  async getGradesByUpload(uploadId: number): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.uploadId, uploadId));
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    return await db.select().from(grades).where(eq(grades.studentId, studentId));
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const [grade] = await db.insert(grades).values(insertGrade).returning();
    return grade;
  }

  async createMultipleGrades(insertGrades: InsertGrade[]): Promise<Grade[]> {
    if (insertGrades.length === 0) return [];
    return await db.insert(grades).values(insertGrades).returning();
  }

  async updateGrade(id: number, grade: Partial<Grade>): Promise<Grade | undefined> {
    const [updated] = await db
      .update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return updated;
  }

  // Report Cards
  async getReportCard(id: number): Promise<ReportCard | undefined> {
    const [reportCard] = await db.select().from(reportCards).where(eq(reportCards.id, id));
    return reportCard;
  }

  async getReportCardsByStudent(studentId: string): Promise<ReportCard[]> {
    return await db.select().from(reportCards).where(eq(reportCards.studentId, studentId));
  }

  async getReportCardsByUpload(uploadId: number): Promise<ReportCard[]> {
    return await db.select().from(reportCards).where(eq(reportCards.uploadId, uploadId));
  }

  async getAllReportCards(): Promise<ReportCard[]> {
    return await db.select().from(reportCards).orderBy(reportCards.generatedAt);
  }

  async createReportCard(insertReportCard: InsertReportCard): Promise<ReportCard> {
    const [reportCard] = await db.insert(reportCards).values(insertReportCard).returning();
    return reportCard;
  }

  async updateReportCard(id: number, reportCard: Partial<ReportCard>): Promise<ReportCard | undefined> {
    const [updated] = await db
      .update(reportCards)
      .set(reportCard)
      .where(eq(reportCards.id, id))
      .returning();
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalUploads: number;
    pendingApproval: number;
    reportsGenerated: number;
    successRate: number;
  }> {
    const allUploads = await db.select().from(uploads);
    const allReportCards = await db.select().from(reportCards);
    
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

export class MemStorage implements IStorage {
  sessionStore: any;
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private uploads: Map<number, Upload>;
  private grades: Map<number, Grade>;
  private reportCards: Map<number, ReportCard>;
  private currentUserId: number;
  private currentStudentId: number;
  private currentUploadId: number;
  private currentGradeId: number;
  private currentReportCardId: number;

  constructor() {
    try {
      const MemoryStore = createMemoryStore(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    } catch (error) {
      console.warn('Failed to initialize session store:', error);
      this.sessionStore = new Map();
    }

    this.users = new Map();
    this.students = new Map();
    this.uploads = new Map();
    this.grades = new Map();
    this.reportCards = new Map();
    this.currentUserId = 1;
    this.currentStudentId = 1;
    this.currentUploadId = 1;
    this.currentGradeId = 1;
    this.currentReportCardId = 1;
  }

  // Users (required for auth)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...userData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated: User = {
      ...existing,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
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

export class GoogleSheetsStorage implements IStorage {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private auth: any;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  sessionStore: any;

  constructor() {
    // Use memory store for Google Sheets (no session persistence needed)
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
    
    // Initialize Google Sheets API with service account credentials
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!;
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!;
    
    // Handle various private key formats
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Try to clean up the private key if it appears to be encoded
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Ensure proper formatting
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format. Make sure the private key is properly formatted.');
    }
    
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    
    // Don't initialize immediately - do it on first use
    console.log('Google Sheets storage created, will initialize on first use');
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeSheets();
    await this.initPromise;
  }

  private async initializeSheets(): Promise<void> {
    try {
      console.log('Initializing Google Sheets connection...');
      
      // Test the connection first
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      console.log(`Connected to spreadsheet: ${response.data.properties?.title}`);

      const existingSheets = response.data.sheets?.map(sheet => sheet.properties?.title) || [];
      const requiredSheets = ['users', 'students', 'uploads', 'grades', 'report_cards'];

      // Create missing sheets
      for (const sheetName of requiredSheets) {
        if (!existingSheets.includes(sheetName)) {
          console.log(`Creating sheet: ${sheetName}`);
          await this.createSheet(sheetName);
        }
      }

      // Initialize headers for each sheet
      await this.initializeHeaders();
      
      // Seed users if none exist  
      await this.seedUsersIfEmpty();
      
      this.initialized = true;
      console.log('Google Sheets initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      this.initPromise = null; // Reset so we can retry
      
      // Don't throw - continue with fallback storage
      console.log('Continuing without Google Sheets initialization');
      this.initialized = true; // Mark as initialized to prevent infinite loops
    }
  }

  private async createSheet(title: string) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: { title }
            }
          }]
        }
      });
    } catch (error) {
      console.error(`Error creating sheet ${title}:`, error);
    }
  }

  private async initializeHeaders() {
    const headers = {
      users: ['id', 'username', 'email', 'password', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'],
      students: ['id', 'studentId', 'name', 'grade', 'class', 'createdAt'],
      uploads: ['id', 'filename', 'originalName', 'fileSize', 'mimeType', 'status', 'uploadedBy', 'uploadedAt', 'approvedAt', 'approvedBy', 'validationResults', 'errorCount', 'validCount', 'totalCount'],
      grades: ['id', 'uploadId', 'studentId', 'studentName', 'subject', 'grade', 'numericGrade', 'gpa', 'class', 'term', 'academicYear', 'isValid', 'validationError', 'status', 'rejectionReason', 'reviewedBy', 'reviewedAt', 'createdAt'],
      report_cards: ['id', 'studentId', 'studentName', 'grade', 'class', 'term', 'academicYear', 'pdfPath', 'generatedAt', 'generatedBy', 'uploadId']
    };

    for (const [sheetName, headerRow] of Object.entries(headers)) {
      try {
        // Check if headers exist
        const { data } = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1:Z1`,
        });

        if (!data.values || data.values.length === 0 || data.values[0].length === 0) {
          // Add headers
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [headerRow]
            }
          });
        }
      } catch (error) {
        console.error(`Error initializing headers for ${sheetName}:`, error);
      }
    }
  }

  private async getNextId(sheetName: string): Promise<number> {
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
      });

      if (!data.values || data.values.length <= 1) return 1;
      
      const ids = data.values.slice(1).map(row => parseInt(row[0]) || 0).filter(id => id > 0);
      return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    } catch (error) {
      console.error(`Error getting next ID for ${sheetName}:`, error);
      return 1;
    }
  }

  private async appendRow(sheetName: string, values: any[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      });
    } catch (error) {
      console.error(`Error appending row to ${sheetName}:`, error);
      throw error;
    }
  }

  private async findRowByColumn(sheetName: string, columnIndex: number, value: any): Promise<{ row: any[], rowIndex: number } | null> {
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      if (!data.values || data.values.length <= 1) return null;

      for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i];
        if (row[columnIndex] && row[columnIndex].toString() === value.toString()) {
          return { row, rowIndex: i + 1 };
        }
      }
      return null;
    } catch (error) {
      console.error(`Error finding row in ${sheetName}:`, error);
      return null;
    }
  }

  private async updateRow(sheetName: string, rowIndex: number, values: any[]): Promise<void> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      });
    } catch (error) {
      console.error(`Error updating row in ${sheetName}:`, error);
      throw error;
    }
  }

  private parseStudent(row: any[]): Student | null {
    if (!row || row.length < 6) return null;
    return {
      id: parseInt(row[0]) || 0,
      studentId: row[1] || '',
      name: row[2] || '',
      grade: row[3] || '',
      class: row[4] || '',
      createdAt: new Date(row[5] || Date.now())
    };
  }

  private parseUpload(row: any[]): Upload | null {
    if (!row || row.length < 14) return null;
    return {
      id: parseInt(row[0]) || 0,
      filename: row[1] || '',
      originalName: row[2] || '',
      fileSize: parseInt(row[3]) || 0,
      mimeType: row[4] || '',
      status: row[5] || 'pending',
      uploadedBy: row[6] || '',
      uploadedAt: new Date(row[7] || Date.now()),
      approvedAt: row[8] ? new Date(row[8]) : null,
      approvedBy: row[9] || null,
      validationResults: row[10] ? JSON.parse(row[10]) : null,
      errorCount: parseInt(row[11]) || 0,
      validCount: parseInt(row[12]) || 0,
      totalCount: parseInt(row[13]) || 0
    };
  }

  private parseGrade(row: any[]): Grade | null {
    if (!row || row.length < 18) return null;
    return {
      id: parseInt(row[0]) || 0,
      uploadId: parseInt(row[1]) || 0,
      studentId: row[2] || '',
      studentName: row[3] || '',
      subject: row[4] || '',
      grade: row[5] || '',
      numericGrade: row[6] || null,
      gpa: row[7] || null,
      class: row[8] || null,
      term: row[9] || '',
      academicYear: row[10] || '',
      isValid: row[11] === 'true',
      validationError: row[12] || null,
      status: row[13] || 'pending',
      rejectionReason: row[14] || null,
      reviewedBy: row[15] || null,
      reviewedAt: row[16] ? new Date(row[16]) : null,
      createdAt: new Date(row[17] || Date.now())
    };
  }

  private parseUser(row: any[]): User | null {
    if (!row || row.length < 9) return null;
    
    const isActive = row[6] === 'true' || row[6] === true || row[6] === 'TRUE' || row[6] === 1 || row[6] === '1';
    
    return {
      id: parseInt(row[0]) || 0,
      username: row[1] || '',
      email: row[2] || '',
      password: row[3] || '',
      firstName: row[4] || null,
      lastName: row[5] || null,
      isActive: isActive,
      createdAt: new Date(row[7] || Date.now()),
      updatedAt: new Date(row[8] || Date.now())
    };
  }

  private parseReportCard(row: any[]): ReportCard | null {
    if (!row || row.length < 11) return null;
    return {
      id: parseInt(row[0]) || 0,
      studentId: row[1] || '',
      studentName: row[2] || '',
      grade: row[3] || '',
      class: row[4] || '',
      term: row[5] || '',
      academicYear: row[6] || '',
      pdfPath: row[7] || null,
      generatedAt: new Date(row[8] || Date.now()),
      generatedBy: row[9] || '',
      uploadId: parseInt(row[10]) || 0
    };
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('users', 0, id);
    return result ? this.parseUser(result.row) || undefined : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      const result = await this.findRowByColumn('users', 1, username);
      return result ? this.parseUser(result.row) || undefined : undefined;
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('users', 2, email);
    return result ? this.parseUser(result.row) || undefined : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInitialized();
    const id = await this.getNextId('users');
    const user: User = {
      ...insertUser,
      id,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const values = [
      user.id,
      user.username,
      user.email,
      user.password,
      user.firstName || '',
      user.lastName || '',
      user.isActive,
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    ];

    await this.appendRow('users', values);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.findRowByColumn('users', 0, id);
    if (!result) return undefined;

    const existing = this.parseUser(result.row);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...userData,
      updatedAt: new Date()
    };

    const values = [
      updated.id,
      updated.username,
      updated.email,
      updated.password,
      updated.firstName || '',
      updated.lastName || '',
      updated.isActive,
      updated.createdAt.toISOString(),
      updated.updatedAt.toISOString()
    ];

    await this.updateRow('users', result.rowIndex, values);
    return updated;
  }

  private async seedUsersIfEmpty(): Promise<void> {
    try {
      console.log('Checking if users need to be seeded...');
      
      // Check if users already exist
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'users!A:A',
      });

      // If there are rows besides header, users already exist
      if (data.values && data.values.length > 1) {
        console.log('Users already exist, skipping seeding');
        return;
      }

      console.log('No users found, seeding 5 default users...');
      
      // Create 5 seed users
      const seedUsers: InsertUser[] = [
        {
          username: 'admin',
          email: 'admin@school.edu',
          password: 'admin123', // In production, this should be hashed
          firstName: 'System',
          lastName: 'Administrator',
          isActive: true
        },
        {
          username: 'teacher1',
          email: 'sarah.johnson@school.edu',
          password: 'teacher123',
          firstName: 'Sarah',
          lastName: 'Johnson',
          isActive: true
        },
        {
          username: 'teacher2',
          email: 'mike.davis@school.edu',
          password: 'teacher123',
          firstName: 'Mike',
          lastName: 'Davis',
          isActive: true
        },
        {
          username: 'coordinator',
          email: 'lisa.wilson@school.edu',
          password: 'coord123',
          firstName: 'Lisa',
          lastName: 'Wilson',
          isActive: true
        },
        {
          username: 'principal',
          email: 'john.smith@school.edu',
          password: 'principal123',
          firstName: 'John',
          lastName: 'Smith',
          isActive: true
        }
      ];

      // Add each user
      console.log('Creating users...');
      for (let i = 0; i < seedUsers.length; i++) {
        const userData = seedUsers[i];
        console.log(`Creating user ${i + 1}: ${userData.username}`);
        try {
          await this.createUser(userData);
          console.log(`✓ Created user: ${userData.username}`);
        } catch (error) {
          console.error(`Error creating user ${userData.username}:`, error);
          // Continue with other users
        }
      }

      console.log('Successfully completed user seeding process');
    } catch (error) {
      console.error('Error seeding users:', error);
      // Don't throw error - continue with application startup
    }
  }

  // Students
  async getStudent(id: number): Promise<Student | undefined> {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('students', 0, id);
    return result ? this.parseStudent(result.row) || undefined : undefined;
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const result = await this.findRowByColumn('students', 1, studentId);
    return result ? this.parseStudent(result.row) || undefined : undefined;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = await this.getNextId('students');
    const student: Student = {
      ...insertStudent,
      id,
      createdAt: new Date()
    };

    const values = [
      student.id,
      student.studentId,
      student.name,
      student.grade,
      student.class,
      student.createdAt.toISOString()
    ];

    await this.appendRow('students', values);
    return student;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const result = await this.findRowByColumn('students', 0, id);
    if (!result) return undefined;

    const existing = this.parseStudent(result.row);
    if (!existing) return undefined;

    const updated = { ...existing, ...student };
    const values = [
      updated.id,
      updated.studentId,
      updated.name,
      updated.grade,
      updated.class,
      updated.createdAt.toISOString()
    ];

    await this.updateRow('students', result.rowIndex, values);
    return updated;
  }

  // Uploads
  async getUpload(id: number): Promise<Upload | undefined> {
    const result = await this.findRowByColumn('uploads', 0, id);
    return result ? this.parseUpload(result.row) || undefined : undefined;
  }

  async getAllUploads(): Promise<Upload[]> {
    try {
      await this.ensureInitialized();
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'uploads!A:Z',
      });

      if (!data.values || data.values.length <= 1) return [];

      const uploads = data.values.slice(1)
        .map(row => this.parseUpload(row))
        .filter((upload): upload is Upload => upload !== null);

      return uploads.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } catch (error) {
      console.error('Error getting all uploads:', error);
      return [];
    }
  }

  async getUploadsByStatus(status: string): Promise<Upload[]> {
    const allUploads = await this.getAllUploads();
    return allUploads.filter(upload => upload.status === status);
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = await this.getNextId('uploads');
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

    const values = [
      upload.id,
      upload.filename,
      upload.originalName,
      upload.fileSize,
      upload.mimeType,
      upload.status,
      upload.uploadedBy,
      upload.uploadedAt.toISOString(),
      upload.approvedAt ? upload.approvedAt.toISOString() : '',
      upload.approvedBy || '',
      upload.validationResults ? JSON.stringify(upload.validationResults) : '',
      upload.errorCount,
      upload.validCount,
      upload.totalCount
    ];

    await this.appendRow('uploads', values);
    return upload;
  }

  async updateUpload(id: number, upload: Partial<Upload>): Promise<Upload | undefined> {
    const result = await this.findRowByColumn('uploads', 0, id);
    if (!result) return undefined;

    const existing = this.parseUpload(result.row);
    if (!existing) return undefined;

    const updated = { ...existing, ...upload };
    const values = [
      updated.id,
      updated.filename,
      updated.originalName,
      updated.fileSize,
      updated.mimeType,
      updated.status,
      updated.uploadedBy,
      updated.uploadedAt.toISOString(),
      updated.approvedAt ? updated.approvedAt.toISOString() : '',
      updated.approvedBy || '',
      updated.validationResults ? JSON.stringify(updated.validationResults) : '',
      updated.errorCount,
      updated.validCount,
      updated.totalCount
    ];

    await this.updateRow('uploads', result.rowIndex, values);
    return updated;
  }

  // Grades
  async getGrade(id: number): Promise<Grade | undefined> {
    const result = await this.findRowByColumn('grades', 0, id);
    return result ? this.parseGrade(result.row) || undefined : undefined;
  }

  async getGradesByUpload(uploadId: number): Promise<Grade[]> {
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'grades!A:Z',
      });

      if (!data.values || data.values.length <= 1) return [];

      return data.values.slice(1)
        .map(row => this.parseGrade(row))
        .filter((grade): grade is Grade => grade !== null && grade.uploadId === uploadId);
    } catch (error) {
      console.error('Error getting grades by upload:', error);
      return [];
    }
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'grades!A:Z',
      });

      if (!data.values || data.values.length <= 1) return [];

      return data.values.slice(1)
        .map(row => this.parseGrade(row))
        .filter((grade): grade is Grade => grade !== null && grade.studentId === studentId);
    } catch (error) {
      console.error('Error getting grades by student:', error);
      return [];
    }
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const id = await this.getNextId('grades');
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

    const values = [
      grade.id,
      grade.uploadId,
      grade.studentId,
      grade.studentName,
      grade.subject,
      grade.grade,
      grade.numericGrade || '',
      grade.gpa || '',
      grade.class || '',
      grade.term,
      grade.academicYear,
      grade.isValid.toString(),
      grade.validationError || '',
      grade.status,
      grade.rejectionReason || '',
      grade.reviewedBy || '',
      grade.reviewedAt ? grade.reviewedAt.toISOString() : '',
      grade.createdAt.toISOString()
    ];

    await this.appendRow('grades', values);
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
    const result = await this.findRowByColumn('grades', 0, id);
    if (!result) return undefined;

    const existing = this.parseGrade(result.row);
    if (!existing) return undefined;

    const updated = { ...existing, ...grade };
    const values = [
      updated.id,
      updated.uploadId,
      updated.studentId,
      updated.studentName,
      updated.subject,
      updated.grade,
      updated.numericGrade || '',
      updated.gpa || '',
      updated.class || '',
      updated.term,
      updated.academicYear,
      updated.isValid.toString(),
      updated.validationError || '',
      updated.status,
      updated.rejectionReason || '',
      updated.reviewedBy || '',
      updated.reviewedAt ? updated.reviewedAt.toISOString() : '',
      updated.createdAt.toISOString()
    ];

    await this.updateRow('grades', result.rowIndex, values);
    return updated;
  }

  // Report Cards
  async getReportCard(id: number): Promise<ReportCard | undefined> {
    const result = await this.findRowByColumn('report_cards', 0, id);
    return result ? this.parseReportCard(result.row) || undefined : undefined;
  }

  async getReportCardsByStudent(studentId: string): Promise<ReportCard[]> {
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'report_cards!A:Z',
      });

      if (!data.values || data.values.length <= 1) return [];

      return data.values.slice(1)
        .map(row => this.parseReportCard(row))
        .filter((rc): rc is ReportCard => rc !== null && rc.studentId === studentId);
    } catch (error) {
      console.error('Error getting report cards by student:', error);
      return [];
    }
  }

  async getReportCardsByUpload(uploadId: number): Promise<ReportCard[]> {
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'report_cards!A:Z',
      });

      if (!data.values || data.values.length <= 1) return [];

      return data.values.slice(1)
        .map(row => this.parseReportCard(row))
        .filter((rc): rc is ReportCard => rc !== null && rc.uploadId === uploadId);
    } catch (error) {
      console.error('Error getting report cards by upload:', error);
      return [];
    }
  }

  async getAllReportCards(): Promise<ReportCard[]> {
    try {
      await this.ensureInitialized();
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'report_cards!A:Z',
      });

      if (!data.values || data.values.length <= 1) return [];

      const reportCards = data.values.slice(1)
        .map(row => this.parseReportCard(row))
        .filter((rc): rc is ReportCard => rc !== null);

      return reportCards.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    } catch (error) {
      console.error('Error getting all report cards:', error);
      return [];
    }
  }

  async createReportCard(insertReportCard: InsertReportCard): Promise<ReportCard> {
    const id = await this.getNextId('report_cards');
    const reportCard: ReportCard = {
      ...insertReportCard,
      id,
      generatedAt: new Date(),
      pdfPath: null
    };

    const values = [
      reportCard.id,
      reportCard.studentId,
      reportCard.studentName,
      reportCard.grade,
      reportCard.class,
      reportCard.term,
      reportCard.academicYear,
      reportCard.pdfPath || '',
      reportCard.generatedAt.toISOString(),
      reportCard.generatedBy,
      reportCard.uploadId
    ];

    await this.appendRow('report_cards', values);
    return reportCard;
  }

  async updateReportCard(id: number, reportCard: Partial<ReportCard>): Promise<ReportCard | undefined> {
    const result = await this.findRowByColumn('report_cards', 0, id);
    if (!result) return undefined;

    const existing = this.parseReportCard(result.row);
    if (!existing) return undefined;

    const updated = { ...existing, ...reportCard };
    const values = [
      updated.id,
      updated.studentId,
      updated.studentName,
      updated.grade,
      updated.class,
      updated.term,
      updated.academicYear,
      updated.pdfPath || '',
      updated.generatedAt.toISOString(),
      updated.generatedBy,
      updated.uploadId
    ];

    await this.updateRow('report_cards', result.rowIndex, values);
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalUploads: number;
    pendingApproval: number;
    reportsGenerated: number;
    successRate: number;
  }> {
    await this.ensureInitialized();
    const allUploads = await this.getAllUploads();
    const allReportCards = await this.getAllReportCards();

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

// Initialize storage with fallback to in-memory if Google Sheets fails
class StorageManager {
  private storageInstance: IStorage | null = null;
  private initPromise: Promise<IStorage> | null = null;

  async getStorage(): Promise<IStorage> {
    if (this.storageInstance) {
      return this.storageInstance;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeStorage();
    this.storageInstance = await this.initPromise;
    return this.storageInstance;
  }

  private async initializeStorage(): Promise<IStorage> {
    // Try Google Sheets first
    try {
      console.log('Attempting to initialize Google Sheets storage...');
      const sheetsStorage = new GoogleSheetsStorage();
      
      // Test the connection with a simple operation
      await sheetsStorage.getDashboardStats();
      
      console.log('Google Sheets storage initialized successfully');
      return sheetsStorage;
    } catch (error) {
      console.warn('Failed to initialize Google Sheets storage:', error);
      
      // Fallback to database
      try {
        console.log('Attempting to initialize Database storage...');
        const dbStorage = new DatabaseStorage();
        
        // Test the connection with a simple operation
        await dbStorage.getDashboardStats();
        
        console.log('Database storage initialized successfully');
        return dbStorage;
      } catch (dbError) {
        console.warn('Failed to initialize Database storage, falling back to in-memory storage:', dbError);
        console.log('Using in-memory storage - data will not persist between restarts');
        return new MemStorage();
      }
    }
  }
}

const storageManager = new StorageManager();

// Export a proxy that delegates to the storage manager
export const storage: IStorage = new Proxy({} as IStorage, {
  get(target, prop) {
    return async (...args: any[]) => {
      const storageInstance = await storageManager.getStorage();
      const method = (storageInstance as any)[prop];
      if (typeof method === 'function') {
        return method.apply(storageInstance, args);
      }
      return method;
    };
  }
});
