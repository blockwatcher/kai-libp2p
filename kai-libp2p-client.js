import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@libp2p/noise'
import { mplex } from '@libp2p/mplex'
import { pipe } from 'it-pipe'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { multiaddr } from '@multiformats/multiaddr'

const PROTOCOL = '/science/battery-tech/1.0.0'

async function main() {
  // Server multiaddr will be passed as command line argument
  const serverMultiaddr = process.argv[2]

  if (!serverMultiaddr) {
    console.error('Usage: node kai-libp2p-client.js <server-multiaddr>')
    console.error('Example: node kai-libp2p-client.js /ip4/127.0.0.1/tcp/4001/p2p/12D3KooW...')
    process.exit(1)
  }

  console.log('🔌 Creating client node...')

  // Create libp2p client
  const node = await createLibp2p({
    addresses: {
      listen: []
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
  })

  await node.start()
  console.log('✅ Client started')
  console.log('📍 Client PeerID:', node.peerId.toString())

  try {
    console.log('\n📡 Connecting to server:', serverMultiaddr)
    const ma = multiaddr(serverMultiaddr)

    console.log('🔌 Dialing protocol:', PROTOCOL)
    const stream = await node.dialProtocol(ma, [PROTOCOL])
    console.log('✅ Stream opened')

    // Send request
    const request = JSON.stringify({ action: 'get_updates' })
    console.log('📤 Sending request:', request)

    await pipe(
      [uint8ArrayFromString(request)],
      stream.sink
    )

    // Read response
    console.log('📥 Waiting for response...')
    const response = await pipe(
      stream.source,
      async (source) => {
        let data = ''
        for await (const chunk of source) {
          data += uint8ArrayToString(chunk.subarray())
        }
        return data
      }
    )

    console.log('\n✅ Received battery tech updates:\n')
    const batteryNews = JSON.parse(response)
    console.log(JSON.stringify(batteryNews, null, 2))

    console.log('\n📊 Summary:')
    console.log(`  • Total updates: ${batteryNews.updates.length}`)
    console.log(`  • Latest: ${batteryNews.updates[0].title}`)
    console.log(`  • Next update: ${batteryNews.nextUpdate}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await node.stop()
    console.log('\n🛑 Client stopped')
  }
}

main().catch(console.error)
