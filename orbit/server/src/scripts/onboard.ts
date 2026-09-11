import { db } from "../db";
import { migrate } from "../migrate";
import { hashPassword } from "../auth";
import { randomBytes } from "node:crypto";

migrate();

// [display name, email, password]
const members: [string, string, string][] = [
  ["Kashyap", "kashyap@engipros.com", "kashyap"],
  ["Jatin",   "jatin@engipros.com",   "jatin"],
  ["Harshil", "harshil@engipros.com", "harshil"],
  ["Hitesh",  "hitesh@engipros.com",  "hitesh"],
  ["Parth",   "parth@engipros.com",   "parth"],
];
const palette = ["#5b63d3", "#2f9e5f", "#d64545", "#c8880e", "#8b5cf6", "#0ea5a4"];
const ins = db.prepare("INSERT INTO users (id,name,init,color,presence,email,password_hash) VALUES (?,?,?,?,?,?,?)");

let added = 0;
members.forEach(([name, email, pass], i) => {
  const lower = email.toLowerCase().trim();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(lower)) {
    console.log(`• ${lower} already exists — skipping`);
    return;
  }
  ins.run(`u_${randomBytes(5).toString("hex")}`, name, name[0].toUpperCase(),
          palette[i % palette.length], "offline", lower, hashPassword(pass));
  console.log(`✓ ${name} <${lower}>  password: ${pass}`);
  added++;
});
console.log(`Done. ${added} user(s) added.`);
