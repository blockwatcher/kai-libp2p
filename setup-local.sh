#!/bin/bash

# Setup script for kai-libp2p project
# Run this on your local machine to set up the project and push to GitHub

echo "🚀 Setting up kai-libp2p project..."

# Clone the empty repo
git clone git@github.com:blockwatcher/kai-libp2p.git
cd kai-libp2p

# Create all project files
cat > package.json << 'EOF'
{
  "name": "kai-libp2p-test",
  "version": "1.0.0",
  "type": "module",
  "description": "Kai's libp2p battery-tech protocol test",
  "scripts": {
    "server": "node kai-libp2p-server-v2.js",
    "client": "node kai-libp2p-client-v2.js"
  },
  "dependencies": {
    "@chainsafe/libp2p-noise": "^17.0.0",
    "@chainsafe/libp2p-yamux": "^8.0.1",
    "@libp2p/tcp": "^11.0.10",
    "@multiformats/multiaddr": "^13.0.1",
    "libp2p": "^3.1.3"
  }
}
EOF

cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
logs/
core.*
*.output
EOF

# Download other files from GitHub
echo "✅ Project structure created"
echo "📦 Run 'npm install' to install dependencies"
echo "🔧 Push changes with: git add . && git commit -m 'Initial setup' && git push"
