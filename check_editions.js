const https = require('https');

const languages = ['en', 'ar', 'hi', 'ur', 'bn', 'ta', 'te', 'ml', 'kn', 'gu'];

https.get('https://api.alquran.cloud/v1/edition', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body).data;
    const map = {};
    languages.forEach(lang => {
      const editions = data.filter(e => e.language === lang && e.format === 'text');
      map[lang] = editions.map(e => e.identifier);
    });
    console.log(JSON.stringify(map, null, 2));
  });
});
