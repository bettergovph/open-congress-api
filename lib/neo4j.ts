import neo4j, { Driver, Session, int } from "neo4j-driver-lite";
import { config } from "dotenv";

// Load environment variables from .env file
config();

export { neo4j, int };

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    const uri = Deno.env.get("NEO4J_URI");
    const username = Deno.env.get("NEO4J_USERNAME");
    const password = Deno.env.get("NEO4J_PASSWORD") ||
      Deno.env.get("NEO4J_PASSWORD");

    if (!uri || !username || !password) {
      throw new Error("Missing Neo4j connection environment variables");
    }

    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      { maxConnectionLifetime: 3600000 },
    );
  }
  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export function getSession(): Session {
  return getDriver().session();
}

export async function runQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  cypher: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const session = getSession();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key) => {
        if (typeof key !== 'string') return; // Skip non-string keys
        const value = record.get(key);
        // Handle Neo4j Integer type
        if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
          obj[key] = value.low;
        } else if (Array.isArray(value)) {
          // Handle arrays that might contain Neo4j Integers or objects with integers
          obj[key] = value.map(item => {
            if (item && typeof item === 'object' && 'low' in item && 'high' in item) {
              return item.low;
            } else if (item && typeof item === 'object') {
              // Recursively handle objects in arrays
              const nestedObj: Record<string, unknown> = {};
              Object.keys(item).filter(k => typeof k === 'string').forEach(nestedKey => {
                const nestedValue = (item as Record<string, unknown>)[nestedKey];
                if (nestedValue && typeof nestedValue === 'object' && 'low' in nestedValue && 'high' in nestedValue) {
                  nestedObj[nestedKey] = (nestedValue as { low: number }).low;
                } else {
                  nestedObj[nestedKey] = nestedValue;
                }
              });
              return nestedObj;
            }
            return item;
          });
        } else {
          obj[key] = value?.properties || value;
        }
      });
      return obj as T;
    }) as T[];
  } finally {
    await session.close();
  }
}

export async function runWrite(
  cypher: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const session = getSession();
  try {
    await session.run(cypher, params);
  } finally {
    await session.close();
  }
}
