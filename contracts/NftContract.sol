// SPDX-License-Identifier: MIT
pragma solidity 0.8.8;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';

contract NftContract is ERC721URIStorage {

    event ListingCreated(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);

    address public owner;
    uint256 private tokenIdCounter = 1;
    //string[] private ImageURIs;

    struct Nft{
        address owner;
        string ImageURI;
        bool listedOnMarketplace;
    }

    struct NftMetadata{
        string name;
        string description;
    }

    // marketplace struct
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Nft) private _nfts;
    mapping(string => NftMetadata) private _nftMetadata;
    // Marketplace mapping
    mapping(uint256 => Listing) public listings;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function mintNft(string memory name, string memory description, string memory tokenURI) external {
        uint256 newTokenId = tokenIdCounter;
        _safeMint(msg.sender, newTokenId);

        //string memory _ImageURI = ImageURIs[newTokenId - 1];
        _setTokenURI(newTokenId, tokenURI);
        _nfts[newTokenId] = Nft(msg.sender, tokenURI, false);
        _nftMetadata[tokenURI] = NftMetadata(name, description);

        tokenIdCounter++;
    }

    function getImageURL(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Invalid token ID");
        return _nfts[tokenId].ImageURI;
    }
    // Nft Marketplace

    function listNft(uint256 tokenId, uint256 price) public {
        require(_exists(tokenId), "NFT does not exist.");
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list their NFT.");
        require(price >= 0, "Price cannot be negative.");

        listings[tokenId] = Listing(tokenId, msg.sender, price, true);
        emit ListingCreated(tokenId, msg.sender, price);
    }

    function cancelListing(uint256 tokenId) public {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing is already inactive");
        require(listing.seller == msg.sender, "Only the seller can cancel the listing.");

        listing.active = false;
        emit ListingCancelled(tokenId);
    }

    function updateListing(uint256 tokenId, uint256 newPrice) public {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing is inactive.");
        require(listing.seller == msg.sender, "Only the seller can update the price.");

        listing.price = newPrice;
        emit PriceUpdated(tokenId, newPrice);
    }

    function buyNFT(uint256 tokenId) public payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Listing is inactive.");
        require(listing.price > 0, "NFT is not for sale.");
        require(msg.value >= listing.price, "Insufficient funds.");

        address seller = listing.seller;
        listing.active = false;
        _transfer(seller, msg.sender, tokenId);

        emit NFTSold(tokenId, msg.sender, msg.value);
    }

    function withdraw() external onlyOwner {
         uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw.");

        payable(owner).transfer(balance);
    }

    function getListedToken(uint256 tokenId) external view returns (uint256, address, uint256, bool) {
        Listing storage listing = listings[tokenId];
        return (listing.tokenId, listing.seller, listing.price, listing.active);
    }
    function getNftOwner(uint256 tokenId) external view returns (address) {
    return _nfts[tokenId].owner;
    } 

    function getNftMetadata(string memory tokenURI) external view returns (string memory, string memory) {
    return (_nftMetadata[tokenURI].name, _nftMetadata[tokenURI].description);
    }

    // function getOwner() public view returns (address) {
    // return owner;
    // }

}

// Nft Contract deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3 Localhost

// deployed at mumbai testnet: 0x96c883C9A201F16166019C95e06651bd976f22D3