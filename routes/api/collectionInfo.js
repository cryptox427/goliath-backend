const express = require('express');
const router = express.Router();

const {getCollectionInfoV1, getSalesDataAssets, getListingDataAssets, saveSalesData, saveListingData,
  assetsForSales, getSellWall, getHolderInfo, getHolderInfoByTime
} = require('../../service/service');


// @route    GET api/auth
// @desc     Get user by token
// @access   Private

router.get('/getCollection/:pageNumber/:limitNumber', async (req, res) => {
  try {
    const pageNum = req.params.pageNumber;
    const pageLim = req.params.limitNumber;
    const collectionData = await getCollectionInfoV1(pageNum, pageLim);
    res.json(collectionData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getSalesDataAssets/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;

    const assetData = await getSalesDataAssets(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getListingDataAssets/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;

    const assetData = await getListingDataAssets(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/saveSalesDataChart/:contractAddress/:timeInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const timeInterval = req.params.timeInterval;

    const assetData = await saveSalesData(contractAddress, timeInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.get('/saveListingDataChart/:contractAddress/:timeInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const timeInterval = req.params.timeInterval;

    const assetData = await saveListingData(contractAddress, timeInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.get('/assetsForSalesChart/:contractAddress/:timeInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const timeInterval = req.params.timeInterval;

    const assetData = await assetsForSales(contractAddress, timeInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.get('/getSellWall/:contractAddress/:priceInterval', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const priceInterval = req.params.priceInterval;
    const assetData = await getSellWall(contractAddress, priceInterval);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
router.get('/getHolderInfo/:contractAddress', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const assetData = await getHolderInfo(contractAddress);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/getHolderInfoByTime/:contractAddress/:from/:to', async (req, res) => {
  try {
    const contractAddress = req.params.contractAddress;
    const from = req.params.from;
    const to = req.params.to;
    const assetData = await getHolderInfoByTime(contractAddress, from, to);
    res.json(assetData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
