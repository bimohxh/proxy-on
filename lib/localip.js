var os = require('os')
var ifaces = os.networkInterfaces()
var iptable = []

for (var dev in ifaces) {
  ifaces[dev].forEach(function (details, alias) {
    if (details.family === 'IPv4') {
      iptable.push(details.address)
    }
  })
}

module.exports = iptable[0]
