# Wenab

✨ A privacy-focused, open-source, self-hostable budgeting application. ✨

> Give Every Dollar a Job
>
> A Budget App Should Not be a New Source of Expense

Wenab aims to provide a powerful and flexible budgeting tool inspired by methodologies like Zero-Based Budgeting, while prioritizing user control, data privacy, and transparency. It's built for individuals, families, and small business owners who want to take control of their finances without compromising on privacy or paying hefty subscription fees.

## Key Features

*   **Zero-Based & Envelope Budgeting**: Allocate every dollar to specific categories (envelopes).
*   **Real-Time Syncing**: Data syncs across devices, with offline support.
*   **End-to-End Encryption**: User data is encrypted end-to-end, ensuring privacy. You control the keys.
*   **Self-Hostable**: Fully open-source with clear documentation for self-hosting.
*   **Bank Integration**: Optional seamless integration for automatic transaction imports.
*   **Customizable Categories & Reporting**: Tailor categories and generate detailed financial reports.
*   **Goal Tracking**: Set and monitor financial goals (savings, debt reduction, etc.).
*   **Shared Budgets**: Collaborate on budgets with family members or partners.
*   **Roll-Over System**: Unused funds can roll over to the next month or be reallocated.

## Technical Stack

*   **Language**: TypeScript
*   **Monorepo Management**: Nx
*   **Backend**: NestJS (implicitly, via `@nestjs/*` dependencies)
*   **Frontend**: React, Vite, TanStack Query
*   **UI Components**: shadcn/ui
*   **Database/Auth**: Supabase
*   **Testing**: Jest, Playwright (for E2E)
*   **Analytics**: Plausible (planned)

## Getting Started (Development)

This is an [Nx workspace](https://nx.dev).

**Install dependencies:**

```sh
npm install # or yarn install / pnpm install
```

**Run the development servers:**

```sh
# API
npm run a:s
# Frontend
npm run f:s
```

**Build for production:**

```sh
# API
npx nx build wenab-api

# Frontend
npx nx build wenab-frontend
```

**Run tests:**

```sh
# Run unit tests for a specific project (e.g., wenab-api)
npx nx test wenab-api

# Run e2e tests
npx nx e2e wenab-api-e2e
# or
npx nx e2e wenab-frontend-e2e
```

**Explore project tasks:**

```sh
npx nx show project wenab-api --web
npx nx graph
```

## Self-Hosting

Wenab is designed to be easily self-hostable. Detailed instructions will be provided in the documentation (coming soon). The core requirements will be Node.js and a Supabase instance (or compatible Postgres database).

## Roadmap & Contributing

We have a [public roadmap](link-to-roadmap-if-available) (TODO: Add link) where you can see planned features and suggest new ones.

Contributions are welcome! Please refer to the `CONTRIBUTING.md` file (TODO: Create CONTRIBUTING.md) for guidelines on how to contribute, report bugs, or propose features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
