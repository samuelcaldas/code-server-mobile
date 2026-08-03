# Infrastructure & Environment Setup

This document describes the hosting, deployment contexts, DNS, and reverse proxy configuration.

## Development & Production Host Contexts

- **Dev Host / Context:** `docker-dev` remote context (used for development, builds, and testing).
- **Production Host / Context:** `docker-vm` remote context (`10.250.50.165` - Ubuntu Server).

## DNS Configuration

- **Dev Domain Pattern:** `*.dev.timoteo.mg.gov.br`
- **Wildcard DNS:** `*.dev.timoteo.mg.gov.br` points to `docker-vm` (`10.250.50.165`).
- **Local DNS Server:** Active Directory on `dc01001` (`10.250.50.1`). External DNS resolves through it.

## Nginx Proxy Manager (NPM)

- **Host:** Running on server `fs01002` (`10.250.50.60`).
- **Configuration:** Configured manually by administrators (do NOT interact programmatically). Provide manual setup instructions when updating proxy routing rules.
