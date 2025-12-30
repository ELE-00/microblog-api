//seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const PASSWORD = "Password123!";

// ---------- Helpers ----------
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const shortBios = [
  "Building things on the internet.",
  "Coffee, code, repeat.",
  "Learning one bug at a time.",
  "Frontend enjoyer.",
  "Backend survivor."
];

const longBios = [
  "Software developer passionate about building thoughtful user experiences and clean, maintainable systems. Currently experimenting with side projects and learning something new every day.",
  "I enjoy solving complex problems, simplifying workflows, and occasionally overengineering things just to understand them better. Big fan of clean UI and good UX.",
  "Self-taught developer with a background in curiosity-driven learning. Interested in product thinking, design systems, and human-centered software."
];

const locations = ["Lisbon", "Berlin", "London", "Remote", "Porto", "Amsterdam"];
const occupations = ["Developer", "Designer", "Student", "Engineer", "Founder"];

const usersData = [
  "alex", "maria", "sam", "jordan", "nina",
  "leo", "emma", "tom", "rachel", "ivan",
  "lucas", "sofia", "dan", "mia", "chris"
];

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  // Clean slate
  await prisma.follow.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const users = [];

  // Create users + profiles
  for (const username of usersData) {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        profile: {
          create: {
            name: username.charAt(0).toUpperCase() + username.slice(1),
            bio: Math.random() > 0.5 ? rand(shortBios) : rand(longBios),
            location: rand(locations),
            occupation: rand(occupations)
          }
        }
      }
    });

    users.push(user);
  }

  // Create follow relationships
  for (const follower of users) {
    const followCount = Math.floor(Math.random() * 6); // 0–5 follows

    const shuffled = users
      .filter(u => u.id !== follower.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, followCount);

    for (const following of shuffled) {
      try {
        await prisma.follow.create({
          data: {
            followerId: follower.id,
            followingId: following.id
          }
        });
      } catch {
        // ignore duplicates
      }
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
