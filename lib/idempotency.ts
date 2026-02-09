import 'server-only';
import crypto from 'crypto';

export function generateIdempotencyKey(userId: string, orderData: {
  items: Array<{ variant_id: string; quantity: number }>;
  address_id: string;
}): string {
  const payload = JSON.stringify({
    userId,
    items: orderData.items.sort((a, b) => a.variant_id.localeCompare(b.variant_id)),
    address_id: orderData.address_id,
    timestamp: Math.floor(Date.now() / 1000 / 60), // Round to nearest minute for idempotency window
  });
  
  return crypto.createHash('sha256').update(payload).digest('hex');
}






