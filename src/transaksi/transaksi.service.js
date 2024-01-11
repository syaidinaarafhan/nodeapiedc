const { findMany, findTrace, postData, audit, register, login, 
  card, findAppr, offline, openCard, release, unsettled, settled} = require("./transaksi.repo");


const getAllData = async (userId) => {
    const transaksis = await findMany(userId);

    return transaksis;
}

const createDataInsert = async (newData, userId) => {

  const transaksi = await postData(newData, userId);

      return transaksi;
};

const createDataOpen = async (amount, userId) => {

    
    const transaksi = await openCard(amount, userId);

    return transaksi;
}

const createDataOffline = async(userId, amount) => {

    const transaksi = await offline(userId, amount);

    return transaksi;
}

const createDataRelease = async(userId) => {
    
    const transaksi = await release(userId);

    return transaksi;
}

const createDataManual = async(newData, userId) => {

    const transaksi = await postData(newData, userId);

    return transaksi;
};

const createDataQr = async(newData, userId) => {
    const transaksi = await postData(newData, userId);

    return transaksi;
};  

const getAudit = async() => {
  const transaksi = await audit();

  return transaksi;
}

const getRegister = async(newData) => {

  const registers = await register(newData);

  return registers;
}

const getLogin = async(newData) => {

  const logins = await login(newData);

  return logins;
}

const getCardData = async(userId) =>{
  const data = await card(userId);

  return data;
}

const getAppr = async(userId, apprCode) => {
  const data = await findAppr(userId, apprCode);

  return data;
}

const getTrace = async(userId, traceNumber) => {
  const data = await findTrace(userId, traceNumber);

  return data;
}

const unsettle = async (userId) => {
  const data = await unsettle(userId);

  return data;
}

const getSettled = async (userId) => {
  const data = await settled(userId);

  return data;
}

module.exports = {
    getAllData, getTrace, createDataInsert, 
    createDataOpen, createDataOffline, createDataManual, 
    createDataRelease, createDataQr, getAudit, getRegister, getLogin, 
    getCardData, getAppr, getSettled, unsettle, getSettled
}