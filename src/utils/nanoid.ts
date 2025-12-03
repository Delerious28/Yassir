// Small, dependency-free nanoid substitute for local UI IDs
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export function nanoid(size = 12): string {
  let id = ''
  const len = alphabet.length
  for (let i = 0; i < size; i++) {
    id += alphabet[Math.floor(Math.random() * len)]
  }
  return id
}
