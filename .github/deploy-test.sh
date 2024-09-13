#!/bin/bash

# change directory to project
cd /home/fpt/www-test/

#Stop service
sudo systemctl stop fpt-test

#Update source code from repo
export GIT_ASK_YESNO=false
git reset --hard HEAD
git pull --force -r

# DB migration
export $(cat /home/fpt/.env-test | xargs)
/home/fpt/.rvm/bin/rvm . do rails db:migrate

#Start service again
sudo systemctl start fpt-test
