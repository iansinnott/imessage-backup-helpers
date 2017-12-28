base_dir = ~/Library/Application\ Support/MobileSync/Backup

target_dir = $(shell ls -t $(base_dir))

target_path = $(base_dir)/$(target_dir)

tmp:
	mkdir -p ./tmp

./tmp/$(target_dir):
	@cp -R $(target_path) ./tmp

import_backup: tmp ./tmp/$(target_dir)

import_and_connect: import_backup
	@./connect.sh __test_connection

show_db_file:
	@echo "Current database location:\n$(shell find $(PWD)/tmp -iname 3d0d7e5fb2ce288813306e4d4636395e047a3d28 | head -n 1)"
