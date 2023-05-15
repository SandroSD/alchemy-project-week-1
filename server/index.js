const express = require("express");
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { hexToBytes, toHex } = require("ethereum-cryptography/utils");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

/**
 * Examples:
    {
      'Private Key: ': '650c5922fb6fd5409841a302f4939c43da102a85d3226180806d8fbfa40f8530',
      'Public Key: ': '04b79234192f2b473bf1a3414c7a7d7227a3120fffafbdf4205754e878e375b71e12bc6b7ce9168935d9859fc3f5a88199a1899d8d6ed4fa5f35fd759adf4e9796'
    }
    {
      'Private Key: ': '0be8262e40ba8b407687d18b2ce7285cabc408e48c256d2b3174353c4670b861',
      'Public Key: ': '0479d83a88133656c7c7f95c69ce9b2136074ef5e52c486d7d52dcf0d3edc4a1fb29df39f8bc1d3df2cfd2240812d66c1c4f153acb66885f00248fb002499547e7'
    }
    {
      'Private Key: ': '035f028ae9b6c44b11c3a7b0f93b00e5bad99afb4d624724ae118f1789e4ffcc',
      'Public Key: ': '048921e617814ae9b45605f1addbf81dcdbbccd71bc6cf70b82c95fded60274840d0c8543f12aa0560893152e5d8279c77bdf974478e5babde7b5faccff1fb8477'
    }
 */

const balances = {
  "04b79234192f2b473bf1a3414c7a7d7227a3120fffafbdf4205754e878e375b71e12bc6b7ce9168935d9859fc3f5a88199a1899d8d6ed4fa5f35fd759adf4e9796": 100,
  "0479d83a88133656c7c7f95c69ce9b2136074ef5e52c486d7d52dcf0d3edc4a1fb29df39f8bc1d3df2cfd2240812d66c1c4f153acb66885f00248fb002499547e7": 50,
  "048921e617814ae9b45605f1addbf81dcdbbccd71bc6cf70b82c95fded60274840d0c8543f12aa0560893152e5d8279c77bdf974478e5babde7b5faccff1fb8477": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { message, messageSigned } = req.body;
  const { recipient, amount } = message;
  
  const hash = keccak256(Uint8Array.from(message));

  const fullSignatureBytes = hexToBytes(messageSigned);
  const recoveryBit = fullSignatureBytes[0];
  const signatureBytes = fullSignatureBytes.slice(1);

  const publicKey = secp.recoverPublicKey(hash, signatureBytes, recoveryBit);
  const hashPubKey = keccak256(publicKey.slice(1));
  const sender = toHex(hashPubKey.slice(-20)).toUpperCase();

  setInitialBalance(sender);
  setInitialBalance(recipient);

  console.log(sender, balances[sender]);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
