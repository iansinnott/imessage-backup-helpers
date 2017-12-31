#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Use rsync to copy over anything that has changed from the IOS backup file

start_sync() {
	local base_dir=~/Library/Application\ Support/MobileSync/Backup
	local target_dir=$(ls -t $base_dir)
	local target_path="$base_dir/$target_dir"

	rsync -avP $target_path ./tmp
}

start_sync
