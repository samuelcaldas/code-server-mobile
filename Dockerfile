FROM node:22-bookworm-slim

# Install system utilities and tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    dumb-init \
    git \
    openssh-client \
    sudo \
    ca-certificates \
    procps \
    locales \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Set up timezone and locales
ENV TZ=America/Sao_Paulo \
    GENERIC_TIMEZONE=America/Sao_Paulo \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
    sed -i "s/# en_US.UTF-8/en_US.UTF-8/" /etc/locale.gen && locale-gen

# Create non-root coder user with sudo access
RUN if grep -q 1000 /etc/passwd; then userdel -r "$(id -un 1000)" 2>/dev/null || true; fi && \
    useradd -m -s /bin/bash -u 1000 -U coder && \
    echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd && \
    chmod 0440 /etc/sudoers.d/nopasswd

# Install code-server mobile release build
COPY release /usr/lib/code-server
RUN chmod +x /usr/lib/code-server/bin/code-server && \
    ln -s /usr/lib/code-server/bin/code-server /usr/local/bin/code-server

# Set up user directories
RUN mkdir -p /home/coder/workspace /home/coder/.config/code-server && \
    chown -R coder:coder /home/coder

EXPOSE 8080
USER coder
WORKDIR /home/coder/workspace

# Container healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fs http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["dumb-init", "code-server", "--bind-addr", "0.0.0.0:8080"]
