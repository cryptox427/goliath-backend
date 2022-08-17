const Web3 = require("web3");
const contractConfig = require("../contract/contract.config");
const ABI = require("../contract/abi.json");

const getContractInstance = () => {
  const web3 = new Web3(
    "https://mainnet.infura.io/v3/cd60617c0fd6453dab5f09d99b322630"
  );
  let response = new web3.eth.Contract(ABI, contractConfig.CONTRACT_ADDRESS);
  return response;
};

module.exports = { getContractInstance };
