// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrazyRacerCars
 * Soulbound ERC-721: 1 NFT на каждый тип машины на кошелёк, нельзя передавать
 * Машины 0,1,2 = бесплатные | 3,4,5 = платные
 */
contract CrazyRacerCars is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant MAX_CAR_TYPES = 6;
    uint256 private _nextTokenId;

    uint256[MAX_CAR_TYPES] public prices;
    string private _baseTokenURI;
    address public immutable treasury;

    mapping(uint256 => uint8) public tokenIdToCarType;
    mapping(address => mapping(uint8 => bool)) public hasMinted;

    event Minted(address indexed to, uint256 indexed tokenId, uint8 carType);

    error AlreadyMinted();
    error InvalidCarType();
    error InsufficientPayment();
    error TransferNotAllowed();

    constructor(address _treasury, string memory baseURI_)
        ERC721("Crazy Racer Cars", "CRC")
        Ownable(msg.sender)
    {
        treasury = _treasury;
        _baseTokenURI = baseURI_;

        prices[0] = 0;              // ciric - free
        prices[1] = 0;              // liner - free
        prices[2] = 0;              // cilnia - free
        prices[3] = 0.00015 ether;  // xx7
        prices[4] = 0.0002 ether;   // pupra
        prices[5] = 0.00025 ether;  // ltr
    }

    function mint(uint8 carType) external payable nonReentrant {
        if (carType >= MAX_CAR_TYPES) revert InvalidCarType();
        if (hasMinted[msg.sender][carType]) revert AlreadyMinted();
        if (msg.value < prices[carType]) revert InsufficientPayment();

        hasMinted[msg.sender][carType] = true;
        uint256 tokenId = _nextTokenId++;
        tokenIdToCarType[tokenId] = carType;

        _safeMint(msg.sender, tokenId);

        if (msg.value > 0) {
            (bool sent, ) = treasury.call{value: msg.value}("");
            require(sent, "ETH transfer failed");
        }

        emit Minted(msg.sender, tokenId, carType);
    }

    function ownsCarType(address owner, uint8 carType) external view returns (bool) {
        return hasMinted[owner][carType];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert TransferNotAllowed();
        return super._update(to, tokenId, auth);
    }
}
