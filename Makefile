# NOTE: sync_backup is phony only because we're using rsync to sync rather than
# create. This is how updates will be handled
.PHONY: show_db_file

base_dir = ~/Library/Application\ Support/MobileSync/Backup

target_dir = $(shell ls -t $(base_dir))

target_path = $(base_dir)/$(target_dir)

brew_dir = $(shell brew --prefix)

all: bootstrap_db

data:
	@mkdir -p ./data

sync_backup: data
	@echo "Preparing to backup directory:"
	@echo $(target_path)
	@sleep 5
	@rsync -avP $(target_path) ./data

import_and_connect: sync_backup DB_FILEPATH
	@./connect.sh __test_connection

bootstrap_db: import_and_connect
	@./connect.sh ".read ./scripts/sqlite/01_initialize_db.sql"

# Store the path to a file that can be read from the node app so it knows where
# the db is.
DB_FILEPATH: sync_backup
	@echo "$(shell find $(PWD)/data -iname 3d0d7e5fb2ce288813306e4d4636395e047a3d28 | head -n 1)" > DB_FILEPATH

show_db_file: DB_FILEPATH
	@cat ./DB_FILEPATH

build_prod:
	@npm install
	NODE_ENV=production SERVICE_URL='http://api.messages.archive' npm run build

# NOTE: Using npm here since its ubiquitous with node, unlike yarn
deploy_static: build_prod
	@sudo mkdir -p /opt/imessage-service
	@sudo mkdir -p /opt/imessage-service/log
	@sudo rm -rf /opt/imessage-service/dist/*
	@sudo cp -R $(CURDIR)/dist /opt/imessage-service/dist

# Using port 80 for ease of use for the end user. I don't want anyone to have to
# type the port number in, since this is designed for a non-technical audience
#
# NOTE: This script assumes the server is already running, just not yet
# configured. So `brew services start nginx` should have been run already
nginx_config:
	@echo "Configuring nginx at $(brew_dir)/etc/nginx."
	@cp -R ./scripts/nginx/* $(brew_dir)/etc/nginx/servers/
	@sed -i '.bak' 's/8080/80/g' $(brew_dir)/etc/nginx/nginx.conf
	@echo "Testing new nginx configuration. This may require a password since we're binding to port 80..."
	@sudo nginx -t
	@sudo nginx -s reload

deploy: bootstrap_db deploy_static nginx_config
	@npm install -g pm2
	@NODE_ENV=production PORT=1118 pm2 start server/index.js

# Unosed. Will remove later
data/$(target_dir):
	@cp -R $(target_path) ./data
