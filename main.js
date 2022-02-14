const Sandbox = require("./modules/sandbox");
// Create an array with elements from 20180 to 20399
const portRange = Array.from({ length: 219 }, (_, k) => k + 20180);
const serverNetwork = {
  servers: [],
};

// Create a net.Server() for each port in the portRange
serverNetwork.servers = portRange.map((port) => new Sandbox(port));
console.log("Done")
