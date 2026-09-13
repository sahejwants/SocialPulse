import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@socialpulse.com.au" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@socialpulse.com.au",
      password: adminPassword,
      emailVerified: new Date(),
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user seeded: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
