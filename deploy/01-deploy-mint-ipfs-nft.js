const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = await deployments;
  const { deployer } = await getNamedAccounts();

  log("------------------------------");

  const args = ["myNft", "NFT"];
  const mintNft = await deploy("NftContract", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  log("--------------Deploying MintIpfsNft---------------");

  // verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.POLYGONSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(mintNft.address, args);
  }
  log("--------------Verified MintIpfsNft---------------");
};

module.exports.tags = ["all", "mintIpfsNft"];
