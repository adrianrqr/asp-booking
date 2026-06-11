export const getContentHash = (content: string) => {
  const cryptoHasher = new Bun.CryptoHasher("sha256");
  cryptoHasher.update(content);

  return cryptoHasher.digest("hex");
};
