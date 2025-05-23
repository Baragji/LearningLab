#!/bin/bash

# This script cleans up unnecessary cookies and log files in the project
echo "Starting cleanup process..."

# 1. Clean up Zencoder log files
echo "Running Zencoder cleanup script..."
./.zencoder/cleanup.sh

# 2. Clean up Turbo cookies
echo "Cleaning up Turbo cookies..."
cookie_count=$(find .turbo/cookies -type f -name "*.cookie" | wc -l)
echo "Found $cookie_count cookie files"

# Keep only the 50 most recent cookie files
if [ "$cookie_count" -gt 50 ]; then
  # Get a list of cookie files sorted by modification time (oldest first)
  files_to_remove=$(ls -t1 .turbo/cookies/*.cookie | tail -n +51)

  # Remove the files
  for file in $files_to_remove; do
    echo "Removing $file"
    rm "$file"
  done

  # Count the remaining files
  remaining=$(find .turbo/cookies -type f -name "*.cookie" | wc -l)
  echo "Turbo cookies cleanup complete. $remaining cookie files remaining."
else
  echo "No Turbo cookies cleanup needed. There are $cookie_count cookie files (50 or fewer)."
fi

# 3. Clean up Turbo log files in apps and packages
echo "Cleaning up Turbo log files..."
log_count=$(find apps packages -name "*.log" | wc -l)
echo "Found $log_count log files"

if [ "$log_count" -gt 0 ]; then
  # Remove all log files older than 7 days
  find apps packages -name "*.log" -type f -mtime +7 -delete

  # Count the remaining files
  remaining=$(find apps packages -name "*.log" | wc -l)
  echo "Turbo log files cleanup complete. $remaining log files remaining."
else
  echo "No Turbo log files cleanup needed. There are $log_count log files."
fi

echo "All cleanup processes completed."
