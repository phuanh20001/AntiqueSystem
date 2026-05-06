import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AntiqueVerificationModule", (m) => {
  const antiqueVerification = m.contract("AntiqueVerification");

  return { antiqueVerification };
});