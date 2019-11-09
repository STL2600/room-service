#!/usr/bin/bash
curl -XPOST -F type=photo -F photo=@$1 localhost:3001/security/alert
