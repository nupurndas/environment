# ECS Fargate Deployment Guide

## Environment Variables Configuration

### Backend Service
Required environment variables for ECS Task Definition:

```json
{
  "environment": [
    {
      "name": "PORT",
      "value": "3001"
    },
    {
      "name": "FRONTEND_URL",
      "value": "http://<ALB_DNS_NAME>"
    }
  ]
}
```

### Frontend Service
Required environment variables for ECS Task Definition:

```json
{
  "environment": [
    {
      "name": "REACT_APP_BACKEND_URL",
      "value": "http://<BACKEND_ALB_DNS_NAME>"
    }
  ]
}
```

**Note**: For ECS deployments, replace `<ALB_DNS_NAME>` and `<BACKEND_ALB_DNS_NAME>` with actual Application Load Balancer DNS names.

## ECS Task Definition Requirements

### Backend Task Definition
- **CPU**: 256 (.25 vCPU)
- **Memory**: 512 MB
- **Port Mappings**: 3001
- **Health Check**: `/health` endpoint
- **Network Mode**: awsvpc

### Frontend Task Definition
- **CPU**: 256 (.25 vCPU)
- **Memory**: 512 MB
- **Port Mappings**: 80
- **Health Check**: `/health` endpoint
- **Network Mode**: awsvpc

## Service Discovery (Optional)

For service-to-service communication within ECS:

1. Create AWS Cloud Map namespace
2. Register backend service with Cloud Map
3. Update frontend `REACT_APP_BACKEND_URL` to use service discovery endpoint:
   ```
   http://backend.local:3001
   ```

## Security Groups

### Backend Security Group
- **Inbound**: Port 3001 from Frontend Security Group
- **Outbound**: All traffic

### Frontend Security Group
- **Inbound**: Port 80 from ALB Security Group
- **Outbound**: All traffic

## Application Load Balancer

### Backend ALB
- **Target Group**: Port 3001
- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds

### Frontend ALB
- **Target Group**: Port 80
- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds

## Deployment Steps

1. Push images to Amazon ECR
2. Create ECS Task Definitions with environment variables
3. Create ECS Services with Fargate launch type
4. Configure Application Load Balancers
5. Update environment variables with ALB DNS names
6. Deploy services

## Testing

After deployment, test the endpoints:

```bash
# Backend health
curl http://<BACKEND_ALB_DNS>/health

# Frontend health
curl http://<FRONTEND_ALB_DNS>/health

# Backend API
curl http://<BACKEND_ALB_DNS>/api-docs
```
