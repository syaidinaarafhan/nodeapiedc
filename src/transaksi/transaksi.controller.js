const express = require('express');
const { getAllData, getTrace, createDataOpen, 
  createDataInsert, createDataManual, createDataRelease,
  createDataQr, getRegister, getLogin, getCardData, 
  getAppr, createDataOffline, unsettle, getSettled
} = require('./transaksi.service');
const db = require("../db");
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { findMany, unsettled } = require('./transaksi.repo');


router.post('/register', async (req, res) => {

  const newData = req.body

  try {
    const user = await getRegister(newData);

    res.send({ success: true, user });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).send({ success: false, error: 'Internal Server Error' });
  }
});

const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).send({ message: 'Unauthorized: Missing token' });
  }

  const token = authorizationHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_TOKEN;
    const user = jwt.verify(token, secret);

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send({ message: 'Unauthorized: Invalid token' });
  }
};

router.get('/dashboard',  verifyToken, (req, res) => {

  res.send({ message: 'Welcome to the dashboard', user: req.user });

});

router.post('/login', async (req, res) => {
  const {name, password} = req.body;
    
    const user = await getLogin(name);
  
    if (!user) {
      return res.status(404).send({
        message: 'User not found'
      })
    }
  
    const isPasswordValid = await bcrypt.compare(password, user.password)
  
    if(isPasswordValid){
      const payload = {
          id: user.id,
          name: user.name,
      }
  
      const secret = process.env.JWT_TOKEN;
  
      const expiresIn = 60 * 60 * 24;
  
      const token = jwt.sign(payload, secret, {expiresIn: expiresIn})
  
      return res.send({
          data: {
              id: user.id,
              name: user.name,
          },
          token: token
      })

  } else {
      return res.status(400).send({
          message: 'Wrong password'
      })
  }

});

router.get('/cards', verifyToken, async (req,res) => {
  try {
  const userId = req.user.id

  const data = await getCardData(userId);
  res.status(200).send(data);
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/insertCard', verifyToken, async (req,res) => {

  try {

    const newData = req.body;

    const userId = req.user.id;

    const insertCard = await createDataInsert(newData, userId);

    res.send({
      data : insertCard,
      message : 'Receipt here!',
    })

  } catch (error) {
    console.error(error);
    res.status(400).send(error.message);
  }
});

router.post('/openCard', verifyToken, async (req,res) => {

  try {

    const amount = parseInt(req.body.amount);
    const userId = req.user.id

    const openCard = await createDataOpen(amount, userId);

    res.send({
      data : openCard,
      message : 'Open Card Receipt!',
    })

  } catch (error) {
    console.error(error);
    res.status(400).send(error.message);
  }
});

router.get('/approvalCode/:apprCode', verifyToken, async (req,res) => {

  try {
    
    const apprCode = req.params.apprCode;
  
    const userId = req.user.id;
  
    const transaksi = await getAppr(apprCode, userId);

    if (transaksi) {
      res.send({
        data: transaksi,
        message: 'Data ada'
      });
    } else {
      res.status(404).send({
        message: 'Data tidak ditemukan'
      });
    }
  } catch (error) {
    console.log(error);
  }
})

router.post('/offline', verifyToken, async (req,res) => {
  try {

    const amount = parseInt(req.body.amount);
    const userId = req.user.id
    const offline = await createDataOffline(amount, userId);

    res.send({
      data : offline,
      message : 'OFFLINE Receipt!',
    });
    
  } catch (error) {
    console.log( error);
    res.status(400).send(error.message);
  }
});

router.post('/release', verifyToken, async (req,res) => {
  try {
    const userId = req.user.id;
    const release = await createDataRelease(userId);

    res.send({
      data: release,
      message: 'RELEASE Receipt!'
    })

  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post('/manualTransaction', verifyToken, async (req,res) => {
  try {
    const newData = req.body;
    const userId = req.user.id;
    const manual = await createDataManual(newData, userId);

    res.send({
      data: manual,
      message: 'MANUAL Receipt!'
    })

  } catch (error) {
    console.log(error)
    res.status(400).send(error.message);
  }
});

router.post('/qr', verifyToken, async (req,res) => {
  try {
          const newData = req.body;
          const userId = req.user.id;
          const transaksi = await createDataQr(newData, userId);
      
        res.send({
          data: transaksi,
          message: "Data berhasil disimpan!"
        })
    
        } catch (error) {
          res.status(400).send(error.message);
        }
})
  
router.get('/find/:traceNumber', verifyToken, async (req,res) => {

  try {
    
    const traceNumber = req.params.traceNumber;
    const userId = req.user.id;
  
    const transaksi = await getTrace(traceNumber, userId);

    res.send({
      data : transaksi,
      message : 'data ada'
    })

  } catch (error) { 
    console.log(error);
  }
})

router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const userId = req.user.id;

    await prisma.transaksis.delete({
      where: {
        id: transactionId,
        userId: userId,
      },
    });

    res.status(200).send({
      message: 'Data deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'Internal Server Error',
    });
  }
});

router.get('/void/:traceNumber', verifyToken, async (req, res) => {

    const traceNumber = req.params.traceNumber;
    const hasil = await getDataByTrace(traceNumber);
  
    res.send({
      data: hasil,
      message: 'Berikut hasil dari pencariannya'
    });
});

router.get('/audit', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Today:', today);

    const transactions = await prisma.transaksis.findMany({
      where: {
        userId: userId,
        date: {
          gte: today
        }
      },
    });

    res.send({
      data: transactions,
      message: 'ada'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const totalSum = await findMany(userId);

    console.log('Total Sum:', totalSum);

      res.send({
        data: totalSum,
        message: 'Success'
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/unsettle', verifyToken, async (req, res) => {

  const userId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('Today:', today);

  try {
    const unsettledTransactions = await prisma.transaksis.findMany({
      where: {
        settlement: "",
        userId,
        date: {
          gte: today,
        }
      },
    });
    
    res.send({
      data: unsettledTransactions,
      message: 'berhasil'
    })

  } catch (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
  }
});
  
router.post('/settled', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('Today:', today);

  try {
    await prisma.transaksis.updateMany({
      where: {
        settlement: "",
        userId,
        date: {
          gte: today,
        }
      },
      data: {
        settlement: "true",
      },
    });

    res.status(200).json({ message: 'Transaksi berhasil di-settlement.' });
  } catch (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
})

router.get('/getDataById', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const transactions = await prisma.transaksis.findMany({
      where: {
        userId,
      },
    });

    res.send({
      data: transactions,
    })

  } catch (error) {
    console.error(`Terjadi kesalahan: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post('/', async (req,res) => {
//     try {
//       const newData = req.body;
//       const transaksi = await createData(newData);
  
//     res.send({
//       data: transaksi,
//       message: "Data berhasil disimpan!"
//     })

//     } catch (error) {
//       res.status(400).send(error.message);
//     }
// });

  module.exports = router;
