import * as Jose from "jose";
import fs from "fs";
const jose = Jose;
 
const privateKeyVal = "-----BEGIN PRIVATE KEY----- MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1hz22ymrWvsPV3soVu+ui0vXEi1OymkiyqaCasBRrqXu8blNKllfFAT0ItRoJNBThjkVb0/2qlHBOYFHotINFmZQOiBCUzVvhvhTkMyqTkEDQFmm1CQPEcZQO7UmA5xUkoXZZ8sYIM22etLTrRzwUsFtIFECHAjWTX8+uZX8Tokvf+I/JqAO54/WGx+YeojPl7Pgmd0yHIjudcPS6y/7l/WkmeuO+QqTE5MheIHfcUaQlpEOBLQ3LUPlBwyEMoPjM6FW9dVXfcBwKTYDjZQRRWqTRl8Wbx2SEU8v3kIWh1pq2PZbvZR3D3X5MKEsKAFwHuQtnWgOMi7bpmBPYb+VNAgMBAAECggEABi0jpT2uNJVJXimrkDa/IItIpRclJ2KxeNwQT1hmBs29nIktGKYUjBWWiTPO6XjrVvX7bSbsLsAd3BonNKGOWoa3BLw4wt9ZMiKWB7en9LJdSiyLtzGnKP7A+LW2dlt7xYMgND+a4Po4T2865/XErmLbuuWZgR51n93hgpUIewH6zTKebJo3ubjw52MvD4evrj5PrwJuhO1dynF1y8HEm/ilCuADHOeEhHtdDVWbPBjklNCBbagtEWWTGvzRK4RnCTULfO2GHmgNDUeaasx1NDOlmlpJNeIVR9hvenA6fZXp035Fo5MGSFerLoJXSkwXMm9Lo5vF0cC6JGGFx5zLXwKBgQDbqGknL2PHWovoobUu+1UP1ohL+1uf0rccaylAfj0GDTOfgmDUOV2XYTn1UaxElZOMNjwUdI1a8d800l0NnUytGlSqUWP0ffiODz1llh0xyl/Iwm5bK0Fg2K6bR42bMdeoLT92Ji5CQqNCSDdZRKOSp0Ot2khB7CUNn4t3cij4JwKBgQDTj9sSR+Baw8zGdh8VC1/A7rtNeS6/lmjbrHGoWSg8P8xUuihWGLtUOaR8rA4vwFi3vda3AApd2IJzy53amvxd4cDN9oYEzAut5bXOwZM2PN7BHjHxR6NAi6Cs8S3EGB9QXLRKyN7HXxjhWuK2V7KHYQ1wC8TOSmfIfDNvebWLawKBgDSlAUa18ekGh3+iugTfkbxxA0uKm6QLYX17JXDikIeRxGyXV9OlSAwO7lAgWfQ6ERnKqc2RPYutanyDam/n4keehuonBZjEVDzf5CwjtS2Ivjokd0R8cnfelsJ6fLLUWEZjSdFsRyv0QqKRIkrPy5BLbEoPhb/e8+Z29XsULkODAoGBAJoytNLLLpwZMCzKtXbqNl1x43ThSZB8uWq7co/og+n9+hkbIgE2v3rxFJGF+kUVpdQueswhLG0gPFzX4PMPmbd3rsav0xi1/CFAV1YeQwT6MsWBE5evxi5qVq8WjmvpxREWsJX9eFrKVmESlEGhA8+mjlvHSCevlZtL41Vx2T+HAoGAIzno1tb2Ow//7VZao4acgy39EQdvWDulNkNZtCN8RL356MYMKqn8Ir5rlv7QrNtxx8cBG1UnBZMe0sQmcHnzko1e0cwqsOeiY8VdXxOIxUH4gUQBQmodUjKSvXSPy9nvnhlAvFZBz9wUP6ABuSESAActZ8kWZCa0CjDxWeBOXwk= -----END PRIVATE KEY-----";
 
const publicKeyVal = "-----BEGIN PUBLIC KEY----- MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtYc9tspq1r7D1d7KFbvrotL1xItTsppIsqmgmrAUa6l7vG5TSpZXxQE9CLUaCTQU4Y5FW9P9qpRwTmBR6LSDRZmUDogQlM1b4b4U5DMqk5BA0BZptQkDxHGUDu1JgOcVJKF2WfLGCDNtnrS060c8FLBbSBRAhwI1k1/PrmV/E6JL3/iPyagDueP1hsfmHqIz5ez4JndMhyI7nXD0usv+5f1pJnrjvkKkxOTIXiB33FGkJaRDgS0Ny1D5QcMhDKD4zOhVvXVV33AcCk2A42UEUVqk0ZfFm8dkhFPL95CFodaatj2W72Udw91+TChLCgBcB7kLZ1oDjIu26ZgT2G/lTQIDAQAB -----END PUBLIC KEY-----";
 
export const keyGenenerator = async () => {
  try {
    // const privateKey = await jose.importPKCS8(
    //   fs.readFileSync("./privateKey.pem").toString(),
    //   "pem",
    // );
    console.log(privateKeyVal);
     const privateKey = await jose.importPKCS8(privateKeyVal,"pem");
     console.log('prr', privateKey);
 
    //const publicKey = await jose.importSPKI(fs.readFileSync("./publicKey.pem").toString(), "pem");
    const publicKey = await jose.importSPKI(publicKeyVal, "pem");
    console.log('pub', publicKey);
 
    if (privateKey && publicKey) {
      return { privateKey, publicKey };
    }
  } catch (error) {
    console.warn("generating new keys");
  }
  const secret = await jose.generateKeyPair("PS256", {
    extractable: true,
    modulusLength: 2048,
    crv: "P-256",
  });
  // fs.writeFileSync("./privateKey.pem", await jose.exportPKCS8(secret.privateKey));
  // fs.writeFileSync("./publicKey.pem", await jose.exportSPKI(secret.publicKey));
  return secret;
};
 
const keyGen = await keyGenenerator();
export default keyGen;