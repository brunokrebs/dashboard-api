import { PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @VersionColumn() version?: number;
}
