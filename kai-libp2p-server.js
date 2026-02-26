import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@libp2p/noise'
import { mplex } from '@libp2p/mplex'
import { pipe } from 'it-pipe'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'

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
      listen: [
        '/ip4/0.0.0.0/tcp/0',
        '/ip4/0.0.0.0/tcp/0/ws'
      ]
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
  })

  // Register protocol handler
  await node.handle(PROTOCOL, async ({ stream }) => {
    console.log('📡 Incoming request on', PROTOCOL)

    try {
      // Read request
      const request = await pipe(
        stream.source,
        async (source) => {
          let data = ''
          for await (const chunk of source) {
            data += uint8ArrayToString(chunk.subarray())
          }
          return data
        }
      )

      console.log('📨 Request:', request)

      // Collect battery news
      const batteryNews = await collectBatteryNews()

      // Send response
      await pipe(
        [uint8ArrayFromString(JSON.stringify(batteryNews, null, 2))],
        stream.sink
      )

      console.log('✅ Sent battery tech updates')
    } catch (error) {
      console.error('❌ Error handling request:', error)
    }
  })

  await node.start()

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
