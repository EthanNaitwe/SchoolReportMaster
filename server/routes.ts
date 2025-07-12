import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";
import { insertUploadSchema, insertGradeSchema } from "@shared/schema";
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

// Grade validation
const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function validateGradeData(data: any[]) {
  const validatedGrades = [];
  const errors = [];

  for (const row of data) {
    const validation = {
      studentId: row.studentId || row['Student ID'] || row['student_id'],
      studentName: row.studentName || row['Student Name'] || row['student_name'] || row.name,
      subject: row.subject || row.Subject,
      grade: row.grade || row.Grade,
      term: row.term || row.Term || 'Q1',
      academicYear: row.academicYear || row['Academic Year'] || row['academic_year'] || '2023-2024',
      gpa: row.gpa || row.GPA || calculateGPA(row.grade || row.Grade),
    };

    const rowErrors = [];
    
    if (!validation.studentId) rowErrors.push('Missing Student ID');
    if (!validation.studentName) rowErrors.push('Missing Student Name');
    if (!validation.subject) rowErrors.push('Missing Subject');
    if (!validation.grade) rowErrors.push('Missing Grade');
    if (validation.grade && !validGrades.includes(validation.grade)) {
      rowErrors.push(`Invalid Grade: ${validation.grade}`);
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: data.indexOf(row) + 1,
        errors: rowErrors,
        data: validation
      });
    } else {
      validatedGrades.push(validation);
    }
  }

  return { validatedGrades, errors };
}

function calculateGPA(grade: string): string {
  const gpaMap: Record<string, string> = {
    'A+': '4.0', 'A': '3.7', 'A-': '3.3',
    'B+': '3.0', 'B': '2.7', 'B-': '2.3',
    'C+': '2.0', 'C': '1.7', 'C-': '1.3',
    'D+': '1.0', 'D': '0.7', 'D-': '0.3',
    'F': '0.0'
  };
  return gpaMap[grade] || '0.0';
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Get all uploads
  app.get("/api/uploads", async (req, res) => {
    try {
      const uploads = await storage.getAllUploads();
      res.json(uploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to get uploads" });
    }
  });

  // Get upload by ID
  app.get("/api/uploads/:id", async (req, res) => {
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
  app.post("/api/uploads", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const uploadData = {
        filename: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: 'admin', // In a real app, get from auth
        status: 'pending' as const,
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
  app.get("/api/uploads/:id/grades", async (req, res) => {
    try {
      const uploadId = parseInt(req.params.id);
      const grades = await storage.getGradesByUpload(uploadId);
      res.json(grades);
    } catch (error) {
      res.status(500).json({ message: "Failed to get grades" });
    }
  });

  // Approve upload
  app.post("/api/uploads/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.updateUpload(id, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'admin', // In a real app, get from auth
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
  app.post("/api/uploads/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const upload = await storage.updateUpload(id, {
        status: 'rejected',
        approvedAt: new Date(),
        approvedBy: 'admin', // In a real app, get from auth
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
  app.post("/api/reports/generate", async (req, res) => {
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
      const chunks: Buffer[] = [];

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
        .text('Grade', 200, yPosition)
        .text('GPA', 300, yPosition);

      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(400, yPosition).stroke();
      yPosition += 10;

      for (const grade of studentGrades) {
        doc.text(grade.subject, 50, yPosition)
          .text(grade.grade, 200, yPosition)
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
  app.get("/api/reports", async (req, res) => {
    try {
      const reportCards = await storage.getAllReportCards();
      res.json(reportCards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get report cards" });
    }
  });

  // Generate bulk reports for an upload
  app.post("/api/reports/bulk/:uploadId", async (req, res) => {
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
            generatedBy: 'admin',
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

  const httpServer = createServer(app);
  return httpServer;
}
