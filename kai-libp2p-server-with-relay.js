import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { identify } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'

const PROTOCOL = '/science/battery-tech/1.0.0'
const RELAY_ADDR = '/ip4/46.225.213.61/tcp/4001/p2p/12D3KooWC4aSVDnD1NzedXTrenEowMivZyw6uAjDtVqWFa4pig8Y'

// Mock battery news data
async function collectBatteryNews() {
  return {
    timestamp: new Date().toISOString(),
    updates: [
      {
        title: "Solid-State Battery Breakthrough",
        source: "Nature Energy",
        summary: "New lithium-metal solid-state battery achieves 1000+ charge cycles",
        date: "2026-02-25"
      },
      {
        title: "Sodium-Ion Batteries Enter Mass Production",
        source: "TechCrunch",
        summary: "CATL begins commercial production of sodium-ion batteries for EVs",
        date: "2026-02-24"
      },
      {
        title: "Silicon Anode Technology Improves Energy Density",
        source: "MIT News",
        summary: "Researchers develop stable silicon anode with 40% higher capacity",
        date: "2026-02-23"
      }
    ],
    nextUpdate: "2026-02-27T00:00:00Z"
  }
}

async function main() {
  console.log('🚀 Starting Kai libp2p server with relay support...')

  // Create libp2p node with relay transport
  const node = await createLibp2p({
    addresses: {
      listen: [
        '/ip4/0.0.0.0/tcp/0'  // Listen on random port
      ]
    },
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    transports: [
      tcp(),
      circuitRelayTransport({
        discoverRelays: 1
      })
    ],
    services: {
      identify: identify()
    }
  })

  // Register protocol handler
  await node.handle(PROTOCOL, (stream) => {
    console.log('📡 Incoming request on', PROTOCOL)

    // Listen for incoming messages
    stream.addEventListener('message', async (evt) => {
      const request = new TextDecoder().decode(evt.data.subarray())
      console.log('📨 Request:', request)

      // Collect battery news
      const batteryNews = await collectBatteryNews()

      // Send response
      const response = JSON.stringify(batteryNews, null, 2)
      stream.send(new TextEncoder().encode(response))

      console.log('✅ Sent battery tech updates')

      // Close the stream after sending
      stream.close()
    })

    // Handle stream close
    stream.addEventListener('remoteCloseWrite', () => {
      stream.close()
    })
  })

  console.log('🚀 Kai libp2p server started!')
  console.log('📍 PeerID:', node.peerId.toString())
  console.log('📡 Local addresses:')
  node.getMultiaddrs().forEach((addr) => {
    console.log('  ', addr.toString())
  })
  console.log('🔌 Protocol:', PROTOCOL)

  // Connect to relay
  console.log('\n🔗 Connecting to relay:', RELAY_ADDR)
  try {
    const relayMa = multiaddr(RELAY_ADDR)
    await node.dial(relayMa)
    console.log('✅ Connected to relay!')

    // Wait a bit for relay connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('\n📡 Available addresses (including relay):')
    node.getMultiaddrs().forEach((addr) => {
      console.log('  ', addr.toString())
    })

    console.log('\n✅ Kai is now reachable via relay!')
    console.log('🌐 Horst can connect using:')
    console.log(`   ${RELAY_ADDR}/p2p-circuit/p2p/${node.peerId.toString()}`)
  } catch (error) {
    console.error('❌ Failed to connect to relay:', error.message)
  }

  console.log('\n⏳ Waiting for connections...\n')
}

main().catch(console.error)
