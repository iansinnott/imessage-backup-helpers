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

Then, make sure you have Nginx running. Since this project is entirely tailored to working on a Mac with an iMessage backup I'm going to assume you've installed nginx using brew. If not, then do that first and set it to start at system startup.

```
brew update
brew install nginx
brew services start nginx
```

With nginx installed simply run:

```
make deploy
```

*NOTE:* it will want a password since it's binding to port 80.

The deploy script should handle everything and is mostly idempotent, but there may be some lingering side effects I missed.

Once deployment is successful use PM2 to enable a startup script. I didn't automate this since anyone deploying should be aware of it.

```
pm2 startup
```

## Re-deployment

To redeploy after any code change to the server or client, simply `git pull` and:

```
make redeploy
```

## Room for improvement

* Search on sender, self and date range
* Show all message (if so desired)
* Support SQLite full text search: https://www.sqlite.org/fts5.html
* Attachments?
* Contacts. They aren't stored in the imessage db which means linking names to numbers would have to be done through a Contacts.app integration
* A more concrete idea of who a message is from. Right now I'm only differentiating on is_from_me. But adding a more sophisticated case statement to the all_messages view would be useful
* Threading. Basically just rebuild the imessage UI but with better search?
  * (Probably _wont't_ do this since imessage does have search)
