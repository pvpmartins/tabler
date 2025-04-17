#!/bin/bash
export CLASSPATH="$(ls /usr/src/app/delta-table/node/jars/* | xargs | sed -e 's/ /,/g')"
echo "CLASSPATH set to: $CLASSPATH"
exec "$@"
