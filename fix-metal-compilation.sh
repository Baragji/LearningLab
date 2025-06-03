#!/bin/bash

set -e  # Exit on any error

echo "🔧 Fixing Metal Compilation Issue for Code Assistant"
echo "=================================================="
echo ""

# Check current xcode-select path
echo "📍 Current developer directory:"
xcode-select --print-path
echo ""

# Check if Xcode.app exists
if [ ! -d "/Applications/Xcode.app" ]; then
    echo "❌ Xcode.app is not installed."
    echo ""
    echo "🛠️  SOLUTION: You need to install the full Xcode application"
    echo "   The Metal command-line tools are NOT included in Command Line Tools alone."
    echo ""
    echo "📥 Please install Xcode using ONE of these methods:"
    echo ""
    echo "   Method 1 (Recommended): Mac App Store"
    echo "   • Open Mac App Store"
    echo "   • Search for 'Xcode'"
    echo "   • Click 'Install' (it's free but requires Apple ID)"
    echo "   • Wait for download to complete (several GB)"
    echo ""
    echo "   Method 2: Apple Developer Website"
    echo "   • Go to https://developer.apple.com/xcode/"
    echo "   • Download Xcode (requires Apple Developer account)"
    echo ""
    echo "⚠️  After installation:"
    echo "   1. Launch Xcode.app at least once"
    echo "   2. Accept the license agreement"
    echo "   3. Install additional components when prompted"
    echo "   4. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Xcode.app is installed"

# Check if Xcode has been launched and configured
if [ ! -f "/Applications/Xcode.app/Contents/Developer/usr/bin/metal" ]; then
    echo "⚠️  Xcode is installed but Metal tools are not available."
    echo "   This usually means Xcode hasn't been properly configured."
    echo ""
    echo "🔧 Please:"
    echo "   1. Launch Xcode.app"
    echo "   2. Accept the license agreement"
    echo "   3. Install additional components when prompted"
    echo "   4. Wait for installation to complete"
    echo "   5. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Metal tools are available in Xcode"

# Switch xcode-select to use full Xcode
echo "🔄 Switching developer directory to use full Xcode..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
echo "📜 Accepting Xcode license..."
sudo xcodebuild -license accept

# Verify the switch worked
echo "📍 New developer directory:"
xcode-select --print-path

# Test Metal compiler
echo "🧪 Testing Metal compiler..."
if xcrun --find metal > /dev/null 2>&1; then
    echo "✅ Metal compiler found at: $(xcrun --find metal)"
else
    echo "❌ Metal compiler still not found"
    echo "   Try restarting your terminal and running this script again"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! Metal compilation should now work."
echo "============================================="
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your terminal (or run: source ~/.bashrc)"
echo "   2. Try running your install-code-assistant.sh script again"
echo ""
echo "💡 If you still get errors, try:"
echo "   • Clean any previous build artifacts: rm -rf ~/.cargo/git/checkouts"
echo "   • Clear Rust cache: cargo clean"
echo "   • Restart your computer"
echo ""