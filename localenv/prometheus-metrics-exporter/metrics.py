import boto3
from flask import Flask, Response
from datetime import datetime, timedelta

# Flask app for exposing metrics
app = Flask(__name__)

# Configure boto3 for LocalStack
session = boto3.Session(
    aws_access_key_id="none",
    aws_secret_access_key="none",
    region_name="us-east-1"
)

cloudwatch = session.client('cloudwatch', endpoint_url='http://localstack:4566')
sqs = session.client('sqs', endpoint_url='http://localstack:4566')

# Function to fetch metrics for all SQS queues
def fetch_metrics():
    print("Fetch metrics...")
    metrics = []
    metrics.append(f"# Metrics")
    try:
        # List all SQS queues
        queues = sqs.list_queues().get('QueueUrls', [])
        
        for queue_url in queues:
            # Extract queue name from the URL
            queue_name = queue_url.split('/')[-1]
            
            # Define time range for the metric
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(minutes=1)  # Fetch last minute
            
            # Fetch metrics for the queue
            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/SQS',
                MetricName='ApproximateNumberOfMessagesVisible',
                Dimensions=[
                    {'Name': 'QueueName', 'Value': queue_name}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=60,
                Statistics=['Average']
            )
            
            # Extract the most recent data point
            if response.get('Datapoints'):
                latest_datapoint = max(response['Datapoints'], key=lambda x: x['Timestamp'])
                value = latest_datapoint['Average']
                # Prometheus format: name{label1="value1"} value
                metrics.append(f'sqs_approximate_number_of_messages_visible{{queue="{queue_name}"}} {value}')
    except Exception as e:
        metrics.append(f"# Error fetching metrics: {str(e)}")
    return metrics

# Expose metrics endpoint
@app.route('/metrics')
def metrics():
    metric_data = fetch_metrics()
    return Response("\n".join(metric_data), mimetype='text/plain')

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7670)
