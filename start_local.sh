#!/bin/bash
cd /home/dcl/psquad/localenv/
/snap/bin/docker-compose up -d

sleep 10

cd /home/dcl/psquad/infra/
./start_local.sh
