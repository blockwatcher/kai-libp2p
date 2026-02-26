import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'

const PROTOCOL = '/science/battery-tech/1.0.0'

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
  // Create libp2p node
  const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    transports: [tcp()],
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
  console.log('📡 Listening on:')
  node.getMultiaddrs().forEach((addr) => {
    console.log('  ', addr.toString())
  })
  console.log('🔌 Protocol:', PROTOCOL)
  console.log('\nWaiting for connections...\n')
}

main().catch(console.error)
