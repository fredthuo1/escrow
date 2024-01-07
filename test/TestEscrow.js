const Escrow = artifacts.require("Escrow");

contract("Escrow", accounts => {
    const buyer = accounts[1];
    const seller = accounts[2];
    const arbitrator = accounts[3];
    const amount = web3.utils.toWei('1', 'ether'); // 1 Ether

    it("should initiate escrow correctly", async () => {
        const escrow = await Escrow.new(); // Deploy a new Escrow contract

        // Initiate the escrow with the test parameters
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount);

        // Retrieve the stored escrow data
        const storedBuyer = await escrow.buyer();
        const storedSeller = await escrow.seller();
        const storedArbitrator = await escrow.arbitrator();
        const storedAmount = await escrow.amount();

        // Validate that the contract was initiated with the correct data
        assert.equal(storedBuyer, buyer, "Buyer address mismatch");
        assert.equal(storedSeller, seller, "Seller address mismatch");
        assert.equal(storedArbitrator, arbitrator, "Arbitrator address mismatch");
        assert.equal(storedAmount, amount, "Amount mismatch");
    });

    it("should allow the buyer to deposit the correct amount of funds", async () => {
        const escrow = await Escrow.new();
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount);

        // Deposit the amount
        await escrow.depositFunds({ from: buyer, value: amount });

        // Check the contract's balance to ensure it received the funds
        const balance = await web3.eth.getBalance(escrow.address);
        assert.equal(balance, amount, "The deposited amount doesn't match the escrow balance");
    });

    it("should allow the seller to claim funds after approval", async () => {
        const escrow = await Escrow.new();
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount);
        await escrow.depositFunds({ from: buyer, value: amount });

        // Simulate multi-sig approval (add your implementation based on your actual multi-sig mechanism)
        // ...

        // Claim funds as the seller
        await escrow.claimFunds({ from: seller });

        // Check that the contract's balance is 0 and the seller received the funds
        const balance = await web3.eth.getBalance(escrow.address);
        assert.equal(balance, 0, "The contract should have a 0 balance after funds are claimed");
    });

    it("should allow extending the deadline", async () => {
        const escrow = await Escrow.new();
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount);
        const newDeadline = (await web3.eth.getBlock('latest')).timestamp + 1000; // New deadline 1000 seconds from now

        // Extend the deadline
        await escrow.extendDeadline(newDeadline, { from: owner });

        // Check the new deadline
        const storedDeadline = await escrow.deadline();
        assert.equal(storedDeadline, newDeadline, "The deadline was not extended correctly");
    });

    it("should allow initiating and resolving a dispute", async () => {
        const escrow = await Escrow.new();
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount);
        await escrow.depositFunds({ from: buyer, value: amount });

        // Initiate a dispute
        await escrow.initiateDispute({ from: buyer });

        // Check the dispute status
        let isDisputed = await escrow.isDisputed();
        assert.isTrue(isDisputed, "The escrow should be in a disputed state");

        // Resolve the dispute (assuming buyer wins)
        await escrow.resolveDispute(true, { from: arbitrator });

        // Check the final state
        isDisputed = await escrow.isDisputed();
        const isClaimed = await escrow.isClaimed();
        assert.isFalse(isDisputed, "The escrow should not be in a disputed state after resolution");
        assert.isTrue(isClaimed, "The funds should be claimed after dispute resolution");
    });

    it("should allow cancelling the escrow by the owner", async () => {
        const escrow = await Escrow.new();
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount);
        await escrow.depositFunds({ from: buyer, value: amount });

        // Cancel the escrow
        await escrow.cancelEscrow({ from: owner });

        // Check the final state
        const isClaimed = await escrow.isClaimed();
        assert.isTrue(isClaimed, "The escrow should be marked as claimed after cancellation");
    });

});
