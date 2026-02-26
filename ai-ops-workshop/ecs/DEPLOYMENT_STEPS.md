# TMS Complete Deployment Guide

**Step-by-step guide to deploy the Time Management System from scratch**

---

## Prerequisites

- AWS CLI configured with credentials
- Docker installed and running
- AWS Account with ECS, RDS, ECR, ALB, IAM permissions
- Region: us-west-2 (modify if needed)
- Project directory: `/home/ec2-user/environment/ai-ops-workshop/ecs`

---

## Phase 1: Database Setup (RDS PostgreSQL)

### Step 1.1: Create RDS Parameter Group
```bash
aws rds create-db-parameter-group \
  --db-parameter-group-name tms-postgres-params \
  --db-parameter-group-family postgres16 \
  --description "TMS PostgreSQL parameters" \
  --region us-west-2
```

### Step 1.2: Disable SSL Requirement
```bash
aws rds modify-db-parameter-group \
  --db-parameter-group-name tms-postgres-params \
  --parameters "ParameterName=rds.force_ssl,ParameterValue=0,ApplyMethod=immediate" \
  --region us-west-2
```

### Step 1.3: Get Your VPC ID
```bash
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=isDefault,Values=true" \
  --region us-west-2 \
  --query 'Vpcs[0].VpcId' \
  --output text)
echo "VPC ID: $VPC_ID"
```

### Step 1.4: Create RDS Security Group
```bash
RDS_SG=$(aws ec2 create-security-group \
  --group-name tms-rds-sg \
  --description "Security group for TMS RDS" \
  --vpc-id $VPC_ID \
  --region us-west-2 \
  --query 'GroupId' \
  --output text)
echo "RDS Security Group: $RDS_SG"
```

### Step 1.5: Get Subnet IDs
```bash
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --region us-west-2 \
  --query 'Subnets[*].SubnetId' \
  --output text)
echo "Subnets: $SUBNET_IDS"

# Store first two subnets
SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')
```

### Step 1.6: Create DB Subnet Group
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name tms-db-subnet-group \
  --db-subnet-group-description "TMS DB subnet group" \
  --subnet-ids $SUBNET_1 $SUBNET_2 \
  --region us-west-2
```

### Step 1.7: Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier tms-postgres-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.4 \
  --master-username tmsadmin \
  --master-user-password TmsAdmin123! \
  --allocated-storage 20 \
  --db-name tmsdb \
  --db-parameter-group-name tms-postgres-params \
  --db-subnet-group-name tms-db-subnet-group \
  --vpc-security-group-ids $RDS_SG \
  --publicly-accessible \
  --backup-retention-period 7 \
  --region us-west-2
```

### Step 1.8: Wait for RDS (15-20 minutes)
```bash
echo "Waiting for RDS to be available (this takes 15-20 minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier tms-postgres-db \
  --region us-west-2
echo "✅ RDS is available"
```

### Step 1.9: Get RDS Endpoint
```bash
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier tms-postgres-db \
  --region us-west-2 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)
echo "RDS Endpoint: $RDS_ENDPOINT"
```

---

## Phase 2: Infrastructure Setup

### Step 2.1: Create ECS Cluster
```bash
aws ecs create-cluster \
  --cluster-name ecs-workshop \
  --region us-west-2
```

### Step 2.2: Get AWS Account ID
```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
```

### Step 2.3: Create ECR Repositories
```bash
# Frontend repository
aws ecr create-repository \
  --repository-name ai-ops-frontend-ecs \
  --region us-west-2

# Backend repository
aws ecr create-repository \
  --repository-name ai-ops-backend-ecs \
  --region us-west-2

# Next.js repository
aws ecr create-repository \
  --repository-name ai-ops-frontend-nextjs-ecs \
  --region us-west-2

echo "✅ ECR repositories created"
```

### Step 2.4: Create ALB Security Group
```bash
ALB_SG=$(aws ec2 create-security-group \
  --group-name tms-alb-sg \
  --description "Security group for TMS ALB" \
  --vpc-id $VPC_ID \
  --region us-west-2 \
  --query 'GroupId' \
  --output text)
echo "ALB Security Group: $ALB_SG"

# Allow HTTP traffic on port 80
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region us-west-2

# Allow traffic on port 8080 (backend)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 8080 \
  --cidr 0.0.0.0/0 \
  --region us-west-2

# Allow traffic on port 3002 (nextjs)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 3002 \
  --cidr 0.0.0.0/0 \
  --region us-west-2

echo "✅ ALB security group configured"
```

### Step 2.5: Create Task Security Group
```bash
TASK_SG=$(aws ec2 create-security-group \
  --group-name tms-task-sg \
  --description "Security group for TMS ECS tasks" \
  --vpc-id $VPC_ID \
  --region us-west-2 \
  --query 'GroupId' \
  --output text)
echo "Task Security Group: $TASK_SG"

# Allow port 80 from ALB (frontend)
aws ec2 authorize-security-group-ingress \
  --group-id $TASK_SG \
  --protocol tcp \
  --port 80 \
  --source-group $ALB_SG \
  --region us-west-2

# Allow port 3000 from ALB (nextjs)
aws ec2 authorize-security-group-ingress \
  --group-id $TASK_SG \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG \
  --region us-west-2

# Allow port 5000 from ALB (backend)
aws ec2 authorize-security-group-ingress \
  --group-id $TASK_SG \
  --protocol tcp \
  --port 5000 \
  --source-group $ALB_SG \
  --region us-west-2

# Allow RDS access from tasks
aws ec2 authorize-security-group-ingress \
  --group-id $RDS_SG \
  --protocol tcp \
  --port 5432 \
  --source-group $TASK_SG \
  --region us-west-2

echo "✅ Task security group configured"
```

### Step 2.6: Create Application Load Balancer
```bash
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name ai-ops-alb \
  --subnets $SUBNET_1 $SUBNET_2 \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --region us-west-2 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

echo "ALB ARN: $ALB_ARN"

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --region us-west-2 \
  --query 'LoadBalancers[0].DNSName' \
  --output text)
echo "ALB DNS: $ALB_DNS"
echo "✅ ALB created"
```

### Step 2.7: Create Target Groups
```bash
# Frontend target group (port 80)
FRONTEND_TG=$(aws elbv2 create-target-group \
  --name tms-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-west-2 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
echo "Frontend TG: $FRONTEND_TG"

# Backend target group (port 5000)
BACKEND_TG=$(aws elbv2 create-target-group \
  --name tms-backend-dotnet-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-west-2 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
echo "Backend TG: $BACKEND_TG"

# Next.js target group (port 3000)
NEXTJS_TG=$(aws elbv2 create-target-group \
  --name tms-nextjs-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /api/users \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-west-2 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
echo "Next.js TG: $NEXTJS_TG"
echo "✅ Target groups created"
```

### Step 2.8: Create ALB Listeners
```bash
# Port 80 - Frontend
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG \
  --region us-west-2

# Port 8080 - Backend
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 8080 \
  --default-actions Type=forward,TargetGroupArn=$BACKEND_TG \
  --region us-west-2

# Port 3002 - Next.js
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 3002 \
  --default-actions Type=forward,TargetGroupArn=$NEXTJS_TG \
  --region us-west-2

echo "✅ ALB listeners created"
```

### Step 2.9: Create IAM Task Execution Role
```bash
# Create trust policy
cat > /tmp/ecs-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole-tms \
  --assume-role-policy-document file:///tmp/ecs-trust-policy.json

# Attach policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole-tms \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Get role ARN
TASK_ROLE_ARN=$(aws iam get-role \
  --role-name ecsTaskExecutionRole-tms \
  --query 'Role.Arn' \
  --output text)
echo "Task Role ARN: $TASK_ROLE_ARN"
echo "✅ IAM role created"
```

---

## Phase 3: Application Configuration

### Step 3.1: Update Backend Configuration
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/backend-dotnet

cat > appsettings.json <<EOF
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=$RDS_ENDPOINT;Database=tmsdb;Username=tmsadmin;Password=TmsAdmin123!;SSL Mode=Disable",
    "LocalConnection": "Host=localhost;Database=tmsdb;Username=tmsadmin;Password=TmsAdmin123!"
  },
  "FrontendUrl": "http://$ALB_DNS"
}
EOF

echo "✅ Backend configuration updated"
```

### Step 3.2: Update Frontend Configuration
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/frontend

cat > .env.production <<EOF
REACT_APP_BACKEND_URL=http://$ALB_DNS:8080
REACT_APP_REPORT_URL=http://$ALB_DNS:3002
EOF

echo "✅ Frontend configuration updated"
```

---

## Phase 4: Build and Push Docker Images

### Step 4.1: Login to ECR
```bash
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com

echo "✅ Logged into ECR"
```

### Step 4.2: Build and Push Frontend
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/frontend

echo "Building frontend image..."
docker build -t ai-ops-frontend-ecs:latest .

docker tag ai-ops-frontend-ecs:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-ecs:latest

echo "Pushing frontend image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-ecs:latest

echo "✅ Frontend image pushed"
```

### Step 4.3: Build and Push Backend
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/backend-dotnet

echo "Building backend image..."
docker build -t ai-ops-backend-ecs:latest .

docker tag ai-ops-backend-ecs:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-backend-ecs:latest

echo "Pushing backend image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-backend-ecs:latest

echo "✅ Backend image pushed"
```

### Step 4.4: Build and Push Next.js
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/frontend-nextjs

echo "Building Next.js image..."
docker build -t ai-ops-frontend-nextjs-ecs:latest .

docker tag ai-ops-frontend-nextjs-ecs:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-nextjs-ecs:latest

echo "Pushing Next.js image..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-nextjs-ecs:latest

echo "✅ Next.js image pushed"
```

---

## Phase 5: Create ECS Task Definitions

### Step 5.1: Frontend Task Definition
```bash
cat > /tmp/frontend-task-def.json <<EOF
{
  "family": "ai-ops-frontend-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-ecs:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "REACT_APP_BACKEND_URL",
          "value": "http://$ALB_DNS:8080"
        },
        {
          "name": "REACT_APP_REPORT_URL",
          "value": "http://$ALB_DNS:3002"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-ops-frontend-task",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/frontend-task-def.json \
  --region us-west-2

echo "✅ Frontend task definition created"
```

### Step 5.2: Backend Task Definition
```bash
cat > /tmp/backend-task-def.json <<EOF
{
  "family": "ai-ops-backend-dotnet",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "backend-dotnet",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-backend-ecs:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FrontendUrl",
          "value": "http://$ALB_DNS"
        },
        {
          "name": "ConnectionStrings__DefaultConnection",
          "value": "Host=$RDS_ENDPOINT;Database=tmsdb;Username=tmsadmin;Password=TmsAdmin123!;SSL Mode=Disable"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-ops-backend-ecs",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/backend-task-def.json \
  --region us-west-2

echo "✅ Backend task definition created"
```

### Step 5.3: Next.js Task Definition
```bash
cat > /tmp/nextjs-task-def.json <<EOF
{
  "family": "ai-ops-nextjs-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "nextjs",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-nextjs-ecs:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "$RDS_ENDPOINT"
        },
        {
          "name": "DB_PORT",
          "value": "5432"
        },
        {
          "name": "DB_NAME",
          "value": "tmsdb"
        },
        {
          "name": "DB_USER",
          "value": "tmsadmin"
        },
        {
          "name": "DB_PASSWORD",
          "value": "TmsAdmin123!"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-ops-nextjs-task",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/users || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/nextjs-task-def.json \
  --region us-west-2

echo "✅ Next.js task definition created"
```

---

## Phase 6: Create ECS Services

### Step 6.1: Create Frontend Service
```bash
aws ecs create-service \
  --cluster ecs-workshop \
  --service-name ai-ops-frontend-ecs \
  --task-definition ai-ops-frontend-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$FRONTEND_TG,containerName=frontend,containerPort=80" \
  --region us-west-2

echo "✅ Frontend service created"
```

### Step 6.2: Create Backend Service
```bash
aws ecs create-service \
  --cluster ecs-workshop \
  --service-name ai-ops-backend-ecs \
  --task-definition ai-ops-backend-dotnet \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$BACKEND_TG,containerName=backend-dotnet,containerPort=5000" \
  --region us-west-2

echo "✅ Backend service created"
```

### Step 6.3: Create Next.js Service
```bash
aws ecs create-service \
  --cluster ecs-workshop \
  --service-name ai-ops-nextjs-ecs \
  --task-definition ai-ops-nextjs-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$NEXTJS_TG,containerName=nextjs,containerPort=3000" \
  --region us-west-2

echo "✅ Next.js service created"
```

---

## Phase 7: Initialize Database

### Step 7.1: Wait for Services (3 minutes)
```bash
echo "Waiting for services to stabilize (3 minutes)..."
sleep 180
echo "✅ Services should be running"
```

### Step 7.2: Check Service Status
```bash
aws ecs describe-services \
  --cluster ecs-workshop \
  --services ai-ops-frontend-ecs ai-ops-backend-ecs ai-ops-nextjs-ecs \
  --region us-west-2 \
  --query 'services[*].[serviceName,status,runningCount,desiredCount]' \
  --output table
```

### Step 7.3: Initialize Database Tables
```bash
echo "Initializing database..."
curl -X POST http://$ALB_DNS:3002/api/init

echo "✅ Database initialized"
```

### Step 7.4: Verify Database
```bash
PGPASSWORD='TmsAdmin123!' psql \
  -h $RDS_ENDPOINT \
  -U tmsadmin \
  -d tmsdb \
  -c "\dt"
```

---

## Phase 8: Verification

### Step 8.1: Check Target Health
```bash
echo "=== Frontend Target Health ==="
aws elbv2 describe-target-health \
  --target-group-arn $FRONTEND_TG \
  --region us-west-2 \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' \
  --output table

echo "=== Backend Target Health ==="
aws elbv2 describe-target-health \
  --target-group-arn $BACKEND_TG \
  --region us-west-2 \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' \
  --output table

echo "=== Next.js Target Health ==="
aws elbv2 describe-target-health \
  --target-group-arn $NEXTJS_TG \
  --region us-west-2 \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State]' \
  --output table
```

### Step 8.2: Test Endpoints
```bash
echo "=== Testing Frontend Health ==="
curl http://$ALB_DNS/health

echo -e "\n=== Testing Backend Health ==="
curl http://$ALB_DNS:8080/health

echo -e "\n=== Testing Backend Login ==="
curl -X POST http://$ALB_DNS:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"uid":"admin","password":"admin123"}'

echo -e "\n=== Testing Next.js Users API ==="
curl http://$ALB_DNS:3002/api/users

echo -e "\n=== Testing Next.js Timesheet API ==="
curl http://$ALB_DNS:3002/api/timesheet

echo -e "\n✅ All endpoints tested"
```

### Step 8.3: Test PDF Generation
```bash
echo "Downloading PDF report..."
curl -o /tmp/test-report.pdf "http://$ALB_DNS:3002/api/report?userId=1"

if [ -f /tmp/test-report.pdf ]; then
  echo "✅ PDF report downloaded successfully"
  ls -lh /tmp/test-report.pdf
else
  echo "❌ PDF download failed"
fi
```

---

## Phase 9: Access Application

### Application URLs
```bash
echo "=========================================="
echo "TMS Application Deployed Successfully!"
echo "=========================================="
echo ""
echo "Frontend Application:"
echo "  http://$ALB_DNS"
echo ""
echo "Backend API:"
echo "  http://$ALB_DNS:8080"
echo ""
echo "Reporting API:"
echo "  http://$ALB_DNS:3002"
echo ""
echo "Login Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "=========================================="
```

### Save Configuration
```bash
cat > /tmp/tms-deployment-info.txt <<EOF
TMS Deployment Information
==========================

Date: $(date)
Region: us-west-2

Infrastructure:
- VPC ID: $VPC_ID
- Subnet 1: $SUBNET_1
- Subnet 2: $SUBNET_2
- ALB Security Group: $ALB_SG
- Task Security Group: $TASK_SG
- RDS Security Group: $RDS_SG

Resources:
- ECS Cluster: ecs-workshop
- ALB ARN: $ALB_ARN
- ALB DNS: $ALB_DNS
- RDS Endpoint: $RDS_ENDPOINT
- Task Role ARN: $TASK_ROLE_ARN

Target Groups:
- Frontend TG: $FRONTEND_TG
- Backend TG: $BACKEND_TG
- Next.js TG: $NEXTJS_TG

Application URLs:
- Frontend: http://$ALB_DNS
- Backend: http://$ALB_DNS:8080
- Reporting: http://$ALB_DNS:3002

Database:
- Host: $RDS_ENDPOINT
- Port: 5432
- Database: tmsdb
- Username: tmsadmin
- Password: TmsAdmin123!

Login Credentials:
- Username: admin
- Password: admin123
EOF

echo "✅ Configuration saved to /tmp/tms-deployment-info.txt"
cat /tmp/tms-deployment-info.txt
```

---

## Monitoring and Logs

### View Service Logs
```bash
# Frontend logs
aws logs tail /ecs/ai-ops-frontend-task --follow --region us-west-2

# Backend logs
aws logs tail /ecs/ai-ops-backend-ecs --follow --region us-west-2

# Next.js logs
aws logs tail /ecs/ai-ops-nextjs-task --follow --region us-west-2
```

### Check Service Status
```bash
aws ecs describe-services \
  --cluster ecs-workshop \
  --services ai-ops-frontend-ecs ai-ops-backend-ecs ai-ops-nextjs-ecs \
  --region us-west-2 \
  --query 'services[*].[serviceName,status,runningCount,desiredCount,deployments[0].rolloutState]' \
  --output table
```

---

## Troubleshooting

### Issue: Services Not Starting
```bash
# Check service events
aws ecs describe-services \
  --cluster ecs-workshop \
  --services ai-ops-backend-ecs \
  --region us-west-2 \
  --query 'services[0].events[0:5].[createdAt,message]' \
  --output table
```

### Issue: Health Checks Failing
```bash
# Check target health details
aws elbv2 describe-target-health \
  --target-group-arn $BACKEND_TG \
  --region us-west-2 \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason,TargetHealth.Description]' \
  --output table

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $TASK_SG \
  --region us-west-2 \
  --query 'SecurityGroups[0].IpPermissions[*].[FromPort,ToPort,IpProtocol]' \
  --output table
```

### Issue: Database Connection Failed
```bash
# Test database connection
PGPASSWORD='TmsAdmin123!' psql \
  -h $RDS_ENDPOINT \
  -U tmsadmin \
  -d tmsdb \
  -c "SELECT version();"

# Check RDS security group
aws ec2 describe-security-groups \
  --group-ids $RDS_SG \
  --region us-west-2 \
  --query 'SecurityGroups[0].IpPermissions[*].[FromPort,ToPort,IpProtocol,UserIdGroupPairs[0].GroupId]' \
  --output table
```

### Issue: 504 Gateway Timeout
```bash
# This usually means security group is blocking traffic
# Verify port 5000 is allowed from ALB to tasks
aws ec2 describe-security-groups \
  --group-ids $TASK_SG \
  --region us-west-2 \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`5000`]' \
  --output json
```

---

## Update Deployment

### Update Frontend
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/frontend

# Make your changes, then:
docker build -t ai-ops-frontend-ecs:latest .
docker tag ai-ops-frontend-ecs:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-ecs:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-ecs:latest

# Force new deployment
aws ecs update-service \
  --cluster ecs-workshop \
  --service ai-ops-frontend-ecs \
  --force-new-deployment \
  --region us-west-2
```

### Update Backend
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/backend-dotnet

# Make your changes, then:
docker build -t ai-ops-backend-ecs:latest .
docker tag ai-ops-backend-ecs:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-backend-ecs:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-backend-ecs:latest

# Force new deployment
aws ecs update-service \
  --cluster ecs-workshop \
  --service ai-ops-backend-ecs \
  --force-new-deployment \
  --region us-west-2
```

### Update Next.js
```bash
cd /home/ec2-user/environment/ai-ops-workshop/ecs/frontend-nextjs

# Make your changes, then:
docker build -t ai-ops-frontend-nextjs-ecs:latest .
docker tag ai-ops-frontend-nextjs-ecs:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-nextjs-ecs:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/ai-ops-frontend-nextjs-ecs:latest

# Force new deployment
aws ecs update-service \
  --cluster ecs-workshop \
  --service ai-ops-nextjs-ecs \
  --force-new-deployment \
  --region us-west-2
```

---

## Cleanup (Delete All Resources)

### Step 1: Delete ECS Services
```bash
aws ecs delete-service \
  --cluster ecs-workshop \
  --service ai-ops-frontend-ecs \
  --force \
  --region us-west-2

aws ecs delete-service \
  --cluster ecs-workshop \
  --service ai-ops-backend-ecs \
  --force \
  --region us-west-2

aws ecs delete-service \
  --cluster ecs-workshop \
  --service ai-ops-nextjs-ecs \
  --force \
  --region us-west-2

echo "Waiting for services to drain (60 seconds)..."
sleep 60
```

### Step 2: Delete ECS Cluster
```bash
aws ecs delete-cluster \
  --cluster ecs-workshop \
  --region us-west-2
```

### Step 3: Delete ALB and Target Groups
```bash
# Delete ALB
aws elbv2 delete-load-balancer \
  --load-balancer-arn $ALB_ARN \
  --region us-west-2

echo "Waiting for ALB to delete (60 seconds)..."
sleep 60

# Delete target groups
aws elbv2 delete-target-group --target-group-arn $FRONTEND_TG --region us-west-2
aws elbv2 delete-target-group --target-group-arn $BACKEND_TG --region us-west-2
aws elbv2 delete-target-group --target-group-arn $NEXTJS_TG --region us-west-2
```

### Step 4: Delete RDS Instance
```bash
aws rds delete-db-instance \
  --db-instance-identifier tms-postgres-db \
  --skip-final-snapshot \
  --region us-west-2

echo "RDS deletion initiated (takes 10-15 minutes)"
```

### Step 5: Delete ECR Repositories
```bash
aws ecr delete-repository \
  --repository-name ai-ops-frontend-ecs \
  --force \
  --region us-west-2

aws ecr delete-repository \
  --repository-name ai-ops-backend-ecs \
  --force \
  --region us-west-2

aws ecr delete-repository \
  --repository-name ai-ops-frontend-nextjs-ecs \
  --force \
  --region us-west-2
```

### Step 6: Delete Security Groups
```bash
# Wait for resources to be deleted
echo "Waiting for resources to be deleted (120 seconds)..."
sleep 120

# Delete security groups
aws ec2 delete-security-group --group-id $TASK_SG --region us-west-2
aws ec2 delete-security-group --group-id $ALB_SG --region us-west-2
aws ec2 delete-security-group --group-id $RDS_SG --region us-west-2
```

### Step 7: Delete IAM Role
```bash
aws iam detach-role-policy \
  --role-name ecsTaskExecutionRole-tms \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam delete-role --role-name ecsTaskExecutionRole-tms
```

### Step 8: Delete CloudWatch Log Groups
```bash
aws logs delete-log-group --log-group-name /ecs/ai-ops-frontend-task --region us-west-2
aws logs delete-log-group --log-group-name /ecs/ai-ops-backend-ecs --region us-west-2
aws logs delete-log-group --log-group-name /ecs/ai-ops-nextjs-task --region us-west-2
```

---

## Quick Reference

### Environment Variables
```bash
# Save these for future use
export VPC_ID="<your-vpc-id>"
export SUBNET_1="<your-subnet-1>"
export SUBNET_2="<your-subnet-2>"
export ALB_DNS="<your-alb-dns>"
export RDS_ENDPOINT="<your-rds-endpoint>"
export AWS_ACCOUNT_ID="<your-account-id>"
```

### Common Commands
```bash
# Check service status
aws ecs describe-services --cluster ecs-workshop --services ai-ops-backend-ecs --region us-west-2

# View logs
aws logs tail /ecs/ai-ops-backend-ecs --follow --region us-west-2

# Force new deployment
aws ecs update-service --cluster ecs-workshop --service ai-ops-backend-ecs --force-new-deployment --region us-west-2

# Check target health
aws elbv2 describe-target-health --target-group-arn $BACKEND_TG --region us-west-2
```

---

**End of Deployment Guide**

For issues or questions, refer to:
- TMS_DEPLOYMENT_SUMMARY.md
- TMS_TESTING_GUIDE.md
- TMS_DEPLOYMENT_HISTORY.md
