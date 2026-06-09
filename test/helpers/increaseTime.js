// Advances the EVM clock by the given number of seconds and mines a block so
// the new timestamp takes effect immediately. Uses the web3 1.x provider API
// (web3.currentProvider.send), replacing the web3 0.x `sendAsync` used by the
// original suite.
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      { jsonrpc: "2.0", method, params: params || [], id: Date.now() },
      (error, result) => (error ? reject(error) : resolve(result))
    );
  });
}

module.exports = async function increaseTime(seconds) {
  await rpc("evm_increaseTime", [seconds]);
  await rpc("evm_mine");
};
