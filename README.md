# iMessage Backup Service

## What's included

* Scripts to make a copy of your iMessage backup and bootstrap the Sqlite3 database
* An API server providing HTTP access to the database
* A web app for viewing and searching past messages

## Dev

* `make`: Copy over the database and set it up
* `yarn mon`: start server
* `yarn start`: start webpack dev server for UI development

## Deployment

First, edit the hosts file:

```
127.0.0.1	messages.archive
127.0.0.1	api.messages.archive
```

Then, make sure you have Nginx running. Since this project is entirely tailored to working on a Mac with an iMessage backup I'm going to assume you've installed nginx using brew. If not, then do that first: `brew install nginx`.

With nginx installed simply run:

```
make deploy_prod
```

*NOTE:* it will want a password since it's binding to port 80.

```
brew services start nginx
```
