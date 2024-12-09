import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateUserDto } from '../dto/createUser.dto';
import { User } from '../type/user.type';
import { DatabaseConfig } from '../../db/db.config';

@Injectable()
export class UserRepository {
  private pool: Pool;

  constructor(private readonly databaseConfig: DatabaseConfig) {
    this.pool = databaseConfig.getPool();
  }

  async create({
    username,
    email,
    password,
  }: Omit<CreateUserDto, 'confirmedPassword'>): Promise<User> {
    const query = `
      INSERT INTO users(username,email,password) 
      VALUES ($1,$2,$3) 
      RETURNING 
      id,
      username,
      email,
      created_at as "createdAt",
      updated_at as "updatedAt";`;

    const result = await this.pool.query(query, [username, email, password]);
    return result.rows[0];
  }

  async findByEmail(
    email: string,
  ): Promise<(User & { password: string }) | null> {
    const query = `
      SELECT 
      id,
      username,
      email,
      password,
      created_at as "createdAt",
      updated_at as "updatedAt"
      FROM users 
      WHERE email = $1;`;

    const result = await this.pool.query(query, [email]);

    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User> {
    const query = `
      SELECT 
      id,
      username,
      email,
      created_at as "createdAt",
      updated_at as "updatedAt"
      FROM users 
      WHERE username = $1;`;

    const result = await this.pool.query(query, [username]);
    return result.rows[0] || null;
  }

  async createTable() {
    const query = `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
    
          DO $$
          BEGIN
          IF NOT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'set_updated_at'
          ) THEN
          CREATE TRIGGER set_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
           END IF;
          END $$;
        `;

    return this.pool.query(query);
  }
}
