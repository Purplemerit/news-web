# NewsWeb Setup Instructions

Your NewsWeb application has been fully set up with the following features:
- **Next.js App Router** with TypeScript
- **Authentication**: NextAuth.js with Credentials (Email/Password) and Prisma Adapter
- **Database**: SQLite with Prisma ORM
- **UI**: Modern, premium design with Glassmorphism, Responsive Grid, and Animations
- **Pages**: Home, Login, Signup, About, Forgot Password

## Getting Started

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Setup Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features & Usage

- **Sign Up**: Create an account using the Sign Up page.
- **Log In**: Use your credentials to log in.
- **Home Page**: Displays featured and latest news. If the database is empty, placeholder data is shown automatically.
- **Admin**: You can inspect the database using `npx prisma studio`.

## Troubleshooting

- If you see a "PrismaClient" error: Run `npx prisma generate` again and restart the server.
- Database is stored locally in `dev.db`.
