module.exports = {
  apps: [{
    name: "wdi-panel",
    script: "build/index.js",
    interpreter: "/opt/node20/bin/node",
    env: {
      PORT: "8443",
      HOST: "127.0.0.1",
      MONGO_URI: "mongodb://wdipanel:d3352bc54ba20a3dc4b75e2ed8073297a4ec0f9a@127.0.0.1:27017/wdi?authSource=wdi"
    }
  }]
}
