const mysql = require('mysql2/promise');

async function testConnection() {
  const passwordsToTry = ['root123', 'Amrit@16947', ''];

  for (const pwd of passwordsToTry) {
    try {
      console.log(`Trying password: "${pwd}" ...`);
      const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: pwd,
        database: 'jobie'
      });

      console.log(`✅ SUCCESS! We connected using password: "${pwd}"`);

      // Let's check what data is inside the Profile table
      const [rows] = await connection.execute('SELECT * FROM Profiles LIMIT 5');
      console.log(`\nHere is what is inside the Profiles table right now:`);
      console.log(rows);

      await connection.end();
      return;
    } catch (err) {
      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
         console.log(`❌ Failed: Access Denied for password "${pwd}"`);
      } else if (err.code === 'ER_BAD_DB_ERROR') {
         console.log(`⚠️  Connected with "${pwd}", but the database 'jobie' DOES NOT EXIST!`);
         return;
      } else {
         console.log(`❌ Failed with error:`, err.message);
      }
    }
  }
  
  console.log(`\n🚨 All common passwords failed. The MySQL root user is actively rejecting these passwords.`);
}

testConnection();
