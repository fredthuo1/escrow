// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Escrow {
    // State variables
    address payable public buyer;
    address payable public seller;
	address payable public arbitrator; 
    uint256 public amount;
    bool public isClaimed;
	bool public isActive;
    uint256 public deadline; // Deadline for claiming funds
    address[] public approvers; // Addresses required for multi-sig approval
    mapping(address => bool) public approved;
    address public owner; // Contract owner
    bool public isDisputed; // Indicates if there's an ongoing dispute

    event EscrowInitiated(address buyer, address seller, uint256 amount);
    event FundsDeposited(uint256 amount);
    event FundsClaimed();
    event DeadlineExtended(uint256 newDeadline);
    event DisputeInitiated(string reason);
	event DisputeResolved(bool success);
    event EscrowCancelled();
	event EscrowCompleted();

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can perform this action");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can perform this action");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

	modifier inDispute() {
        require(isDisputed, "No ongoing dispute");
        _;
    }

    modifier notDisputed() {
        require(!isDisputed, "Action blocked due to ongoing dispute");
        _;
    }

	 modifier onlyParticipant() {
        require(msg.sender == buyer || msg.sender == seller, "Not a participant");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Not an arbitrator");
        _;
    }

    constructor() {
    }

	// Function to initiate a new escrow
    function initiateEscrow(address payable _buyer, address payable _seller, address payable _arbitrator, uint256 _amount) public {
        require(!isActive, "An escrow is already active");
        buyer = _buyer;
        seller = _seller;
        arbitrator = _arbitrator;
        amount = _amount;
        isActive = true;
        emit EscrowInitiated(_buyer, _seller, _amount);
    }

	// Function to reset the escrow for reuse (to be called after completion)
    function resetEscrow() public {
        require(msg.sender == buyer || msg.sender == seller, "Only participant can reset");
        buyer = payable(address(0));
        seller = payable(address(0));
        arbitrator = payable(address(0));
        amount = 0;
        isActive = false;
        emit EscrowCompleted();
    }

    // Function for buyer to deposit funds
    function depositFunds() public payable onlyBuyer notDisputed {
        require(msg.value == amount, "Incorrect deposit amount");
        emit FundsDeposited(msg.value);
    }

    // Modified claimFunds function with multi-sig and deadline check
    function claimFunds() public onlySeller notDisputed {
        require(!isClaimed, "Funds already claimed");
        require(block.timestamp <= deadline, "Deadline exceeded");
        require(isApproved(msg.sender), "Multi-sig approval required");

        payable(seller).transfer(amount);
        isClaimed = true;
        emit FundsClaimed();
    }

    // Multi-sig approval logic
    function isApproved(address _sender) public view returns (bool) {
        uint256 approvedCount = 0;
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approved[approvers[i]]) {
                approvedCount++;
            }
        }
        return approvedCount > approvers.length / 2 && approved[_sender]; // Requires majority approval and sender's approval
    }

    // Function for extending the deadline
    function extendDeadline(uint256 newDeadline) public onlyOwner {
        require(newDeadline > deadline, "New deadline must be later than current");
        deadline = newDeadline;
        emit DeadlineExtended(newDeadline);
    }

	// Function to initiate a dispute
    function initiateDispute() public onlyParticipant {
        require(!isClaimed, "Cannot dispute after funds are claimed");
        isDisputed = true;
    }

    // Function for the arbitrator to resolve disputes
    function resolveDispute(bool buyerWins) public onlyArbitrator {
        require(isDisputed, "No dispute to resolve");
        if (buyerWins) {
            payable(buyer).transfer(amount);
        } else {
            payable(seller).transfer(amount);
        }
        isClaimed = true;
        isDisputed = false;
        emit DisputeResolved(buyerWins);
    }

    // Function for cancelling the escrow (e.g., if both parties agree to cancel)
    function cancelEscrow() public onlyOwner notDisputed {
        require(!isClaimed, "Funds already claimed");
        if (address(this).balance > 0) {
            // Refund any deposited funds back to the buyer
            buyer.transfer(address(this).balance);
        }
        isClaimed = true; // Prevents further actions on the escrow
        emit EscrowCancelled();
    }

    // Fallback function to prevent accidental Ether transfer
    fallback() external {
        revert("Direct transfer not allowed");
    }
}
