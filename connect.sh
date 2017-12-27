#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
# What's this gibberish?? http://redsymbol.net/articles/unofficial-bash-strict-mode/

# The head -n1 should not be necessary (right?). But in case there are multiple
# files just take the first one
DB_FILE=$(find ./tmp -iname 3d0d7e5fb2ce288813306e4d4636395e047a3d28 | head -n 1)

if [[ ! -e "$DB_FILE" ]]; then
	echo "Could not find database file. Ensure you have first run: make import_backup"
	exit 1
fi

echo "Connecting..."
echo $(sqlite3 $DB_FILE "select count(*) from message;")
