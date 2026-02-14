// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ERC721Mock
 * @dev 简化的 ERC-721 实现，用于测试 EVM 兼容性
 */
contract ERC721Mock {
    string public name = "Test NFT";
    string public symbol = "TNFT";

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function mint(address to, uint256 tokenId) external {
        require(to != address(0), "Invalid recipient");
        require(ownerOf[tokenId] == address(0), "Token already minted");

        balanceOf[to]++;
        ownerOf[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(ownerOf[tokenId] == from, "Invalid owner");
        require(to != address(0), "Invalid recipient");
        require(
            msg.sender == from ||
            msg.sender == getApproved[tokenId] ||
            isApprovedForAll[from][msg.sender],
            "Not authorized"
        );

        balanceOf[from]--;
        balanceOf[to]++;
        ownerOf[tokenId] = to;
        delete getApproved[tokenId];

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory /* data */) external {
        transferFrom(from, to, tokenId);
    }

    function approve(address approved, uint256 tokenId) external {
        address owner = ownerOf[tokenId];
        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "Not authorized");

        getApproved[tokenId] = approved;
        emit Approval(owner, approved, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "Cannot approve self");

        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function burn(uint256 tokenId) external {
        address owner = ownerOf[tokenId];
        require(owner != address(0), "Token does not exist");
        require(msg.sender == owner, "Not owner");

        balanceOf[owner]--;
        delete ownerOf[tokenId];
        delete getApproved[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // ERC721 interface ID: 0x80ac58cd
        // ERC721Metadata interface ID: 0x5b5e139f
        return interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f || interfaceId == 0x01ffc9a7;
    }
}
