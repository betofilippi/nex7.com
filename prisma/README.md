# Prisma Database Setup

This project uses Prisma as the ORM with PostgreSQL as the database.

## Quick Start

1. **Set up your database connection**
   - Copy `.env.example` to `.env` (if available) or create a `.env` file
   - Update the `DATABASE_URL` in `.env` with your PostgreSQL connection string:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/nex7_db?schema=public"
     ```

2. **Run the setup script**
   ```bash
   npm run db:setup
   ```
   This will:
   - Generate the Prisma Client
   - Create the initial migration
   - Apply the migration to your database

3. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```
   This creates sample data for development.

## Available Commands

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations
- `npm run db:push` - Push schema changes without migrations (development only)
- `npm run db:seed` - Seed the database with sample data
- `npm run db:studio` - Open Prisma Studio (GUI for database)
- `npm run db:setup` - Complete database setup

## Database Schema

The schema includes the following models:

### User
- Authentication support (local, Google, GitHub OAuth)
- Role-based access (USER, ADMIN)
- Profile information (name, email, image)

### Session
- JWT token management
- Session expiration handling

### Conversation & Message
- Claude AI conversation history
- Message roles (USER, ASSISTANT, SYSTEM)
- File attachments and metadata support

### Project
- User projects with framework information
- Repository links
- Project status tracking

### Deployment
- Vercel deployment tracking
- Deployment status and metadata
- Environment configuration

### Workflow
- Visual workflow designer data
- Nodes and edges for flow representation
- Public/private workflow sharing

### AgentMemory
- Persistent memory for AI agents
- Key-value storage with expiration
- Agent-specific context management

## Migration Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. **Apply to production**:
   ```bash
   npx prisma migrate deploy
   ```

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify network access to database

### Migration Errors
- Run `npx prisma migrate reset` to reset database (CAUTION: deletes all data)
- Check for pending migrations with `npx prisma migrate status`

### Type Errors
- Run `npm run db:generate` after schema changes
- Restart TypeScript server in your IDE

## Production Considerations

1. Use connection pooling for better performance
2. Set up regular backups
3. Monitor query performance with Prisma's built-in logging
4. Consider using Prisma Accelerate for edge deployments
5. Use read replicas for scaling read operations