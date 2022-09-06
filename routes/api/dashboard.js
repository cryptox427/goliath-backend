const express = require("express");
const axios = require("axios");
// const { response } = require("express");
const router = express.Router();
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "qufqjrtjrj"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

router.get('/', (req, res) => {
    console.log('Hello world');
    res.send(
        `
        <a href='/getTotalVolume'>Get total volume</a>
        <a href='/getTotalSales'>Get total sales</a>
        <a href='/getTotalSupply'>Get total supply</a>
        <a href='/getAverage'>Get average price</a>
        <a href='/getMarketCap'>Get market cap</a>
        <a href='/getFloorPrice'>Get floor price</a>
        `
    );
})

async function getCollectionInfo(pageNumber, pageLimit) {
    const options = {method: 'GET', headers: {Accept: 'application/json', 'X-API-KEY': '7c01ed670df3403bb8105e5587f93d7f'}};

    const collectionData = (await axios.get(`https://api.opensea.io/api/v1/collections?offset=${pageNumber}&limit=${pageLimit}`, options)).data;
    return collectionData;
}


router.get('/test', async(req, res) => {
    res.send(await getCollectionInfo(30, 50))
})

router.get('/getTotalVolume/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let totalVolumes = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        totalVolumes.push(info.stats.total_volume);
    }
    res.send(totalVolumes);
})

router.get('/getTotalSales/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let totalSales = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        totalSales.push(info.stats.total_sales);
    }
    res.send(totalSales);
})

router.get('/getTotalSupply/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let totalSupply = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        totalSupply.push(info.stats.total_supply);
    }
    res.send(totalSupply);
})

router.get('/getAverage/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let average = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        average.push(info.stats.average_price);
    }
    res.send(average);
})

router.get('/getMarketCap/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let marketCap = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        marketCap.push(info.stats.market_cap);
    }
    res.send(marketCap);
})

router.get('/getFloorPrice/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let floorPrice = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        floorPrice.push(info.stats.floor_price);
    }
    res.send(floorPrice);
})

router.get('/getRarity/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let floorPrice = [];
    for(const info of (await getCollectionInfo(pageNum, pageLim)).collections) {
        rarity.push(info.traits);
    }
    res.send(floorPrice);
})

// For CollectionInfo page
async function getCollectionStats() {
    const options = {method: 'GET', headers: {Accept: 'application/json'}};
    const collectionStats = (await axios.get(`https://testnets-api.opensea.io/api/v1/collection/opensea-creature/stats`, options)).data;
    return collectionStats;
}

router.get('/getOsFloor/:pageNum/:pageLim', async(req, res) => {
    const pageNum = req.params.pageNum;
    const pageLim = req.params.pageLim;
    let floorPrice = [];
    for(const info of (await getCollectionStats(pageNum, pageLim)).collections) {
        floorPrice.push(info.stats.floor_price);
    }
    res.send(floorPrice);
})