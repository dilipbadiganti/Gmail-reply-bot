const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels'
  
];

async function googlAuthenticate() {
  const auth = await authenticate({
    keyfilePath: path.join(__dirname, '../creds.json'),
    scopes: SCOPES,
  });
  return auth;
}
module.exports = { googlAuthenticate };
