import { Allow } from 'class-validator';
import { PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

export abstract class BaseEntity {
  @Allow()
  @PrimaryGeneratedColumn()
  id?: number;

  @VersionColumn() version?: number;
}
