#!/bin/bash

mv data data-raw
mkdir data
cd data-raw
FILES="./*"
for f in $FILES
do
  echo "Processing $f file..."
  jq -c '.' "$f" > "../data/$f"
done
cd ..
