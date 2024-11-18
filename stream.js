const axios = require('axios');
const yargs = require('yargs');

// Parse the --chunk option from the command line
const argv = yargs
  .option('chunk', {
    alias: 'c',
    type: 'number',
    description: 'Number of chunks to stream',
    default: 5,
  })
  .help()
  .alias('help', 'h').argv;

const chunkCount = argv.chunk;
const streamUrl = `https://postman-echo.com/stream/${chunkCount}`;

async function wait(time=200) {
  return new Promise((resolve) => setTimeout(() => resolve(true), time));
}

(async () => {
  try {
    console.log(`Streaming ${chunkCount} chunks from: ${streamUrl}`);

    let buffer = ''; // Buffer to handle incomplete chunks

    const response = await axios.get(streamUrl, {
      responseType: 'stream', // Enable streaming response
    });
    const chunkArray = []

    response.data.on('data', async(chunk) => {
      buffer += chunk.toString(); // Append chunk to buffer

      let boundary = buffer.indexOf('}{'); // Find boundaries between objects

      while (boundary !== -1) {
        // Split complete JSON object
        const completeChunk = buffer.slice(0, boundary + 1);
        buffer = buffer.slice(boundary + 1); // Update buffer with remaining data

        // Parse and process the chunk immediately
        try {
          const parsedChunk = JSON.parse(completeChunk);
          chunkArray.push(parsedChunk)
          console.log('Processed chunk:', chunkArray.length);
          await wait()
          // Add your processing logic here, e.g., save to database, filter, etc.
        } catch (error) {
          console.error('Error parsing chunk:', error.message);
        }

        boundary = buffer.indexOf('}{'); // Check for the next boundary
      }
    });

    response.data.on('end', () => {
      if (buffer) {
        // Process any remaining buffer content as a complete JSON object
        try {
          const parsedChunk = JSON.parse(buffer);
          // console.log('Processed remaining chunk:', parsedChunk);
          // Add your processing logic here
        } catch (error) {
          console.error('Error parsing remaining buffer:', error.message);
        }
      }
      console.log('Stream ended.');
    });

    response.data.on('error', (err) => {
      console.error('Error during stream:', err.message);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
