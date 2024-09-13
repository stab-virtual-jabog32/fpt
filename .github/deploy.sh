#!/bin/bash

# change directory to project
cd /home/fpt/www/

#Stop service
sudo systemctl stop fpt

#Update source code from repo
export GIT_ASK_YESNO=false
git reset --hard HEAD
git pull --force -r

# DB migration
export $(cat /home/fpt/.env | xargs)
rvm . do rails db:migrate

#Start service again
sudo systemctl start fpt
