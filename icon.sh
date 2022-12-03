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




## Multilevel updates

# mv data data-raw
# mkdir data

# cd data-raw || exit

# folders=( "icons" "actors" )
# for folder in "${folders[@]}"
# do
#   echo "Processing files in $folder"
#   cd $folder || return
#   FILES="./*"
#   for f in $FILES
#   do
#     echo "Processing $f file..."
#     jq -c '.' "$f" > "../data/$f"
#   done
#   cd ..
# done

