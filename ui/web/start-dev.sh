#!/bin/bash
# Start Soose dev server
# Uses system node to bypass Hermit CWD hijacking
cd "$(dirname "$0")"

# Find system node (not Hermit wrapper)
if [ -x /opt/homebrew/bin/node ]; then
  SOOSE_NODE=/opt/homebrew/bin/node
elif [ -x /usr/local/bin/node ]; then
  SOOSE_NODE=/usr/local/bin/node
else
  SOOSE_NODE=$(which node 2>/dev/null)
fi

echo "Soose dev server"
echo "  Node: $SOOSE_NODE ($($SOOSE_NODE --version))"
echo "  Root: $(pwd)"
echo ""

# Clean PATH to avoid Hermit interference
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
exec $SOOSE_NODE ./node_modules/vite/bin/vite.js --host "$@"
