// Configurações do site. Edite aqui.
// Para desenvolvimento local: copie este arquivo como js/config.local.js
// e preencha url e anonKey lá. O arquivo config.local.js é ignorado pelo git.
window.SITE_CONFIG = {
  title: "ERROR 404",
  subtitle: "~PAGE~ PHOTO NOT FOUND",
  sinopse: [
    "\"Lo, eu amo sua voz, amo seu jeito, amo o que a gente tem, mas eu cansei de namorar uma tela estática\".",
    "Depois de dez meses, Eduarda conhece quase tudo sobre a mulher por quem está apaixonada.",
    "Tudo, exceto a verdade."
  ],

  // Nome e avatar da autora (aparecem nas notas de autoria nos capítulos)
  author: {
    name: "Sophia",      // seu nome / apelido
    avatar: ""           // caminho para uma foto (ex: "img/autora.jpg") — deixe "" para usar inicial
  },

  // Comentários via Supabase (passo a passo no README.md).
  // Enquanto url e anonKey estiverem vazios, a seção de comentários não aparece no site.
  // A chave "anon/publishable" é PÚBLICA por design: a proteção vem das regras do banco (supabase/setup.sql).
  // NUNCA coloque aqui a chave "service_role" / "secret".
  comments: {
    url: "",      // ex.: https://abcdxyz.supabase.co
    anonKey: ""   // chave anon / publishable
  }
};
