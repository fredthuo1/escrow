const Escrow = artifacts.require("Escrow");

module.exports = async function (deployer, network, accounts) {
    // Define the addresses for buyer and seller, and an initial amount
    const buyerAddress = "0xa8f77cc46bb3dd45db224E632b965E0A3900Abcd"; // or another address that represents the buyer
    const sellerAddress = "0xbC17C584E33f59a072203b542feAcB4c8F7e6426"; // or another address that represents the seller
    const initialAmount = web3.utils.toWei("1", "ether"); // or any other amount

    // Deploy the contract with the necessary constructor parameters
    await deployer.deploy(Escrow);
};
