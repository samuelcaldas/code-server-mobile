# Infrastructure & Environment Setup

This document describes the hosting, deployment contexts, DNS, and reverse proxy configuration for **code-server mobile**.

## Development & Production Host Contexts

- **Dev Host / Context:** `docker-dev` remote context (used for development, builds, and testing).
- **Production Host / Context:** `docker-vm` remote context (`10.250.50.165` - Ubuntu Server).

## Active Production Deployment

- **Public Domain:** `code.dev.timoteo.mg.gov.br`
- **Internal Host:** `10.250.50.165` (`docker-vm`)
- **Published Port:** `8088` (Container port: `8080`)
- **Container Name:** `code-server-mobile`
- **Timezone:** `TZ=America/Sao_Paulo`, `GENERIC_TIMEZONE=America/Sao_Paulo`
- **Health Check Endpoint:** `http://10.250.50.165:8088/healthz` (Status: `healthy`)

## DNS Configuration

- **Dev Domain Pattern:** `*.dev.timoteo.mg.gov.br`
- **Wildcard DNS:** `*.dev.timoteo.mg.gov.br` points to `docker-vm` (`10.250.50.165`).
- **Local DNS Server:** Active Directory on `dc01001` (`10.250.50.1`). External DNS resolves through it.

## Nginx Proxy Manager (NPM) Configuration Guide

NPM is hosted on **`fs01002`** (`10.250.50.60`). Apply the following settings manually via the NPM Web UI:

### 1. Proxy Host Settings

| Setting | Value |
| :--- | :--- |
| **Domain Names** | `code.dev.timoteo.mg.gov.br` |
| **Scheme** | `http` |
| **Forward Hostname / IP** | `10.250.50.165` |
| **Forward Port** | `8088` |
| **Cache Assets** | `Disabled` |
| **Block Common Exploits** | `Enabled` |
| **Websockets Support** | `Enabled` (Mandatory for VS Code workbench & terminal RPC) |

### 2. SSL Configuration

| Setting | Value |
| :--- | :--- |
| **SSL Certificate** | `*.dev.timoteo.mg.gov.br` (Wildcard Let's Encrypt / Municipal Cert) |
| **Force SSL** | `Enabled` |
| **HTTP/2 Support** | `Enabled` |
| **HSTS Enabled** | `Enabled` |

### 3. Custom Nginx Configuration (Advanced)

> [!IMPORTANT]
> O Nginx Proxy Manager já injeta os headers `Upgrade`, `Connection`, `Host`, `X-Forwarded-For` e `proxy_http_version 1.1` automaticamente quando o toggle **Websockets Support** está ativado no NPM.
> **Não repita** `proxy_set_header` no campo Custom Nginx Configuration, pois causa conflito de sintaxe/escopo no template do NPM e derruba o proxy.

No campo **Custom Nginx Configuration**, adicione apenas as diretivas de timeout e limite de upload (ou deixe em branco):

```nginx
client_max_body_size 100M;
proxy_read_timeout 86400s;
proxy_send_timeout 86400s;
```
