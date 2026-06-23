# 🤝 Contributing to The Molecular Sandbox

Thank you for your interest in contributing! We welcome contributions to improve the chemistry engine, add 3D visual effects, expand the chemical/reaction databases, or refine the UI design.

---

## 🛠️ Development Setup

1. Fork the repository and clone your fork locally:
   ```bash
   git clone https://github.com/your-username/MolecularSandbox.git
   cd MolecularSandbox
   ```
2. Install dependencies:
   ```bash
   bun install # or npm install
   ```
3. Initialize the database and run seeds:
   ```bash
   bun run db:push
   bun run db:seed
   ```
4. Start the local dev server:
   ```bash
   bun run dev
   ```

## 📐 Guidelines

### 1. Code Standards
*   Use TypeScript for logic and type safety.
*   Use Tailwind CSS 4 for styling, utilizing global custom design tokens found in `src/app/globals.css`.
*   Maintain Zustand store actions cleanly in `src/lib/store/lab-store.ts`.

### 2. Code Quality & Linting
Ensure all code compiles and passes lints before proposing a change:
```bash
bun run lint
```

### 3. Database Modifications
If you add chemicals or reactions:
1. Update `prisma/schema.prisma` if structural tables change.
2. Edit `prisma/seed.ts` to include the new chemicals or balanced equations.
3. Run `bun run db:seed` to test database population locally.

---

## 🚀 Submitting a Pull Request

1. Create a descriptive branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your modifications with clean, conventional commit messages.
3. Push to your fork and submit a Pull Request (PR) to the `main` branch.
4. Ensure your PR description lists the features added, bugs resolved, and manual testing completed.
