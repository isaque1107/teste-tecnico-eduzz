import { pool } from "./connection";
import { logger } from "../shared/logger";

export async function runMigrations(): Promise<void> {
  const conn = await pool.getConnection();

  try {
    logger.info("Rodando migrations...");

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS payers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        external_id VARCHAR(100) NOT NULL,
        psp VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        document_hash VARCHAR(64) NOT NULL,
        document_type VARCHAR(10) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_payer_psp (external_id, psp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        external_id VARCHAR(100)  NOT NULL,
        psp VARCHAR(20) NOT NULL,
        payer_id INT UNSIGNED NOT NULL,
        status VARCHAR(30) NOT NULL,
        original_amount INT NOT NULL,
        net_amount INT NOT NULL,
        fees INT NOT NULL,
        installment_count INT NOT NULL DEFAULT 1,
        currency VARCHAR(5) NOT NULL DEFAULT 'BRL',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uq_transaction_psp (external_id, psp),
        CONSTRAINT fk_transaction_payer FOREIGN KEY (payer_id) REFERENCES payers(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS installments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT UNSIGNED NOT NULL,
        installment_number INT NOT NULL,
        amount INT NOT NULL,
        fees INT NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL,
        due_date DATETIME NULL,
        paid_at DATETIME NULL,
        UNIQUE KEY uq_installment (transaction_id, installment_number),
        CONSTRAINT fk_installment_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    logger.info("Migration executadas com sucesso.");
  } finally {
    conn.release();
  }
}