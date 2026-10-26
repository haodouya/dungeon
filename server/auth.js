// 密码哈希与会话令牌：只使用 Node 内置 crypto，无外部依赖。
import crypto from 'node:crypto'

const KEY_LEN = 64

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(password), salt, KEY_LEN).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false
  const [scheme, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const actual = crypto.scryptSync(String(password), salt, KEY_LEN)
  const expected = Buffer.from(hash, 'hex')
  if (actual.length !== expected.length) return false
  return crypto.timingSafeEqual(actual, expected)
}

export function randomToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function validateUsername(username) {
  const value = String(username || '').trim()
  if (value.length < 3 || value.length > 24) return false
  return /^[\p{L}\p{N}_-]+$/u.test(value)
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 72
}
