import { db } from "../db";
import { migrate } from "../migrate";
import { hashPassword } from "../auth";

// Usage: npm run set-password -- <email> <new-password>
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: npm run set-password -- <email> <new-password>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

migrate();

const user = db.prepare("SELECT id, name FROM users WHERE email = ?").get(email.toLowerCase().trim()) as
  | { id: string; name: string }
  | undefined;

if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), user.id);
// Invalidate existing sessions for that user after a password change.
db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);

console.log(`✓ password updated for ${user.name} (${email})`);
