#!/bin/bash

DATE=`date +%Y%m%d`

dumpAndPackPostgres() {
    echo "\n##### Dumping and Packing Digituz Database #####\n"
    
    cd /tmp/
    
    PGPASSWORD=spbGskUwcgv6RuNqJrcn3KqMqj \
    pg_dump \
    --host=databases.digituz.com.br \
    --port=7432 \
    --username=digituz-db-user \
    --dbname=digituz \
    > digituz-postgres.dump
    
    tar -czvf $DATE-digituz-postgres.dump.tar.gz digituz-postgres.dump
    rm digituz-postgres.dump
}

dumpAndMongo() {
    echo "\n##### Dumping and Packing Digituz Database #####\n"
    
    cd /tmp/
    
    mongodump \
    --host databases.digituz.com.br \
    --port 23987 \
    --authenticationDatabase admin \
    --username frida-kahlo-website-user \
    --password yNYyKfW2rQzVrmifzsNjA8aVHX \
    --db frida \
    --archive=$DATE-frida-dump.gz \
    --gzip
}

moveToSpace() {
    echo "\n##### Moving the backup file to DigitalOcean Spaces #####\n"
    cd /tmp/
    s3cmd put $DATE-digituz-postgres.dump.tar.gz s3://digituz-backups/postgresql/
    s3cmd put $DATE-frida-dump.gz s3://digituz-backups/mongo/
}

dumpAndPackPostgres && dumpAndMongo && moveToSpace
