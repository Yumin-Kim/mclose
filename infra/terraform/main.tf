# LightSail Instance
resource "aws_lightsail_instance" "mclose_app" {
  name              = var.lightsail_instance_name
  availability_zone = "ap-northeast-2a"
  blueprint_id      = "ubuntu_24_04" # Ubuntu 24.04 LTS
  bundle_id         = "medium_2_0"  # 4 GB RAM, 2 vCPUs, 80 GB SSD

  user_data = file("${path.module}/scripts/instance.sh")

  tags = {
    Name = "MCLOSE-APP"
  }
}

# LightSail DataBase

# LightSail Load Balancer
resource "aws_lightsail_lb" "mclose_lb" {
  name              = "mclose-lb"
  health_check_path = "/health-check.html"

  tags = {
    Name = "MCLOSE-LB"
  }
}

# Attach Load Balancer to Instance
resource "aws_lightsail_lb_attachment" "mclose_lb_attachment" {
  lb_name       = aws_lightsail_lb.mclose_lb.name
  instance_name = aws_lightsail_instance.mclose_app.name
}

# SQS Queues
resource "aws_sqs_queue" "standard_queues" {
  for_each = toset(var.sqs_queues.standard)

  name = each.value
}

resource "aws_sqs_queue" "fifo_queues" {
  for_each = toset(var.sqs_queues.fifo)

  name                      = each.value
  fifo_queue                = true
  content_based_deduplication = true
}

module "vpc" {
  source = "./modules/vpc"

  project_name     = var.project_name
  environment      = var.environment
  vpc_cidr         = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

module "sqs" {
  source = "./modules/sqs"

  project_name = var.project_name
  environment  = var.environment
}

module "ses" {
  source = "./modules/ses"

  project_name = var.project_name
  environment  = var.environment
}

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

module "ecs" {
  source = "./modules/ecs"

  project_name     = var.project_name
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnet_ids
  public_subnets   = module.vpc.public_subnet_ids
  ecr_repository_url = module.ecr.repository_url
  s3_bucket_name    = module.s3.video_bucket_name
  sqs_queue_url     = module.sqs.queue_url
}

module "rds" {
  source = "./modules/rds"

  project_name     = var.project_name
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  private_subnets  = module.vpc.private_subnet_ids
  db_name          = var.db_name
  db_username      = var.db_username
  db_password      = var.db_password
}

module "lightsail" {
  source = "./modules/lightsail"

  project_name = var.project_name
  environment  = var.environment
  region       = var.aws_region
}

module "domain" {
  source = "./modules/domain"

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}

module "load_balancer" {
  source = "./modules/load_balancer"

  project_name     = var.project_name
  environment      = var.environment
  instance_name    = module.lightsail.instance_name
  domain_name      = var.domain_name
  certificate_arn  = module.domain.certificate_arn
}

module "nginx" {
  source = "./modules/nginx"

  project_name = var.project_name
  environment  = var.environment
  instance_id  = module.lightsail.instance_id
}