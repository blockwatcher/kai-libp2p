#!/bin/bash

# Hetzner Relay Node Deployment Script
# Usage: bash deploy-relay.sh

SERVER_IP="46.225.213.61"

echo "🚀 Deploying libp2p Relay Node to $SERVER_IP"
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
cat > /tmp/relay-setup.sh << 'REMOTE_SCRIPT'
#!/bin/bash

set -e

echo "🔧 Updating system..."
apt update && apt upgrade -y

echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

echo "✅ Node.js installed: $(node --version)"

echo "📁 Creating relay directory..."
mkdir -p /opt/libp2p-relay
cd /opt/libp2p-relay

echo "📝 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "libp2p-relay",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@chainsafe/libp2p-noise": "^17.0.0",
    "@chainsafe/libp2p-yamux": "^8.0.1",
    "@libp2p/circuit-relay-v2": "^3.0.0",
    "@libp2p/identify": "^3.0.0",
    "@libp2p/tcp": "^11.0.10",
    "libp2p": "^3.1.3"
  }
}
EOF

echo "📝 Creating relay server..."
cat > relay.js << 'EOF'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'

async function main() {
  const relay = await createLibp2p({
    addresses: {
      listen: [
        '/ip4/0.0.0.0/tcp/4001'
      ]
    },
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    transports: [tcp()],
    services: {
      identify: identify(),
      relay: circuitRelayServer({
        reservations: {
          maxReservations: 100
        }
      })
    }
  })

  console.log('🚀 libp2p Relay Node started!')
  console.log('📍 PeerID:', relay.peerId.toString())
  console.log('📡 Listening on:')
  relay.getMultiaddrs().forEach((addr) => {
    console.log('  ', addr.toString())
  })
  console.log('\n✅ Ready to relay connections')
}

main().catch(console.error)
EOF

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up systemd service..."
cat > /etc/systemd/system/libp2p-relay.service << 'EOF'
[Unit]
Description=libp2p Relay Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/libp2p-relay
ExecStart=/usr/bin/node relay.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "🔥 Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 4001/tcp comment 'libp2p'
ufw --force enable

echo "🚀 Starting relay service..."
systemctl daemon-reload
systemctl enable libp2p-relay
systemctl start libp2p-relay

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service status:"
systemctl status libp2p-relay --no-pager -l

echo ""
echo "📝 Relay multiaddr (wait 5 seconds for startup):"
sleep 5
journalctl -u libp2p-relay -n 20 --no-pager | grep -E "(PeerID|Listening)"

REMOTE_SCRIPT

# Copy and execute on server
echo "📤 Uploading setup script to server..."
scp -o StrictHostKeyChecking=no -i ~/.ssh/hetzner_kai /tmp/relay-setup.sh root@$SERVER_IP:/tmp/

echo "🚀 Executing setup on server..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/hetzner_kai root@$SERVER_IP 'bash /tmp/relay-setup.sh'

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 To view logs: ssh -i ~/.ssh/hetzner_kai root@$SERVER_IP 'journalctl -u libp2p-relay -f'"
echo "📊 To check status: ssh -i ~/.ssh/hetzner_kai root@$SERVER_IP 'systemctl status libp2p-relay'"
