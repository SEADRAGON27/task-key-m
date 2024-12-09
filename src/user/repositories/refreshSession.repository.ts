import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { RefreshSession } from '../type/refreshSession.type';
import { DatabaseConfig } from '../../db/db.config';

@Injectable()
export class RefreshSessionRepository {
  private pool: Pool;

  constructor(private readonly databaseConfig: DatabaseConfig) {
    this.pool = this.databaseConfig.getPool();
  }

  async create({
    fingerprint,
    refreshToken,
    userId,
  }: Omit<RefreshSession, 'id'>): Promise<RefreshSession> {
    const query = `
      INSERT INTO refresh_sessions(fingerprint,refresh_token,user_id) 
      VALUES ($1,$2,$3)
      RETURNING
      id,
      fingerprint,
      refresh_token as "refreshToken",
      user_id as "userId";`;

    const result = await this.pool.query(query, [
      fingerprint,
      refreshToken,
      userId,
    ]);

    return result.rows[0];
  }

  async findByToken(refreshToken: string): Promise<RefreshSession | null> {
    const query = `
      SELECT 
      id,
      fingerprint,
      refresh_token as "refreshToken",
      user_id as "userId"
      FROM refresh_sessions 
      WHERE refresh_token = $1;
      `;

    const result = await this.pool.query(query, [refreshToken]);

    return result.rows[0] || null;
  }

  async deleteByToken(refreshToken: string): Promise<boolean> {
    const query =
      'DELETE FROM refresh_sessions WHERE refresh_token = $1 RETURNING *;';

    const result = await this.pool.query(query, [refreshToken]);

    return result.rows.length > 0;
  }

  async deleteById(id: number): Promise<boolean> {
    const query = 'DELETE FROM refresh_sessions WHERE id = $1 RETURNING *;';

    const result = await this.pool.query(query, [id]);

    return result.rows.length > 0;
  }

  async createTable() {
    const query = `
          CREATE TABLE IF NOT EXISTS refresh_sessions (
          id SERIAL PRIMARY KEY,
          fingerprint TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          user_id INT NOT NULL,
          CONSTRAINT fk_user
            FOREIGN KEY (user_id) 
            REFERENCES users(id)
            ON DELETE CASCADE
          );
        
          CREATE INDEX IF NOT EXISTS idx_refresh_sessions_refresh_token_hash ON refresh_sessions USING HASH (refresh_token);
          `;

    return this.pool.query(query);
  }
}
