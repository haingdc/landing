import { createHash } from "node:crypto"

// returns the current server time in UTC format
const getTime = (date: Date) => {
  const coeff = 1000 * 60 * 5; // 5 minutes
  return new Date(Math.floor(date.getTime() / coeff) * coeff).toUTCString();
};

const md5 = (input: string) => createHash("md5").update(input).digest("hex")

export { getTime, md5 };