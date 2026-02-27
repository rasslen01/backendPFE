const os = require('os');

module.exports.getData = async () => {
    try {
        const osInformation = {
            platform: os.platform(),
            arch: os.arch(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            hostname: os.hostname(),
        };
        console.log(osInformation);
        return osInformation;
    } catch (error) {
        throw new Error('Error getting OS information: ' + error.message);
    }
}