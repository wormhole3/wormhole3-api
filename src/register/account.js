const { steem } = require('../utils/steem/steem')
const { Steem_Transfer_Delegate_Account } = require('../../config')
const { sleep } = require('../utils/helper')
const axios = require('axios');

let Delegatee_Account = {};

const monitorDelegateeAccount = async () => {
    return new Promise(async (resolve, reject) => {
        while(true) {
            try{
                const acc = await getAccount(Steem_Transfer_Delegate_Account)
                if (acc) {
                    Delegatee_Account = acc;
                }
            }catch (e) {
                console.log('Get Delegatee account fail:', e);
            }
            if (Object.keys(Delegatee_Account).length === 0){
                await sleep(1)
                continue;
            }   
            await sleep(600)
        }
    })
}

/**
 * Get steem account info from steem
 * @param {*} username 
 * @returns 
 */
 const getAccount = async (username) => {
    return new Promise((resolve, reject) => {
        steem.api.getAccounts([username], (err, results) => {
            if (err) {
                reject(err)
            }else if (results.length > 0){
                resolve(results[0])
            }else {
                reject('None')
            }
        })
    })
}

const getAccounts = async (usernames) => {
    return new Promise((resolve, reject) => {
        steem.api.getAccounts(usernames, (err, results) => {
            if (err) {
                reject(err)
            }else if (results.length > 0){
                resolve(results)
            }else {
                reject('None')
            }
        })
    })
}

async function getGlobalProperties () {
    return new Promise(async (resolve, reject) => {
      axios.post('https://api.steemit.com', '{"jsonrpc":"2.0", "method":"database_api.get_dynamic_global_properties", "id":1}').then(res => {
      if (res.data.result)  
        resolve(res.data.result)
      else
        reject();
      }).catch(err => {
        console.log('Get steem global data fail:', err)
        reject(err)
      })
    })
  }

async function vestsToSteem(vests) {
    const props = await getGlobalProperties()
    const totalSteem = Number(props.total_vesting_fund_steem.amount) / (10 ** props.total_vesting_fund_steem.precision)
    const totalVests = Number(props.total_vesting_shares.amount) / (10 ** props.total_vesting_shares.precision)
    return ((parseFloat(vests) * totalSteem) / totalVests)
}

async function steemToVest (steemPower) {
    const props = await getGlobalProperties()
    const totalSteem = Number(props.total_vesting_fund_steem.amount) / (10 ** props.total_vesting_fund_steem.precision)
    const totalVests = Number(props.total_vesting_shares.amount) / (10 ** props.total_vesting_shares.precision)
    return ((parseFloat(steemPower) * totalVests) / totalSteem).toFixed(6)
  } 

const getAccountVestsBalance = async (rec) => {
    try{
        const account = await getAccount(rec.steemId);
        const vestBalance = parseFloat(account.vesting_shares)
        return vestBalance
    }catch(e) {
        return -1
    }
}

const getAccountDelegation = async (username) => {
    return new Promise(resolve => {
        steem.api.getVestingDelegations(username, '', 100, function(err, result) {
            if (err) {
                resolve([])
            }else {
                let delegations = {}
                for (let d of result) {
                    delegations[d.delegatee] = parseFloat(d.vesting_shares)
                }
                resolve(delegations)
            }
          });
    })
}

/**
 * Get voting powering status
 * @param {*} account 
 * @returns 
 */
function getVPHF20(account) {
    var totalShares = parseFloat(account.vesting_shares) + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares) - parseFloat(account.vesting_withdraw_rate);

    var elapsed = Date.now() / 1000 - account.voting_manabar.last_update_time;
    var maxMana = totalShares * 1000000;
    // 432000 sec = 5 days
    var currentMana = parseFloat(account.voting_manabar.current_mana) + elapsed * maxMana / 432000;

    if (currentMana > maxMana) {
        currentMana = maxMana;
    }

    return [currentMana / 1811, maxMana / 1811]

    var currentManaPerc = currentMana * 100 / maxMana;

    return Math.round(currentManaPerc * 100);
}

/**
 * 
 */
const getDelegateAccountInfo = () => {
    return Delegatee_Account;
}

module.exports = {
    monitorDelegateeAccount,
    getAccount,
    getAccounts,
    getVPHF20,
    getDelegateAccountInfo,
    getAccountVestsBalance,
    vestsToSteem,
    steemToVest,
    getAccountDelegation
}