const express = require("express");
const axios = require("axios");
const { response } = require("express");
const router = express.Router();
const Web3 = require("web3");
const { getContractInstance } = require("../extra/index");

const Page_token = require("../model/Page_tokens");
const Price_Volume = require("../model/Price_Volume");
const Collectionslugs = require("../model/Collectionslugs");

let pagination = [];
// To start the backend test

const token_type = "token_type=ERC721";
const page_size = "page_size=20";
const sort = "sort_by=name";
const order = "order=asc";
const apiKey = "apiKey=bd1aR8U5js1UXcbIehGqaXUh4b8fOxOGv1gO9OQuDL3Ifxh";
const options = {
  method: "GET",
  headers: {
    Accept: "application/json",
    "X-API-KEY": "7c01ed670df3403bb8105e5587f93d7f",
  },
};
const opensea_options = {
  headers: {
    Accept: "application/json",
    "X-API-KEY": "7ff0746b048a4f848e2ecadb55b7ae5c",
  },
};

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function initializeData() {
  let page_token = "";
  let page_index = 0;
  while (true) {
    if (page_token == null) break;
    let temp = "";
    temp = (
      await axios.get(
        `https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections?${token_type}&${page_size}&${sort}&${order}&${apiKey}&${page_token}`
      )
    ).data;

    let newToken = new Page_token({
      page_index: page_index,
      page_token: temp.meta.paging.next_page_token,
    });
    newToken.save();
    page_index++;
    for (let tData of temp.data) {
      try {
        let data = (
          await axios.get(
            `https://api.opensea.io/api/v1/asset_contract/${tData.contracts[0]}`,
            opensea_options
          )
        ).data;

        console.log(data);

        if (data != null && data.collection != null) {
          console.log(data.collection.slug);
          let newCollection = new Collectionslugs({
            collectionSlug: data.collection.slug,
            // collectionAddress: tData.contracts[0],
          });
          newCollection.save();
        }
      } catch {}
    }
    page_token = "page_token=" + temp.meta.paging.next_page_token;
    console.log("******", temp.meta.paging.next_page_token);
    delay(300);
  }
  return "";
}

async function storingPV() {
  let collectionSlugs = await Collectionslugs.find();
  for (let slug of collectionSlugs) {
    try {
      let tData = (
        await axios.get(
          `https://api.opensea.io/api/v1/collection/${slug.collectionSlug}/stats`,
          opensea_options
        )
      ).data.stats;

      await delay(500);

      let newPriceVolume = new Price_Volume({
        collectionName: slug.collectionSlug,
        floor_price: tData.floor_price,
        average_price: tData.average_price,
        total_volume: tData.total_volume,
        one_day_sales: tData.one_day_sales,
        one_day_average_price: tData.one_day_average_price,
        one_day_volume: tData.one_day_volume,
      });

      newPriceVolume.save();
    } catch (err) {
      console.log(err);
    }
  }
  return;
}

async function storingHolder(){
  
}

async function dailyUpdate() {
  Page_token.deleteMany();
  Collectionslugs.deleteMany();
  await initializeData();
  await storingPV();
  await storingHolder();
}

async function nftHolderInfo(collectionSlug, collectionAddress) {
  let collectionData;
  let index = 0;
  let response = [];
  while (true) {
    try {
      collectionData = (
        await axios.get(
          `https://api.opensea.io/api/v1/bundles?asset_contract_address=${collectionAddress}&limit=50&offset=${index}`,
          opensea_options
        )
      ).data;
      console.log(collectionData);
      if (collectionData.bundles.length == 0) {
        break;
      }
      for (let bundle of collectionData.bundles) {
        for (let tData of bundle.assets) {
          response.push({
            address: tData.owner.address,
            token_id: tData.token_id,
          });
        }
      }

      index += 50;
      await delay(300);
    } catch (err) {
      console.log("err", err);
      break;
    }
  }
  return response;
}

async function getTokenTotalSupply(collectionSlug) {
  let totalTokenSupply;
  let collectionData;
  try {
    collectionData = (
      await axios.get(
        `https://api.opensea.io/api/v1/collection/${collectionSlug}`,
        opensea_options
      )
    ).data;
    await delay(300);
  } catch (err) {
    console.log(err);
  }

  totalTokenSupply = collectionData.collection.stats.total_supply;

  return totalTokenSupply;
}

async function nftHoldersBalanceInfo(contractAddress, holderAddress) {
  let address;
  let res;

  address = contractAddress;

  const contractInstance = getContractInstance();

  try {
    res = await contractInstance.methods
      .getBalanceOf(address, holderAddress)
      .call();
  } catch (err) {}
  return res;
}

async function gettingSalesHistory(collectionSlug) {
  let only_opensea = "false";
  let event_type = "successful";
  let cursor = "";
  let response = [];
  while (true) {
    try {
      let tData = await axios.get(
        `https://api.opensea.io/api/v1/events?only_opensea=${only_opensea}&collection_slug=${collectionSlug}&event_type=${event_type}&${cursor}`,
        opensea_options
      ).data;
      for (let data of tData.asset_events) {
        let temp = {
          owner: data.asset.owner.address,
          seller: data.asset.seller.address,
          event_timestamp: data.asset.event_timestamp,
        };
        cursor = "cursor=" + res.cursor;
        response.push(temp);
      }
      await delay(300);
      cursor = tData.next;
      let jsonData = { data: response };
      // break;
    } catch (err) {
      console.log(err);
    }
  }
  return jsonData;
}

async function gettingListingHistory(collectionSlug) {
  let only_opensea = "false";
  console.log(collectionSlug);
  let event_type = "created";
  let cursor = "";
  let response = [];
  let tData;
  while (true) {
    try {
      tData = (
        await axios.get(
          `https://api.opensea.io/api/v1/events?only_opensea=${only_opensea}&collection_slug=${collectionSlug}&event_type=${event_type}&${cursor}`,
          opensea_options
        )
      ).data;

      for (let data of tData.asset_events) {
        let temp = {
          token_name: data.asset.name,
          starting_price: data.starting_price,
          listing_time: data.listing_time,
        };
        response.push(temp);
      }
      console.log(cursor);
      await delay(300);
      cursor = "cursor=" + tData.next;
      // break;
    } catch (err) {
      console.log(err);
      break;
    }
  }
  console.log(response);
  let jsonData = { data: response };
  return jsonData;
}

async function gettingFloor_VolumePriceHistory(collectionSlug, date) {
  return Collectionslugs.findOne({
    date: date,
    collectionSlug: collectionSlug,
  });
}

async function gettingLiveMintsData(collectionSlug, timeStamp) {
  let tAddress = Collectionslugs.findOne({
    collectionSlug: collectionSlug,
  }).collectionAddress;
  let livemintsData = [];
  try {
    let cursor = "";
    tData = (
      await axios.get(
        `https://api.opensea.io/api/v1/events?only_opensea=false&collection_slug=${collectionSlug}&account_address=0x0000000000000000000000000000000000000000&event_type=transfer&occurred_after=${timeStamp}&${cursor}`,
        options
      )
    ).data;
    await delay(300);
    cursor = "cursor=" + tData.next;
    for (data of tData.asset_events) {
      livemintsData.push({
        to_address: data.to_account,
      });
    }
  } catch (err) {
    console.log(err);
  }
  return livemintsData;
}

async function gettingMintsPerWallet(collectionSlug) {
  let mintsperwallet = [];
  let cursor = "";
  while (true) {
    try {
      tData = (
        await axios.get(
          `https://api.opensea.io/api/v1/events?only_opensea=false&collection_slug=${collectionSlug}&account_address=0x0000000000000000000000000000000000000000&event_type=transfer&${cursor}`,
          options
        )
      ).data;
      console.log(tData.next);
      cursor = "cursor=" + tData.next;
      for (data of tData.asset_events) {
        mintsperwallet.push({
          to_address: data.to_account,
        });
      }
      await delay(300);
    } catch (err) {
      console.log(err);
      break;
    }
  }
  return mintsperwallet;
}

async function nftHolderInfoOverTime(collectionSlug, contractAddress, from, to){

}


router.get("/", (req, res) => {
  console.log("Hello world");
  res.send(
    `
    <a href='/getCollectionStatus/byPage/1'>Get collection info</a><br>
    <a href='/getCollectionStatus/search/doodles-official'>Search a collection's info</a><br>
    <a href='/getCollectionStatus/collection/doodles-official'>Get a collection info</a><br>
    <a href='/getCollectionStatus/settings/tokens/doodles-official'>Get a collection token info</a><br>
    <a href='/getCollectionStatus/settings/feeds/doodles-official/2022-8-8T1:16:06'>Get feeds info of a collection</a><br>

    <a href='/getCollectionStatus/leaderboard/doodles-official/0x8a90cab2b38dba80c64b7734e58ee1db38b8992e'>Get leaderboard info</a><br>

    <a href='/getFloor_VolumePriceHistory/cryptopunks/2020-08-01'>Get a collection's floor and volume info</a><br>

    <a href='/getListingHistory/doodles-official'>Get a collection's Listing History</a><br>
    <a href='/getLiveMintsData/doodles-official/2021-10-17T13:00:47.419945'>Get a collection's Live Mints</a><br>
    <a href='/getMintsPerWallet/doodles-official'>Get a collection's Live Mints per Wallet info</a><br>

    <a href='/getCollectionStatus/holders/doodles-official/0x8a90cab2b38dba80c64b7734e58ee1db38b8992e'>Get a collection's Holders' info</a><br>
    
    `
  );
});

router.get("/test", async (req, res) => {
  while (1) {
    let data = axios
      .get(
        `https://api.opensea.io/api/v1/asset_contract/0xD2A1FA51DB5bD42Dd805835f90C45df67Da63975`,
        opensea_options
      )
      .then((res) => {
        if (res.data.collection != null) {
          console.log(res.data.collection.slug);
          let newCollection = new Collectionslugs({
            collectionSlug: res.data.collection.slug,
            // collectionAddress: tData.contracts[0],
          });
          // newCollection.save();
        }
      })
      .catch((err) => {
        console.log(err);
      });
    await delay(300);
  }

  res.send("AAA");
});

router.get(
  "/getHolderInfo/:collectionSlug/:collectionAddress",
  async (req, res) => {
    let data = await nftHolderInfo(
      req.params.collectionSlug,
      req.params.collectionAddress
    );
    res.send(data);
  }
);

router.get("/initializing", async (req, res) => {
  console.log("Database initializing is started");
  await initializeData();
  await storingPV();
  res.send("Done");
});
router.get("/storingPrice_Volume", async (req, res) => {
  console.log("Storing Price and Volume info is started");
  await storingPV();
  res.send("Done");
});

// routing for getting all NFT collections data for pagination
// req can be pagination number
// ie. 1 2 3 4 ...

router.get("/getCollectionStatus/byPage/:pagination", async (req, res) => {
  let collectionAddress = [];
  let collectionSlug = [];
  let temp_collection_data = [];
  if (req.params.pagination == 1) {
    try {
      temp_collection_data = (
        await axios.get(
          `https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections?${token_type}&${page_size}&${sort}&${order}&${apiKey}`
        )
      ).data.data;
      for (let i = 0; i < temp_collection_data.length; i++) {
        collectionAddress.push(temp_collection_data[i].contracts[0]);
      }
      console.log(collectionAddress);
    } catch (err) {
      console.log(err);
    }
  } else {
    try {
      let Token = await Page_token.findOne({
        page_index: req.params.pagination - 1,
      });
      let token = Token.page_token;
      temp_collection_data = (
        await axios.get(
          `https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections?${token_type}&${page_size}&page_token=${token}&${sort}&${order}&${apiKey}`
        )
      ).data.data;

      for (let i = 0; i < temp_collection_data.length; i++) {
        collectionAddress.push(temp_collection_data[i].contracts[0]);
      }
    } catch (err) {
      console.log("There is an error1");
    }
  }

  for (address of collectionAddress) {
    try {
      let tSlug = await axios.get(
        `https://api.opensea.io/api/v1/asset_contract/${address}`,
        opensea_options
      );
      // res.json(tSlug)
      collectionSlug.push(tSlug.data.collection.slug);
      await delay(300);
      // break;
    } catch (err) {
      console.log("There is an error2", err);
    }
  }

  console.log(collectionSlug);

  let collectionInfo = [];
  for (const slug of collectionSlug) {
    try {
      const collectionData = (
        await axios.get(
          `https://api.opensea.io/api/v1/collection/${slug}`,
          opensea_options
        )
      ).data;
      const info = {
        name: collectionData.collection.primary_asset_contracts[0].name,
        status: collectionData.collection.stats,
      };
      collectionInfo.push(info);
      await delay(300);
    } catch (err) {
      console.log("There is an error3");
    }
  }
  res.send(collectionInfo);
});

// Searching api by NFT collection's slug
// Name must matched to the real NFT collection's slug

router.get("/getCollectionStatus/search/:collectionSlug", async (req, res) => {
  const collectionSlug = req.params.collectionSlug;
  let collectionData;
  let collectionInfo = [];
  try {
    collectionData = (
      await axios.get(
        `https://api.opensea.io/api/v1/collection/${collectionSlug}`,
        opensea_options
      )
    ).data;
    await delay(300);
  } catch (err) {
    console.log(err);
  }
  const info = {
    name: collectionSlug,
    address: collectionData.collection.primary_asset_contracts[0].address,
    status: collectionData.collection.stats,
  };
  collectionInfo.push(info);

  res.send(collectionInfo);
});

// Searching api by NFT collection's slug
// Name must matched to the real NFT collection's slug

router.get(
  "/getCollectionStatus/collection/:collectionSlug",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    let collectionData;
    let collectionInfo = [];
    try {
      collectionData = (
        await axios.get(
          `https://api.opensea.io/api/v1/collection/${collectionSlug}`,
          options
        )
      ).data;
      await delay(300);
    } catch (err) {
      console.log(err);
    }
    const info = {
      name: collectionSlug,
      address: collectionData.collection.primary_asset_contracts[0].address,
      status: collectionData.collection.stats,
    };
    collectionInfo.push(info);

    res.send(collectionInfo);
  }
);

router.get(
  "/getCollectionStatus/settings/tokens/:collectionSlug",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    let assetsData;
    try {
      assetsData = (
        await axios.get(
          `https://api.opensea.io/api/v1/assets?collection_slug=${collectionSlug}&order_direction=desc&limit=20&include_orders=false`,
          options
        )
      ).data;
      await delay(300);
    } catch (err) {
      console.log(err);
    }

    res.send(assetsData);
  }
);

router.get(
  "/getCollectionStatus/settings/feeds/:collectionSlug/:timeStamp",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    const timeStamp = req.params.timeStamp;
    let response = {};

    let assetsData;
    try {
      assetsData = (
        await axios.get(
          `https://api.opensea.io/api/v1/events?collection_slug=${collectionSlug}&occurred_after=${timeStamp}`,
          options
        )
      ).data;
      await delay(300);
    } catch (err) {
      console.log(err);
    }

    response = {
      assetsData: assetsData,
    };

    res.send(response);
  }
);

router.get(
  "/getCollectionStatus/leaderboard/:collectionSlug/:contractAddress",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    const contractAddress = req.params.contractAddress;
    let account_arrray = [];
    let holderData = await nftHolderInfo(collectionSlug, contractAddress);
    let addressData = [];

    for (let data of holderData) {
      addressData.push(data.address);
    }

    let array = [];
    for (let holderAddress of addressData) {
      try {
        let tData = (
          await axios.get(
            `https://api.opensea.io/api/v1/events?only_opensea=false&asset_contract_address=${contractAddress}&collection_slug=${collectionSlug}&account_address=${holderAddress}`,
            options
          )
        ).data;
        await delay(300);
        console.log(tData);
        for (let Data of tData.asset_events) {
          array.push({
            holderAddress: holderAddress,
            assetOwner: Data.asset.owner,
            tx: Data.transaction,
            from_account: Data.from_account,
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
    let response = {};
    response = {
      data: array,
    };

    res.send(response);
  }
);

router.get(
  "/getFloor_VolumePriceHistory/:collectionSlug/:date",
  async (req, res) => {
    let data = await gettingFloor_VolumePriceHistory(
      req.params.collectionSlug,
      req.params.date
    );
    res.send(data);
  }
);

router.get("/getListingHistory/:collectionSlug", async (req, res) => {
  // res.send(gettingListingHistory(req.params.collectionSlug));
  let history = await gettingListingHistory(req.params.collectionSlug);
  res.send(history);
});

router.get(
  "/getSalesHistory/:collectionSlug",

  async (req, res) => {
    // res.send(gettingSalesHistory(req.params.collectionSlug));
    let history = await gettingSalesHistory(req.params.collectionSlug);
    res.send(history);
  }
);

router.get("/getLiveMintsData/:collectionSlug/:timeStamp", async (req, res) => {
  let data = await gettingLiveMintsData(
    req.params.collectionSlug,
    req.params.timeStamp
  );
  res.send(data);
});

router.get("/getMintsPerWallet/:collectionSlug", async (req, res) => {
  let data = await gettingMintsPerWallet(req.params.collectionSlug);
  res.send(data);
});

router.get(
  "/getCollectionStatus/holders/:collectionSlug/:contractAddress",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    const contractAddress = req.params.contractAddress;
    let data = await nftHolderInfo(collectionSlug, contractAddress);

    res.send(data);
  }
);

router.get("/getCollectionStatus/holders/:collectionSlug/:contractAddress/from/to",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    const contractAddress = req.params.collectionAddress;
    const from = req.params.from;
    const to = req.params.to;
    
    let data  = await nftHolderInfoOverTime(collectionSlug, contractAddress, from, to);

    res.send(data);
  }
);

module.exports = { router, dailyUpdate };
