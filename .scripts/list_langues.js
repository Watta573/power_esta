(async () => {
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const res = await fetch('http://localhost:8080/api/langues');
    const json = await res.json();
    console.log('LANGUES_LIST:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(2);
  }
})();
