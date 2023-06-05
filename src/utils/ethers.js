const ethers = require('ethers')
const { sleep } = require('./helper')
const { RPC_NODE, FAUCET_KEY, AIRDROP_KEY, CURATION_CONTRACT } = require('../../config')

const ReadOnlyProvider = new ethers.providers.JsonRpcProvider(RPC_NODE)

const FAIL_RESULT = [
  'INSUFFICIENT_FUNDS',
  'UNPREDICTABLE_GAS_LIMIT',
  'TRANSACTION_FAIL'
]

const FaucetTokens = {
  'USDT': '0x4cF89A27A27425d81C49c0B345e58A18De8A7273'
}

const ERC20_abi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name_",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol_",
        "type": "string"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

const Provider = new ethers.providers.JsonRpcProvider(RPC_NODE)
const FaucetWallet = new ethers.Wallet(FAUCET_KEY, Provider)
const AirdropWallet = new ethers.Wallet(AIRDROP_KEY, Provider)

let IsAirdroping = false;
let IsFauceting = false;

let Curation_Abi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "taskIds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "topCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxCount",
        "type": "uint256"
      }
    ],
    "name": "newTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_limit",
        "type": "uint256"
      }
    ],
    "name": "distribute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "taskInfo",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "enum Task.TaskState",
            "name": "taskState",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "topCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "feedTotal",
            "type": "uint256"
          }
        ],
        "internalType": "struct Task.TaskInfo",
        "name": "task",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "userCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const getERC20Infos = async (token) => {
  return new Promise(async (resolve, reject) => {
    try{
      if (!ethers.utils.isAddress(token)){
        reject(ERR_CODE.WRONG_ERC20)
        return;
      }
      const erc20Contract = new ethers.Contract(token, ERC20_abi, ReadOnlyProvider);
      const [name, symbol, decimals] = await Promise.all([erc20Contract.name(), erc20Contract.symbol(), erc20Contract.decimals()]);
      resolve({name, symbol, decimals})
    }catch(e) {
      console.log('get token info fail:', e);
      reject(ERR_CODE.BLOCK_CHAIN_ERROR);
    }
  })
}

const getCuration = async (curationId) => {
  try{
    curationId = ethers.BigNumber.from('0x' + curationId);
    const contract = new ethers.Contract(CURATION_CONTRACT, Curation_Abi, ReadOnlyProvider);
    const info = await contract.taskInfo(curationId);
    return info;
  }catch(e) {
    console.log('Get curation info fail', e);
    return false;
  }
}

const faucet = async (symbol, address) => {
  console.log(1, IsFauceting, address);
  while(IsFauceting) {
    await sleep(1);
  }
  try{
    IsFauceting = true;
    const token = FaucetTokens[symbol.toUpperCase()]
    if (!ethers.utils.isAddress(address)) return false;
    if (!token) return false;

    const erc20Contract = new ethers.Contract(token, ERC20_abi, FaucetWallet);
    console.log(4, address);
    const tx = await erc20Contract.transfer(address, ethers.utils.parseUnits('10', 18), {
      gasPrice: 31000000000
    })
    console.log(3, tx.hash);
    return tx.hash;
  }catch(error){
    console.error('Faucet USDT fail:', error)
    return false;
  }finally{
    console.log(2, IsFauceting);
    IsFauceting = false;
  } 
}

const sendMainAsset = async(address, amount) => {
  while(IsAirdroping) {
    await sleep(1);
  }
  try{
    IsAirdroping = true;
    const tx = {
      to: address,
      value: amount,
      gasPrice: 31000000000
    }
    const res =  await AirdropWallet.sendTransaction(tx)
    await waitForTx(Provider, res.hash)
    return res.hash
  }catch(error){
    throw error;
  }finally{
    IsAirdroping = false;
  }  
}

const waitForTx = async (provider, hash) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Waiting for tx: ${hash}...`)
      let trx = await provider.getTransactionReceipt(hash)
      while (!trx) {
        await sleep(1)
        trx = await provider.getTransactionReceipt(hash)
      }
      if (trx.status !== 0) {
        resolve()
      } else {
        console.log('tx fail status:', trx.status);
        reject(FAIL_RESULT[2])
      }
    } catch (err) {
      console.log('tx fail:', err);
      reject(FAIL_RESULT[2])
    }
  })
}

module.exports = {
  getERC20Infos,
  faucet,
  waitForTx,
  FaucetWallet,
  sendMainAsset,
  getCuration
}