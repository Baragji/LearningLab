#!/bin/bash

# This script is a wrapper that calls the actual cleanup script in the .zencoder directory
echo "Running Zencoder cleanup script..."

# Call the actual cleanup script
./.zencoder/cleanup.sh

echo "Cleanup completed."