output "lightsail_instance_name" {
  value = aws_lightsail_instance.mclose_app.name
}

output "lightsail_lb_dns" {
  value = aws_lightsail_lb.mclose_lb.dns_name
}

output "sqs_standard_queues" {
  value = aws_sqs_queue.standard_queues[*].name
}

output "sqs_fifo_queues" {
  value = aws_sqs_queue.fifo_queues[*].name
}