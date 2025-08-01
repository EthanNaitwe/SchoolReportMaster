# Tamayuz Report System

## Overview

This is a full-stack TypeScript application built for managing academic report cards. The system allows users to upload Excel files containing student grade data, validate the data, approve uploads through an admin workflow, and generate PDF report cards. The application features a modern React frontend with a Node.js/Express backend, using Google Sheets as the primary database with in-memory storage fallback.

## Recent Changes

**July 29, 2025**
- ✓ Successfully configured separate server setup for development
- ✓ Backend API now runs on port 3001 in development mode
- ✓ Frontend Vite dev server runs on port 5000 with API proxy configuration
- ✓ Created separate server scripts and configuration files for independent development
- ✓ Maintained production build compatibility (both servers on port 5000)
- ✓ Added comprehensive documentation for separate server development workflow
- ✓ Enhanced development experience with concurrent server management

**July 28, 2025**
- ✓ Updated record counting system to count unique students instead of total grade records
- ✓ Modified backend upload processing to count distinct students for validation
- ✓ Updated frontend data validation components to display student counts correctly
- ✓ Enhanced workflow status component to show "students valid" instead of "records valid"
- ✓ Improved user experience by showing meaningful student-based statistics throughout the application
- ✓ Removed entire approval workflow process - uploads now automatically processed
- ✓ Updated backend routes to set uploads as 'approved' automatically without manual review
- ✓ Simplified data validation component to remove approval buttons and dialogs
- ✓ Modified workflow status to show 3 steps instead of 4 (removed admin approval step)
- ✓ Updated dashboard stats to show "Recent Uploads" instead of "Pending Approval"
- ✓ Enhanced upload flow to automatically display validation results immediately after upload
- ✓ Fixed critical PDF generation bug caused by upload status mismatch between 'pending' and 'approved'
- ✓ Updated storage logic to properly preserve 'approved' status during upload creation
- ✓ Reformatted PDF reports to match attached template showing tabular layout with subjects and grades
- ✓ Implemented spreadsheet-style PDF format with Student ID, Name, Class, and subject columns
- ✓ Enhanced PDF layout to show both numeric scores and letter grades for each subject
- ✓ Added summary section with overall average score and GPA calculations
- ✓ Cleaned up debug logging and error messages in report generation routes

**July 22, 2025**
- ✓ Converted all server-side TypeScript files to JavaScript (.js extension)
- ✓ Created JavaScript versions: index.js, routes.js, storage.js, replitAuth.js, vite.js
- ✓ Updated import paths in TypeScript files to reference JavaScript versions
- ✓ Application running successfully with JavaScript backend and TypeScript frontend
- ✓ Maintained all functionality during TypeScript to JavaScript conversion
- ✓ Preserved Google Sheets integration and authentication system
- ✓ Backend now uses pure JavaScript while client remains TypeScript/React

**July 19, 2025**
- ✓ Successfully completed migration from Replit Agent to Replit environment
- ✓ Configured Google Sheets as primary storage with in-memory fallback only
- ✓ Completely removed PostgreSQL dependencies and references (DATABASE_URL no longer needed)
- ✓ Successfully connected to "Tamayuz Junior School" spreadsheet
- ✓ All database schemas automatically created in Google Sheets format
- ✓ Maintained robust security practices with proper client/server separation
- ✓ Added user authentication system with active user validation
- ✓ Disabled registration - system now uses seeded admin users only
- ✓ Implemented bcryptjs for secure password handling
- ✓ Seeded 5 default users: admin, teacher1, teacher2, coordinator, principal
- ✓ Users must have active status to login and access system
- ✓ Fixed authentication system and routing - application fully functional
- ✓ Cleaned up codebase - removed all PostgreSQL/Drizzle dependencies and files

**July 12, 2025**
- Successfully migrated from Replit Agent to standard Replit environment
- Enhanced data validation display to show one row per student with subjects as columns
- Updated table format to display both scores and grades for each subject
- All security practices maintained with proper client/server separation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Theme**: Academic-focused design with custom CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: JavaScript with ES modules (converted from TypeScript)
- **API Style**: RESTful API with JSON responses
- **File Processing**: Multer for file uploads, XLSX for Excel parsing
- **PDF Generation**: PDFKit for report card generation
- **Validation**: Zod for schema validation
- **Authentication**: Passport.js with local strategy and bcryptjs password hashing

### Data Storage  
- **Primary Database**: Google Sheets with googleapis integration
- **Fallback**: In-memory storage (no data persistence)
- **Storage Implementation**: GoogleSheetsStorage class implementing IStorage interface
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Sheet Structure**: Each database table maps to a separate sheet (students, uploads, grades, report_cards, users)

## Key Components

### Core Entities
1. **Students**: Student records with ID, name, grade, and class
2. **Uploads**: File upload tracking with validation status
3. **Grades**: Individual grade records linked to uploads and students
4. **Report Cards**: Generated PDF reports with metadata

### Frontend Components
- **Dashboard Page**: Overview stats and quick navigation to other sections
- **Uploads Page**: File upload zone, data validation, and workflow status
- **Reports Page**: Report management and generation interface
- **Navigation Header**: Responsive navigation bar with page routing
- **PDF Preview Modal**: Report preview and download functionality
- **Component Library**: Reusable UI components (upload zone, data validation, etc.)

### Backend Services
- **File Upload Handler**: Processes Excel files and extracts grade data
- **Data Validation**: Validates student records and grade formats
- **PDF Generation**: Creates formatted report cards
- **Storage Interface**: Abstracted data access layer with Google Sheets integration

## Data Flow

1. **Upload Process**:
   - User uploads Excel file via drag-and-drop interface
   - Backend validates file format and processes rows
   - Invalid records are flagged with specific error messages
   - Upload status tracked (pending/approved/rejected)

2. **Validation Workflow**:
   - Admin reviews uploaded data and validation results
   - Can approve or reject uploads based on data quality
   - System tracks approval metadata (who, when)

3. **Report Generation**:
   - Individual PDF reports generated per student
   - Bulk generation available for entire uploads
   - Generated reports stored with metadata tracking

## External Dependencies

### Core Libraries
- **Database**: `googleapis` for Google Sheets integration
- **UI Components**: Extensive `@radix-ui` component collection
- **File Processing**: `multer` for uploads, `xlsx` for Excel parsing
- **PDF Generation**: `pdfkit` for report creation
- **Validation**: `zod` for runtime type checking

### Development Tools
- **Vite**: Build tool with React and TypeScript support
- **PostCSS**: CSS processing with Tailwind CSS
- **ESBuild**: Fast TypeScript compilation for production
- **Replit Integration**: Development environment optimizations

## Deployment Strategy

### Development Mode
- Vite dev server for frontend with HMR
- TSX for running TypeScript backend directly
- Concurrent frontend and backend development

### Production Build
- Vite builds optimized React bundle to `dist/public`
- ESBuild compiles backend TypeScript to `dist/index.js`
- Single Express server serves both API and static files
- Environment variable configuration for database connections

### Key Features
- **File Upload Validation**: Comprehensive Excel file processing with error reporting
- **Admin Approval Workflow**: Multi-step validation and approval process
- **PDF Report Generation**: Automated report card creation with academic formatting
- **Real-time Status Tracking**: Live updates on upload and processing status
- **Responsive Design**: Mobile-friendly interface with academic theme
- **Type Safety**: End-to-end TypeScript with shared schema definitions

The application is designed to handle the complete lifecycle of academic report generation, from data upload through final PDF delivery, with emphasis on data validation and administrative oversight.

## Recent Changes

### Migration to Replit Environment (July 12, 2025)
- ✓ Successfully migrated from Replit Agent to standard Replit environment
- ✓ Updated display format to show one row per student with all subjects and grades in separate columns
- ✓ Added individual student record approval/rejection functionality with narration system
- ✓ Enhanced data validation component with improved table layout matching academic report format
- ✓ Implemented rejection dialog with mandatory feedback for record corrections
- ✓ Extended database schema with student-level approval workflow tracking
- ✓ Added status tracking (pending/approved/rejected) for individual student records
- ✓ Enhanced UI with status badges, action buttons, and rejection reason tooltips

### New Features Added
- **Individual Record Management**: Admins can now approve or reject individual student records
- **Rejection Narration System**: Required feedback when rejecting records to help uploaders fix issues
- **Enhanced Table Display**: Student data now shows in academic report format with subjects as columns
- **Status Tracking**: Visual indicators for record status with hover tooltips for rejection reasons
- **Improved Workflow**: Granular control over data validation and approval process
- **Multi-Page Navigation**: Split interface into 3 focused pages (Dashboard, Uploads, Reports)
- **Google Sheets Integration**: Persistent data storage using Google Sheets API with automatic fallback