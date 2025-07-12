# Academic Report System

## Overview

This is a full-stack TypeScript application built for managing academic report cards. The system allows users to upload Excel files containing student grade data, validate the data, approve uploads through an admin workflow, and generate PDF report cards. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

## Recent Changes

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
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **File Processing**: Multer for file uploads, XLSX for Excel parsing
- **PDF Generation**: PDFKit for report card generation
- **Validation**: Zod for schema validation

### Data Storage
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Core Entities
1. **Students**: Student records with ID, name, grade, and class
2. **Uploads**: File upload tracking with validation status
3. **Grades**: Individual grade records linked to uploads and students
4. **Report Cards**: Generated PDF reports with metadata

### Frontend Components
- **Dashboard**: Main interface with stats overview and workflow management
- **Upload Zone**: Drag-and-drop file upload with validation feedback
- **Data Validation**: Review and approval interface for uploaded data
- **Workflow Status**: Visual progress tracking for upload processing
- **Reports Sidebar**: Report management and bulk generation tools
- **PDF Preview Modal**: Report preview and download functionality

### Backend Services
- **File Upload Handler**: Processes Excel files and extracts grade data
- **Data Validation**: Validates student records and grade formats
- **PDF Generation**: Creates formatted report cards
- **Storage Interface**: Abstracted data access layer (currently in-memory)

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
- **Database**: `@neondatabase/serverless` for PostgreSQL connection
- **ORM**: `drizzle-orm` and `drizzle-kit` for database operations
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