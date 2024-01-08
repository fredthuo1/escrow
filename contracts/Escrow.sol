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
	uint256 public approvalCount;
	uint256 public requiredApprovals;

    event EscrowInitiated(address buyer, address seller, uint256 amount);
    event FundsDeposited(uint256 amount);
    event FundsClaimed();
    event DeadlineExtended(uint256 newDeadline);
    event DisputeInitiated(string reason);
    event DisputeResolved(bool success);
    event EscrowCancelled();
    event EscrowCompleted();
    event ApproverAdded(address approver);
    event ApproverRemoved(address approver);
	event ApprovalReceived(address approver);

    constructor() {
    }

    // Function to initiate a new escrow
	function initiateEscrow(address payable _buyer, address payable _seller, address payable _arbitrator, uint256 _amount, uint256 _deadline, uint256 _requiredApprovals) public {
        require(!isActive, "An escrow is already active");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(_buyer != address(0) && _seller != address(0) && _arbitrator != address(0), "Invalid address");
        require(_buyer != _seller, "Buyer and seller must be different");
        require(_amount > 0, "Amount must be greater than 0");
        buyer = _buyer;
        seller = _seller;
        arbitrator = _arbitrator;
        amount = _amount;
        deadline = _deadline;
        isActive = true;
        emit EscrowInitiated(_buyer, _seller, _amount);
		requiredApprovals = _requiredApprovals;
    }

    // Function to reset the escrow for reuse (to be called after completion)
    function resetEscrow() public onlyParticipant {
        require(isClaimed || block.timestamp > deadline, "Escrow not yet claimable or expired");
        buyer = payable(address(0));
        seller = payable(address(0));
        arbitrator = payable(address(0));
        amount = 0;
        deadline = 0;
        isActive = false;
        isDisputed = false;
        isClaimed = false;
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
		require(isApproved(), "Multi-sig approval required");
		payable(seller).transfer(amount);
		isClaimed = true;
		emit FundsClaimed();
	}

    // Multi-sig approval logic
	function approve() public {
		require(msg.sender != buyer && msg.sender != seller, "Buyer or seller cannot approve");
		require(!approved[msg.sender], "Already approved");
		approved[msg.sender] = true;
		approvalCount++;
		emit ApprovalReceived(msg.sender);
	}


	function isApproved() public view returns (bool) {
		return approvalCount >= requiredApprovals;
	}

    // Function for extending the deadline
    function extendDeadline(uint256 newDeadline) public {
        require(newDeadline > deadline, "New deadline must be later than current");
        deadline = newDeadline;
        emit DeadlineExtended(newDeadline);
    }

    // Function to initiate a dispute
    function initiateDispute() public onlyParticipant {
        require(!isClaimed, "Cannot dispute after funds are claimed");
        isDisputed = true;
        emit DisputeInitiated("Dispute initiated");
    }

    // Function for the arbitrator to resolve disputes
    function resolveDispute(bool buyerWins) public onlyArbitrator inDispute {
        require(!isClaimed, "Funds already claimed");
        if (buyerWins) {
            payable(buyer).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
        isClaimed = true;
        isDisputed = false;
        emit DisputeResolved(buyerWins);
    }

    // Function for cancelling the escrow (e.g., if both parties agree to cancel)
    function cancelEscrow() public notDisputed {
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

    // Modifiers
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can perform this action");
        _;
    }
    
	modifier onlySeller() {
		require(msg.sender == seller, "Only seller can perform this action");
		_;
	}

	modifier onlyArbitrator() {
		require(msg.sender == arbitrator, "Not an arbitrator");
		_;
	}

	modifier onlyParticipant() {
		require(msg.sender == buyer || msg.sender == seller, "Not a participant");
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

    // Approver management
    function addApprover(address approver) public {
        require(approver != address(0), "Invalid address");
        approvers.push(approver);
        emit ApproverAdded(approver);
    }

    function removeApprover(address approver) public {
		require(approver != address(0), "Invalid address");

		// Find the index of the approver to remove
		int256 approverIndex = -1;
		for (uint256 i = 0; i < approvers.length; i++) {
			if (approvers[i] == approver) {
				approverIndex = int256(i);
				break;
			}
		}

		require(approverIndex >= 0, "Approver not found");

			// Remove the approver by shifting the last element of the array into its place
			approvers[uint256(approverIndex)] = approvers[approvers.length - 1];
			approvers.pop(); // Remove the last element

			emit ApproverRemoved(approver);
	}

}
