# 🔒 Privacy Policy

Your privacy is important. This Privacy Policy details how **The Molecular Sandbox** handles data, storage, and external API requests.

---

## 💾 Local Data Storage
*   **Browser `localStorage`**: The application uses your browser's local storage to save user preferences, such as whether you have viewed the onboarding welcome modal. This data never leaves your local browser profile.
*   **SQLite Database**: All lab saves, chemicals, reactions, and journal logs are stored in a local SQLite file (`prisma/dev.db` or `db/custom.db`) managed by Prisma on your local machine. No database records are transmitted to remote servers.

## 📡 External API Requests
*   **AI Lab Assistant (Dr. Beaker)**:
    *   If you interact with the optional AI Assistant panel, your chat messages and a summary of your current virtual lab state (beaker contents, temperature, pH) are sent to the Z-AI Web Development SDK endpoint to generate responses.
    *   **No personal identifying information (PII)** is packaged or transmitted.
    *   If you choose not to use the AI Assistant, no network requests are sent to the AI endpoint.

## 🍪 Cookies & Tracking
The Molecular Sandbox does not use tracking cookies, analytics pixels, or telemetry scripts to monitor user behavior or build user profiles.

## 📝 Updates to This Policy
This policy may be updated as features evolve. All updates will be committed directly to this repository.
