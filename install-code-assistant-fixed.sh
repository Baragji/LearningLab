#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting Code Assistant Installation (Fixed Version)"
echo "======================================================"

# Function to check Metal compiler availability
check_metal_compiler() {
    if ! xcrun --find metal > /dev/null 2>&1; then
        echo "❌ Metal compiler not found!"
        echo ""
        echo "🔧 The Metal command-line tools are required for this build."
        echo "   They are only available with the full Xcode installation."
        echo ""
        echo "📥 To fix this issue:"
        echo "   1. Install Xcode from the Mac App Store (free)"
        echo "   2. Launch Xcode and accept the license"
        echo "   3. Run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
        echo "   4. Run: sudo xcodebuild -license accept"
        echo ""
        echo "🛠️  Or run the fix script: ./fix-metal-compilation.sh"
        echo ""
        return 1
    fi
    return 0
}

# Check Metal compiler first
echo "🔍 Checking Metal compiler availability..."
if ! check_metal_compiler; then
    exit 1
fi
echo "✅ Metal compiler is available"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo "✅ Rust installed successfully!"
else
    echo "✅ Rust is already installed"
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
else
    echo "✅ Git is available"
fi

# Create workspace directory if it doesn't exist
WORKSPACE_DIR="$HOME/workspace"
if [ ! -d "$WORKSPACE_DIR" ]; then
    echo "📁 Creating workspace directory at $WORKSPACE_DIR"
    mkdir -p "$WORKSPACE_DIR"
fi

cd "$WORKSPACE_DIR"

# Clone the repository
echo "📥 Cloning Code Assistant repository..."
if [ -d "code-assistant" ]; then
    echo "⚠️  Code Assistant directory already exists. Removing old version..."
    rm -rf code-assistant
fi

git clone https://github.com/stippi/code-assistant
cd code-assistant

# Set environment variables for better Metal compilation
echo "⚙️  Setting up build environment..."
export BINDGEN_EXTRA_CLANG_ARGS="--sysroot=$(xcrun --show-sdk-path)"

# Build the project with better error handling
echo "🔨 Building Code Assistant (this may take a few minutes)..."
echo "   Note: Metal shader compilation may take extra time..."

# Try building with verbose output for better debugging
if ! cargo build --release --verbose; then
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "🔍 Common solutions:"
    echo "   1. Ensure Xcode is properly installed and configured"
    echo "   2. Try: cargo clean && cargo build --release"
    echo "   3. Restart your terminal and try again"
    echo "   4. Check that xcode-select points to full Xcode:"
    echo "      xcode-select --print-path"
    echo "      (should be /Applications/Xcode.app/Contents/Developer)"
    echo ""
    exit 1
fi

# Check if build was successful
if [ ! -f "target/release/code-assistant" ]; then
    echo "❌ Build completed but executable not found!"
    echo "   Please check the error messages above."
    exit 1
fi

echo "✅ Build completed successfully!"

# Create configuration directory
echo "⚙️  Setting up configuration..."
CONFIG_DIR="$HOME/.config/code-assistant"
mkdir -p "$CONFIG_DIR"

# Create projects.json configuration
echo "📝 Creating projects configuration..."
cat > "$CONFIG_DIR/projects.json" << EOF
{
  "code-assistant": {
    "path": "$PWD"
  },
  "workspace": {
    "path": "$WORKSPACE_DIR"
  }
}
EOF

# Create a simple wrapper script
echo "🔗 Creating wrapper script..."
WRAPPER_SCRIPT="$HOME/.local/bin/code-assistant"
mkdir -p "$HOME/.local/bin"

cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash
exec "$PWD/target/release/code-assistant" "\$@"
EOF

chmod +x "$WRAPPER_SCRIPT"

# Add to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo "🛤️  Adding $HOME/.local/bin to PATH..."
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
fi

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "📍 Code Assistant installed at: $PWD/target/release/code-assistant"
echo "📍 Wrapper script created at: $WRAPPER_SCRIPT"
echo "📍 Configuration directory: $CONFIG_DIR"
echo ""
echo "🔑 Next Steps:"
echo "1. Set up your API key (choose one):"
echo "   export ANTHROPIC_API_KEY='your-key-here'"
echo "   export OPENAI_API_KEY='your-key-here'"
echo ""
echo "2. Edit your projects configuration:"
echo "   nano $CONFIG_DIR/projects.json"
echo ""
echo "3. Test the installation:"
echo "   code-assistant --task 'Explain this project structure'"
echo ""
echo "4. For Claude Desktop integration, add this to claude_desktop_config.json:"
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"code-assistant\": {"
echo "         \"command\": \"$PWD/target/release/code-assistant\","
echo "         \"args\": [\"server\"]"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "🔄 Restart your terminal or run: source ~/.bashrc"