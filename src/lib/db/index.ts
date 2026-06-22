import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { assertValidPostgresUrl, getDatabaseUrl } from "./env";
import * as schema from "./schema";

const databaseUrl = getDatabaseUrl();
assertValidPostgresUrl(databaseUrl);

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
