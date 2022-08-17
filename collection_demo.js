const express = require("express");
const axios = require("axios");
const { response } = require("express");
const router = express.Router();
const Web3 = require("web3");
import { getContractInstance } from "../extra/index";

const Page_token = require("../model/Page_tokens");

let pagination = [];
// To start the backend test

const token_type = "token_type=ERC721";
const page_size = "page_size=20";
const sort = "sort_by=name";
const order = "order=desc";
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
  if (pagination.length <= 1) {
    let erc = [];

    while (true) {
      if (!pagination.length) {
        try {
          const temp_page_token = (
            await axios.get(
              `https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections?${token_type}&${page_size}&${sort}&${order}&${apiKey}`
            )
          ).data.meta.paging.next_page_token;
          let newToken = Page_token({
            page_index: 1,
            page_token: temp_page_token,
          });
          newToken.save();
          pagination.push(temp_page_token);
          console.log(temp_page_token);
        } catch (err) {
          console.log(err);
          break;
        }
      } else {
        let page_token = pagination[pagination.length - 1];
        try {
          const temp_page_token = (
            await axios.get(
              `https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections?${token_type}&${page_size}&page_token=${page_token}&${sort}&${order}&${apiKey}`
            )
          ).data.meta.paging.next_page_token;
          let newToken = Page_token({
            page_index: pagination.length,
            page_token: temp_page_token,
          });
          newToken.save();
          pagination.push(temp_page_token);
          console.log(temp_page_token);
        } catch (err) {
          console.log(err);
          break;
        }
      }
    }
  }

  return;
}

async function nftHolderInfo(collectionSlug){

  let totalTokenSupply;
  try {
    const collectionData = (
      await axios.get(
        `https://api.opensea.io/api/v1/collection/${collectionSlug}`,
        options
      )
    ).data;
  } catch (err) {
    console.log(err);
  }

  totalTokenSupply = collectionData.stats.total_supply;
  let contractAddress = collectionData.primary_asset_contracts.address;

  for(let tokenIndex = 0; tokenIndex < totalTokenSupply; tokenIndex++){
    try{
      const contractInstance = getContractInstance();
      const res = await contractInstance.method.getOwnerOf(contractAddress, tokenIndex)
    }catch(err){
      console.log(err);
    }
  }
  
}
router.get("/", (req, res) => {
  console.log("Hello world");
  res.send(
    `
    <a href='/getCollectionStatus/'>Get collection info</a>
    
    `
  );
});

// routing for getting all NFT collections data for pagination
// req can be pagination number
// ie. 1 2 3 4 ...

router.get("/getCollectionStatus/:pagination", async (req, res) => {
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
});

// Route for settings/tokens
// Request with collection slug
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

// Route for settings/feeds
// Request with collection slug
//                                          Note that request has body of timestamp
// output events
router.get(
  "/getCollectionStatus/settings/feeds/:collectionSlug",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    const timeStamp = req.body.timeStamp;
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

// Route for settings/mints
// Request with collection slug
// Note that this requires the timestamp ( input data of timestamp should be some mins ago )
// output collection description,mints info and assets
router.get(
  "/getCollectionStatus/settings/mints/:collectionSlug/:timeStamp",
  async (req, res) => {
    const collectionSlug = req.params.collectionSlug;
    const timeStamp = req.params.timeStamp;
    let response = {};
    let livemintsData = [];
    let collectionsAddress;
    let tAddress, total_supply, created_date, minter_address, tData, buff;
    let ownerAddress = [];
    try {
      let tData = (
        await axios.get(
          `https://api.opensea.io/api/v1/collection/${collectionSlug}`,
          options
        )
      ).data;
      await delay(300);
      tAddress = tData.collection.primary_asset_contracts[0].address;
      total_supply = tData.collection.stats.total_supply;
      created_date = tData.collection.created_date;
    } catch (err) {
      console.log(err);
    }
    // Getting LiveMints Data

    try {
      tData = (
        await axios.get(
          `https://api.opensea.io/api/v1/events?only_opensea=false&asset_contract_address=${tAddress}&collection_slug=${$collectionslug}&occurred_after=${timeStamp}`,
          options
        )
      ).data;
      await delay(300);
      //  buff = {
      //   name: tData.name,
      //   wallet: tData.last_sale.to_account.address,
      //   time: tData.last_sale.event_timestamp,
      // }
      // livemintsData.push(buff);
      for (let index of tData.asset_events.length) {
        if (tData.asset_events[index].asset) {
          buff = {
            name: tData.asset_events[index].asset.name,
            wallet: tData.asset_events[index].asset.owner.address,
            time: tData.asset_events[index].event_timestamp,
          };
          livemintsData.push(buff);
        }
      }
    } catch (err) {
      console.log(err);
    }

    // Getting Mints Per Wallet data
    for (let index of total_supply) {
      try {
        tData = (
          await axios.get(
            `https://api.opensea.io/api/v1/asset/${tAddress}/${index}/owners?limit=1&order_by=created_date&order_direction=desc`,
            options
          )
        ).data.owners[0].address;
        await delay(300);

        ownerAddress.push(tData);
      } catch (err) {
        console.log(err);
      }
    }

    let temp = new Set(ownerAddress);
    for (let owner of temp.values()) {
    // Getting owner info

    }

    response = {
      assetsData: assetsData,
    };

    res.send(response);
  }
);

module.exports = router;
