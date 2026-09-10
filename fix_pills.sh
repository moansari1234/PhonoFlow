#!/bin/bash
find src -type f -name "*.tsx" | xargs sed -i \
  -e 's/bg-emerald-950\/70/bg-emerald-50/g' \
  -e 's/text-emerald-100/text-emerald-800/g' \
  -e 's/bg-rose-950\/70/bg-rose-50/g' \
  -e 's/text-rose-100/text-rose-800/g' \
  -e 's/bg-emerald-950\/40/bg-emerald-50/g' \
  -e 's/border-emerald-600/border-emerald-300/g' \
  -e 's/border-emerald-500\/80/border-emerald-300/g' \
  -e 's/bg-emerald-500\/20/bg-emerald-50/g' \
  -e 's/bg-amber-500\/20/bg-amber-50/g' \
  -e 's/bg-rose-500\/20/bg-rose-50/g'
