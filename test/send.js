const { sendMainAsset } = require('../src/utils/ethers')
const ethers = require('ethers')
const { pollingFaucet } = require('../src/utils/airdrip')


pollingFaucet()