var Web3 = require("web3");
var EventEmitter = require("events").EventEmitter;
var EthereumTx = require("ethereumjs-tx");
const NODE_HOST = "https://exchaintestrpc.okex.org";
var cTokenAbi = require("./abis/CToken.json");
var tokenAbi = require("./abis/CErc20.json");
const comptrollerAbi = require("./abis/Comptroller.json");
const web3 = new Web3(new Web3.providers.HttpProvider(NODE_HOST));
const usdkAddress = "0xE2149C91A8767Af701D0f20DA61AF01E32d7C225";
const usdkCtokenAddress = "0xaD28B23198d8C45F6470F5d09F73897A502Cf45E";
const comptrollerAddress = "0xA9432753135cad988982c941f32fabf8d781041E";
const usdkContract = new web3.eth.Contract(tokenAbi, usdkAddress);

const cUSDKContract = new web3.eth.Contract(cTokenAbi, usdkCtokenAddress);
const comptroller = new web3.eth.Contract(comptrollerAbi, comptrollerAddress);
const privateKey = Buffer.from(
  "02f066318ec663ba0f687984c1122b47addd9f3cacc30e3c0789d8d5ae7a292e",
  "hex"
);
const accountAddress = "0x1BE31032C039be3D1e4130bbAf81dD78fd5016b1";

function sendSigned(txData, callback) {
  console.log("=========");
  var transaction = new EthereumTx(txData);
  transaction.sign(privateKey);
  const serializedTx = transaction.serialize().toString("hex");
  web3.eth.sendSignedTransaction("0x" + serializedTx, callback);
}
function _promise(from, to, encodeABI) {
  try {
    web3.eth.getTransactionCount(from).then((txCount) => {
      var txData = {
        nonce: web3.utils.toHex(txCount),
        gas: web3.utils.toHex(1000000),
        gasPrice: web3.utils.toHex(200000000000),
        from: from,
        to: to,
        data: encodeABI,
      };
      sendSigned(txData, function (err, res) {
        if (!!err) {
          console.log(err);
          return;
        }

        console.log("transactionHash:" + res);
        return res;
      });
    });
  } catch (error) {
    reject(error);
  }
}
const approve = async (amount = -1) => {
  const encodeABI = await usdkContract.methods
    .approve(usdkCtokenAddress, web3.utils.toTwosComplement(amount))
    .encodeABI();
  _promise(accountAddress, usdkAddress, encodeABI);
};

const enterMarkets = async () => {
  const encodeABI = await comptroller.methods
    .enterMarkets([usdkCtokenAddress])
    .encodeABI();
  _promise(accountAddress, usdkAddress, encodeABI);
};
const mint = async () => {
  const amount = await usdkContract.methods.balanceOf(accountAddress).call();
  const encodeABI = await cUSDKContract.methods.mint(amount).encodeABI();
  _promise(accountAddress, usdkAddress, encodeABI);
};
async function runBot() {
  await approve();
  await enterMarkets();
  await mint();
}
runBot();
