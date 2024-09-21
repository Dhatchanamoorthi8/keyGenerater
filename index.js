const express = require("express");
const cors = require("cors");
const server = express();
server.use(cors());
server.use(express.json());

const path = require('path')


const crypto = require('crypto');


const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PORT || 2002;



server.get('/api/config', (req, res) => {
  res.json(process.env.apiurl);
});


server.use(express.static(path.join(__dirname, 'frontend', 'build')));



server.post('/generate-key', async (req, res) => {

  try {

    const { servername, date } = req.body

    const activationKey = await generateActivationKey(servername, date);

    res.status(200).send(activationKey)

  } catch (err) {

    console.log(err);
  }

})



server.post('/decrypte-key', async (req, res) => {
  try {
    const { key } = req.body;

    const decryptedData = decrypteServername(key);

    res.status(200).json({ servername: decryptedData.servername, expiredate: decryptedData.expiredate });
  } catch (err) {
    
    console.log(err);

    res.status(500).json({ error: 'Internal server error' });
  }
});




function generateActivationKey(servername, expdate) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  // Encrypt server name
  let cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedServerName = cipher.update(servername, 'utf-8', 'hex');
  encryptedServerName += cipher.final('hex');

  // Encrypt expiration date
  cipher = crypto.createCipheriv(algorithm, key, iv); // Create a new cipher instance
  let encryptedExpDate = cipher.update(expdate, 'utf-8', 'hex');
  encryptedExpDate += cipher.final('hex');

  // Concatenate encrypted server name, expiration date, key, and IV, and return as activation key
  const activationKey = `${encryptedServerName}.${encryptedExpDate}.${key.toString('hex')}.${iv.toString('hex')}`;

  return activationKey;
}

function decrypteServername(activationKey) {
  const [encryptedServerName, encryptedExpDate, keyHex, ivHex] = activationKey.split('.');
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const algorithm = 'aes-256-cbc';
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decryptedServerName = decipher.update(encryptedServerName, 'hex', 'utf-8');
  decryptedServerName += decipher.final('utf-8');

  function decrypteexpdate() {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decryptedExpDate = decipher.update(encryptedExpDate, 'hex', 'utf-8');
    decryptedExpDate += decipher.final('utf-8');
    return decryptedExpDate;
  }

  const expDate = decrypteexpdate(); // Call the function to get the decrypted expiration date

  return {
    servername: decryptedServerName,
    expiredate: expDate
  };
}






// Example usage
const servername = '192.168.136.4';
const expdate = '2024-06-07';

const activationKey = generateActivationKey(servername, expdate);
console.log('Generated Activation Key:', activationKey);


const decryptedData = decrypteServername(activationKey);
console.log(decryptedData.expiredate, decryptedData.servername);






server.listen(PORT, () => {
  console.log(`Server is connected ${PORT}`);
});































































































































