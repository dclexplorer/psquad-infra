#!/bin/bash

# Read username and password from environment variables
if [ -z "$BASIC_AUTH_USERNAME" ] || [ -z "$BASIC_AUTH_PASSWORD" ]; then
  echo "Error: BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set."
  exit 1
fi

# Generate htpasswd file
htpasswd -cb /etc/nginx/.htpasswd "$BASIC_AUTH_USERNAME" "$BASIC_AUTH_PASSWORD"

# Execute the CMD from Dockerfile
exec "$@"
