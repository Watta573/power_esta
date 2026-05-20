(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const id = 'admintest' + Math.floor(Math.random() * 100000);
    const email = 'admintest' + Date.now() + '@example.com';
    const registerBody = {
      nom: 'Admin',
      prenom: 'Tester',
      identifiant: id,
      email: email,
      motDePasse: 'Password123!',
      telephone: '',
      role: 'ADMIN'
    };

    const regRes = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerBody)
    });
    const regJson = await regRes.json();
    console.log('REGISTER_ADMIN:', JSON.stringify(regJson));
    if (!regJson.token) { console.error('No token from register'); process.exit(1); }
    const token = regJson.token;

    const hdr = { Authorization: 'Bearer ' + token };

    // Get langues
    let languesRes = await fetch('http://localhost:8080/api/langues', { headers: hdr });
    if (languesRes.status === 401) {
      console.error('Failed to fetch langues: 401');
      process.exit(2);
    }
    let langues = await languesRes.json();
    console.log('LANGUES_BEFORE:', JSON.stringify(langues, null, 2));

    if (!langues || langues.length === 0) {
      // create a langue
      const createLangRes = await fetch('http://localhost:8080/api/langues', { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'Français' }) });
      const created = await createLangRes.json();
      console.log('CREATED_LANG:', created);
      langues = [created];
    }

    const langId = langues[0].id;

    // choose a book to update — fetch first page
    const livresRes = await fetch('http://localhost:8080/api/livres?page=0&size=10', { headers: hdr });
    const livresJson = await livresRes.json();
    console.log('LIVRES_PAGE_SAMPLE (first item):', JSON.stringify(livresJson.content && livresJson.content[0] ? livresJson.content[0] : null, null, 2).slice(0, 2000));
    if (!livresJson.content || livresJson.content.length === 0) { console.error('No livres found'); process.exit(3); }
    const livre = livresJson.content[0];
    const livreId = livre.id;

    // Prepare form data with existing values, set langueIds
    const form = new FormData();
    form.append('titre', livre.titre || 'Titre');
    form.append('isbn', livre.isbn || 'ISBN-'+Date.now());
    form.append('auteur', livre.auteur || 'Auteur');
    form.append('editeur', livre.editeur || '');
    form.append('edition', livre.edition || '');
    if (livre.anneePublication) form.append('anneePublication', String(livre.anneePublication));
    if (livre.categorie && livre.categorie.id) form.append('categorieId', String(livre.categorie.id));
    else form.append('categorieId', '1');
    form.append('description', livre.description || '');
    if (livre.nombrePages) form.append('nombrePages', String(livre.nombrePages));
    if (livre.nombreExemplaires) form.append('nombreExemplaires', String(livre.nombreExemplaires));
    // Append langueIds (can be multiple)
    form.append('langueIds', String(langId));

    const updateRes = await fetch('http://localhost:8080/api/admin/livres/' + livreId, { method: 'PUT', headers: hdr, body: form });
    const updateJson = await updateRes.json();
    console.log('UPDATE_RESPONSE:', JSON.stringify(updateJson, null, 2));

    // Verify by fetching the book
    const verifyRes = await fetch('http://localhost:8080/api/livres/' + livreId, { headers: hdr });
    const verify = await verifyRes.json();
    console.log('VERIFY_LIVRE:', JSON.stringify(verify, null, 2));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(4);
  }
})();
