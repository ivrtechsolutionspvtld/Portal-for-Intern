# Deployment & Infrastructure Guide: IVR Tech Solutions Portal

This comprehensive deployment guide provides technical transparency into where the platform is hosted, how the cloud infrastructure is architected, how future updates are deployed, and an itemized breakdown of monthly operational expenses.

---

## 1. Hosting Architecture Overview

```
                      Internet Traffic (HTTPS 443)
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    AWS Route 53 (DNS)         │
                   │    portal.ivrtechsolution.in  │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  AWS Application Load Balancer│
                   │  ACM SSL/TLS Encryption Seal  │
                   └───────────────┬───────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                               ▼
       ┌──────────────────────┐         ┌──────────────────────┐
       │ AWS ECS Fargate Pod 1│         │ AWS ECS Fargate Pod 2│
       │ Next.js 16 (Node 20) │         │ Next.js 16 (Node 20) │
       │ Port 3000 (Private)  │         │ Port 3000 (Private)  │
       └───────────┬──────────┘         └──────────┬───────────┘
                   │                               │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
       ┌───────────────────────────────────────────────────────┐
       │ AWS RDS PostgreSQL (Multi-AZ) / Local Dev SQLite      │
       │ Encrypted with AWS KMS                                │
       └───────────────────────────────────────────────────────┘
```

| Component | Development Environment | Production AWS Environment |
| :--- | :--- | :--- |
| **Frontend & Backend** | Local Node.js 20 (`localhost:3000`) | AWS ECS Fargate (2 Tasks, 0.5 vCPU, 1GB RAM) |
| **Database** | SQLite (`prisma/dev.db`) | AWS RDS PostgreSQL 15 (`db.t4g.micro` / `small`) |
| **Object Storage** | Local static storage (`public/uploads`) | AWS S3 Bucket (`ivr-enterprise-storage-mumbai`) |
| **DNS & Domain** | Localhost | AWS Route 53 (`ivrtechsolution.in`) |
| **SSL/TLS Certificates** | Local HTTP | AWS Certificate Manager (Auto-renewing wildcard SSL) |
| **Email Deliverability** | Transactional Console Logger | Amazon SES (Mumbai `ap-south-1`) |
| **Geographic Region** | Local Machine | **Mumbai, India (`ap-south-1`)** |

---

## 2. Docker Container Deployment

The application includes a production-grade multi-stage `Dockerfile` creating minimal, hardened Alpine Linux containers:

### Build Container Image:
```bash
# 1. Build the production Docker image
docker build -t ivr-platform:latest .

# 2. Test the container locally
docker run -p 3000:3000 -e DATABASE_URL="file:./dev.db" -e JWT_SECRET="your_production_secret" ivr-platform:latest
```

### Push to AWS Elastic Container Registry (ECR):
```bash
# Authenticate Docker to AWS ECR in Mumbai
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# Tag and push image
docker tag ivr-platform:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ivr-portal:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ivr-portal:latest
```

---

## 3. ECS Task Definition Configuration

The production ECS task is pre-configured in [`deploy/aws-ecs-task-def.json`](file:///deploy/aws-ecs-task-def.json):
* **Launch Type:** `FARGATE`
* **CPU / Memory:** 512 Units (0.5 vCPU) / 1024 MB RAM
* **Port Mappings:** Container Port `3000` (HTTP)
* **Log Configuration:** AWS CloudWatch Logs (`/ecs/ivr-platform`)
* **Environment Variables:** Loaded securely from AWS Systems Manager (SSM) Parameter Store or AWS Secrets Manager.

---

## 4. Terraform Infrastructure as Code (IaC)

All required AWS resources can be provisioned in minutes via the declarative Terraform script in [`deploy/terraform-main.tf`](file:///deploy/terraform-main.tf):

```bash
cd deploy/
terraform init
terraform plan
terraform apply
```

This provisions:
1. VPC with 2 Public and 2 Private Subnets across Mumbai availability zones (`ap-south-1a`, `ap-south-1b`).
2. Internet Gateway and NAT Gateway.
3. AWS Application Load Balancer with HTTPS redirect listeners.
4. ECS Cluster, Task Definition, and Fargate Service with auto-healing.
5. AWS CloudWatch Log Groups.

---

## 5. How to Update the Website in the Future

To deploy code changes or new features without downtime:

1. **Commit and Push Changes to Git:**
   ```bash
   git add .
   git commit -m "feat: updated portal features"
   git push origin main
   ```
2. **Build and Push Updated Container:**
   ```bash
   docker build -t <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ivr-portal:latest .
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/ivr-portal:latest
   ```
3. **Trigger Zero-Downtime Rolling Update:**
   ```bash
   aws ecs update-service --cluster ivr-production-cluster --service ivr-portal-service --force-new-deployment --region ap-south-1
   ```
   *ECS Fargate boots the new container pod, performs health checks against `/api/health`, shifts load balancer traffic to the new pod, and gracefully terminates the older pod. Zero seconds of user downtime.*

---

## 6. Itemized Monthly Hosting & Maintenance Expenses

Transparent financial projection for running the portal on AWS in the Mumbai (`ap-south-1`) region:

| AWS Service | Resource Sizing | Estimated Monthly Cost (USD) | Estimated Monthly Cost (INR) |
| :--- | :--- | :--- | :--- |
| **AWS ECS Fargate** | 1 Task (0.5 vCPU, 1GB RAM, 24/7) | ~$14.50 | ~₹1,220 |
| **AWS Application Load Balancer** | 1 Shared ALB + LCUs | ~$16.00 | ~₹1,345 |
| **AWS RDS PostgreSQL** | `db.t4g.micro` (Single-AZ, 20GB SSD) | ~$15.00 | ~₹1,260 |
| **AWS Route 53 (DNS)** | 1 Hosted Zone + Queries | ~$0.60 | ~₹50 |
| **AWS Certificate Manager (SSL)** | 1 Wildcard SSL Certificate | **$0.00 (Free)** | **₹0.00** |
| **Amazon SES (Emails)** | 10,000 emails/month | ~$1.00 | ~₹85 |
| **AWS S3 & CloudWatch Logs** | 10GB documents + log retention | ~$2.00 | ~₹170 |
| **Total Estimated Expense** | **Production Enterprise Grade** | **~$49.10 / month** | **~₹4,130 / month** |

> **Cost Optimization Tip:** For low-traffic periods, you can run single-instance hosting on an AWS EC2 `t4g.small` instance (~$12/month or ~₹1,000/month) running Docker Compose directly.

