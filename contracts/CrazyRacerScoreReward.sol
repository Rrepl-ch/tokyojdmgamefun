// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title CrazyRacerScoreReward
 * @dev Holds reward token; dispenses tokens when backend signs (to, amount, nonce).
 *      Backend tracks accumulated balance off-chain; on withdraw it signs and returns (amount, nonce).
 *      Player calls claim(to, amount, nonce, v, r, s) and pays gas. One nonce = one withdrawal.
 */
contract CrazyRacerScoreReward {
    address public immutable rewardToken;
    address public signer;

    mapping(bytes32 => bool) public usedNonce;

    event Claimed(address indexed to, uint256 amount);
    error InvalidSignature();
    error NonceUsed();
    error TransferFailed();

    constructor(address _rewardToken, address _signer) {
        rewardToken = _rewardToken;
        signer = _signer;
    }

    /// @param to recipient
    /// @param amount tokens to send (in wei, 18 decimals)
    /// @param nonce unique per withdrawal
    /// @param v,r,s EIP-191 signature from signer over keccak256(to, amount, nonce)
    function claim(address to, uint256 amount, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external {
        if (usedNonce[nonce]) revert NonceUsed();
        bytes32 dataHash = keccak256(abi.encodePacked(to, amount, nonce));
        bytes32 msgHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));
        address recovered = ecrecover(msgHash, v, r, s);
        if (recovered != signer) revert InvalidSignature();
        usedNonce[nonce] = true;
        (bool ok,) = rewardToken.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok) revert TransferFailed();
        emit Claimed(to, amount);
    }
}
