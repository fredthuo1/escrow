const Escrow = artifacts.require("Escrow");

contract("Escrow", accounts => {
    const buyer = accounts[1];
    const seller = accounts[2];
    const arbitrator = accounts[3];
    const owner = accounts[0];
    const amount = web3.utils.toWei('1', 'ether'); // 1 Ether
    const requiredApprovals = 2; // Define the number of required approvals here
    let escrow;
    let _deadline;
    const approvers = [accounts[4], accounts[5], accounts[6]]; // Example approver addresses

    beforeEach(async () => {
        escrow = await Escrow.new({ from: owner });
        const currentTime = await web3.eth.getBlock('latest').then(block => block.timestamp);
        _deadline = currentTime + 3600; // Set deadline to 1 hour in the future
        await escrow.initiateEscrow(buyer, seller, arbitrator, amount, _deadline, requiredApprovals, { from: owner });

        // Assume the contract has a method to set approvers for simplicity
        for (let i = 0; i < approvers.length; i++) {
            await escrow.addApprover(approvers[i], { from: owner });
        }
    });

    it("should initiate escrow correctly", async () => {
        const storedBuyer = await escrow.buyer();
        const storedSeller = await escrow.seller();
        const storedArbitrator = await escrow.arbitrator();
        const storedAmount = await escrow.amount();

        assert.equal(storedBuyer, buyer, "Buyer address mismatch");
        assert.equal(storedSeller, seller, "Seller address mismatch");
        assert.equal(storedArbitrator, arbitrator, "Arbitrator address mismatch");
        assert.equal(storedAmount, amount, "Amount mismatch");
    });

    it("should allow the buyer to deposit the correct amount of funds", async () => {
        await escrow.depositFunds({ from: buyer, value: amount });
        const balance = await web3.eth.getBalance(escrow.address);
        assert.equal(balance, amount, "The deposited amount doesn't match the escrow balance");
    });

    it("should allow the seller to claim funds after approval", async () => {
        await escrow.depositFunds({ from: buyer, value: amount });

        // Simulate multi-sig approval by third parties
        for (let i = 0; i < requiredApprovals; i++) {
            await escrow.approve({ from: approvers[i] });
        }

        // Claim funds as the seller
        const sellerInitialBalance = BigInt(await web3.eth.getBalance(seller));
        await escrow.claimFunds({ from: seller });

        const balance = await web3.eth.getBalance(escrow.address);
        const sellerFinalBalance = BigInt(await web3.eth.getBalance(seller));
        assert.equal(balance, 0, "The contract should have a 0 balance after funds are claimed");
        assert.isTrue(sellerFinalBalance > sellerInitialBalance, "Seller should have more funds after claiming");
    });

    it("should allow extending the deadline", async () => {
        const newDeadline = (await web3.eth.getBlock('latest')).timestamp + 10000; // Increase deadline by 10 seconds
        await escrow.extendDeadline(newDeadline, { from: owner });

        const storedDeadline = await escrow.deadline();
        assert.equal(storedDeadline.toString(), newDeadline.toString(), "The deadline was not extended correctly");
    });

    it("should not allow unauthorized accounts to extend the deadline", async () => {
        const newDeadline = (await web3.eth.getBlock('latest')).timestamp + 1000;

        try {
            await escrow.extendDeadline(newDeadline, { from: buyer }); // Unauthorized account
            assert.fail("The transaction should have reverted");
        } catch (error) {
            assert.include(error.message, "revert", "The error message should contain 'revert'");
        }
    });

    it("should allow initiating and resolving a dispute", async () => {
        await escrow.depositFunds({ from: buyer, value: amount });
        await escrow.initiateDispute({ from: buyer });

        let isDisputed = await escrow.isDisputed();
        assert.isTrue(isDisputed, "The escrow should be in a disputed state");

        await escrow.resolveDispute(true, { from: arbitrator });

        isDisputed = await escrow.isDisputed();
        const isClaimed = await escrow.isClaimed();
        assert.isFalse(isDisputed, "The escrow should not be in a disputed state after resolution");
        assert.isTrue(isClaimed, "The funds should be claimed after dispute resolution");
    });

    it("should allow cancelling the escrow by the owner", async () => {
        await escrow.depositFunds({ from: buyer, value: amount });
        await escrow.cancelEscrow({ from: owner });

        const isClaimed = await escrow.isClaimed();
        assert.isTrue(isClaimed, "The escrow should be marked as claimed after cancellation");
    });

    it("should not allow unauthorized accounts to cancel the escrow", async () => {
        await escrow.depositFunds({ from: buyer, value: amount });

        try {
            await escrow.cancelEscrow({ from: buyer }); // Unauthorized account
            assert.fail("The transaction should have reverted");
        } catch (error) {
            assert.include(error.message, "revert", "The error message should contain 'revert'");
        }
    });

    // ... any additional tests you want to add
});
