FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the script
COPY metrics.py .

# Expose the Prometheus metrics port
EXPOSE 7670

# Command to run the script
CMD ["python", "metrics.py"]
