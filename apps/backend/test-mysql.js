const mysql = require('mysql2/promise');

async function testConnection() {
  const configs = [
    { user: 'root', password: '' },
    { user: 'root', password: 'root' },
    { user: 'root', password: 'password' },
    { user: 'root', password: '123456' },
  ];

  for (const config of configs) {
    try {
      const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: config.user,
        password: config.password,
      });
      
      console.log(`✅ Connected with user: ${config.user}, password: ${config.password || '(empty)'}`);
      await connection.end();
      return config;
    } catch (error) {
      console.log(`❌ Failed with user: ${config.user}, password: ${config.password || '(empty)'}`);
    }
  }
  
  console.log('❌ None of the common passwords worked');
  return null;
}

testConnection();