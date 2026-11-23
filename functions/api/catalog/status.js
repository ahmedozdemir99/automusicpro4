export async function onRequestGet({env}) {
  // SQLite/D1 is not connected until a database binding and DB endpoints are deployed.
  return Response.json({
    databaseConnected: false,
    quranApiConnected: true,
    internetArchiveConnected: true,
    jamendoConfigured: Boolean(env.JAMENDO_CLIENT_ID),
    localArchiveReady: true,
    openCatalogAvailable: true,
  }, {headers: {"Cache-Control":"no-store"}});
}
