const axios = require('axios');
const readline = require('readline');

/**
 * ONE-TIME OAUTH SETUP SCRIPT
 * Run this to get your refresh token
 */

const CLIENT_ID = process.env.BLOGGER_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

async function getRefreshToken() {
    // Step 1: Generate authorization URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `response_type=code&` +
        `scope=https://www.googleapis.com/auth/blogger&` +
        `access_type=offline&` +
        `prompt=consent`;

    console.log('\n🔐 FootyBite Blogger OAuth Setup\n');
    console.log('Step 1: Open this URL in your browser:');
    console.log('─'.repeat(80));
    console.log(authUrl);
    console.log('─'.repeat(80));
    console.log('\nStep 2: Authorize the app and copy the authorization code\n');

    // Step 2: Get authorization code from user
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Paste the authorization code here: ', async (code) => {
        try {
            // Step 3: Exchange code for tokens
            const response = await axios.post('https://oauth2.googleapis.com/token', {
                code: code.trim(),
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            });

            console.log('\n✅ Success! Your credentials:\n');
            console.log('─'.repeat(80));
            console.log('BLOGGER_REFRESH_TOKEN:');
            console.log(response.data.refresh_token);
            console.log('─'.repeat(80));
            console.log('\n📋 Add this to GitHub Secrets as BLOGGER_REFRESH_TOKEN\n');
            console.log('Also add:');
            console.log(`  BLOGGER_CLIENT_ID: ${CLIENT_ID}`);
            console.log(`  BLOGGER_CLIENT_SECRET: ${CLIENT_SECRET}`);
            console.log('  BLOGGER_BLOG_ID: (get from Blogger Settings)\n');

        } catch (error) {
            console.error('\n❌ Error getting token:');
            console.error(error.response?.data || error.message);
            console.log('\nTroubleshooting:');
            console.log('  1. Make sure CLIENT_ID and CLIENT_SECRET are correct');
            console.log('  2. Verify you authorized the correct Google account');
            console.log('  3. Check that Blogger API is enabled in Google Cloud Console');
        }

        rl.close();
    });
}

// Validate inputs
if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
    console.error('❌ Error: Please set BLOGGER_CLIENT_ID and BLOGGER_CLIENT_SECRET');
    console.log('\nUsage:');
    console.log('  export BLOGGER_CLIENT_ID="your_client_id"');
    console.log('  export BLOGGER_CLIENT_SECRET="your_client_secret"');
    console.log('  node get-refresh-token.js');
    process.exit(1);
}

getRefreshToken();
