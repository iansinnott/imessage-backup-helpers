.PHONY: show_db_file

base_dir = ~/Library/Application\ Support/MobileSync/Backup

target_dir = $(shell ls -t $(base_dir))

target_path = $(base_dir)/$(target_dir)

all: import_and_connect

data:
	mkdir -p ./data

data/$(target_dir):
	@cp -R $(target_path) ./data

import_backup: data data/$(target_dir)

import_and_connect: import_backup DB_FILEPATH
	@./connect.sh __test_connection

# Store the path to a file that can be read elsewhere
DB_FILEPATH: import_backup
	@echo "$(shell find $(PWD)/data -iname 3d0d7e5fb2ce288813306e4d4636395e047a3d28 | head -n 1)" > DB_FILEPATH

show_db_file: DB_FILEPATH
	@cat ./DB_FILEPATH
