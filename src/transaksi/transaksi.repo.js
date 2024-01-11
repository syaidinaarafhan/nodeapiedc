const prisma = require("../db");
const bcrypt = require('bcrypt')

const findMany = async (userId) => {
  try {
    const allTransaksis = await prisma.transaksis.findMany({
      where: {
        userId
      }
    });

    const totalHarga = allTransaksis.reduce((acc, transaksi) => acc + transaksi.totalHarga, 0);

    console.log(`Total Harga dari Semua Transaksi: ${totalHarga}`);

    return totalHarga;
  } catch (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
  }
};

const findAppr = async (apprCode, userId) => {
    const transaksi = await prisma.transaksis.findFirst({
      where: {
        apprCode: parseInt(apprCode),
        userId
      }
    })
    return transaksi;
} 

const findTrace = async (traceNumber, userId) => {
    const transaksi = await prisma.transaksis.findFirst({
      where: {
          traceNumber: parseInt(traceNumber),
          userId
      }
    })
    return transaksi;
} 

const postData = async (newData, userId) => {
    const transaksi = await prisma.transaksis.create({
        data: {
          totalHarga: newData.totalHarga,
          userId: userId
        },
      });

      return transaksi;
}

const audit = async () => {

  const today = new Date();
  today.setHours(0,0,0,0);

  const transaksi = await prisma.transaksis.findMany({
    where: {
      date: {
        gte:today
      }
    }
  });

  return transaksi;
}

const register = async(newData) => {
  const hashedPassword = await bcrypt.hash(newData.password, 10);
  const data = await prisma.users.create({
    data: {
      name: newData.name,
      password: hashedPassword,
      cards: {
        create: {
          pin: generateRandomPin(),
          noKartu: generateRandomCardNumber(),
          cardExp: generateRandomCardExpiration(),
          password: generateRandomString(8),
          nominalLimit: 10000000,
          deposit: 0,
        }
      }
    }
  });  
  return data;
}

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}
function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000);
}

function generateRandomCardNumber() {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('')
  ).join('-');
}

function generateRandomCardExpiration() {
  const month = Math.floor(Math.random() * 12) + 1;
  const year = new Date().getFullYear() + Math.floor(Math.random() * 5);

  return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
}

const login = async(newData) => {
  const data = await prisma.users.findFirst({
    where: {
      name: newData,
    }
  })
  return data;
}

const card = async(userId) =>{
  const data = await prisma.cards.findMany({
    where: {
      userId: userId,
    }
  });

  return data;
}

const openCard = async (amount, userId) => {
  try {

    const card = await prisma.cards.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!card) {
      throw new Error('Card not found for user with userId: ' + userId);
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative.');
    } 

    if (amount > card.nominalLimit) {
      throw new Error('Insufficient nominalLimit.');
    }

    const updatedCard = await prisma.cards.update({
      where: {
        id: userId,
      },
      data: {
        deposit: card.deposit + amount,
        nominalLimit: card.nominalLimit - amount,
      },
    });

    const Receipt = await prisma.transaksis.create({
      data: {
        totalHarga: amount,
        userId: userId
      }
    })

    return updatedCard, Receipt;
  } catch (error) {
    throw new Error('Error updating card: ' + error.message);
  }
}

const offline = async (amount, userId) => {
  try {

    const card = await prisma.cards.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!card) {
      throw new Error('Card not found for user with userId: ' + userId);
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative.');
    } 

    if (amount > card.nominalLimit) {
      throw new Error('Insufficient nominalLimit.');
    }

    const updatedCard = await prisma.cards.update({
      where: {
        id: userId,
      },
      data: {
        deposit: 0,
        nominalLimit: card.nominalLimit + amount,
      },
    });

    const Receipt = await prisma.transaksis.create({
      data: {
        totalHarga: amount,
        userId: userId
      }
    })

    return updatedCard, Receipt;
  } catch (error) {
    throw new Error('Error updating card: ' + error.message);
  }
}
 
const release = async (userId) => {
  try {

    const card = await prisma.cards.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!card) {
      throw new Error('Card not found for user with userId: ' + userId);
    }

    const updatedCard = await prisma.cards.update({
      where: {
        id: card.id,
      },
      data: {
        deposit: 0,
        nominalLimit: 10000000,
      },
    });

    const Receipt = await prisma.transaksis.create({
      data: {
        totalHarga: updatedCard.nominalLimit,
        userId: userId
      }
    })

    return {updatedCard, Receipt};
  } catch (error) {
    throw new Error('Error updating card: ' + error.message);
  }
}

const unsettled = async (userId) => {
  try {
    const unsettledTransactions = await prisma.transaksis.findMany({
      where: {
        settlement: "",
        userId
      },
    });
    return unsettledTransactions;
  } catch (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
  }
  
}

const settled = async (userId) => {
  try {
    await prisma.transaksis.update({
      where:{
       data: {
        settlement: "true",
        userId
      }, 
      },
      
    });

    res.status(200).json({ message: 'Transaksi berhasil di-settlement.' });
  } catch (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
module.exports = {
    findMany, findTrace, postData, audit, register, 
    login, card, findAppr, offline, openCard, release, unsettled, settled
}