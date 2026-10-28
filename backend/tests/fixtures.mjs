// Minimal repository double for application tests; does not model MongoDB concurrency.
import { isDeepStrictEqual } from 'node:util';
export function fixture(seed = {}) {
  let records = structuredClone(seed);
  const matches = (row, filter = {}) => Object.entries(filter).every(([key, value]) => {
    if (key === '$and') return value.every(item => matches(row, item));
    if (key === '$or') return value.some(item => matches(row, item));
    const actual = row[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      return Object.entries(value).every(([op, expected]) => {
        if (op === '$ne') return !isDeepStrictEqual(actual, expected);
        if (op === '$in') return expected.includes(actual);
        if (op === '$gte') return actual >= expected;
        if (op === '$gt') return actual > expected;
        if (op === '$lte') return actual <= expected;
        throw new Error('Unimplemented fixture operator: ' + op);
      });
    }
    return isDeepStrictEqual(actual, value);
  });
  const rows = name => records[name] ||= [];
  const update = (row, change) => {
    Object.assign(row, structuredClone(change.$set || {}));
    for (const [key, value] of Object.entries(change.$inc || {})) row[key] = (row[key] || 0) + value;
    return row;
  };
  const db = { command: async () => ({ ok: 1 }), collection(name) {
    return {
      findOne: async filter => structuredClone(rows(name).find(row => matches(row, filter)) || null),
      find(filter) {
        let selected = rows(name).filter(row => matches(row, filter));
        return { limit(value) { selected = selected.slice(0, value); return this; }, toArray: async () => structuredClone(selected) };
      },
      countDocuments: async filter => rows(name).filter(row => matches(row, filter)).length,
      insertOne: async row => { rows(name).push(structuredClone(row)); return { insertedId: row.id }; },
      insertMany: async values => { rows(name).push(...structuredClone(values)); },
      updateOne: async (filter, change, options = {}) => {
        let row = rows(name).find(row => matches(row, filter));
        const inserted = !row && options.upsert;
        if (inserted) { row = { ...filter, ...change.$setOnInsert }; rows(name).push(row); }
        if (!row) return { matchedCount: 0, modifiedCount: 0 };
        update(row, change); return { matchedCount: inserted ? 0 : 1, modifiedCount: inserted ? 0 : 1, upsertedCount: inserted ? 1 : 0 };
      },
      updateMany: async (filter, change) => rows(name).filter(row => matches(row, filter)).forEach(row => update(row, change)),
      findOneAndUpdate: async (filter, change) => {
        const row = rows(name).find(row => matches(row, filter));
        return row ? structuredClone(update(row, change)) : null;
      },
      findOneAndDelete: async filter => {
        const index = rows(name).findIndex(row => matches(row, filter));
        return index < 0 ? null : rows(name).splice(index, 1)[0];
      },
      deleteOne: async filter => { const index = rows(name).findIndex(row => matches(row, filter)); if (index >= 0) rows(name).splice(index, 1); },
      deleteMany: async filter => { records[name] = rows(name).filter(row => !matches(row, filter)); },
    };
  } };
  const client = { startSession: () => ({
    async withTransaction(work) {
      const before = structuredClone(records);
      try { return await work(); } catch (error) { records = before; throw error; }
    }, endSession: async () => {},
  }) };
  return { db, client, rows };
}
