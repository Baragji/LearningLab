#!/bin/bash

# setup-codex.sh - Prepare environment for automated lint and test runs

set -e

echo "📦 Installing dependencies..."
yarn install --immutable

echo "🗄️  Setting up database..."
yarn db:setup

echo "🛠️  Building workspace..."
yarn build

echo "✅ Environment ready for lint and tests."
