import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateBookingDto } from './dto/createBooking.dto';
import { Booking } from './booking.type';
import { UpdateBookingDto } from './dto/updateBooking.dto';
import { DatabaseConfig } from '../db/db.config';

@Injectable()
export class BookingRepository {
  private pool: Pool;

  constructor(private readonly databaseConfig: DatabaseConfig) {
    this.pool = databaseConfig.getPool();
  }

  async create(
    { date, startTime, endTime }: CreateBookingDto,
    userId: number,
  ): Promise<Booking> {
    if (date.includes('T')) date = date.split('T')[0];

    const query = `
    INSERT INTO bookings(date,start_time,end_time,user_id) 
    VALUES ($1,$2,$3,$4) 
    RETURNING 
    id,
    date,
    start_time as "startTime",
    end_time as "endTime",
    user_id as "userId",
    created_at as "createdAt",
    updated_at as "updatedAt";`;

    const result = await this.pool.query<Booking>(query, [
      date,
      startTime,
      endTime,
      userId,
    ]);
    return result.rows[0];
  }

  async findById(id: number): Promise<Booking | null> {
    const query = `
    SELECT 
    id,
    date,
    start_time as "startTime",
    end_time as "endTime",
    user_id as "userId",
    created_at as "createdAt",
    updated_at as "updatedAt"
    FROM bookings WHERE id = $1;`;

    const result = await this.pool.query<Booking>(query, [id]);

    return result.rows[0] || null;
  }

  async update(
    updateBookingDto: UpdateBookingDto,
    id: number,
  ): Promise<Booking | null> {
    if (updateBookingDto.date)
      updateBookingDto.date.includes('T')
        ? (updateBookingDto.date = updateBookingDto.date.split('T')[0])
        : '';

    const setClause = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updateBookingDto)) {
      if (key !== 'id' && value !== undefined) {
        const toSnakeCase = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${toSnakeCase} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (setClause.length === 0) return null;

    const query = `
      UPDATE bookings
      SET ${setClause.join(', ')}
      WHERE id = ${id}
      RETURNING 
      id,
      date,
      start_time as "startTime",
      end_time as "endTime",
      user_id as "userId",
      created_at as "createdAt",
      updated_at as "updatedAt";
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findAll(): Promise<Booking[]> {
    const query = `
    SELECT  
    id,
    date,
    start_time as "startTime",
    end_time as "endTime",
    user_id as "userId",
    created_at as "createdAt",
    updated_at as "updatedAt"
    FROM bookings;`;

    const result = await this.pool.query(query);

    return result.rows;
  }

  async delete(id: number) {
    const query = 'DELETE FROM bookings WHERE id = $1 RETURNING *;';

    const result = await this.pool.query(query, [id]);

    return result.rows.length > 0;
  }

  async checkAvailability({
    date,
    startTime,
    endTime,
  }: CreateBookingDto): Promise<boolean> {
    if (date.includes('T')) date = date.split('T')[0];

    if (startTime >= endTime) return null;

    const query = `
    SELECT COUNT(*) AS overlap_count
    FROM bookings
    WHERE date = $1
      AND (($1::date || ' ' || $2::time)::timestamp, ($1::date || ' ' || $3::time)::timestamp) 
          OVERLAPS ((date::timestamp + start_time::time), (date::timestamp + end_time::time));
    `;

    const result = await this.pool.query(query, [date, startTime, endTime]);
    const overlapCount = parseInt(result.rows[0].overlap_count, 10);

    return overlapCount === 0;
  }

  async checkAvailabilityForUpdate({
    date,
    startTime,
    endTime,
    id,
  }: Booking): Promise<boolean> {
    if (typeof date === 'string' && date.includes('T'))
      date = date.split('T')[0];

    if (startTime >= endTime) return null;

    const query = `
    SELECT COUNT(*) AS overlap_count
    FROM bookings
    WHERE date = $1
      AND id <> $4 
      AND (($1::date || ' ' || $2::time)::timestamp, ($1::date || ' ' || $3::time)::timestamp) 
          OVERLAPS ((date::timestamp + start_time::time), (date::timestamp + end_time::time));
    `;

    const result = await this.pool.query(query, [date, startTime, endTime, id]);
    const overlapCount = parseInt(result.rows[0].overlap_count, 10);

    return overlapCount === 0;
  }

  async createTable() {
    const query = `CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE
      );

      DO $$
      BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_updated_at_bookings'
        ) THEN
        CREATE TRIGGER set_updated_at_bookings
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
        
    `;

    return this.pool.query(query);
  }
}
