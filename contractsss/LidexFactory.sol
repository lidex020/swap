// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LidexPair.sol";

/// @title LidexSwap Factory
/// @notice Factory for creating LidexSwap liquidity pairs - Green DEX
/// @dev Based on Uniswap V2, rebranded for LidexSwap with logo: green circular arrows
contract LidexFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "LidexSwap: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "LidexSwap: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "LidexSwap: PAIR_EXISTS");
        
        bytes memory bytecode = type(LidexPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        LidexPair(pair).initialize(token0, token1);
        
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);
        
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
}
