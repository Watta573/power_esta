(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const id = 'autotest' + Math.floor(Math.random() * 100000);
    const email = 'autotest' + Date.now() + '@example.com';
    const body = {
      nom: 'Auto',
      prenom: 'Tester',
      identifiant: id,
      email: email,
      motDePasse: 'Password123!',
      telephone: '',
      role: 'PUBLIC'
    };

    const registerRes = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const registerJson = await registerRes.json();
    console.log('REGISTER_RESPONSE:', JSON.stringify(registerJson));
    if (!registerJson || !registerJson.token) {
      console.error('No token returned from register');
      process.exit(1);
    }
    const token = registerJson.token;
    console.log('TOKEN:', token);

    const livresRes = await fetch('http://localhost:8080/api/livres', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const livresJson = await livresRes.json();
    console.log('LIVRES_SAMPLE:', JSON.stringify(livresJson, null, 2).slice(0, 5000));
    // Print any "langue" occurrences from the JSON
    const asText = JSON.stringify(livresJson);
    const matches = asText.match(/"langue"\s*:\s*"(.*?)"/g) || [];
    console.log('LANGUE_ENTRIES:');
    matches.forEach(m => console.log(m));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(2);
  }
})();
