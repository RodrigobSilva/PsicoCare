import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const password = 'nova123';
  const hashed = await hashPassword(password);
  console.log(`Email: psicorodrigo@rodrigo.com`);
  console.log(`Password: ${password}`);
  console.log(`Hashed: ${hashed}`);
}

main().catch(console.error);