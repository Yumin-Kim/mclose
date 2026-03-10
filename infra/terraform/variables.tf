variable "lightsail_instance_name" {
  default = "MCLOSE-APP"
}

variable "sqs_queues" {
  default = {
    standard = [
      "mclose-gateway-queue",
      "mclose-video-transform-in-queue",
      "mclose-video-transform-out-queue"
    ]
    fifo = [
      "mclose-matching-in-queue.fifo",
      "mclose-matching-out-queue.fifo"
    ]
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "mclose"
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "mclose.net"
}

variable "instance_type" {
  description = "LightSail instance type"
  type        = string
  default     = "medium_2_0"  # 4 GB RAM, 2 vCPUs, 80 GB SSD
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health-check.html"
}