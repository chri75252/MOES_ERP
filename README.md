# MCE Command Center

**A Project & Tender Management System**

---

## What is This?

MCE Command Center is a web application for managing construction projects and tenders. It helps you:

- 📁 **Track Projects** — Manage all your construction projects in one place
- 📋 **Handle Tenders** — Track tender deadlines, communications, and submissions
- 📄 **Store Documents** — Securely upload and organize project files
- 👥 **Collaborate** — Work with your team with role-based access
- 📝 **Audit Trail** — Keep a complete record of all actions

---

## Quick Links

| Document | Description |
|----------|-------------|
| [guide.txt](./guide.txt) | **Start here!** Full setup guide step-by-step |
| [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) | How to use the app (common tasks) |
| [SYSTEM_ARCHITECTURE_COMPLETE.md](./SYSTEM_ARCHITECTURE_COMPLETE.md) | Technical overview |
| [DATABASE_SCHEMA_REFERENCE.md](./DATABASE_SCHEMA_REFERENCE.md) | Database tables explained |
| [ISSUE_RESOLUTION_REPORT.md](./ISSUE_RESOLUTION_REPORT.md) | Bug fixes and solutions |

---

## Technology Stack

| Tool | Purpose |
|------|---------|
| **Next.js 15** | Web framework |
| **React 18** | User interface |
| **TypeScript** | Programming language |
| **Clerk** | Authentication (login/signup) |
| **Supabase** | Database + File storage |
| **Tailwind CSS** | Styling |

---

## Getting Started

### Prerequisites

- **Node.js 18+** — Download from [nodejs.org](https://nodejs.org)
- **A code editor** — We recommend [VS Code](https://code.visualstudio.com)
- **A Clerk account** — Free at [clerk.com](https://clerk.com)
- **A Supabase account** — Free at [supabase.com](https://supabase.com)

### Installation (5 Minutes)

```bash
# 1. Clone or download the project
git clone <repo-url>
cd mce-command-center

# 2. Install dependencies
npm install

# 3. Create .env.local file (see guide.txt for details)

# 4. Start the development server
npm run dev

# 5. Open http://localhost:3000
```

**For detailed instructions, see [guide.txt](./guide.txt)**

---

## Project Structure

```
mce-command-center/
├── app/                  # Pages and server logic
│   ├── ssr/             # Database operations
│   ├── dashboard/       # Main dashboard
│   ├── projects/        # Project pages
│   ├── tenders/         # Tender pages
│   ├── documents/       # Document upload
│   └── notifications/   # Alerts
├── supabase/            # Database migrations
│   └── migrations/      # SQL files
├── public/              # Static assets
├── .env.local           # Your secret keys
└── guide.txt           # Setup instructions
```

---

## User Roles

| Role | Access Level |
|------|-------------|
| `super_admin` | Full access to everything |
| `chairman_vp` | Executive oversight |
| `dept_head` | Department management |
| `finance` | Financial oversight |
| `pm` | Project management |
| `engineer` | Technical work |
| `viewer` | Read-only (default) |

---

## Key Features

### Dashboard
- Real-time project counts
- Tender deadline warnings (14/7/3/1/today)
- Upcoming milestones
- Notification center

### Projects
- Create and manage projects
- **Edit project details** (name, status, progress, dates)
- **Delete projects** with confirmation
- Track progress with milestones
- Assign team members
- View project UUID for document uploads
- Export data to CSV

### Tenders
- Track tender deadlines
- Log communications
- Store tender documents
- Team collaboration

### Documents
- Secure file upload
- Organized by project/tender
- Access control via permissions
- Download with signed URLs

### Security
- Row Level Security (RLS)
- Role-based access control
- Complete audit trail
- Secure file storage

---

## Environment Variables

Create a `.env.local` file with these variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database Setup

Run these migrations in Supabase SQL Editor (in order):

1. `supabase/migrations/001_day1_schema.sql` — Creates tables
2. `supabase/migrations/002_day1_rls.sql` — Security policies
3. `supabase/migrations/004_security_hotfix.sql` — Bug fixes

For storage bucket:
- Create bucket named `mce-documents`
- See `003_storage_policies.sql` for policy reference

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Profile not found" | Sign out and back in |
| Projects list empty | Run `004_security_hotfix.sql` migration |
| Upload fails | Use UUID, not project code |
| Empty dashboard | Refresh page (F5) |

**For detailed troubleshooting, see [ISSUE_RESOLUTION_REPORT.md](./ISSUE_RESOLUTION_REPORT.md)**

---

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm run start
```

---

## Deployment

Recommended: **Vercel**

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

See [guide.txt](./guide.txt) for detailed Vercel deployment steps.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

[Your License Here]

---

## Support

For issues or questions:
1. Check the documentation files
2. Review the troubleshooting guide
3. Check Supabase logs for database issues
4. Check browser console for frontend errors

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2026-01-24 | Added project edit/delete, UUID display, auto-fill document uploads |
| 2.0 | 2026-01-21 | Bug fixes, documentation updates |
| 1.0 | 2026-01-20 | Initial release |
