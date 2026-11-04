import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const databaseUrl = process.env.DATABASE_URL || "";

console.log("====================================================");
console.log("⚽ BolãoPro Database Setup hook");
console.log("====================================================");

if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
  console.log("🚀 [Deploy] Detectado banco de dados PostgreSQL (Vercel / Supabase / Neon).");
  
  const postgresSchema = path.join(process.cwd(), "prisma", "schema.postgresql.prisma");
  const targetSchema = path.join(process.cwd(), "prisma", "schema.prisma");

  if (fs.existsSync(postgresSchema)) {
    fs.copyFileSync(postgresSchema, targetSchema);
    console.log("✅ [Deploy] prisma/schema.prisma sincronizado com schema.postgresql.prisma");
  }

  try {
    console.log("🔄 [Deploy] Sincronizando tabelas no PostgreSQL (prisma db push)...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("✅ [Deploy] Tabelas do PostgreSQL sincronizadas com sucesso!");

    console.log("🌱 [Deploy] Populando partidas reais e dados iniciais no PostgreSQL...");
    execSync("node scripts/seed.mjs", { stdio: "inherit" });
    console.log("✅ [Deploy] Seed concluído com sucesso!");
  } catch (err) {
    console.warn("⚠️ [Deploy Warning] Erro durante push/seed automático:", err.message);
    console.log("O build continuará normalmente...");
  }
} else {
  console.log("💻 [Local] Usando banco de dados local SQLite (dev.db).");
}
