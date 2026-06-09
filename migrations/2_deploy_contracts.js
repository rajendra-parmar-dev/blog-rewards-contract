var BlogRewards = artifacts.require("./BlogRewards.sol");

module.exports = function(deployer, network, accounts) {
  // Constructor args: coordinator address, reward amount, deposit amount
  deployer.deploy(BlogRewards, accounts[0], 2, 2);
};
