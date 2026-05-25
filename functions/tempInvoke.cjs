const path = require('path');
process.env.USE_MOCK_AZURE = 'true';
const base = __dirname; // functions folder
const vision = require(path.join(base, 'dist', 'vision.js'));
const translate = require(path.join(base, 'dist', 'translate.js'));
const processFn = require(path.join(base, 'dist', 'process.js'));

const run = async () => {
    const fs = require('fs');
    const payload = JSON.parse(fs.readFileSync(path.join(__dirname, 'payload.json'), 'utf8'));

    console.log('VISION TEST');
    console.log(await vision.handler({ httpMethod: 'POST', body: JSON.stringify(payload) }, {}));

    console.log('TRANSLATE TEST');
    console.log(await translate.handler({ httpMethod: 'POST', body: JSON.stringify({ text: 'こんにちは、これは漫画です' }) }, {}));

    console.log('PROCESS TEST');
    console.log(await processFn.handler({ httpMethod: 'POST', body: JSON.stringify(payload) }, {}));
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
