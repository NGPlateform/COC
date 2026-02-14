// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PoSeTypes} from "./PoSeTypes.sol";

interface IPoSeManager {
    event NodeRegistered(bytes32 indexed nodeId, address indexed operator, uint8 serviceFlags, uint256 bondAmount);
    event NodeCommitmentUpdated(bytes32 indexed nodeId, bytes32 newCommitment);
    event BatchSubmitted(uint64 indexed epochId, bytes32 indexed batchId, bytes32 merkleRoot, bytes32 summaryHash);
    event BatchChallenged(bytes32 indexed batchId, address indexed challenger, bytes32 leaf);
    event EpochFinalized(uint64 indexed epochId);
    event NodeSlashed(bytes32 indexed nodeId, uint256 slashAmount, uint8 reasonCode);
    event UnbondRequested(bytes32 indexed nodeId, uint64 unlockEpoch);
    event Withdrawn(bytes32 indexed nodeId, address indexed operator, uint256 amount);

    function registerNode(
        bytes32 nodeId,
        bytes calldata pubkeyNode,
        uint8 serviceFlags,
        bytes32 serviceCommitment,
        bytes32 endpointCommitment,
        bytes32 metadataHash,
        bytes calldata ownershipSig
    ) external payable;

    function updateCommitment(bytes32 nodeId, bytes32 newCommitment) external;

    function submitBatch(
        uint64 epochId,
        bytes32 merkleRoot,
        bytes32 summaryHash,
        PoSeTypes.SampleProof[] calldata sampleProofs
    ) external returns (bytes32 batchId);

    function challengeBatch(bytes32 batchId, bytes32 receiptLeaf, bytes32[] calldata merkleProof) external;

    function finalizeEpoch(uint64 epochId) external;

    function slash(bytes32 nodeId, PoSeTypes.SlashEvidence calldata evidence) external;

    function requestUnbond(bytes32 nodeId) external;

    function withdraw(bytes32 nodeId) external;
}
