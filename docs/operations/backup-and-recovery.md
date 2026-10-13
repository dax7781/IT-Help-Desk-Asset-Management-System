# Backup and recovery runbook

Local data is under .local/mongodb; .env.local holds its credentials/secret. Both are excluded from the source package. A source archive is not a database backup. Preserve these independently when moving the local app. Never copy a live WiredTiger directory while mongod is writing; stop the managed app/database before making a filesystem copy, and preserve its replica-set configuration.

For Atlas, configure the backup option supported by the chosen cluster and verify restore to a separate database/cluster before relying on it. Application transaction tests do not verify an Atlas backup service.

## Logical backup with MongoDB Database Tools

Install official MongoDB Database Tools before using mongodump/mongorestore. They are not bundled with this app and were not installed or run during local delivery. Stop application writes for a database-scoped consistent backup. MongoDB documents either stopping writes or using a full replica-set oplog backup; `--oplog` cannot be combined with a dump limited by `--db`. See [MongoDB backup guidance](https://www.mongodb.com/docs/manual/tutorial/backup-and-restore-tools/) and [mongodump options](https://www.mongodb.com/docs/database-tools/mongodump/).

Create a private .local/mongodb-tools.yml using the tool's documented uri/password configuration, with an account scoped to the intended source. Keep credentials out of shell history and source control. After stopping writes:

```powershell
mongodump --config=.local/mongodb-tools.yml --db=techdesk --archive=.local/techdesk-backup.archive.gz --gzip
```

Check the exit code, archive existence, size and timestamp; store an encrypted copy outside the same machine with its retention schedule and app version. If the source is techdesk_demo, use that database name consistently instead. Do not silently back up the default test database.

## Restore drill and recovery

1. Choose a new empty recovery namespace or separate replica set. Use a target configuration file and account permitted to write only there. Confirm the target is different from the live database; never add --drop to an unreviewed live restore.
2. For a database-scoped techdesk archive, restore to techdesk_recovery:

```powershell
mongorestore --config=.local/mongodb-recovery-tools.yml --archive=.local/techdesk-backup.archive.gz --gzip --nsInclude='techdesk.*' --nsFrom='techdesk.*' --nsTo='techdesk_recovery.*'
```

3. Check the command's status and compare source/restore collection counts and sampled ticket/history/asset relationships. Review [mongorestore options](https://www.mongodb.com/docs/database-tools/mongorestore/). For a full oplog backup, use its distinct documented whole-replica restore procedure rather than namespace mapping.
4. Configure an isolated app preview to the restored database, run db:prepare, and rotate AUTH_SECRET before allowing access so archived sessions do not become valid again. Verify roles, ownership, notes, history, last-admin count, inventory and reports through the browser.
5. Record the tested backup timestamp, elapsed recovery time, and acceptable data-loss window. Switch production configuration only after the recovery preview passes and the owner selects that restore point. Preserve the failed instance for investigation.

The disposable demo-reset transaction and failure rollback were verified in isolated MongoDB tests. The mongodump/mongorestore procedure and Atlas recovery remain instructions for the configured environment, not tests performed against the user's cluster.
