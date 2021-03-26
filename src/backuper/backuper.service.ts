import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { S3 } from 'aws-sdk';
import execa from 'execa';
import { readFile } from 'fs';

import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class BackuperService {
  private s3 = new S3({
    accessKeyId: process.env.DO_SPACES_ID,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    endpoint: process.env.DO_ENDPOINT,
  });

  constructor(private logger: AppLogger) {}

  private uploadFile() {
    return new Promise<void>((res, rej) => {
      readFile('/tmp/digituz.sql', (err, data) => {
        if (err) throw err;
        const params = {
          Bucket: 'digituz-backups',
          Key: `postgres/${Date.now()}-digituz-postgres.sql`,
          Body: data,
        };

        this.s3.upload(params, err => {
          if (err) return rej(err);
          res();
        });
      });
    });
  }

  @Cron('30 20 * * *')
  async backupPostgres(): Promise<void> {
    try {
      await execa(
        'pg_dump',
        [
          `--host=${process.env.DATABASE_HOST}`,
          `--port=${process.env.DATABASE_PORT}`,
          `--username=${process.env.DATABASE_USER}`,
          `--dbname=${process.env.DATABASE_NAME}`,
          '>',
          '/tmp/digituz.sql',
        ],
        {
          extendEnv: false,
          env: { PGPASSWORD: process.env.DATABASE_PASSWORD },
        },
      );

      await this.uploadFile();
      this.logger.log('Backup realizado com sucesso');
    } catch (err) {
      this.logger.error(err);
    }
  }
}
