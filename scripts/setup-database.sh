#!/bin/bash

echo "Setting up Prisma database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set. Loading from .env file..."
    if [ -f .env ]; then
        export $(cat .env | grep DATABASE_URL | xargs)
    else
        echo "Error: .env file not found. Please create one with DATABASE_URL"
        exit 1
    fi
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Create initial migration
echo "Creating initial migration..."
npx prisma migrate dev --name init

# Seed the database (optional)
# echo "Seeding database..."
# npx prisma db seed

echo "Database setup complete!"
echo ""
echo "To view your database, run: npx prisma studio"