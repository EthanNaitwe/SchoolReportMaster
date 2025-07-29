# Running Backend and Frontend on Separate Ports

This guide shows how to run the Tamayuz Report System with backend and frontend on separate ports for development.

## Configuration

### Backend Server
- **Port**: 3001 (development) / 5000 (production)
- **URL**: http://localhost:3001
- **Endpoints**: All `/api/*` routes

### Frontend Server  
- **Port**: 5000
- **URL**: http://localhost:5000
- **Proxy**: API calls automatically forwarded to backend on port 3001

## Running the Servers

### Option 1: Using the separate servers script
```bash
node separate-servers.js
```

### Option 2: Manual startup (two terminals)

**Terminal 1 - Backend:**
```bash
NODE_ENV=development tsx server/index.ts
```

**Terminal 2 - Frontend:**
```bash
vite --config client/vite.config.local.ts --port 5000 --host 0.0.0.0
```

### Option 3: Using concurrently
```bash
npx concurrently "NODE_ENV=development tsx server/index.ts" "vite --config client/vite.config.local.ts --port 5000 --host 0.0.0.0"
```

## How it Works

1. **Backend** runs on port 3001 and serves only API endpoints (`/api/*`)
2. **Frontend** runs on port 5000 using Vite dev server with HMR
3. **API Proxy** configured in `client/vite.config.local.ts` forwards `/api/*` requests to port 3001
4. **Client** accesses the application at http://localhost:5000
5. **API calls** from frontend are automatically proxied to the backend

## Benefits

- **Separate Concerns**: Backend and frontend run independently
- **Hot Module Replacement**: Frontend updates instantly during development
- **API Independence**: Backend can be tested separately on port 3001
- **Production Ready**: Same setup works for production deployment

## Testing the Setup

### Test Backend API
```bash
curl http://localhost:3001/api/user
```

### Test Frontend
```bash
curl http://localhost:5000
```

### Test API Proxy (from frontend)
```bash
curl http://localhost:5000/api/user
```

## Files Modified

- `server/index.ts` - Backend runs on port 3001 in development
- `client/vite.config.local.ts` - Frontend config with API proxy
- `separate-servers.js` - Script to run both servers concurrently

The original workflow still works for production builds where everything runs on port 5000.