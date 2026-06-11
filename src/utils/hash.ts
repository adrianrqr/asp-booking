export const getContentHash = (content: unknown) => {
  const cryptoHasher = new Bun.CryptoHasher("sha256");
  cryptoHasher.update(JSON.stringify(content));

  return cryptoHasher.digest("hex");
};
