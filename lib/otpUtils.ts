import crypto from 'crypto';

const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = 'sha256';

function verifyPbkdf2Password(password: string, hash: string): boolean {
  try {
    const parts = hash.split('$');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const digest = parts[1] || PBKDF2_DIGEST;
    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const storedHash = parts[4];

    if (!iterations || !salt || !storedHash) return false;

    const computedHash = crypto
      .pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, digest as crypto.BinaryToTextEncoding)
      .toString('hex');

    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}


/**
 * Generate a random OTP of specified length
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
}

/**
 * Hash OTP using SHA-256 with salt
 */
export async function hashOTP(otp: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(otp + salt)
    .digest('hex');
  
  return `${salt}:${hash}`;
}

/**
 * Verify OTP against its hash
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  try {
    const [salt, storedHash] = hash.split(':');
    
    if (!salt || !storedHash) {
      return false;
    }
    
    const computedHash = crypto
      .createHash('sha256')
      .update(otp + salt)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(storedHash)
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

/**
 * Hash password using scrypt
 * Format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');

    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err: NodeJS.ErrnoException | null, derivedKey: Buffer) => {
      if (err) {
        reject(err);
      } else {
        const hash = derivedKey.toString('hex');
        resolve(`${salt}:${hash}`);
      }
    });
  });
}


export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('pbkdf2$')) {
    return verifyPbkdf2Password(password, hash);
  }

  return new Promise((resolve) => {
    try {
      const [salt, storedHash] = hash.split(':');
      
      if (!salt || !storedHash) {
        resolve(false);
        return;
      }

      // Use scrypt() async API instead of scryptSync (which does not accept a callback)
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err: NodeJS.ErrnoException | null, derivedKey: Buffer) => {
        if (err) {
          console.error('Error verifying password:', err);
          resolve(false);
          return;
        }
        
        const computedHash = derivedKey.toString('hex');
        
        try {
          const isValid = crypto.timingSafeEqual(
            Buffer.from(computedHash),
            Buffer.from(storedHash)
          );
          resolve(isValid);
        } catch (error: unknown) {
          console.error('Error verifying password:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error in verifyPassword:', error);
      resolve(false);
    }
  });
}