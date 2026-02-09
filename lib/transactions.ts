import 'server-only';
import { getAdminDbClient } from './adminDb';

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
}

export class TransactionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TransactionError';
  }
}

export async function executeInTransaction<T>(
  callback: (db: ReturnType<typeof getAdminDbClient>) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const db = getAdminDbClient();
  const isolationLevel = options.isolationLevel || 'READ COMMITTED';
  
  try {
    await db.rpc('begin_transaction', { isolation_level: isolationLevel });
    
    try {
      const result = await callback(db);
      await db.rpc('commit_transaction');
      return result;
    } catch (error) {
      await db.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new TransactionError(`Transaction failed: ${error.message}`, error);
    }
    throw new TransactionError('Transaction failed with unknown error');
  }
}






