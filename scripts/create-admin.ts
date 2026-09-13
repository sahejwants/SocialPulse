import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = "admin@socialpulse.com";
  const password = "Admin@12345"; // change after first login

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists. Updating role to ADMIN...");
    await db.user.update({ where: { email }, data: { role: Role.ADMIN } });
    console.log("Done.");
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await db.user.create({
    data: {
      name: "Admin",
      email,
      password: hash,
      role: Role.ADMIN,
      emailVerified: new Date(), // pre-verified so login works immediately
    },
  });

  console.log(`\nAdmin user created:`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`\nChange the password after first login.\n`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
