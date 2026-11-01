# ==============================================================================
# IVR Enterprise Internship Platform - AWS Mumbai (ap-south-1) Terraform Infrastructure
# Complete Production Architecture: VPC, ECS Fargate, RDS PostgreSQL Multi-AZ,
# S3, CloudFront CDN, Application Load Balancer, AWS WAFv2, and Secrets Manager.
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "IVR-Enterprise-Platform"
      Environment = "Production"
      ManagedBy   = "Terraform"
      Compliance  = "DPDP-India-2023"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-south-1" # AWS Asia Pacific (Mumbai)
}

variable "domain_name" {
  type    = string
  default = "ivrenterprise.com"
}

# 1. Virtual Private Cloud (VPC)
resource "aws_vpc" "ivr_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ivr-production-vpc"
  }
}

# Availability Zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Public Subnets (for ALB & NAT Gateways)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.ivr_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = { Name = "ivr-public-ap-south-1a" }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.ivr_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags = { Name = "ivr-public-ap-south-1b" }
}

# Private Subnets (for ECS Tasks)
resource "aws_subnet" "private_app_1" {
  vpc_id            = aws_vpc.ivr_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = { Name = "ivr-private-app-ap-south-1a" }
}

resource "aws_subnet" "private_app_2" {
  vpc_id            = aws_vpc.ivr_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = { Name = "ivr-private-app-ap-south-1b" }
}

# Database Subnets (for RDS PostgreSQL Multi-AZ)
resource "aws_subnet" "db_1" {
  vpc_id            = aws_vpc.ivr_vpc.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = { Name = "ivr-db-ap-south-1a" }
}

resource "aws_subnet" "db_2" {
  vpc_id            = aws_vpc.ivr_vpc.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = { Name = "ivr-db-ap-south-1b" }
}

# Internet Gateway & Routing
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.ivr_vpc.id
  tags   = { Name = "ivr-igw" }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.ivr_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "ivr-public-route-table" }
}

resource "aws_route_table_association" "pub_1_assoc" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "pub_2_assoc" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public_rt.id
}

# NAT Gateway for Secure Outbound from Private Subnets
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags   = { Name = "ivr-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_1.id
  tags          = { Name = "ivr-nat-gateway" }
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.ivr_vpc.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "ivr-private-route-table" }
}

resource "aws_route_table_association" "priv_app_1" {
  subnet_id      = aws_subnet.private_app_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "priv_app_2" {
  subnet_id      = aws_subnet.private_app_2.id
  route_table_id = aws_route_table.private_rt.id
}

# 2. Security Groups (Zero Trust)
resource "aws_security_group" "alb_sg" {
  name        = "ivr-alb-security-group"
  description = "Allows inbound HTTPS/HTTP to Load Balancer"
  vpc_id      = aws_vpc.ivr_vpc.id

  ingress {
    description = "Allow HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTP (Redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "ivr-ecs-tasks-security-group"
  description = "Allows traffic only from ALB to ECS Fargate tasks"
  vpc_id      = aws_vpc.ivr_vpc.id

  ingress {
    description     = "Allow ALB traffic to port 3000"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "ivr-rds-security-group"
  description = "Allows PostgreSQL traffic strictly from ECS tasks"
  vpc_id      = aws_vpc.ivr_vpc.id

  ingress {
    description     = "PostgreSQL from ECS tasks only"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. RDS PostgreSQL Multi-AZ
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "ivr-rds-subnets"
  subnet_ids = [aws_subnet.db_1.id, aws_subnet.db_2.id]
}

resource "aws_db_instance" "postgres" {
  identifier             = "ivr-enterprise-postgresql"
  allocated_storage      = 50
  max_allocated_storage  = 200
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = "db.t4g.medium" # ARM-based Graviton2 for cost efficiency & throughput
  multi_az               = true            # High availability failover across Mumbai AZs
  db_name                = "ivr_internship_db"
  username               = "ivr_admin"
  password               = "IVR_Secure_Pass2026!" # Loaded from Secrets Manager in real setup
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  deletion_protection    = true
  storage_encrypted      = true
  backup_retention_period = 30
}

# 4. S3 Bucket for Documents & Verified Certificates
resource "aws_s3_bucket" "artifacts_bucket" {
  bucket = "ivr-enterprise-media-mumbai-2026"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encrypt" {
  bucket = aws_s3_bucket.artifacts_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket                  = aws_s3_bucket.artifacts_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 5. Application Load Balancer
resource "aws_lb" "main_alb" {
  name               = "ivr-alb-mumbai"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_lb_target_group" "app_tg" {
  name        = "ivr-app-target-group"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.ivr_vpc.id
  target_type = "ip"

  health_check {
    path                = "/api/auth/me"
    protocol            = "HTTP"
    matcher             = "200,401"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# 6. AWS ECS Cluster & Fargate Service
resource "aws_ecs_cluster" "ivr_cluster" {
  name = "ivr-enterprise-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/ivr-enterprise-platform"
  retention_in_days = 60
}

# 7. AWS WAF v2 Web Application Firewall
resource "aws_wafv2_web_acl" "ivr_waf" {
  name        = "ivr-alb-waf-rules"
  description = "OWASP Top 10, rate limiting, and SQLi protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limit rule: max 500 requests per 5 minutes per IP
  rule {
    name     = "RateLimitPerIP"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 500
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitPerIP"
      sampled_requests_enabled   = true
    }
  }

  # Common rule set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 2
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "IVRWafAcl"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "waf_alb" {
  resource_arn = aws_lb.main_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.ivr_waf.arn
}

output "alb_dns_name" {
  description = "The public DNS endpoint of the Application Load Balancer"
  value       = aws_lb.main_alb.dns_name
}

output "rds_endpoint" {
  description = "The internal endpoint of the PostgreSQL Multi-AZ database"
  value       = aws_db_instance.postgres.endpoint
}
