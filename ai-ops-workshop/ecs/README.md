# TMS - Time Management System

Professional full-stack application with React frontend and Node.js backend.

## Features

### Frontend
- Modern React application with gradient styling and animations
- Login page with user authentication
- Timesheet entry form with 5 input fields
- Health check endpoint at `/health`
- Responsive design for all devices
- Production-ready build

### Backend
- RESTful API with Express.js
- Swagger UI documentation at `/api-docs`
- User profile management
- Timesheet data management
- Health check endpoint
- CORS enabled

## Local Development

### Build Docker Images

```bash
# Build both images
docker-compose build

# Or build individually
docker build -t ai-ops-frontend-ecs:latest ./frontend
docker build -t ai-ops-backend-ecs:latest ./backend
```

### Run Locally

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger UI: http://localhost:3001/api-docs
- Frontend Health: http://localhost:3000/health
- Backend Health: http://localhost:3001/health

### Test Service Communication

```bash
# Test from frontend container
docker exec tms-frontend nslookup backend
docker exec tms-frontend curl http://backend:3001/health

# Test from backend container
docker exec tms-backend nslookup frontend
docker exec tms-backend curl http://frontend:80/health
```

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users

### Timesheet
- `POST /api/timesheet` - Create timesheet entry
- `GET /api/timesheet` - Get all timesheet entries

### Health
- `GET /health` - Health check (returns 200)

## ECS Fargate Compatibility

Both Dockerfiles are optimized for:
- Multi-stage builds for minimal image size
- Linux/amd64 architecture
- ECS Fargate launch type
- Production workloads
- Network debugging tools (curl, nslookup)
- Environment variable configuration for service URLs

## Environment Variables

### Backend
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Frontend
- `REACT_APP_BACKEND_URL` - Backend API URL (default: http://localhost:3001)

For ECS deployment, see [ECS_DEPLOYMENT.md](./ECS_DEPLOYMENT.md)

## Project Structure

```
ecs/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Timesheet.js
│   │   │   └── Health.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```
