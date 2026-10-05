import { randomInt } from "node:crypto";

// Unambiguous alphabet: no 0/O, 1/I/L, U — easy to read aloud and copy by hand.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** e.g. OC26-7K3F9Q — ~730M combinations; uniqueness is still enforced by the DB. */
export function generateApplicationId() {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `OC26-${out}`;
}
