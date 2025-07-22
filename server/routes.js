import { createServer } from "http";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import multer from "multer";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// Grade validation - supports both numeric (0-100) and letter grades
const validLetterGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function isValidNumericGrade(grade) {
  const num = parseFloat(grade);
  return !isNaN(num) && num >= 0 && num <= 100;
}

function convertNumericToLetterGrade(numericGrade) {
  if (numericGrade >= 97) return 'A+';
  if (numericGrade >= 93) return 'A';
  if (numericGrade >= 90) return 'A-';
  if (numericGrade >= 87) return 'B+';
  if (numericGrade >= 83) return 'B';
  if (numericGrade >= 80) return 'B-';
  if (numericGrade >= 77) return 'C+';
  if (numericGrade >= 73) return 'C';
  if (numericGrade >= 70) return 'C-';
  if (numericGrade >= 67) return 'D+';
  if (numericGrade >= 63) return 'D';
  if (numericGrade >= 60) return 'D-';
  return 'F';
}

function validateGradeData(data) {
  const validatedGrades = [];
  const errors = [];

  for (const row of data) {
    const studentId = row['Student ID'] || row.studentId || row['StudentID'] || row['ID'];
    const studentName = row['Name'] || row['Student Name'] || row.studentName || row['Full Name'];
    const studentClass = row['Class'] || row.class || row['Grade'] || row.grade;
    const term = row.term || row.Term || row['Quarter'] || row['Semester'] || 'Q1';
    const academicYear = row.academicYear || row['Academic Year'] || row['School Year'] || '2023-2024';

    // Handle subjects as columns (Mathematics, English, Social Studies, Science, etc.)
    const subjects = ['Mathematics', 'English', 'Social Studies', 'Science', 'History', 'Physics', 'Chemistry', 'Biology'];
    
    for (const subject of subjects) {
      const gradeValue = row[subject];
      
      if (gradeValue !== undefined && gradeValue !== null && gradeValue !== '') {
        let letterGrade = '';
        let numericGrade = gradeValue;
        
        // Convert numeric grade to letter grade if needed
        if (isValidNumericGrade(gradeValue)) {
          letterGrade = convertNumericToLetterGrade(parseFloat(gradeValue));
        } else if (validLetterGrades.includes(gradeValue)) {
          letterGrade = gradeValue;
          numericGrade = gradeValue; // Keep original if already letter grade
        }

        const validation = {
          studentId: studentId,
          studentName: studentName,
          subject: subject,
          grade: letterGrade,
          numericGrade: numericGrade,
          class: studentClass,
          term: term,
          academicYear: academicYear,
          gpa: calculateGPA(letterGrade),
        };

        const rowErrors = [];
        
        if (!validation.studentId) rowErrors.push('Missing Student ID');
        if (!validation.studentName) rowErrors.push('Missing Student Name');
        if (!validation.grade) rowErrors.push(`Invalid ${subject} grade: ${gradeValue}`);

        if (rowErrors.length > 0) {
          errors.push({
            row: data.indexOf(row) + 1,
            errors: rowErrors,
            data: validation,
            subject: subject
          });
        } else {
          validatedGrades.push(validation);
        }
      }
    }
  }

  return { validatedGrades, errors };
}

function calculateGPA(grade) {
  const gpaMap = {
    'A+': '4.0', 'A': '3.7', 'A-': '3.3',
    'B+': '3.0', 'B': '2.7', 'B-': '2.3',
    'C+': '2.0', 'C': '1.7', 'C-': '1.3',
    'D+': '1.0', 'D': '0.7', 'D-': '0.3',
    'F': '0.0'
  };
  return gpaMap[grade] || '0.0';
}

export async function registerRoutes(app) {
  console.log('Setting up authentication...');
  
  // Auth middleware
  try {
    await setupAuth(app);
    console.log('Authentication setup completed');
  } catch (error) {
    console.error('Error setting up authentication:', error);
    throw error;
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Download sample Excel template
  app.get("/api/template/download", async (req, res) => {
    try {
      // Create sample data matching the user's format
      const sampleData = [
        {
          'Student ID': 'STU001',
          'Name': 'John Doe',
          'Class': 'S1A',
          'Mathematics': 78,
          'English': 82,
          'Social Studies': 91,
          'Science': 91
        },
        {
          'Student ID': 'STU002',
          'Name': 'Jane Mary',
          'Class': 'S1A',
          'Mathematics': 85,
          'English': 79,
          'Social Studies': 87,
          'Science': 87
        },
        {
          'Student ID': 'STU003',
          'Name': 'Alan Smith',
          'Class': 'S1A',
          'Mathematics': 90,
          'English': 88,
          'Social Studies': 95,
          'Science': 95
        }
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Results');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Student_Results_Template.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('Template generation error:', error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Get all uploads
  app.get("/api/uploads", isAuthenticated, async (req, res) => {
    try {
      const uploads = await storage.getAllUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to get uploads" });
    }
  });

  // Get upload by ID
  app.get("/api/uploads/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.getUpload(id);
      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      res.json(upload);
    } catch (error) {
      res.status(500).json({ message: "Failed to get upload" });
    }
  });

  // Upload Excel file
  app.post("/api/uploads", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('Request headers:', req.headers);
      console.log('File info:', req.file);
      
      if (!req.file) {
        console.log('No file found in request');
        return res.status(400).json({ message: "No file uploaded" });
      }

      const uploadData = {
        filename: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user?.username || 'unknown',
        status: 'pending',
      };

      const upload = await storage.createUpload(uploadData);

      // Process Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);

      // Validate data
      const { validatedGrades, errors } = validateGradeData(data);

      // Store grades
      const grades = await storage.createMultipleGrades(
        validatedGrades.map(grade => ({ ...grade, uploadId: upload.id }))
      );

      // Update upload with validation results
      const updatedUpload = await storage.updateUpload(upload.id, {
        validationResults: { validatedGrades, errors },
        errorCount: errors.length,
        validCount: validatedGrades.length,
        totalCount: data.length,
      });

      res.status(201).json({ upload: updatedUpload, grades, errors });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to process upload" });
    }
  });

  // Get grades for an upload
  app.get("/api/uploads/:id/grades", isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const grades = await storage.getGradesByUpload(uploadId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to get grades" });
    }
  });

  // Approve upload
  app.post("/api/uploads/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.updateUpload(id, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user?.username || 'unknown',
      });

      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      res.json(upload);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve upload" });
    }
  });

  // Reject upload
  app.post("/api/uploads/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.updateUpload(id, {
        status: 'rejected',
        approvedAt: new Date(),
        approvedBy: req.user?.username || 'unknown',
      });

      if (!upload) {
        return res.status(404).json({ message: "Upload not found" });
      }

      res.json(upload);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject upload" });
    }
  });

  // Generate PDF report for a student
  app.post("/api/reports/generate", isAuthenticated, async (req, res) => {
    try {
      const { uploadId, studentId } = req.body;

      if (!uploadId || !studentId) {
        return res.status(400).json({ message: "Upload ID and Student ID are required" });
      }

      const upload = await storage.getUpload(uploadId);
      if (!upload || upload.status !== 'approved') {
        return res.status(400).json({ message: "Upload not found or not approved" });
      }

      const grades = await storage.getGradesByUpload(uploadId);
      const studentGrades = grades.filter(g => g.studentId === studentId);

      if (studentGrades.length === 0) {
        return res.status(404).json({ message: "No grades found for student" });
      }

      const studentInfo = studentGrades[0];

      // Create PDF
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Create report card record
        const reportCard = await storage.createReportCard({
          studentId: studentInfo.studentId,
          studentName: studentInfo.studentName,
          grade: '7th', // This should come from student data
          class: '7-A', // This should come from student data
          term: studentInfo.term,
          academicYear: studentInfo.academicYear,
          uploadId: uploadId,
          generatedBy: 'admin',
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${studentInfo.studentName}_Report_Card.pdf"`);
        res.send(pdfBuffer);
      });

      // Generate PDF content
      doc.fontSize(20).text('Academic Report Card', 50, 50, { align: 'center' });
      doc.fontSize(16).text('Riverside Elementary School', 50, 80, { align: 'center' });
      doc.fontSize(12).text(`Academic Year: ${studentInfo.academicYear} • Term: ${studentInfo.term}`, 50, 110, { align: 'center' });

      doc.fontSize(14).text('Student Information', 50, 150);
      doc.fontSize(12)
        .text(`Name: ${studentInfo.studentName}`, 50, 175)
        .text(`Student ID: ${studentInfo.studentId}`, 50, 195)
        .text(`Grade: 7th`, 50, 215) // This should come from student data
        .text(`Class: 7-A`, 50, 235); // This should come from student data

      doc.fontSize(14).text('Academic Performance', 50, 270);

      let yPosition = 300;
      doc.fontSize(12)
        .text('Subject', 50, yPosition)
        .text('Score', 150, yPosition)
        .text('Grade', 220, yPosition)
        .text('GPA', 300, yPosition);

      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(400, yPosition).stroke();
      yPosition += 10;

      for (const grade of studentGrades) {
        doc.text(grade.subject, 50, yPosition)
          .text(grade.numericGrade || '-', 150, yPosition)
          .text(grade.grade, 220, yPosition)
          .text(grade.gpa || '0.0', 300, yPosition);
        yPosition += 20;
      }

      // Calculate overall GPA
      const totalGPA = studentGrades.reduce((sum, g) => sum + parseFloat(g.gpa || '0'), 0);
      const avgGPA = studentGrades.length > 0 ? (totalGPA / studentGrades.length).toFixed(2) : '0.00';

      yPosition += 20;
      doc.fontSize(14).text(`Overall GPA: ${avgGPA}`, 50, yPosition);

      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, 50, yPosition + 50);

      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // Get all report cards
  app.get("/api/reports", isAuthenticated, async (req, res) => {
    try {
      const reportCards = await storage.getAllReportCards();
      res.json(reportCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get report cards" });
    }
  });

  // Approve individual student record
  app.post("/api/uploads/:uploadId/students/:studentId/approve", isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const studentId = req.params.studentId;
      
      const grades = await storage.getGradesByUpload(uploadId);
      const studentGrades = grades.filter(g => g.studentId === studentId);
      
      if (studentGrades.length === 0) {
        return res.status(404).json({ message: "Student not found in this upload" });
      }

      // Update all grades for this student
      const updatedGrades = [];
      for (const grade of studentGrades) {
        const updated = await storage.updateGrade(grade.id, {
          status: 'approved',
          reviewedBy: req.user?.username || 'unknown',
          reviewedAt: new Date(),
        });
        if (updated) updatedGrades.push(updated);
      }

      res.json({ message: "Student record approved", grades: updatedGrades });
    } catch (error) {
      console.error('Student approval error:', error);
      res.status(500).json({ message: "Failed to approve student record" });
    }
  });

  // Reject individual student record with reason
  app.post("/api/uploads/:uploadId/students/:studentId/reject", isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const studentId = req.params.studentId;
      const { reason } = req.body;
      
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const grades = await storage.getGradesByUpload(uploadId);
      const studentGrades = grades.filter(g => g.studentId === studentId);
      
      if (studentGrades.length === 0) {
        return res.status(404).json({ message: "Student not found in this upload" });
      }

      // Update all grades for this student with rejection
      const updatedGrades = [];
      for (const grade of studentGrades) {
        const updated = await storage.updateGrade(grade.id, {
          status: 'rejected',
          rejectionReason: reason,
          reviewedBy: req.user?.username || 'unknown',
          reviewedAt: new Date(),
        });
        if (updated) updatedGrades.push(updated);
      }

      res.json({ message: "Student record rejected", grades: updatedGrades });
    } catch (error) {
      console.error('Student rejection error:', error);
      res.status(500).json({ message: "Failed to reject student record" });
    }
  });

  // Generate bulk reports for an upload
  app.post("/api/reports/bulk/:uploadId", isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const upload = await storage.getUpload(uploadId);
      
      if (!upload || upload.status !== 'approved') {
        return res.status(400).json({ message: "Upload not found or not approved" });
      }

      const grades = await storage.getGradesByUpload(uploadId);
      const studentIds = Array.from(new Set(grades.map(g => g.studentId)));

      const reportCards = [];
      for (const studentId of studentIds) {
        const studentGrades = grades.filter(g => g.studentId === studentId);
        if (studentGrades.length > 0) {
          const studentInfo = studentGrades[0];
          const reportCard = await storage.createReportCard({
            studentId: studentInfo.studentId,
            studentName: studentInfo.studentName,
            grade: '7th', // This should come from student data
            class: '7-A', // This should come from student data
            term: studentInfo.term,
            academicYear: studentInfo.academicYear,
            uploadId: uploadId,
            generatedBy: req.user?.username || 'unknown',
          });
          reportCards.push(reportCard);
        }
      }

      res.json({ message: `Generated ${reportCards.length} report cards`, reportCards });
    } catch (error) {
      console.error('Bulk report generation error:', error);
      res.status(500).json({ message: "Failed to generate bulk reports" });
    }
  });

  console.log('Creating HTTP server...');
  const httpServer = createServer(app);
  console.log('HTTP server created successfully');
  return httpServer;
}