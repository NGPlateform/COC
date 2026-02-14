// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../settlement/PoSeManager.sol";

/**
 * @title ReentrancyAttacker
 * @dev 测试合约，尝试对 PoSeManager 进行重入攻击
 */
contract ReentrancyAttacker {
    PoSeManager public target;
    uint256 public attackCount;
    bytes32 public nodeId;

    constructor(address _target) {
        target = PoSeManager(payable(_target));
    }

    // 尝试重入攻击 withdraw 函数
    function attackWithdraw(bytes32 _nodeId) external payable {
        nodeId = _nodeId;
        attackCount = 0;

        // 调用 withdraw
        target.withdraw(_nodeId);
    }

    // 接收以太币时尝试重入
    receive() external payable {
        if (attackCount < 5) {
            attackCount++;
            // 尝试再次调用 withdraw（重入攻击）
            try target.withdraw(nodeId) {
                // 如果成功，说明存在重入漏洞
            } catch {
                // 预期会失败（被 CEI 模式阻止）
            }
        }
    }

    // 获取合约余额
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

/**
 * @title VulnerableBank
 * @dev 故意存在重入漏洞的合约，用于对比测试
 */
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // 危险：先转账，后更新状态
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        // 漏洞：在更新状态前转账
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // 太晚了！
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

/**
 * @title BankAttacker
 * @dev 攻击 VulnerableBank 的合约
 */
contract BankAttacker {
    VulnerableBank public target;
    uint256 public attackCount;

    constructor(address _target) {
        target = VulnerableBank(_target);
    }

    function attack() external payable {
        require(msg.value > 0, "Need ETH to attack");
        attackCount = 0;

        target.deposit{value: msg.value}();
        target.withdraw();
    }

    receive() external payable {
        if (attackCount < 5 && address(target).balance > 0) {
            attackCount++;
            target.withdraw();
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
