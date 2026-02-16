// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TokyoJDMNicknames
 * @dev On-chain nickname registry: 1 per wallet, globally unique, non-transferable
 */
contract TokyoJDMNicknames {
    mapping(bytes32 => address) public nicknameToOwner;
    mapping(address => string) public ownerToNickname;

    event NicknameMinted(address indexed owner, string nickname);

    error NicknameTaken();
    error AlreadyHasNickname();
    error InvalidLength();
    error InvalidChars();

    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        for (uint i = 0; i < b.length; i++) {
            if (b[i] >= 0x41 && b[i] <= 0x5A) {
                b[i] = bytes1(uint8(b[i]) + 32);
            }
        }
        return string(b);
    }

    function _normalizeKey(string memory str) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_toLower(str)));
    }

    function _validNickname(string memory str) internal pure returns (bool) {
        bytes memory b = bytes(str);
        if (b.length < 2 || b.length > 20) return false;
        for (uint i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (!(c >= 0x30 && c <= 0x39) && // 0-9
                !(c >= 0x41 && c <= 0x5A) && // A-Z
                !(c >= 0x61 && c <= 0x7A) && // a-z
                c != 0x5F) { // _
                return false;
            }
        }
        return true;
    }

    function mint(string calldata nickname) external {
        if (!_validNickname(nickname)) revert InvalidLength();
        if (bytes(ownerToNickname[msg.sender]).length > 0) revert AlreadyHasNickname();

        bytes32 key = _normalizeKey(nickname);
        if (nicknameToOwner[key] != address(0)) revert NicknameTaken();

        nicknameToOwner[key] = msg.sender;
        ownerToNickname[msg.sender] = nickname;

        emit NicknameMinted(msg.sender, nickname);
    }

    function getNickname(address owner) external view returns (string memory) {
        return ownerToNickname[owner];
    }

    function hasNickname(address owner) external view returns (bool) {
        return bytes(ownerToNickname[owner]).length > 0;
    }

    function isAvailable(string calldata nickname) external view returns (bool) {
        if (!_validNickname(nickname)) return false;
        return nicknameToOwner[_normalizeKey(nickname)] == address(0);
    }
}
