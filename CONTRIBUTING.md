<!-- @format -->

# Contributing to Xernerx Suite

Welcome, and thank you for your interest in contributing to the Xernerx Suite! We've worked hard to make the developer experience as seamless and frictionless as possible.

You do **not** need to manually configure databases, manage docker containers, or stitch together microservices to start contributing. Everything you need is automated out of the box!

## Getting Started

Follow these simple steps to spin up the entire monorepo locally:

### 1. Fork and Clone

Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/suite.git
cd suite
```

### 2. Install Dependencies

This project uses `pnpm` as its package manager. If you don't have it installed, you can install it globally via npm:

```bash
npm install -g pnpm
```

Once installed, install all monorepo dependencies:

```bash
pnpm i
```

### 3. Start the Development Environment

Start the development servers by running the native suite command:

```bash
suite dev
```

Alternatively, you can run it via the workspace script:

```bash
pnpm dev
```

**What happens when you run this?**

- The CLI will automatically bootstrap your `.env` configuration.
- It dynamically binds the routing to your local IP address for full cross-device testing.
- **Zero Database Configuration:** If no database is detected, it automatically downloads and spins up an isolated, persistent `mongodb-memory-server` in the background (storing data in `.xernerx/database`). You don't need to install Docker or MongoDB natively!
- All 7 Next.js applications (WWW, API, CDN, Account, App, Docs, Admin) will boot concurrently and proxy automatically.

> [!IMPORTANT]
> **Authentication / Login:** The suite uses Discord for authentication. To log in locally, you must create a free application at the [Discord Developer Portal](https://discord.com/developers/applications) and grab your **Client ID** and **Client Secret**. The CLI will prompt you for these during its first-time setup!

> [!TIP]
> **Claiming Master Admin (First-time Setup):** When booting a fresh database for the first time, you must claim the Master Admin (`owner`) role to access the Admin Dashboard. Navigate to `http://admin.<YOUR_LOCAL_DOMAIN>/setup/<YOUR_NEXTAUTH_SECRET>` (using the exact `NEXTAUTH_SECRET` generated in your `.env` file). This will safely crown your first logged-in user as the owner and lock the backdoor permanently.

> [!NOTE]
> **Custom Domains & Tunnels:** If you choose to configure a custom "owned domain" (e.g., `dev.yourdomain.com`) instead of the default local IP, it requires an advanced setup with a **Cloudflare Tunnel** running concurrently so that traffic can securely route to your local Next.js servers.

### 4. Making Changes

- Create a new branch for your feature (`git checkout -b feature/my-new-feature`)
- Make your changes across the respective `apps/*`, `packages/*`, `services/*`, or `clients/*`.
- Ensure your code passes any existing linting or formatting standards.
- Commit your changes and push to your fork.
- Open a Pull Request!

## Architecture

The Xernerx Suite is a Turborepo/pnpm monorepo containing:

- `apps/*`: Next.js applications serving distinct subdomains.
- `packages/*`: Shared internal libraries (components, lib, providers, config) used across the apps.
- `services/*`: Microservices and background workers orchestrating platform operations.
- `clients/*`: Dedicated client interfaces and libraries.
- `.xernerx/cli`: The custom CLI orchestrating the development environment.

Happy coding!
