const { expect } = require('chai');
const hre = require('hardhat');
const { ethers } = require('ethers');
const counterArtifact = require('../artifacts/contracts/Counter.sol/Counter.json');

function createHardhatBrowserProvider() {
  return new ethers.BrowserProvider({
    request: async ({ method, params }) => hre.network.provider.send(method, params || []),
  });
}

describe('Counter', function () {
  it('Should emit the Increment event when calling the inc() function', async function () {
    const provider = createHardhatBrowserProvider();
    const signer = await provider.getSigner();
    const factory = new ethers.ContractFactory(counterArtifact.abi, counterArtifact.bytecode, signer);
    const counter = await factory.deploy();
    await counter.waitForDeployment();

    const tx = await counter.inc();
    const receipt = await tx.wait();
    const parsedEvent = receipt.logs
      .map((log) => {
        try {
          return counter.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((event) => event && event.name === 'Increment');

    expect(parsedEvent).to.not.equal(null);
    expect(parsedEvent.args.by).to.equal(1n);
  });

  it('The sum of the Increment events should match the current value', async function () {
    const provider = createHardhatBrowserProvider();
    const signer = await provider.getSigner();
    const factory = new ethers.ContractFactory(counterArtifact.abi, counterArtifact.bytecode, signer);
    const counter = await factory.deploy();
    await counter.waitForDeployment();

    const deploymentBlockNumber = await provider.getBlockNumber();

    for (let index = 1; index <= 10; index++) {
      await counter.incBy(index);
    }

    const events = await counter.queryFilter(
      counter.filters.Increment(),
      deploymentBlockNumber,
      'latest'
    );

    let total = 0n;
    for (const event of events) {
      total += event.args.by;
    }

    expect(await counter.x()).to.equal(total);
  });
});