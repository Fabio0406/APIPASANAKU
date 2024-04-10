import pkg from 'whatsapp-web.js';
const { Client,LocalAuth } = pkg;
import qrcode from 'qrcode-terminal'

// Create a new client instance
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "sessions",
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Client is ready!');
});

// When the client received QR-Code
client.on('qr', (qr) => {
    qrcode.generate(qr,{small:true})
    
});

// Start your client
client.initialize();


export default client
