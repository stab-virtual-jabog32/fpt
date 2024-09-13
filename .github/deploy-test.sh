#!/bin/bash

# change directory to project
cd /home/fpt/www-test/

#Stop service
sudo systemctl stop fpt-test

#Update source code from repo
export GIT_ASK_YESNO=false
git reset --hard HEAD
git pull --force -r

#Start service again
sudo systemctl start fpt-test
