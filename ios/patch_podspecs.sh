#!/bin/bash
# Script to patch React Native modules with CocoaPods compatibility fixes

# Find React-Fabric.podspec
FABRIC_PODSPEC=$(find $PWD/node_modules -name "React-Fabric.podspec" -type f | head -n 1)

if [ -n "$FABRIC_PODSPEC" ]; then
  echo "Found React-Fabric.podspec at: $FABRIC_PODSPEC"
  # Remove the always_out_of_date option
  sed -i '' 's/:always_out_of_date => true,//' "$FABRIC_PODSPEC"
  sed -i '' 's/:always_out_of_date => false,//' "$FABRIC_PODSPEC" 
  sed -i '' 's/:always_out_of_date => 1,//' "$FABRIC_PODSPEC"
  echo "Patched React-Fabric.podspec"
fi

# Fix other podspecs with visionOS references if needed
find $PWD/node_modules -name "*.podspec" -type f -exec grep -l "visionos" {} \; | while read file; do
  echo "Patching visionOS reference in: $file"
  sed -i '' 's/s\.visionos\./# s.visionos./g' "$file"
done

echo "All patches applied!"
