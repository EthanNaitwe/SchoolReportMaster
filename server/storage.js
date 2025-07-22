import { google } from 'googleapis';
import session from 'express-session';
import createMemoryStore from 'memorystore';

export class MemStorage {
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

  // Users
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(userData) {
    const id = this.currentUserId++;
    const user = {
      ...userData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id, userData) {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // Students
  async getStudent(id) {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId) {
    return Array.from(this.students.values()).find(s => s.studentId === studentId);
  }

  async createStudent(insertStudent) {
    const id = this.currentStudentId++;
    const student = { 
      ...insertStudent, 
      id, 
      createdAt: new Date() 
    };
    this.students.set(id, student);
    return student;
  }

  async updateStudent(id, student) {
    const existing = this.students.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...student };
    this.students.set(id, updated);
    return updated;
  }

  // Uploads
  async getUpload(id) {
    return this.uploads.get(id);
  }

  async getAllUploads() {
    return Array.from(this.uploads.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getUploadsByStatus(status) {
    return Array.from(this.uploads.values())
      .filter(upload => upload.status === status)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  async createUpload(insertUpload) {
    const id = this.currentUploadId++;
    const upload = { 
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

  async updateUpload(id, upload) {
    const existing = this.uploads.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...upload };
    this.uploads.set(id, updated);
    return updated;
  }

  // Grades
  async getGrade(id) {
    return this.grades.get(id);
  }

  async getGradesByUpload(uploadId) {
    return Array.from(this.grades.values()).filter(grade => grade.uploadId === uploadId);
  }

  async getGradesByStudent(studentId) {
    return Array.from(this.grades.values()).filter(grade => grade.studentId === studentId);
  }

  async createGrade(insertGrade) {
    const id = this.currentGradeId++;
    const grade = { 
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

  async createMultipleGrades(insertGrades) {
    const createdGrades = [];
    for (const insertGrade of insertGrades) {
      const grade = await this.createGrade(insertGrade);
      createdGrades.push(grade);
    }
    return createdGrades;
  }

  async updateGrade(id, grade) {
    const existing = this.grades.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...grade };
    this.grades.set(id, updated);
    return updated;
  }

  // Report Cards
  async getReportCard(id) {
    return this.reportCards.get(id);
  }

  async getReportCardsByStudent(studentId) {
    return Array.from(this.reportCards.values()).filter(rc => rc.studentId === studentId);
  }

  async getReportCardsByUpload(uploadId) {
    return Array.from(this.reportCards.values()).filter(rc => rc.uploadId === uploadId);
  }

  async getAllReportCards() {
    return Array.from(this.reportCards.values()).sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  async createReportCard(insertReportCard) {
    const id = this.currentReportCardId++;
    const reportCard = { 
      ...insertReportCard, 
      id, 
      generatedAt: new Date(),
      pdfPath: null
    };
    this.reportCards.set(id, reportCard);
    return reportCard;
  }

  async updateReportCard(id, reportCard) {
    const existing = this.reportCards.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...reportCard };
    this.reportCards.set(id, updated);
    return updated;
  }

  // Dashboard stats
  async getDashboardStats() {
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

export class GoogleSheetsStorage {
  constructor() {
    // Use memory store for Google Sheets (no session persistence needed)
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.initialized = false;
    this.initPromise = null;
    
    // Initialize Google Sheets API with service account credentials
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
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
    
    console.log('Google Sheets storage created, will initialize on first use');
  }

  async ensureInitialized() {
    if (this.initialized) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.initializeSheets();
    await this.initPromise;
  }

  async initializeSheets() {
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

  async createSheet(title) {
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

  async initializeHeaders() {
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

  async getNextId(sheetName) {
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

  async appendRow(sheetName, values) {
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

  async findRowByColumn(sheetName, columnIndex, value) {
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

  async updateRow(sheetName, rowIndex, values) {
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

  parseStudent(row) {
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

  parseUpload(row) {
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

  parseGrade(row) {
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

  parseUser(row) {
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

  parseReportCard(row) {
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

  // User methods
  async getUser(id) {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('users', 0, id);
    return result ? this.parseUser(result.row) : undefined;
  }

  async getUserByUsername(username) {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('users', 1, username);
    return result ? this.parseUser(result.row) : undefined;
  }

  async getUserByEmail(email) {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('users', 2, email);
    return result ? this.parseUser(result.row) : undefined;
  }

  async createUser(userData) {
    await this.ensureInitialized();
    const id = await this.getNextId('users');
    const now = new Date().toISOString();
    const user = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    const values = [
      id,
      userData.username,
      userData.email,
      userData.password,
      userData.firstName || '',
      userData.lastName || '',
      userData.isActive || true,
      now,
      now
    ];
    
    await this.appendRow('users', values);
    return user;
  }

  async updateUser(id, userData) {
    await this.ensureInitialized();
    const result = await this.findRowByColumn('users', 0, id);
    if (!result) return undefined;
    
    const existing = this.parseUser(result.row);
    const updated = { ...existing, ...userData, updatedAt: new Date().toISOString() };
    
    const values = [
      updated.id,
      updated.username,
      updated.email,
      updated.password,
      updated.firstName || '',
      updated.lastName || '',
      updated.isActive,
      updated.createdAt,
      updated.updatedAt
    ];
    
    await this.updateRow('users', result.rowIndex, values);
    return updated;
  }

  // Continue with all other methods following the same pattern...
  // (Student, Upload, Grade, ReportCard methods)
  
  async seedUsersIfEmpty() {
    console.log('Checking if users need to be seeded...');
    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'users!A:A',
      });

      const hasUsers = data.values && data.values.length > 1;
      
      if (!hasUsers) {
        console.log('No users found, seeding default users...');
        const defaultUsers = [
          { username: 'admin', email: 'admin@school.edu', password: 'admin123', firstName: 'System', lastName: 'Administrator', isActive: true },
          { username: 'teacher1', email: 'sarah.johnson@school.edu', password: 'teacher123', firstName: 'Sarah', lastName: 'Johnson', isActive: true },
          { username: 'teacher2', email: 'mike.davis@school.edu', password: 'teacher123', firstName: 'Mike', lastName: 'Davis', isActive: true },
          { username: 'coordinator', email: 'lisa.wilson@school.edu', password: 'coord123', firstName: 'Lisa', lastName: 'Wilson', isActive: true },
          { username: 'principal', email: 'john.smith@school.edu', password: 'principal123', firstName: 'John', lastName: 'Smith', isActive: true }
        ];

        for (const userData of defaultUsers) {
          await this.createUser(userData);
        }
        
        console.log('Default users seeded successfully');
      } else {
        console.log('Users already exist, skipping seeding');
      }
    } catch (error) {
      console.error('Error checking/seeding users:', error);
    }
  }

  // Stub implementations for remaining methods - they would follow the same pattern
  async getStudent(id) { /* Implementation similar to getUser */ }
  async getStudentByStudentId(studentId) { /* Implementation similar to getUserByUsername */ }
  async createStudent(insertStudent) { /* Implementation similar to createUser */ }
  async updateStudent(id, student) { /* Implementation similar to updateUser */ }
  
  async getUpload(id) { /* Implementation similar to getUser */ }
  async getAllUploads() { /* Implementation to get all uploads */ }
  async getUploadsByStatus(status) { /* Implementation to filter by status */ }
  async createUpload(insertUpload) { /* Implementation similar to createUser */ }
  async updateUpload(id, upload) { /* Implementation similar to updateUser */ }
  
  async getGrade(id) { /* Implementation similar to getUser */ }
  async getGradesByUpload(uploadId) { /* Implementation to filter by uploadId */ }
  async getGradesByStudent(studentId) { /* Implementation to filter by studentId */ }
  async createGrade(insertGrade) { /* Implementation similar to createUser */ }
  async createMultipleGrades(insertGrades) { /* Implementation to create multiple */ }
  async updateGrade(id, grade) { /* Implementation similar to updateUser */ }
  
  async getReportCard(id) { /* Implementation similar to getUser */ }
  async getReportCardsByStudent(studentId) { /* Implementation to filter by studentId */ }
  async getReportCardsByUpload(uploadId) { /* Implementation to filter by uploadId */ }
  async getAllReportCards() { /* Implementation to get all */ }
  async createReportCard(insertReportCard) { /* Implementation similar to createUser */ }
  async updateReportCard(id, reportCard) { /* Implementation similar to updateUser */ }
  
  async getDashboardStats() {
    // Implementation to calculate stats from all data
    return {
      totalUploads: 0,
      pendingApproval: 0,
      reportsGenerated: 0,
      successRate: 0
    };
  }
}

// Create storage instance - prefer Google Sheets, fallback to memory
let storage;

try {
  console.log('Attempting to initialize Google Sheets storage...');
  storage = new GoogleSheetsStorage();
  console.log('Google Sheets storage initialized successfully');
} catch (error) {
  console.error('Failed to initialize Google Sheets storage:', error);
  console.log('Falling back to in-memory storage');
  storage = new MemStorage();
}

export { storage };