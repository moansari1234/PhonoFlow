#!/bin/bash
find src/components -type f -name "*.tsx" | xargs sed -i \
  -e 's/text-neutral-950/text-neutral-900/g' \
  -e 's/font-black/font-serif font-bold/g' \
  -e 's/rounded-3xl/rounded-2xl/g' \
  -e 's/shadow-xl/shadow-sm/g' \
  -e 's/shadow-lg/shadow-sm/g'
