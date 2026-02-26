# libp2p Relay Node Setup

This guide explains how to set up a libp2p relay node on a Hetzner VPS for NAT traversal.

## 🖥 Hetzner VPS Recommendation

- **Server Type**: CX22 (2 vCPU, 4GB RAM)
- **Cost**: ~€5.83/month
- **OS**: Ubuntu 22.04 LTS
- **Location**: Choose nearest to your location

## 🚀 Quick Setup

### 1. Create Hetzner Server

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create new project
3. Add server: CX22, Ubuntu 22.04
4. Add SSH key
5. Note the server IP address

### 2. Initial Server Setup

SSH into your server:

```bash
ssh root@YOUR_SERVER_IP
```

Update system:

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential
```

### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version  # Should show v20.x
```

### 4. Deploy Relay Node

```bash
# Create app directory
mkdir -p /opt/libp2p-relay
cd /opt/libp2p-relay

# Clone repo (or upload files)
# For now, create files manually:

# Create package.json
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

# Create relay server
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

# Install dependencies
npm install
```

### 5. Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow libp2p
ufw allow 4001/tcp

# Enable firewall
ufw --force enable
ufw status
```

### 6. Create systemd Service

```bash
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

# Enable and start service
systemctl daemon-reload
systemctl enable libp2p-relay
systemctl start libp2p-relay

# Check status
systemctl status libp2p-relay
```

### 7. View Logs

```bash
journalctl -u libp2p-relay -f
```

## 📝 Get Relay Multiaddr

After starting the relay, check the logs for the multiaddr:

```bash
journalctl -u libp2p-relay -n 20
```

You should see something like:
```
📍 PeerID: 12D3KooW...
📡 Listening on:
   /ip4/SERVER_IP/tcp/4001/p2p/12D3KooW...
```

## 🔌 Connect via Relay

### Kai (Server behind NAT)

```javascript
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'

const kai = await createLibp2p({
  // ... other config
  transports: [
    tcp(),
    circuitRelayTransport()
  ]
})

// Connect to relay
await kai.dial('/ip4/RELAY_IP/tcp/4001/p2p/RELAY_PEER_ID')
```

### Horst (Client)

```javascript
// Connect to Kai via relay
const kaiViaRelay = '/ip4/RELAY_IP/tcp/4001/p2p/RELAY_PEER_ID/p2p-circuit/p2p/KAI_PEER_ID'
const stream = await node.dialProtocol(kaiViaRelay, '/science/battery-tech/1.0.0')
```

## 🔧 Troubleshooting

### Check if relay is running
```bash
systemctl status libp2p-relay
```

### Check logs
```bash
journalctl -u libp2p-relay -n 100
```

### Test connectivity
```bash
nc -zv YOUR_SERVER_IP 4001
```

### Restart service
```bash
systemctl restart libp2p-relay
```

## 🔐 Security Best Practices

1. **Firewall**: Only open necessary ports (22, 4001)
2. **SSH Keys**: Disable password authentication
3. **Updates**: Keep system updated (`apt update && apt upgrade`)
4. **Monitoring**: Set up monitoring for relay uptime
5. **Rate Limiting**: Configure relay reservation limits

## 💰 Cost Calculation

- **Hetzner CX22**: €5.83/month
- **Traffic**: 20TB included (more than enough)
- **Total**: ~€70/year

## 🎯 Next Steps

1. ✅ Deploy relay on Hetzner
2. ✅ Note the relay multiaddr
3. ✅ Configure Kai to connect to relay
4. ✅ Test Horst → Relay → Kai connection
5. ✅ Register on nowhooo.ai with relay multiaddr

## 📚 Resources

- [libp2p Circuit Relay v2 Docs](https://github.com/libp2p/specs/blob/master/relay/circuit-v2.md)
- [Hetzner Cloud Docs](https://docs.hetzner.com/cloud/)
- [libp2p Documentation](https://docs.libp2p.io/)
