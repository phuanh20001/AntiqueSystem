// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// This is your smart contract — it lives permanently on the Ethereum blockchain
contract AntiqueVerification {

    // Defines the structure of one verification record stored on-chain
    struct VerificationRecord {
        string  itemId;           // MongoDB _id of the antique item
        address verifier;         // Ethereum wallet of the expert who verified it
        bool    isAuthentic;      // true = approved, false = rejected
        string  metadataHash;     // SHA-256 hash of the full MongoDB record
        uint256 timestamp;        // exact time the block was mined on Ethereum
        bool    exists;           // used to check if a record exists
    }

    // Owner of the contract — only they can assign verifiers
    address public owner;

    // Maps each itemId to its verification record
    mapping(string => VerificationRecord) public records;

    // Tracks which wallet addresses are approved verifiers
    mapping(address => bool) public approvedVerifiers;

    // Events are logged on Ethereum — visible on Etherscan
    event ItemVerified(
        string  indexed itemId,
        address indexed verifier,
        bool    isAuthentic,
        string  metadataHash,
        uint256 timestamp
    );
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // Runs once when the contract is first deployed
    constructor() {
        owner = msg.sender;
        // The deployer is automatically an approved verifier
        approvedVerifiers[msg.sender] = true;
    }

    // Only the contract owner can call functions with this modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // Only approved verifiers can call functions with this modifier
    modifier onlyVerifier() {
        require(approvedVerifiers[msg.sender], "Not an approved verifier");
        _;
    }

    // Admin adds a new verifier wallet address
    function addVerifier(address verifier) public onlyOwner {
        approvedVerifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }

    // Admin removes a verifier
    function removeVerifier(address verifier) public onlyOwner {
        approvedVerifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }

    // Verifier calls this to record their decision on-chain
    function verifyItem(
        string memory itemId,
        bool          isAuthentic,
        string memory metadataHash
    ) public onlyVerifier {

        // Make sure this item has not already been verified
        require(!records[itemId].exists, "Item already verified");

        // Store the record permanently on the blockchain
        records[itemId] = VerificationRecord({
            itemId:       itemId,
            verifier:     msg.sender,      // auto-captures the verifier's wallet
            isAuthentic:  isAuthentic,
            metadataHash: metadataHash,
            timestamp:    block.timestamp, // set by Ethereum, cannot be faked
            exists:       true
        });

        emit ItemVerified(itemId, msg.sender, isAuthentic, metadataHash, block.timestamp);
    }

    // Anyone can read a verification record by itemId
    function getRecord(string memory itemId)
        public view returns (VerificationRecord memory)
    {
        require(records[itemId].exists, "No record found for this item");
        return records[itemId];
    }

    // Check if an item has already been verified
    function isVerified(string memory itemId) public view returns (bool) {
        return records[itemId].exists;
    }
}