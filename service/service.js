const axios = require("axios");
const moment = require("moment");
const {formatDate} = require('./util');
const sql = require("../config/mySql");
const options = {method: 'GET', headers: {Accept: 'application/json', 'X-API-KEY': '7c01ed670df3403bb8105e5587f93d7f'}};
const LimitNumber = 200;
const ItemNumber = 8;
const MiniInterval = 60;

const delay = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const  getCollectionInfoV1  = async (pageNumber, pageLimit) => {
    const collectionData = (await axios.get(`https://api.opensea.io/api/v1/collections?offset=${pageNumber}&limit=${LimitNumber}`, options)).data;
    return collectionData;
}


const getSalesDataAssets =async (contractAddress) => {
    const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&limit=${LimitNumber}&event_type=successful`, options)).data;
    // const nextParam = collectionStats['next'];

    console.log(collectionStats["asset_events"]);
    const assetData = collectionStats["asset_events"];

    const salesData = {};
    var key = "Sales";
    salesData[key] = [];
    
    assetData.forEach(item => {
        if(salesData[key].length < 8) {
            if(item['listing_time'] == null) {
                const record = {};
                record['id'] = item['asset']['id'];
                record['name'] = item['asset']['name'];
                record['image_url'] = item['asset']['image_url'];

                if(item['payment_token'] !== null)
                    record['market_image_url'] = item['payment_token']['image_url'];
                else 
                    record['market_image_url'] = '';

                record['sold_date'] = item['event_timestamp'].replace(/T/, ' ').replace(/\..+/, '');
                record['sold_price'] = item['total_price'] / (10 ** 18) + " ETH";

                if(item['asset']['name'].indexOf('#') > 0)
                    record['rarity'] = Number(item['asset']['name'].split('#')[1]);
                else 
                    record['rarity'] = 0;
                    
                salesData[key].push(record);
            }
        }
    });

    console.log(salesData[key].length);
    return assetData; 
}

const getListingDataAssets =async (contractAddress) => {
    const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&limit=${LimitNumber}&event_type=successful`, options)).data;
    // const nextParam = collectionStats['next'];

    const assetData = collectionStats["asset_events"];

    const salesData = {};
    var key = "Listing";
    salesData[key] = [];
    
    assetData.forEach(item => {
        if(salesData[key].length < 8) {
            if(item['listing_time'] != null) {
                // console.log(item);
                const record = {};
                record['id'] = item['asset']['id'];
                record['name'] = item['asset']['name'];
                record['image_url'] = item['asset']['image_url'];

                if(item['payment_token'] !== null)
                    record['market_image_url'] = item['payment_token']['image_url'];
                else 
                    record['market_image_url'] = '';

                record['listing_date'] = item['event_timestamp'].replace(/T/, ' ').replace(/\..+/, '');
                record['listing_price'] = item['total_price'] / (10 ** 18) + " ETH";

                if(item['asset']['name'].indexOf('#') > 0)
                    record['rarity'] = Number(item['asset']['name'].split('#')[1]);
                else 
                    record['rarity'] = 0;
                    
                salesData[key].push(record);
            }
        }
    });
    console.log(salesData[key]);
    return salesData; 
}


const saveSalesData = async (contractAddress, timeInterval) => {
    const nowTime = new Date();
    const prevTime = new Date(nowTime.getTime()-1000*60*timeInterval);
    const salesStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`, options)).data;
    console.log(salesStats);
    const salesHistory = {};
    var key = "SalesHistory";
    salesHistory[key] = [];
    var query = "DELETE FROM sales";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for(var timeCount = nowTime.getTime(); timeCount > prevTime.getTime(); timeCount -= 1000*60*timeInterval / MiniInterval) {
        var volume = 0;
        var itemNum = 0;
        salesStats['asset_events'].map(item => {
            if(item['listing_time'] == null) {
                const unix = new Date(item['event_timestamp']);
                if(unix.getTime() < timeCount && unix.getTime() > (timeCount - 1000*60*timeInterval / MiniInterval)) {
                    volume += item['total_price'] / (10**18);
                    itemNum ++;
                }
            }
        })
        console.log(' item num' + itemNum + ' volume' + volume);
        
        const record = {};
        record['start_date'] = formatDate(new Date(timeCount - 1000*60*timeInterval / MiniInterval));
        record['end_date'] = formatDate(new Date(timeCount));
        record['volume'] = volume;
        record['avg_volume'] = itemNum == 0 ? volume = 0 : volume / itemNum;
        record['item_num'] = itemNum;

        salesHistory[key].push(record);
        
        sql.query(`INSERT INTO sales (start_date, end_date, volume, avg_volume, item_num) VALUES ('${formatDate(new Date(timeCount - 1000*60*timeInterval / MiniInterval))}', '${formatDate(new Date(timeCount))}', ${volume}, ${ itemNum == 0 ? volume = 0 : volume / itemNum}, ${itemNum})`, function (err) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    }    
    return salesHistory;
}

const saveListingData = async (contractAddress, timeInterval) => {
    const nowTime = new Date();
    const prevTime = new Date(nowTime.getTime()-1000*60*timeInterval);
    const salesStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`, options)).data;
    console.log(salesStats);
    const listingHistory = {};
    var key = "ListingHistory";
    listingHistory[key] = [];
    var query = "DELETE FROM listing";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for(var timeCount = nowTime.getTime(); timeCount > prevTime.getTime(); timeCount -= 1000*60*timeInterval / MiniInterval) {
        var volume = 0;
        var itemNum = 0;
        salesStats['asset_events'].map(item => {
            if(item['listing_time'] != null) {
                const unix = new Date(item['event_timestamp']);
                if(unix.getTime() < timeCount && unix.getTime() > (timeCount - 1000*60*timeInterval / MiniInterval)) {
                    volume += item['total_price'] / (10**18);
                    itemNum ++;
                }
            }
        })
        
        const record = {};
        record['start_date'] = formatDate(new Date(timeCount - 1000*60*timeInterval / MiniInterval));
        record['end_date'] = formatDate(new Date(timeCount));
        record['volume'] = volume;
        record['avg_volume'] = itemNum == 0 ? volume = 0 : volume / itemNum;
        record['item_num'] = itemNum;

        listingHistory[key].push(record);
        
        sql.query(`INSERT INTO listing (start_date, end_date, volume, avg_volume, item_num) VALUES ('${formatDate(new Date(timeCount - 1000*60*timeInterval / MiniInterval))}', '${formatDate(new Date(timeCount))}', ${volume}, ${ itemNum == 0 ? volume = 0 : volume / itemNum}, ${itemNum})`, function (err) {
            if (err) throw err;
            // console.log("1 record inserted");
        });
    }    
    return salesStats;
}

const assetsForSales = async (contractAddress, timeInterval) => {
    const nowTime = new Date();
    const prevTime = new Date(nowTime.getTime()-1000*60*timeInterval);
    const salesStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`, options)).data;
    // console.log(salesStats);
    const listingHistory = {};
    var key = "ListingHistory";
    listingHistory[key] = [];
    var query = "DELETE FROM assetsForSales";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for(var timeCount = nowTime.getTime(); timeCount > prevTime.getTime(); timeCount -= 1000*60*timeInterval / (MiniInterval * 100)) {
        var volume = 0;
        var itemNum = 0;
        salesStats['asset_events'].map(item => {
            if(item['listing_time'] != null) {
                const unix = new Date(item['event_timestamp']);
                if(unix.getTime() < timeCount && unix.getTime() > (timeCount - 1000*60*timeInterval / (MiniInterval * 100))) {
                    volume += item['total_price'] / (10**18);
                    itemNum ++;
                }
            }
        })
        
        const record = {};
        record['start_date'] = timeCount - 1000*60*timeInterval / (MiniInterval * 100);
        record['end_date'] = timeCount;
        record['volume'] = volume;
        record['avg_volume'] = itemNum == 0 ? volume = 0 : volume / itemNum;
        record['item_num'] = itemNum;
        listingHistory[key].push(record);
        
        sql.query(`INSERT INTO assetsForSales (start_date, end_date, volume, avg_volume, item_num) VALUES ('${timeCount - 1000*60*timeInterval / (MiniInterval * 100)}', '${timeCount}', ${volume}, ${ itemNum == 0 ? volume = 0 : volume / itemNum}, ${itemNum})`, function (err) {
            if (err) throw err;
            // console.log("1 record inserted");
        });
    }    
    return listingHistory;
}
 
const getSellWall = async (contractAddress, priceInterval) => {
    const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&limit=${LimitNumber}&event_type=successful`, options)).data;
    const assetData = collectionStats["asset_events"];
    const tempArray = [];
    const sellWall = {};
    var keys = 'SellWall';
    sellWall[keys] = [];

    var query = "DELETE FROM sellWall";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for(var cnt =0; cnt < 1500; cnt++) {
        tempArray[cnt] = 0;
    }

    assetData.map(item => {
        if(item['listing_time'] == null) {            
            tempArray[parseInt((item['total_price'] / (10 ** 18))/priceInterval)]++;
        }
    })
    tempArray.map((item, key) => {
        const record = {};
        record['low_price'] = key * priceInterval;
        record['high_price'] = (key + 1) * priceInterval;
        record['main_value'] = item;
        sellWall[keys].push(record);
        sql.query(`INSERT INTO sellWall (low_price, high_price, main_value) VALUES (${key * priceInterval}, ${(key + 1) * priceInterval}, ${item})`, function (err) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    })
    return sellWall;
}

const getHolderInfo = async (contractAddress) => {
    let collectionData;
    let index = 0;
    let response = [];
    while (true) {
        try {
        collectionData = (
            await axios.get(
            `https://api.opensea.io/api/v1/bundles?asset_contract_address=${contractAddress}&limit=50&offset=${index}`,
            options
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

    var seenNames = {};
    array = response.filter(function(currentObject) {
        if (currentObject.address in seenNames) {
            return false;
        } else {
            seenNames[currentObject.address] = true;
            return true;
        }
    });
    array.forEach((node) => node.cnt = 0)
    array.forEach(item => {
        for(var cnt = 0; cnt < response.length; cnt++) {
            if(item['address'] == response[cnt]['address']) {
                item['cnt']++;
            }
        }
    })
    record = [
        {'count': 0, 'percentage': 0},
        {'count': 0, 'percentage': 0},
        {'count': 0, 'percentage': 0},
        {'count': 0, 'percentage': 0}
    ];
    array.map(item => {
        if (item['cnt'] == 1) {
            record[0]['count']++;
        } else if (item ['cnt'] <= 3 && item['cnt'] >= 2 ) {
            record[1]['count']++;
        } else if (item ['cnt'] <= 7 && item['cnt'] >= 4 ) {
            record[2]['count']++;
        } else if (item ['cnt'] <= 46 && item['cnt'] >= 7 ) {
            record[3]['count']++;
        }
    })    
    record.map(item => {
        item['percentage'] = (item['count'] / array.length * 100).toFixed(3) + "%";
    })
    return collectionData;    
}

const getHolderInfoByTime = async (contractAddress, from, to) => {
    const nowTime = new Date(from);
    const prevTime = new Date(to);

    const result = [];

    var query = "DELETE FROM holder";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    const response = [];
    for(var timeCnt = nowTime.getTime(); timeCnt < prevTime.getTime(); timeCnt += 86400000) {
        const holderInfo = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(new Date(timeCnt+86400000))}&occurred_after=${formatDate(new Date(timeCnt))}&event_type=successful`, options)).data
    
        holderInfo.asset_events.map(item => {
            response.push({
                address: item.asset.owner.address,
                token_id: item.asset.token_id
            })
        })

        console.log(response);
        var seenNames = {};
        array = response.filter(function(currentObject) {
            if (currentObject.address in seenNames) {
                return false;
            } else {
                seenNames[currentObject.address] = true;
                return true;
            }
        });
        array.forEach((node) => node.cnt = 0)
        array.forEach(item => {
            for(var cnt = 0; cnt < response.length; cnt++) {
                if(item['address'] == response[cnt]['address']) {
                    item['cnt']++;
                }
            }
        })
        record = [
            {'count': 0, 'percentage': 0},
            {'count': 0, 'percentage': 0},
            {'count': 0, 'percentage': 0},
            {'count': 0, 'percentage': 0}
        ];
        array.map(item => {
            if (item['cnt'] == 1) {
                record[0]['count']++;
            } else if (item ['cnt'] <= 3 && item['cnt'] >= 2 ) {
                record[1]['count']++;
            } else if (item ['cnt'] <= 7 && item['cnt'] >= 4 ) {
                record[2]['count']++;
            } else if (item ['cnt'] <= 46 && item['cnt'] >= 7 ) {
                record[3]['count']++;
            }
        })    
        record.map(item => {
            item['percentage'] = (item['count'] / array.length * 100).toFixed(3) + "%";
        })  
        sql.query(`INSERT INTO holder (ExDate, data) VALUES ('${formatDate(new Date(timeCnt))}', '${record}')`, function (err) {
            if (err) throw err;
            console.log("1 record inserted");
        });
        result.push({
            ExDate: formatDate(new Date(timeCnt)),
            data: record
        })
    }    
    return result;  
}

module.exports = { getCollectionInfoV1, getSalesDataAssets, getListingDataAssets, saveSalesData, saveListingData, assetsForSales, getSellWall,
    getHolderInfo, getHolderInfoByTime };