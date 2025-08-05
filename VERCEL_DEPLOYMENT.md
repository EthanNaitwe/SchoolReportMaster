# Vercel Deployment Guide

This guide will help you deploy your School Report Master application to Vercel.

## Prerequisites

1. Make sure you have a Vercel account
2. Install Vercel CLI: `npm i -g vercel`
3. Ensure your code is pushed to a Git repository (GitHub, GitLab, etc.)

## Project Structure

The project is configured for Vercel deployment with the following structure:

```
├── api/
│   └── index.ts          # Serverless API handler
├── client/
│   ├── package.json      # Client dependencies
│   ├── vite.config.ts    # Client build config
│   └── src/              # React application
├── server/
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── replitAuth.ts     # Authentication
├── shared/
│   └── schema.ts         # Shared types
└── vercel.json           # Vercel configuration
```

## Deployment Steps

### 1. Environment Variables

Set up the following environment variables in your Vercel project:

```bash
# Required for authentication
SESSION_SECRET=your-super-secret-session-key-here

# Google Sheets configuration (for data storage)
GOOGLE_SHEETS_SPREADSHEET_ID=your-google-sheets-spreadsheet-id
GOOGLE_SHEETS_CLIENT_EMAIL=your-google-service-account-email
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# Other environment variables as needed
NODE_ENV=production
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy from your project root:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your project

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure the project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: Leave empty (handled by vercel.json)
   - **Output Directory**: Leave empty (handled by vercel.json)

### 3. Build Configuration

The `vercel.json` file is configured to:

- Build the API using `@vercel/node`
- Build the client using `@vercel/static-build`
- Route API requests to `/api/*`
- Route all other requests to the client

### 4. Post-Deployment

After deployment:

1. **Set Environment Variables**: Go to your Vercel project dashboard → Settings → Environment Variables
2. **Configure Domain**: Set up your custom domain if needed
3. **Test the Application**: Verify that both API and client are working

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are properly listed in package.json files
   - Ensure TypeScript compilation is successful
   - Verify that all import paths are correct

2. **API Errors**:
   - Check that environment variables are set correctly
   - Verify that the database connection is working
   - Check server logs in Vercel dashboard

3. **Client Not Loading**:
   - Ensure the client build is successful
   - Check that the routing configuration is correct
   - Verify that static files are being served

### Debugging

1. **Check Build Logs**: Go to your Vercel project → Deployments → Latest deployment → Build logs
2. **Check Function Logs**: Go to Functions tab in your Vercel project
3. **Test API Endpoints**: Use tools like Postman or curl to test API endpoints

## Development vs Production

### Development
- Uses local server on port 3001 for API
- Uses Vite dev server on port 5000 for client
- Hot reload enabled

### Production (Vercel)
- API runs as serverless functions
- Client is built and served as static files
- No persistent server process

## File Uploads

The application supports file uploads for Excel files. In Vercel's serverless environment:

- Files are processed in memory (no persistent storage)
- Maximum file size is limited by Vercel's function limits
- Consider using external storage (AWS S3, etc.) for production

## Authentication

The application uses session-based authentication with:

- Express sessions for session management
- Passport.js for authentication strategies
- Session secret must be set via environment variable

## Database

The application uses a local storage system. For production:

- Consider migrating to a proper database (PostgreSQL, MongoDB, etc.)
- Update the storage.ts file to use your database
- Set up proper database connection pooling

## Performance Optimization

1. **Client**: 
   - Code splitting is configured in vite.config.ts
   - Static assets are optimized during build

2. **API**:
   - Functions have a 30-second timeout
   - Consider implementing caching for frequently accessed data

## Security Considerations

1. **Environment Variables**: Never commit secrets to your repository
2. **Session Security**: Use a strong SESSION_SECRET
3. **CORS**: Configure CORS properly for your domain
4. **File Uploads**: Validate file types and sizes
5. **Authentication**: Implement proper session management

## Monitoring

1. **Vercel Analytics**: Enable in your project settings
2. **Error Tracking**: Consider integrating error tracking services
3. **Performance Monitoring**: Monitor function execution times and cold starts

## Updates and Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Security Patches**: Monitor for security vulnerabilities
3. **Performance Monitoring**: Monitor application performance
4. **Backup Strategy**: Implement proper backup strategies for data

## Support

If you encounter issues:

1. Check Vercel's documentation
2. Review build and function logs
3. Test locally to isolate issues
4. Consider reaching out to Vercel support for platform-specific issues 