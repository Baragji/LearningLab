# Jupyter MCP Server Dockerfile
# AI-powered Jupyter environment for LearningLab

FROM jupyter/scipy-notebook:latest

# Switch to root for installations
USER root

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    tree \
    jq \
    build-essential \
    graphviz \
    pandoc \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-plain-generic \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for Jupyter extensions
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Switch back to jovyan user
USER $NB_UID

# Install Python packages for AI and data science
RUN pip install --no-cache-dir \
    # AI and Machine Learning
    openai==1.3.5 \
    anthropic==0.7.7 \
    google-generativeai==0.3.1 \
    cohere==4.37 \
    transformers==4.35.2 \
    torch==2.1.1 \
    torchvision==0.16.1 \
    tensorflow==2.14.0 \
    keras==2.14.0 \
    scikit-learn==1.3.2 \
    xgboost==2.0.1 \
    lightgbm==4.1.0 \
    catboost==1.2.2 \
    # Data Science and Analysis
    pandas==2.1.3 \
    numpy==1.25.2 \
    scipy==1.11.4 \
    statsmodels==0.14.0 \
    # Visualization
    matplotlib==3.8.2 \
    seaborn==0.13.0 \
    plotly==5.17.0 \
    bokeh==3.3.0 \
    altair==5.1.2 \
    wordcloud==1.9.2 \
    # Natural Language Processing
    nltk==3.8.1 \
    spacy==3.7.2 \
    textblob==0.17.1 \
    gensim==4.3.2 \
    # Computer Vision
    opencv-python==4.8.1.78 \
    pillow==10.1.0 \
    # Web and APIs
    requests==2.31.0 \
    beautifulsoup4==4.12.2 \
    selenium==4.15.2 \
    fastapi==0.104.1 \
    uvicorn==0.24.0 \
    # Database and Storage
    sqlalchemy==2.0.23 \
    psycopg2-binary==2.9.9 \
    redis==5.0.1 \
    pymongo==4.6.0 \
    # Educational Tools
    nbgrader==0.9.1 \
    jupyter-book==0.15.1 \
    rise==5.7.1 \
    # Utilities
    python-dotenv==1.0.0 \
    pyyaml==6.0.1 \
    jsonschema==4.20.0 \
    tqdm==4.66.1 \
    joblib==1.3.2 \
    dask==2023.11.0 \
    # Development Tools
    black==23.11.0 \
    flake8==6.1.0 \
    pytest==7.4.3 \
    jupyter-lsp==2.2.0 \
    jupyterlab-code-formatter==2.2.1

# Install JupyterLab extensions
RUN jupyter labextension install --no-build \
    @jupyter-widgets/jupyterlab-manager \
    @bokeh/jupyter_bokeh \
    @pyviz/jupyterlab_pyviz \
    plotlywidget \
    jupyterlab-plotly \
    && jupyter lab build --dev-build=False --minimize=False

# Install additional Jupyter extensions
RUN pip install --no-cache-dir \
    jupyterlab-git==0.44.0 \
    jupyterlab-variableinspector==3.0.9 \
    jupyterlab-execute-time==3.1.0 \
    jupyterlab-system-monitor==0.8.0 \
    jupyter-ai==2.5.0

# Download NLTK data
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('vader_lexicon')"

# Download spaCy models
RUN python -m spacy download en_core_web_sm
RUN python -m spacy download en_core_web_md

# Create directories for LearningLab
RUN mkdir -p /home/jovyan/work/learninglab/{notebooks,data,models,templates,utils} && \
    mkdir -p /home/jovyan/work/learninglab/notebooks/{ai-analysis,student-analytics,content-creation,experiments} && \
    mkdir -p /home/jovyan/work/learninglab/data/{raw,processed,exports} && \
    mkdir -p /home/jovyan/work/learninglab/models/{trained,pretrained,checkpoints}

# Copy LearningLab specific notebooks and utilities
COPY --chown=$NB_UID:$NB_GID notebooks/ /home/jovyan/work/learninglab/notebooks/
COPY --chown=$NB_UID:$NB_GID templates/ /home/jovyan/work/learninglab/templates/
COPY --chown=$NB_UID:$NB_GID utils/ /home/jovyan/work/learninglab/utils/

# Copy configuration files
COPY --chown=$NB_UID:$NB_GID config/jupyter_lab_config.py /home/jovyan/.jupyter/
COPY --chown=$NB_UID:$NB_GID config/jupyter_notebook_config.py /home/jovyan/.jupyter/

# Set up custom kernel for LearningLab
RUN python -m ipykernel install --user --name learninglab --display-name "LearningLab Python"

# Create startup script
COPY --chown=$NB_UID:$NB_GID scripts/start-notebook.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start-notebook.sh

# Set environment variables
ENV JUPYTER_ENABLE_LAB=yes
ENV JUPYTER_TOKEN=""
ENV GRANT_SUDO=yes
ENV CHOWN_HOME=yes
ENV CHOWN_HOME_OPTS="-R"
ENV NB_UID=1000
ENV NB_GID=1000

# Expose port
EXPOSE 8888

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8888/api || exit 1

# Set working directory
WORKDIR /home/jovyan/work

# Start Jupyter Lab
CMD ["/usr/local/bin/start-notebook.sh"]