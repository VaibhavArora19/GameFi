require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    mumbai:{
      url: process.env.ALCHEMY_MUMBAI,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
