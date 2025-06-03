# Metal Compilation Error Fix

## Problem Summary

Your `install-code-assistant.sh` script is failing with this error:
```
xcrun: error: unable to find utility "metal", not a developer tool or in PATH
```

## Root Cause Analysis

After thorough research, the issue is:

1. **The code-assistant project depends on Metal shader compilation** (it uses Rust crates like `gpui` that require Metal on macOS)
2. **Metal command-line tools are NOT included in Xcode Command Line Tools** - they only come with the full Xcode application
3. **Your system currently only has Command Line Tools installed** (not full Xcode)
4. **The Metal compiler is located in full Xcode** at: `/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/usr/bin/metal`

## Solution Steps

### Step 1: Install Full Xcode

**Option A: Mac App Store (Recommended)**
1. Open Mac App Store
2. Search for "Xcode"
3. Click "Install" (free, but requires Apple ID)
4. Wait for download (several GB - can take 30+ minutes)

**Option B: Apple Developer Website**
1. Go to https://developer.apple.com/xcode/
2. Download Xcode (requires Apple Developer account)

### Step 2: Configure Xcode

After installation:
1. **Launch Xcode.app** at least once
2. **Accept the license agreement**
3. **Install additional components** when prompted
4. Wait for installation to complete

### Step 3: Switch Developer Tools

Run the provided fix script:
```bash
./fix-metal-compilation.sh
```

Or manually:
```bash
# Switch to full Xcode
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Accept license
sudo xcodebuild -license accept

# Verify Metal compiler is available
xcrun --find metal
```

### Step 4: Retry Installation

Use the improved script:
```bash
./install-code-assistant-fixed.sh
```

## Why This Happens

This is a common issue with Rust projects that use Metal on macOS:

- **Zed Editor**: Requires Metal for GPU-accelerated rendering
- **GPUI crate**: Uses Metal shaders for UI rendering
- **Other graphics-intensive Rust projects**: Often need Metal compilation

The Metal compiler (`metal`) is considered part of the full SDK, not just command-line tools.

## Verification Commands

To check if everything is working:

```bash
# Check developer directory (should show Xcode path)
xcode-select --print-path

# Should output: /Applications/Xcode.app/Contents/Developer

# Check Metal compiler
xcrun --find metal

# Should output: /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/usr/bin/metal
```

## Alternative Solutions (If You Can't Install Xcode)

If you cannot install the full Xcode for space/licensing reasons:

1. **Use pre-built binaries** if available for the project
2. **Use Docker** with a macOS container that has Xcode
3. **Build on a different machine** that has Xcode installed
4. **Look for alternative projects** that don't require Metal compilation

## Files Created

- `fix-metal-compilation.sh` - Diagnostic and fix script
- `install-code-assistant-fixed.sh` - Improved installation script with Metal checks
- `METAL_COMPILATION_FIX.md` - This documentation

## References

- [Zed Editor macOS Build Instructions](https://zed.dev/docs/development/macos)
- [Stack Overflow: Metal tools without Xcode](https://stackoverflow.com/questions/52183221/are-the-metal-command-line-tools-available-without-xcode)
- [GitHub Issue: gfx-rs Metal compilation](https://github.com/gfx-rs/gfx/issues/2309)

The consensus from the developer community is clear: **Metal command-line tools require the full Xcode installation**.