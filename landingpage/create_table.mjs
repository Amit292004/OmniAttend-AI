import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Review table...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."Review" (
          "id" TEXT NOT NULL,
          "rating" INTEGER NOT NULL,
          "comment" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
      );
    `);
    
    // Add foreign key if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
      console.log("Foreign key added.");
    } catch (fkError) {
      console.log("Foreign key might already exist, ignoring:", fkError.message);
    }
    
    console.log("Review table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
