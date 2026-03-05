const dns = require('dns');

console.log('Testing DNS resolution for MongoDB Atlas...');

dns.resolveSrv('_mongodb._tcp.cluster0.r5gxqyg.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('DNS SRV Resolution Failed:');
        console.error(err);
        console.log('\nThis confirms your network or ISP is blocking SRV records, which are required for the mongodb+srv:// connection string.');
    } else {
        console.log('DNS SRV Resolution Succeeded!');
        console.log(addresses);
    }
});
