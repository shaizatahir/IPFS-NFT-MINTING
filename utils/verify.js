const { run } = require("hardhat");

async function verify(contractAddress, args) {
  console.log("Verifying Contract...");

  try {
    console.log("try");
    console.log(contractAddress);
    console.log(args);
    await run("verify:verify", {
      
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.log("An error occured");
      console.log(e);
    }
  }
}

module.exports = { verify };