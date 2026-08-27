# ESENet — web

The ESENet platform: a year-round talent network for ESEN students, alumni,
and companies. See [`../CLAUDE.md`](../CLAUDE.md) for full project context,
brand tokens, data model and roadmap scope.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and anon key (Project
Settings → API), then run `supabase/schema.sql` in the Supabase SQL editor,
followed by every file in `supabase/migrations/`, in numeric order.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
