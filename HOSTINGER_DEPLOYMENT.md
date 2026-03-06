# Hostinger Deployment (Business Web Hosting)

This project now supports:
- Email/password signup + login
- Session cookies
- Server-side trade storage in MySQL

## 1. Prepare MySQL Database
1. In Hostinger hPanel, create a MySQL database and user.
2. Open phpMyAdmin for that database.
3. Run the SQL from [sql/init.sql](/Users/abhishekkumar/Documents/trading-diary/sql/init.sql).

## 2. Configure Environment Variables
Add these variables in your hosting app environment:
- `DB_HOST`
- `DB_PORT` (usually `3306`)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `NODE_ENV=production`

Template: [.env.example](/Users/abhishekkumar/Documents/trading-diary/.env.example)

## 3. Build and Start Commands
Use these commands:
- Install: `npm install`
- Build: `npm run build`
- Start: `npm run start`

`package.json` already has the needed scripts.

## 4. Domain + HTTPS
- Point your domain/subdomain to the Node app in Hostinger.
- Ensure HTTPS is enabled.
- Because auth uses secure cookies in production, HTTPS is required.

## 5. Verify After Deploy
1. Open your app URL.
2. Sign up a new account.
3. Login.
4. Add a trade.
5. Verify DB rows in `users`, `user_sessions`, and `trades` tables.

## 6. Important Current Scope
- Server persistence is implemented for **authentication and trades**.
- Ideas/goals/filters/templates still use local browser storage currently.
- If you want, next step is migrating those modules to MySQL too.
