#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
# What's this gibberish?? http://redsymbol.net/articles/unofficial-bash-strict-mode/

if [[ ! -e ./tmp ]]; then
	echo 'Temp directory does not yet exist. Run `make import_and_connect` then try again.'
	exit 1
fi

# The head -n1 should not be necessary (right?). But in case there are multiple
# files just take the first one
DB_FILE=$(find ./tmp -iname 3d0d7e5fb2ce288813306e4d4636395e047a3d28 | head -n 1)

if [[ ! -e "$DB_FILE" ]]; then
	echo "Could not find database file. Ensure you have first run: make import_and_connect"
	exit 1
fi

test_connection() {
	echo "Attempting connection..."
	local total_messages=$(sqlite3 $DB_FILE 'select count(*) from message;')
	if [[ -n $total_messages ]]; then
		echo "Success! You have $total_messages messages available for querying."
	else
		echo "Failure. Could not connect. This most likely means you have an encrypted backup."
		exit 1
	fi
}

if [[ $# -eq 1 ]] && [[ "__test_connection" == "$1" ]]; then
	test_connection
else
	sqlite3 $DB_FILE "$@"
fi

