# Dependency Management Guide

**Last Updated:** 2026-01-30
**Why this exists:** To help you manage npm packages and prevent breaking changes

---

## Quick Commands

```bash
# Check for updates
npm outdated

# Update everything safely
npm update

# Install specific version
npm install package-name@version

# Update specific package to latest
npm install package-name@latest

# Remove unused packages
npm prune

# Verify your setup
npm install
```

---

## Understanding Version Numbers

### Semantic Versioning Format: `MAJOR.MINOR.PATCH`

Example: `4.1.0`
- **4** = Major version (breaking changes possible)
- **1** = Minor version (new features, backward compatible)
- **0** = Patch version (bug fixes only)

### Version Symbols in package.json

| Symbol | Range | Safe for? | Example |
|--------|-------|-----------|---------|
| `^4.1.0` | 4.1.0 to <5.0.0 | ✅ Normal use | Allows `4.1.1`, `4.2.0`, `4.99.0` |
| `~4.1.0` | 4.1.0 to <4.2.0 | ✅ Conservative | Allows `4.1.1`, `4.1.2` only |
| `4.1.0` | Exactly 4.1.0 | 🔒 Strict | Must be exactly `4.1.0` |
| `latest` | Always newest | ❌ **Risky** | Could jump to v5, v6, break code |
| `>4.1.0` | Anything newer | ⚠️ Dangerous | Could allow major version jumps |

**Recommendation:** Always use `^` (caret) for production projects. It allows safe updates but prevents major breaking changes.

---

## Current Project Dependencies

This project uses:

```json
{
  "dependencies": {
    "@clerk/nextjs": "^6.12.12",
    "@supabase/supabase-js": "^2.49.4",
    "@tailwindcss/postcss": "^4.1.18",
    "next": "^15.2.4",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.6.0"
  }
}
```

All use `^` (caret) for safe updates.

---

## Monthly Update Routine

Do this once a month to stay current:

### Step 1: Check for Updates
```bash
npm outdated
```

Output example:
```
Package              Current  Wanted  Latest  Location
@clerk/nextjs        6.12.12  6.15.0  6.15.0  node_modules/@clerk/nextjs
next                15.2.4  15.3.0  15.3.0  node_modules/next
```

### Step 2: Update Safely
```bash
npm update
```

This updates all packages to their latest **compatible** version within the ranges specified by `^`, `~`, etc.

### Step 3: Test Everything
```bash
npm run build
npm run dev
```

Visit `http://localhost:3000` and test core features.

### Step 4: Commit Changes
```bash
git add package-lock.json
git commit -m "chore: update dependencies"
git push
```

---

## Major Version Upgrades (Quarterly/As Needed)

Major version upgrades (e.g., Tailwind v3 → v4) require more attention.

### Example: Tailwind CSS v3 → v4 (What Happened)

**Problem:** Tailwind v4 is incompatible with v3 config and CSS

**Solution Steps:**

1. **Read the migration guide**
   - Visit: https://tailwindcss.com/docs/v4/migration-guide
   - Understand what changed

2. **Update package.json**
   ```json
   {
     "devDependencies": {
       "tailwindcss": "^4.1.0",
       "@tailwindcss/postcss": "^4.1.18"
     }
   }
   ```

3. **Install dependencies**
   ```bash
   npm install @tailwindcss/postcss
   npm update
   ```

4. **Update configuration files**

   **File: `postcss.config.js`**
   ```js
   // Old (v3)
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }

   // New (v4)
   module.exports = {
     plugins: {
       '@tailwindcss/postcss': {},
     },
   }
   ```

   **File: `app/globals.css`**
   ```css
   /* Old (v3) */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* New (v4) */
   @import "tailwindcss";
   ```

5. **Test thoroughly**
   ```bash
   npm run build
   npm run dev
   ```

6. **Review changes**
   ```bash
   git status
   git diff
   ```

7. **Commit**
   ```bash
   git add .
   git commit -m "chore: upgrade tailwindcss v3 to v4 with config updates"
   git push
   ```

---

## Troubleshooting

### Problem: "Package not found" after `npm install`

**Cause:** package.json references a package that doesn't exist or is misspelled

**Solution:**
```bash
# Reinstall everything from scratch
rm -rf node_modules package-lock.json
npm install
```

### Problem: Version conflicts

**Error:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
# Try forcing resolution
npm install --legacy-peer-deps
```

### Problem: Outdated global npm

**Solution:**
```bash
# Update npm itself
npm install -g npm@latest

# Check version
npm --version
```

### Problem: "Module not found" after updating

**Cause:** New version requires new peer dependency

**Solution:**
1. Read the error message carefully
2. Install the missing dependency
3. Check the package's upgrade guide

Example:
```bash
npm install missing-package
```

---

## Lock File (package-lock.json)

**What it is:** A lock file that ensures everyone installs the same exact versions

**Why it matters:**
- ✅ You install `react@19.1.0` today
- ✅ Your teammate installs tomorrow, gets `react@19.1.0` (same!)
- ✅ If not locked, they might get `react@19.2.0` (different!)

**How to use:**
```bash
# After `npm install`, commit the lock file
git add package-lock.json
git commit -m "update dependencies"

# Your teammate just runs:
npm install
# They get the exact same versions as you!
```

---

## Best Practices

### ✅ DO

- ✅ Use `npm update` monthly
- ✅ Commit `package-lock.json` to git
- ✅ Test after updates
- ✅ Use `^` (caret) for version ranges
- ✅ Read migration guides for major versions
- ✅ Keep Node.js up to date
- ✅ Review what changed: `npm outdated`

### ❌ DON'T

- ❌ Use `"latest"` in production code
- ❌ Skip testing after updates
- ❌ Ignore migration guides for major versions
- ❌ Run `npm update` and push without testing
- ❌ Manually edit package.json version numbers (use npm commands)
- ❌ Delete package-lock.json or ignore it in git

---

## Learning More

- [npm Docs](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [package.json Guide](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)

---

## Questions?

1. Check the troubleshooting section above
2. Run `npm help` to see available commands
3. Check the package's documentation on [npmjs.com](https://npmjs.com)
