const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Mint Nft Unit Test", () => {
      let deployer, accounts;
      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["mintIpfsNft"]);
        nftContract = await ethers.getContract("NftContract");
      });

      describe("MintNft", () => {
        const tokenId = 1;
        const name = "myNft";
        const description = "This is my Nft";
        const tokenURI = "https://example.com/nft";
        it("mints nft and store metadata", async () => {
          await nftContract.mintNft(name, description, tokenURI);

          assert.equal(await nftContract.ownerOf(tokenId), deployer.address);
          assert.equal(await nftContract.tokenURI(tokenId), tokenURI);

          const metadata = nftContract.getNftMetadata(tokenURI);

          expect((await metadata) == [name, description]);
        });
        describe("ListNft", () => {
          const tokenId = 1;
          const price = 1;
          const name = "myNft";
          const description = "This is my Nft";
          const tokenURI = "https://example.com/nft";
          it("reverts when nft doesn't exist", async () => {
            // await nftContract.mintNft(name, description, tokenURI);
            expect(nftContract.listNft(tokenId, price)).to.be.revertedWith(
              "NFT does not exist."
            );
          });
          it("reverts when not pass enough price", async () => {
            await nftContract.mintNft(name, description, tokenURI);

            expect(await nftContract.listNft(tokenId, 0)).to.be.revertedWith(
              "Price cannot be negative."
            );
          });
          it("emits an events when nft got listed", async () => {
            await nftContract.mintNft(name, description, tokenURI);
            expect(await nftContract.listNft(tokenId, price)).to.emit(
              "ListingCreated"
            );
          });
        });
        describe("CancelNft", () => {
          const tokenId = 1;
          const price = 1;
          const name = "myNft";
          const description = "This is my Nft";
          const tokenURI = "https://example.com/nft";
          it("reverts when listing is not active", async () => {
            expect(nftContract.cancelListing(3)).to.be.revertedWith(
              "Listing is already inactive"
            );
          });
          it("emits event when listing got canceled", async () => {
            await nftContract.mintNft(name, description, tokenURI);
            await nftContract.listNft(tokenId, price);
            expect(await nftContract.cancelListing(tokenId)).to.emit(
              "ListingCancelled"
            );
          });
        });
        describe("UpdateListing", () => {
          const tokenId = 1;
          const price = 1;
          const newPrice = 2;
          const name = "myNft";
          const description = "This is my Nft";
          const tokenURI = "https://example.com/nft";
          it("emits event after updating price", async () => {
            await nftContract.mintNft(name, description, tokenURI);
            await nftContract.listNft(tokenId, price);
            expect(await nftContract.updateListing(tokenId, newPrice)).to.emit(
              "PriceUpdated"
            );
          });
        });

        describe("buyNft", () => {
          const tokenId = 1;
          const price = 1;
          const name = "myNft";
          const description = "This is my Nft";
          const tokenURI = "https://example.com/nft";
          it("emits event after buying nft", async () => {
            await nftContract.mintNft(name, description, tokenURI);
            await nftContract.listNft(tokenId, price);
            expect(await nftContract.buyNFT(tokenId, { value: price })).to.emit(
              "NFTSold"
            );
          });
          it("transfer nft to the buyer", async () => {
            await nftContract.mintNft(name, description, tokenURI);
            await nftContract.listNft(tokenId, price);
            const [buyer] = await ethers.getSigners();
            const buyerAddress = await buyer.getAddress();
            const buyTx = await nftContract.connect(buyer).buyNFT(tokenId, {
              value: price,
            });
            await buyTx.wait();

            // Check that the NFT is transferred to the buyer
            const owner = await nftContract.ownerOf(tokenId);
            expect(owner).to.equal(buyerAddress);
          });
        });
        describe("Withdraw", () => {
          const tokenId = 1;
          const price = 1;
          const name = "myNft";
          const description = "This is my Nft";
          const tokenURI = "https://example.com/nft";
          it("withdrw balance from contract", async () => {
            await nftContract.mintNft(name, description, tokenURI);
            await nftContract.listNft(tokenId, price);
            await nftContract.buyNFT(tokenId, { value: price });

            // Owner's account
            const [owner] = await ethers.getSigners();
            // Check the initial balance of the contract
            const startingDeployerBalance =
              await nftContract.provider.getBalance(deployer.address);
            const startingContractBalance =
              await nftContract.provider.getBalance(nftContract.address);
            console.log("initialContractBalance", startingContractBalance);
            // Withdraw the contract balance
            const withdrawTx = await nftContract.connect(owner).withdraw();
            const txReceipt = await withdrawTx.wait();
            const gasCost = txReceipt.gasUsed.mul(txReceipt.effectiveGasPrice);
            console.log("GasCost", gasCost);

            const endingDeployerBalance = await nftContract.provider.getBalance(
              deployer.address
            );
            // Check that the contract balance is zero
            const endingContractBalance = await ethers.provider.getBalance(
              nftContract.address
            );
            const expectedEndingDeployerBalance = startingDeployerBalance
              .add(startingContractBalance)
              .sub(gasCost);

            assert.equal(
              endingDeployerBalance.toString(),
              expectedEndingDeployerBalance.toString()
            );
            assert.equal(endingContractBalance, 0);
            
          });
        });
      });
    });
