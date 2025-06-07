# Virtual Environment Setup Guide

This guide explains how to set up a Python virtual environment for the Agentic RAG project to ensure all dependencies are properly installed without affecting your system Python installation.

## Why Use a Virtual Environment?

Modern macOS systems (and many Linux distributions) use Python's externally managed environment feature to protect system Python installations. This prevents installing packages globally with pip, which could potentially break system functionality.

A virtual environment creates an isolated Python installation where you can safely install and manage dependencies for this specific project.

## Setup Instructions

### 1. Create a Virtual Environment

Navigate to the project directory and create a new virtual environment:

```bash
cd /Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/gcp-migration
python3 -m venv venv
```

This creates a directory called `venv` containing a separate Python installation.

### 2. Activate the Virtual Environment

You must activate the virtual environment before using it:

#### On macOS/Linux:
```bash
source venv/bin/activate
```

#### On Windows:
```bash
venv\Scripts\activate
```

When activated, you'll see `(venv)` at the beginning of your command prompt, indicating that you're working within the virtual environment.

### 3. Install Dependencies

Once the virtual environment is activated, install the project dependencies:

```bash
pip install -r requirements.txt
```

You can also update pip to the latest version:

```bash
pip install --upgrade pip
```

### 4. Running Tests

With the virtual environment activated, you can run the tests:

```bash
# Basic syntax test
python test_syntax.py

# Comprehensive test
python test_agentic_rag_comprehensive.py

# End-to-end test (requires OpenAI API key)
python test_e2e.py
```

### 5. Deactivating the Environment

When you're finished working on the project, you can deactivate the virtual environment:

```bash
deactivate
```

This returns you to your system's Python environment.

### 6. Reusing the Environment

The next time you work on the project, navigate to the project directory and activate the virtual environment again:

```bash
cd /Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/gcp-migration
source venv/bin/activate  # On macOS/Linux
```

## Troubleshooting

### Missing Modules

If you encounter "No module named X" errors even after installing requirements, check:

1. Is the virtual environment activated? (You should see `(venv)` in your prompt)
2. Was the package installed correctly? Verify with `pip list`
3. Try reinstalling the specific package: `pip install X`

### Permission Issues

If you encounter permission errors during installation:

1. Don't use `sudo` with pip in a virtual environment
2. Check that the `venv` directory is owned by your user
3. Try recreating the virtual environment

### Environment Activation Problems

If activation doesn't work or doesn't show `(venv)` in your prompt:

1. Make sure you're using the correct activation command for your OS
2. Try recreating the virtual environment
3. Check if your shell initialization files are modifying the prompt

## Best Practices

1. **Never** use `sudo` with pip inside a virtual environment
2. Always activate the virtual environment before working on the project
3. Keep your `requirements.txt` up to date when adding new dependencies
4. Consider using a `.gitignore` file to exclude the `venv` directory from version control