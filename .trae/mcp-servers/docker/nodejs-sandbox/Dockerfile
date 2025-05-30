# Node.js Sandbox MCP Server Dockerfile
# Secure JavaScript/TypeScript execution environment for LearningLab

FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV SANDBOX_MODE=1
ENV NODE_OPTIONS="--max-old-space-size=512"

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create sandbox user
RUN addgroup -g 1001 -S sandbox && \
    adduser -S sandbox -G sandbox -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY config/ ./config/
COPY security/ ./security/
COPY templates/ ./templates/

# Create sandbox directories
RUN mkdir -p /sandbox/{workspace,temp,uploads,outputs,node_modules} && \
    mkdir -p /logs && \
    chown -R sandbox:sandbox /app /sandbox /logs

# Install safe packages in sandbox environment
RUN cd /sandbox && \
    npm init -y && \
    npm install --save \
        lodash@4.17.21 \
        moment@2.29.4 \
        axios@1.6.2 \
        express@4.18.2 \
        uuid@9.0.1 \
        validator@13.11.0 \
        bcryptjs@2.4.3 \
        jsonwebtoken@9.0.2 \
        cheerio@1.0.0-rc.12 \
        csv-parser@3.0.0 \
        csv-writer@1.6.0 \
        sharp@0.32.6 \
        canvas@2.11.2 \
        d3@7.8.5 \
        chart.js@4.4.0 \
        three@0.158.0 \
        p5@1.7.0 \
        matter-js@0.19.0 \
        ml-matrix@6.10.7 \
        simple-statistics@7.8.3 \
        natural@6.7.0 \
        compromise@14.10.0 \
        marked@9.1.6 \
        highlight.js@11.9.0 \
        prismjs@1.29.0 \
        katex@0.16.9 \
        mathjs@11.11.1 \
        decimal.js@10.4.3 \
        big.js@6.2.1 \
        crypto-js@4.2.0 \
        node-fetch@3.3.2 \
        form-data@4.0.0 \
        mime-types@2.1.35 \
        file-type@18.7.0 \
        image-size@1.0.2 \
        qrcode@1.5.3 \
        jsbarcode@3.11.5 \
        pdf-lib@1.17.1 \
        docx@8.5.0 \
        xlsx@0.18.5 \
        xml2js@0.6.2 \
        yaml@2.3.4 \
        dotenv@16.3.1 \
        joi@17.11.0 \
        ajv@8.12.0 \
        yup@1.3.3 \
        zod@3.22.4 \
        date-fns@2.30.0 \
        dayjs@1.11.10 \
        ramda@0.29.1 \
        immutable@4.3.4 \
        rxjs@7.8.1 \
        async@3.2.5 \
        bluebird@3.7.2 \
        p-queue@7.4.1 \
        p-limit@4.0.0 \
        nanoid@5.0.4 \
        shortid@2.2.16 \
        slugify@1.6.6 \
        escape-html@1.0.3 \
        he@1.2.0 \
        dompurify@3.0.6 \
        sanitize-html@2.11.0 \
        xss@1.0.14 \
        helmet@7.1.0 \
        cors@2.8.5 \
        compression@1.7.4 \
        morgan@1.10.0 \
        winston@3.11.0 \
        debug@4.3.4 \
        chalk@5.3.0 \
        colors@1.4.0 \
        figlet@1.7.0 \
        ora@7.0.1 \
        inquirer@9.2.12 \
        commander@11.1.0 \
        yargs@17.7.2 \
        minimist@1.2.8 \
        glob@10.3.10 \
        minimatch@9.0.3 \
        chokidar@3.5.3 \
        nodemon@3.0.2 \
        concurrently@8.2.2 \
        cross-env@7.0.3 \
        rimraf@5.0.5 \
        mkdirp@3.0.1 \
        fs-extra@11.2.0 \
        path-exists@5.0.0 \
        find-up@6.3.0 \
        pkg-dir@7.0.0 \
        read-pkg@8.1.0 \
        write-pkg@5.0.0 \
        semver@7.5.4 \
        compare-versions@6.1.0 \
        update-notifier@6.0.2 \
        latest-version@7.0.0 \
        package-json@8.1.1 \
        registry-url@6.0.1 \
        npm-run-path@5.1.0 \
        execa@8.0.1 \
        cross-spawn@7.0.3 \
        which@4.0.0 \
        is-wsl@3.1.0 \
        is-docker@3.0.0 \
        is-ci@4.0.0 \
        ci-info@4.0.0 \
        env-ci@10.0.0 \
        dotenv-expand@10.0.0 \
        config@3.3.9 \
        rc@1.2.8 \
        cosmiconfig@8.3.6 \
        lilconfig@2.1.0 \
        find-config@1.0.0 \
        load-json-file@7.0.1 \
        write-json-file@5.0.0 \
        parse-json@7.1.1 \
        stringify-object@4.0.1 \
        pretty-bytes@6.1.1 \
        filesize@10.1.0 \
        human-readable@0.2.1 \
        pretty-ms@8.0.0 \
        ms@2.1.3 \
        timeago.js@4.0.2 \
        humanize-duration@3.29.0 \
        progress@2.0.3 \
        cli-progress@3.12.0 \
        node-notifier@10.0.1 \
        open@9.1.0 \
        clipboardy@4.0.0 \
        terminal-link@3.0.0 \
        hyperlinker@1.0.0 \
        strip-ansi@7.1.0 \
        ansi-regex@6.0.1 \
        ansi-styles@6.2.1 \
        supports-color@9.4.0 \
        has-flag@5.0.1 \
        is-unicode-supported@1.3.0 \
        unicode-emoji-modifier-base@1.0.0 \
        emoji-regex@10.3.0 \
        string-width@6.1.0 \
        eastasianwidth@0.2.0 \
        wrap-ansi@8.1.0 \
        slice-ansi@5.0.0 \
        ansi-align@3.0.1 \
        boxen@7.1.1 \
        cli-boxes@3.0.0 \
        widest-line@4.0.1 \
        string-length@5.0.1 \
        camelcase@7.0.1 \
        kebab-case@1.0.2 \
        snake-case@3.0.4 \
        param-case@3.0.4 \
        header-case@2.0.4 \
        pascal-case@3.1.2 \
        constant-case@3.0.4 \
        dot-case@3.0.4 \
        no-case@3.0.4 \
        lower-case@2.0.2 \
        upper-case@2.0.2 \
        title-case@3.0.3 \
        sentence-case@3.0.4 \
        capital-case@1.0.4 \
        change-case@4.1.2 \
        pluralize@8.0.0 \
        singularize@1.0.0 \
        humanize-string@3.0.0 \
        decamelize@6.0.0 \
        deburr@1.0.1 \
        trim@1.0.1 \
        pad@3.2.0 \
        repeat-string@1.6.1 \
        truncate@3.0.0 \
        word-wrap@1.2.5 \
        text-table@0.2.0 \
        columnify@1.6.0 \
        cli-table3@0.6.3 \
        table@6.8.1 \
        ascii-table@0.0.9 \
        easy-table@1.2.0 \
        markdown-table@3.0.3 \
        remark@15.0.1 \
        remark-parse@11.0.0 \
        remark-stringify@11.0.0 \
        unified@11.0.4 \
        unist-util-visit@5.0.0 \
        mdast-util-to-string@4.0.0 \
        github-slugger@2.0.0 \
        remark-gfm@4.0.0 \
        remark-html@16.0.1 \
        rehype-stringify@10.0.0 \
        rehype-parse@9.0.0 \
        hast-util-to-string@3.0.0 \
        hastscript@8.0.0 \
        html-entities@2.4.0 \
        entities@4.5.0 \
        parse5@7.1.2 \
        htmlparser2@9.0.0 \
        domhandler@5.0.3 \
        domutils@3.1.0 \
        css-select@5.1.0 \
        css-what@6.1.0 \
        nth-check@2.1.1 \
        boolbase@1.0.0 \
        css-tree@2.3.1 \
        csstree@2.3.1 \
        csso@5.0.5 \
        clean-css@5.3.2 \
        postcss@8.4.32 \
        autoprefixer@10.4.16 \
        browserslist@4.22.2 \
        caniuse-lite@1.0.30001565 \
        electron-to-chromium@1.4.601 \
        node-releases@2.0.14 \
        update-browserslist-db@1.0.13 \
        escalade@3.1.1 \
        picocolors@1.0.0 \
        fraction.js@4.3.7 \
        normalize-range@0.1.2 \
        postcss-value-parser@4.2.0 \
        postcss-selector-parser@6.0.13 \
        cssesc@3.0.0 \
        util-deprecate@1.0.2 \
        inherits@2.0.4 \
        readable-stream@4.4.2 \
        string_decoder@1.3.0 \
        safe-buffer@5.2.1 \
        buffer@6.0.3 \
        ieee754@1.2.1 \
        base64-js@1.5.1 \
        events@3.3.0 \
        stream@0.0.2 \
        util@0.12.5 \
        process@0.11.10 \
        path@0.12.7 \
        querystring@0.2.1 \
        url@0.11.3 \
        punycode@2.3.1 \
        assert@2.1.0 \
        browserify-zlib@0.2.0 \
        pako@2.1.0 \
        crypto-browserify@3.12.0 \
        randombytes@2.1.0 \
        randomfill@1.0.4 \
        create-hash@1.2.0 \
        create-hmac@1.1.7 \
        ripemd160@2.0.2 \
        sha.js@2.4.11 \
        cipher-base@1.0.4 \
        md5.js@1.3.5 \
        hash-base@3.1.0 \
        pbkdf2@3.1.2 \
        evp_bytestokey@1.0.3 \
        browserify-cipher@1.0.1 \
        browserify-aes@1.2.0 \
        browserify-des@1.0.2 \
        des.js@1.1.0 \
        minimalistic-assert@1.0.1 \
        browserify-rsa@4.1.0 \
        bn.js@5.2.1 \
        miller-rabin@4.0.1 \
        brorand@1.1.0 \
        public-encrypt@4.0.3 \
        parse-asn1@5.1.6 \
        asn1.js@5.4.1 \
        minimalistic-crypto-utils@1.0.1 \
        browserify-sign@4.2.2 \
        elliptic@6.5.4 \
        hmac-drbg@1.0.1 \
        hash.js@1.1.7 \
        create-ecdh@4.0.4 \
        diffie-hellman@5.0.3 \
        vm-browserify@1.1.2 \
        console-browserify@1.2.0 \
        constants-browserify@1.0.0 \
        domain-browser@4.23.0 \
        https-browserify@1.0.0 \
        os-browserify@0.3.0 \
        stream-browserify@3.0.0 \
        stream-http@3.2.0 \
        builtin-status-codes@3.0.0 \
        xtend@4.0.2 \
        timers-browserify@2.0.12 \
        setimmediate@1.0.5 \
        tty-browserify@0.0.1 \
        node-libs-browser@2.2.1 && \
    chown -R sandbox:sandbox /sandbox

# Set up security restrictions
RUN echo 'sandbox soft nproc 50' >> /etc/security/limits.conf && \
    echo 'sandbox hard nproc 50' >> /etc/security/limits.conf && \
    echo 'sandbox soft nofile 512' >> /etc/security/limits.conf && \
    echo 'sandbox hard nofile 512' >> /etc/security/limits.conf && \
    echo 'sandbox soft fsize 50000' >> /etc/security/limits.conf && \
    echo 'sandbox hard fsize 50000' >> /etc/security/limits.conf

# Create execution timeout script
COPY --chown=sandbox:sandbox scripts/timeout_executor.js /app/scripts/
RUN chmod +x /app/scripts/timeout_executor.js

# Switch to sandbox user
USER sandbox

# Expose port
EXPOSE 8004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8004/health || exit 1

# Start the sandbox server
CMD ["node", "src/sandbox_server.js"]