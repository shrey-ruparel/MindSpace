const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const SCOPES = (process.env.GOOGLE_OAUTH_SCOPES || '').split(' ');

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('Authorize this app by visiting this url:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nEnter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\nYour refresh token is:\n', tokens.refresh_token);
    console.log('\nAdd this to your .env as GOOGLE_REFRESH_TOKEN');
  } catch (err) {
    console.error('Error retrieving access token', err);
  }
  rl.close();
});
