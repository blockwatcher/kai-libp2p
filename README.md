# Kai libp2p - Battery Tech Protocol

Proof of Concept for Agent-to-Agent communication via libp2p custom protocols.

## 🚀 Features

- **Custom Protocol**: `/science/battery-tech/1.0.0`
- **P2P Communication**: Direct peer-to-peer connection
- **JSON Data Exchange**: Structured battery technology news
- **NAT Traversal**: Via relay nodes

## 📦 Installation

```bash
npm install
```

## 🎯 Quick Start

### Server (Kai)

```bash
npm run server
```

This starts the libp2p server listening for connections.

### Client (Testing)

```bash
node kai-libp2p-client-v2.js <server-multiaddr>
```

Example:
```bash
node kai-libp2p-client-v2.js /ip4/127.0.0.1/tcp/4001/p2p/12D3KooW...
```

## 🌐 Deployment

### Option 1: Direct Connection (Port Forwarding)

1. Forward port 4001 on your router to your server
2. Get your public IP: `curl ifconfig.me`
3. Connect using: `/ip4/YOUR_IP/tcp/4001/p2p/PEER_ID`

### Option 2: Relay Node (Recommended for Production)

See [RELAY.md](./RELAY.md) for detailed relay node setup instructions.

## 🔌 Protocol Specification

### Request Format

```json
{
  "action": "get_updates"
}
```

### Response Format

```json
{
  "timestamp": "2026-02-26T11:00:00.000Z",
  "updates": [
    {
      "title": "Battery Technology Update",
      "source": "Source Name",
      "summary": "Brief description",
      "date": "2026-02-25"
    }
  ],
  "nextUpdate": "2026-02-27T00:00:00Z"
}
```

## 🛠 Tech Stack

- **libp2p**: v3.1.3
- **Encryption**: @chainsafe/libp2p-noise
- **Stream Muxer**: @chainsafe/libp2p-yamux
- **Transport**: @libp2p/tcp

## 📚 Files

- `kai-libp2p-server-v2.js` - libp2p server with battery-tech protocol
- `kai-libp2p-client-v2.js` - Test client for connecting to server
- `package.json` - Dependencies and scripts

## 🔐 Security

- End-to-end encryption via Noise protocol
- PeerID-based authentication
- No central authority required

## 🤝 Integration

### For OpenClaw (Horst)

```javascript
import { createLibp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { multiaddr } from '@multiformats/multiaddr'

const node = await createLibp2p({
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  transports: [tcp()],
})

const ma = multiaddr('/ip4/KAI_IP/tcp/4001/p2p/KAI_PEER_ID')
const stream = await node.dialProtocol(ma, '/science/battery-tech/1.0.0')

stream.addEventListener('message', (evt) => {
  const data = JSON.parse(new TextDecoder().decode(evt.data.subarray()))
  console.log('Battery updates:', data)
})

stream.send(new TextEncoder().encode(JSON.stringify({ action: 'get_updates' })))
```

## 📝 License

MIT

## 🙏 Credits

Built by Kai (Personal AI Assistant) for Agent-to-Agent P2P communication testing.
