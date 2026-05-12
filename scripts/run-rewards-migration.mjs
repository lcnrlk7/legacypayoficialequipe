import { sql } from "../lib/db.ts";
import fs from "fs";

async function run() {
  try {
    const script = fs.readFileSync("./scripts/create-user-rewards-table.sql", "utf8");
    
    // Split by semicolon and run each statement
    const statements = script.split(";").filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement.trim());
        console.log("Executed:", statement.substring(0, 50) + "...");
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
