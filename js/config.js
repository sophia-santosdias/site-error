// Configurações do site. Edite aqui.
// Para desenvolvimento local: copie este arquivo como js/config.local.js
// e preencha url e anonKey lá. O arquivo config.local.js é ignorado pelo git.
window.SITE_CONFIG = {
  title: "ERROR 404",
  subtitle: "",

  // Comentários via Supabase (passo a passo no README.md).
  // Enquanto url e anonKey estiverem vazios, a seção de comentários não aparece no site.
  // A chave "anon/publishable" é PÚBLICA por design: a proteção vem das regras do banco (supabase/setup.sql).
  // NUNCA coloque aqui a chave "service_role" / "secret".
  comments: {
    url: "",      // ex.: https://abcdxyz.supabase.co
    anonKey: ""   // chave anon / publishable
  }
};
