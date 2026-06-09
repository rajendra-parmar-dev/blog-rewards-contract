module.exports = function(error) {
  const message = error.message || "";
  const reverted =
    message.search("revert") >= 0 ||
    message.search("invalid opcode") >= 0 ||
    message.search("invalid JUMP") >= 0 ||
    message.search("out of gas") >= 0;
  assert(
    reverted,
    "Expected the transaction to revert, got '" + message + "' instead"
  );
};
