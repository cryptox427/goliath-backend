async function initializeData() {
  let page_token = "";
  while (true) {
    const temp = "";
    try {
      temp = (
        await axios.get(
          `https://ubiquity.api.blockdaemon.com/v1/nft/ethereum/mainnet/collections?${token_type}&${page_size}&${sort}&${order}&${apiKey}&${page_token}`
        )
      ).data;
    } catch (err) {
      console.log("error 1:");
      break;
    }

    let newToken = new Page_token({
      page_index: 0,
      page_token: temp.meta.paging.next_page_token,
    });
    newToken.save();
    for (let tData of temp.data) {
      let slug = "";
      await delay(300);
      try {
        slug = (
          await axios.get(
            `https://api.opensea.io/api/v1/asset_contract/${tData.contracts[0]}`
          )
        ).data.collection.slug;
      } catch (err) {
        console.log("error2");
        continue;
      }
      let newCollection = new Collectionslugs({
        collectionSlug: slug,
        collectionAddress: tData.contracts[0],
      });
      newCollection.save();
    }
    page_token = "page_token=" + temp.meta.paging.next_page_token;
    console.log(temp.meta.paging.next_page_token);
  }
}
