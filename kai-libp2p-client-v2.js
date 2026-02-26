import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { tcp } from '@libp2p/tcp'
import { createLibp2p } from 'libp2p'
import { multiaddr } from '@multiformats/multiaddr'

const PROTOCOL = '/science/battery-tech/1.0.0'

async function main() {
  // Server multiaddr will be passed as command line argument
  const serverMultiaddr = process.argv[2]

  if (!serverMultiaddr) {
    console.error('Usage: node kai-libp2p-client-v2.js <server-multiaddr>')
    console.error('Example: node kai-libp2p-client-v2.js /ip4/127.0.0.1/tcp/4001/p2p/12D3KooW...')
    process.exit(1)
  }

  console.log('🔌 Creating client node...')

  // Create libp2p client
  const node = await createLibp2p({
    addresses: {
      listen: []
    },
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    transports: [tcp()],
  })

  console.log('✅ Client started')
  console.log('📍 Client PeerID:', node.peerId.toString())

  try {
    console.log('\n📡 Connecting to server:', serverMultiaddr)

    // Dial the protocol
    const ma = multiaddr(serverMultiaddr)
    const stream = await node.dialProtocol(ma, PROTOCOL)
    console.log('✅ Stream opened')

    // Listen for responses
    stream.addEventListener('message', (evt) => {
      const response = new TextDecoder().decode(evt.data.subarray())
      console.log('\n✅ Received battery tech updates:\n')

      const batteryNews = JSON.parse(response)
      console.log(JSON.stringify(batteryNews, null, 2))

      console.log('\n📊 Summary:')
      console.log(`  • Total updates: ${batteryNews.updates.length}`)
      console.log(`  • Latest: ${batteryNews.updates[0].title}`)
      console.log(`  • Next update: ${batteryNews.nextUpdate}`)

      // Close stream after receiving response
      stream.close()

      // Stop node
      setTimeout(async () => {
        await node.stop()
        console.log('\n🛑 Client stopped')
      }, 100)
    })

    // Handle stream close from remote
    stream.addEventListener('remoteCloseWrite', () => {
      console.log('Remote closed stream')
    })

    // Send request
    const request = JSON.stringify({ action: 'get_updates' })
    console.log('📤 Sending request:', request)
    stream.send(new TextEncoder().encode(request))

  } catch (error) {
    console.error('❌ Error:', error.message)
    await node.stop()
    console.log('\n🛑 Client stopped')
  }
}

main().catch(console.error)
