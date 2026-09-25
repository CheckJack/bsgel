export type CookiePolicyTable = {
  headers: string[];
  rows: string[][];
};

export type CookiePolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  afterBullets?: string[];
  table?: CookiePolicyTable;
  afterTable?: string[];
  contactBlock?: { label: string; value: string; href?: string }[];
};

export type CookiePolicyContent = {
  effectiveDateLabel: string;
  lastUpdatedLabel: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: CookiePolicySection[];
};

export const cookiePolicyContent: Record<"en" | "pt", CookiePolicyContent> = {
  en: {
    effectiveDateLabel: "Effective date",
    lastUpdatedLabel: "Last updated",
    effectiveDate: "24 September 2026",
    lastUpdated: "24 September 2026",
    sections: [
      {
        title: "1. What cookies are",
        paragraphs: [
          "Cookies are small text files that are stored on your computer, mobile device, or other device when you visit a website. Similar technologies—including local storage, pixels, tags, and software development kits—may also be used to store or access information from your device. For simplicity, we refer to all of these as “cookies”.",
          "We use a custom cookie-consent banner and preference system on biosculpture.pt.",
        ],
      },
      {
        title: "2. How we use cookies",
        paragraphs: ["We use cookies and similar technologies to:"],
        bullets: [
          "Operate secure account login and authentication functions",
          "Maintain session security and prevent fraudulent or unauthorised use",
          "Remember your cookie preferences",
          "Store language settings where you consent to preference cookies",
          "Manage referral attribution where you consent to optional cookies",
          "Understand website usage and performance through analytics",
          "Measure advertising campaigns and conversions",
          "Support marketing and advertising through platforms such as Google, Facebook, Instagram, and other providers where enabled",
        ],
        afterBullets: [
          "Under Portuguese electronic-communications rules, storing or accessing non-essential information on a user’s device generally requires prior consent. Cookies strictly necessary to provide a service expressly requested by the user can be used without consent.",
        ],
      },
      {
        title: "3. Cookie choices",
        paragraphs: ["When you first visit the Website, you may choose to:"],
        bullets: [
          "Accept all cookies",
          "Reject all non-essential cookies",
          "Manage your preferences by category",
        ],
        afterBullets: [
          "We will not activate optional preference, analytics, marketing, advertising, referral, or similar cookies until you provide valid consent.",
          "You can change or withdraw your preferences at any time through Cookie Settings in the Website footer.",
          "Refusing optional cookies will not prevent you from using the essential functions of the Website, although some optional functionality may be unavailable or less personalised.",
        ],
      },
      {
        title: "4. Cookie categories",
        table: {
          headers: ["Category", "Purpose", "Consent required?"],
          rows: [
            [
              "Essential",
              "Enables account sign-in, session management, CSRF protection, security, cookie-consent storage, and other functions required to operate requested Website services",
              "No",
            ],
            [
              "Preferences",
              "Remembers optional settings, including language preferences where enabled",
              "Yes",
            ],
            [
              "Analytics",
              "Helps us understand Website traffic, visitor behaviour, performance, and improvements using tools such as Google Analytics",
              "Yes",
            ],
            [
              "Marketing",
              "Supports advertising, campaign measurement, conversion tracking, referral attribution, remarketing, and advertising platforms such as Meta and Google Ads",
              "Yes",
            ],
          ],
        },
      },
      {
        title: "5. First-party cookies",
        paragraphs: ["The following first-party cookies may be used by the Website."],
        table: {
          headers: ["Cookie name", "Category", "Purpose", "Duration"],
          rows: [
            [
              "bsg_cookie_consent",
              "Essential",
              "Stores your cookie-consent selection and preferences",
              "365 days",
            ],
            [
              "next-auth.session-token or __Secure-next-auth.session-token",
              "Essential",
              "Maintains your logged-in account session",
              "Session / up to 30 days",
            ],
            [
              "next-auth.csrf-token or __Host-next-auth.csrf-token",
              "Essential",
              "Helps protect authentication flows against cross-site request forgery",
              "Session",
            ],
            [
              "next-auth.callback-url or __Secure-next-auth.callback-url",
              "Essential",
              "Stores the return URL used during sign-in and authentication flows",
              "Session",
            ],
            [
              "referralCode",
              "Marketing",
              "Records referral or affiliate attribution when a visitor arrives using a referral parameter and accepts optional marketing cookies",
              "Approximately 30 days",
            ],
            [
              "language (local storage)",
              "Preferences",
              "Stores your language preference where enabled and consented to",
              "Until cleared by the user or browser",
            ],
          ],
        },
        afterTable: [
          "The Website may mirror certain preferences, including cookie consent and referral information, in browser local storage. Local storage is not technically a cookie, but it can serve a similar function and is managed through the same consent choices.",
        ],
      },
      {
        title: "6. Third-party cookies and technologies",
        paragraphs: [
          "Where you consent, third-party services may set or access cookies and similar technologies. These may include:",
        ],
        table: {
          headers: ["Provider or service", "Category", "Purpose"],
          rows: [
            [
              "Google Analytics",
              "Analytics",
              "Website traffic, usage statistics, performance measurement, and service improvement",
            ],
            [
              "Google Ads",
              "Marketing",
              "Advertising conversion measurement, campaign effectiveness, and remarketing where configured",
            ],
            [
              "Meta services, including Facebook and Instagram",
              "Marketing",
              "Advertising delivery, campaign measurement, conversion tracking, and audience tools where configured",
            ],
            [
              "Stripe",
              "Essential / functional during checkout",
              "Secure payment processing and fraud-prevention measures during checkout",
            ],
            [
              "Brevo",
              "Marketing",
              "Newsletter and email-marketing delivery, preference management, and campaign measurement where enabled",
            ],
            [
              "Embedded content providers",
              "Preferences / marketing depending on the provider",
              "Embedded YouTube, Vimeo, Instagram, TikTok, Google Maps, reviews, social feeds, or other third-party content if introduced on the Website",
            ],
          ],
        },
        afterTable: [
          "Stripe may set cookies or similar technologies during checkout, including on Stripe-controlled domains, to process payments securely and prevent fraud. These technologies are governed by Stripe’s own privacy and cookie information.",
          "We may add or remove third-party providers as the Website develops. This Cookie Policy will be updated where material changes occur.",
        ],
      },
      {
        title: "7. Managing cookies in your browser",
        paragraphs: [
          "You can also control or delete cookies through your browser settings. Browser controls vary by provider and device.",
          "Please note that disabling essential cookies may prevent you from signing in, completing a purchase, maintaining a secure session, or using other core Website functions.",
        ],
      },
      {
        title: "8. Contact",
        paragraphs: ["If you have questions about our use of cookies or personal data, contact:"],
        contactBlock: [
          { label: "Company", value: "BS Gel, Lda." },
          { label: "Trading as", value: "Bio Sculpture Portugal" },
          {
            label: "Registered address",
            value: "Rua José Cunha Bastos, LT 52 R/C Esq, 2650-453 Amadora",
          },
          { label: "NIF/VAT number", value: "509040810" },
          { label: "Telephone", value: "+351 935172295", href: "tel:+351935172295" },
          { label: "Email", value: "info@biosculpture.pt", href: "mailto:info@biosculpture.pt" },
        ],
      },
      {
        title: "9. Changes to this Cookie Policy",
        paragraphs: [
          "We may amend this Cookie Policy when we change the technologies used on the Website, introduce new third-party services, or need to reflect changes in applicable law. The current version will always be made available on the Website.",
        ],
      },
    ],
  },

  pt: {
    effectiveDateLabel: "Data de entrada em vigor",
    lastUpdatedLabel: "Última atualização",
    effectiveDate: "24 de setembro de 2026",
    lastUpdated: "24 de setembro de 2026",
    sections: [
      {
        title: "1. O que são cookies",
        paragraphs: [
          "Os cookies são pequenos ficheiros de texto armazenados no seu computador, dispositivo móvel ou outro dispositivo quando visita um website. Tecnologias semelhantes — incluindo armazenamento local, pixels, tags e kits de desenvolvimento de software — também podem ser utilizadas para armazenar ou aceder a informação no seu dispositivo. Por simplicidade, referimo-nos a todas estas tecnologias como “cookies”.",
          "Utilizamos um banner de consentimento de cookies e um sistema de preferências personalizados em biosculpture.pt.",
        ],
      },
      {
        title: "2. Como utilizamos cookies",
        paragraphs: ["Utilizamos cookies e tecnologias semelhantes para:"],
        bullets: [
          "Operar funções seguras de início de sessão e autenticação de conta",
          "Manter a segurança da sessão e prevenir utilização fraudulenta ou não autorizada",
          "Memorizar as suas preferências de cookies",
          "Guardar definições de idioma quando consente cookies de preferências",
          "Gerir a atribuição de referências quando consente cookies opcionais",
          "Compreender a utilização e o desempenho do website através de analítica",
          "Medir campanhas publicitárias e conversões",
          "Apoiar marketing e publicidade através de plataformas como Google, Facebook, Instagram e outros prestadores, quando ativados",
        ],
        afterBullets: [
          "Ao abrigo das regras portuguesas de comunicações eletrónicas, o armazenamento ou o acesso a informação não essencial no dispositivo de um utilizador exige, em regra, consentimento prévio. Os cookies estritamente necessários para prestar um serviço expressamente solicitado pelo utilizador podem ser utilizados sem consentimento.",
        ],
      },
      {
        title: "3. Escolhas de cookies",
        paragraphs: ["Quando visita o Website pela primeira vez, pode optar por:"],
        bullets: [
          "Aceitar todos os cookies",
          "Rejeitar todos os cookies não essenciais",
          "Gerir as suas preferências por categoria",
        ],
        afterBullets: [
          "Não ativaremos cookies opcionais de preferências, analítica, marketing, publicidade, referência ou semelhantes até que preste um consentimento válido.",
          "Pode alterar ou retirar as suas preferências a qualquer momento através de Definições de Cookies no rodapé do Website.",
          "Recusar cookies opcionais não o impede de utilizar as funções essenciais do Website, embora algumas funcionalidades opcionais possam ficar indisponíveis ou menos personalizadas.",
        ],
      },
      {
        title: "4. Categorias de cookies",
        table: {
          headers: ["Categoria", "Finalidade", "Consentimento necessário?"],
          rows: [
            [
              "Essenciais",
              "Permitem o início de sessão, a gestão de sessão, a proteção CSRF, a segurança, o armazenamento do consentimento de cookies e outras funções necessárias para operar os serviços do Website solicitados",
              "Não",
            ],
            [
              "Preferências",
              "Memorizam definições opcionais, incluindo preferências de idioma quando ativadas",
              "Sim",
            ],
            [
              "Analítica",
              "Ajudam-nos a compreender o tráfego do Website, o comportamento dos visitantes, o desempenho e melhorias, utilizando ferramentas como o Google Analytics",
              "Sim",
            ],
            [
              "Marketing",
              "Apoiam publicidade, medição de campanhas, rastreio de conversões, atribuição de referências, remarketing e plataformas publicitárias como Meta e Google Ads",
              "Sim",
            ],
          ],
        },
      },
      {
        title: "5. Cookies próprios (first-party)",
        paragraphs: ["Os seguintes cookies próprios podem ser utilizados pelo Website."],
        table: {
          headers: ["Nome do cookie", "Categoria", "Finalidade", "Duração"],
          rows: [
            [
              "bsg_cookie_consent",
              "Essenciais",
              "Armazena a sua seleção e preferências de consentimento de cookies",
              "365 dias",
            ],
            [
              "next-auth.session-token ou __Secure-next-auth.session-token",
              "Essenciais",
              "Mantém a sessão da sua conta autenticada",
              "Sessão / até 30 dias",
            ],
            [
              "next-auth.csrf-token ou __Host-next-auth.csrf-token",
              "Essenciais",
              "Ajuda a proteger os fluxos de autenticação contra falsificação de pedidos entre sites",
              "Sessão",
            ],
            [
              "next-auth.callback-url ou __Secure-next-auth.callback-url",
              "Essenciais",
              "Armazena o URL de retorno utilizado durante o início de sessão e os fluxos de autenticação",
              "Sessão",
            ],
            [
              "referralCode",
              "Marketing",
              "Regista a atribuição de referência ou afiliado quando um visitante chega com um parâmetro de referência e aceita cookies de marketing opcionais",
              "Aproximadamente 30 dias",
            ],
            [
              "language (armazenamento local)",
              "Preferências",
              "Armazena a sua preferência de idioma quando ativada e consentida",
              "Até ser limpo pelo utilizador ou pelo navegador",
            ],
          ],
        },
        afterTable: [
          "O Website pode espelhar determinadas preferências, incluindo o consentimento de cookies e informação de referência, no armazenamento local do navegador. O armazenamento local não é tecnicamente um cookie, mas pode cumprir uma função semelhante e é gerido através das mesmas escolhas de consentimento.",
        ],
      },
      {
        title: "6. Cookies e tecnologias de terceiros",
        paragraphs: [
          "Quando consente, serviços de terceiros podem definir ou aceder a cookies e tecnologias semelhantes. Estes podem incluir:",
        ],
        table: {
          headers: ["Prestador ou serviço", "Categoria", "Finalidade"],
          rows: [
            [
              "Google Analytics",
              "Analítica",
              "Tráfego do Website, estatísticas de utilização, medição de desempenho e melhoria do serviço",
            ],
            [
              "Google Ads",
              "Marketing",
              "Medição de conversões publicitárias, eficácia de campanhas e remarketing, quando configurado",
            ],
            [
              "Serviços Meta, incluindo Facebook e Instagram",
              "Marketing",
              "Entrega de publicidade, medição de campanhas, rastreio de conversões e ferramentas de audiência, quando configurados",
            ],
            [
              "Stripe",
              "Essenciais / funcionais durante o checkout",
              "Processamento seguro de pagamentos e medidas de prevenção de fraude durante o checkout",
            ],
            [
              "Brevo",
              "Marketing",
              "Envio de newsletters e email marketing, gestão de preferências e medição de campanhas, quando ativado",
            ],
            [
              "Prestadores de conteúdo incorporado",
              "Preferências / marketing consoante o prestador",
              "Conteúdo incorporado de YouTube, Vimeo, Instagram, TikTok, Google Maps, avaliações, feeds sociais ou outro conteúdo de terceiros, se introduzido no Website",
            ],
          ],
        },
        afterTable: [
          "A Stripe pode definir cookies ou tecnologias semelhantes durante o checkout, incluindo em domínios controlados pela Stripe, para processar pagamentos de forma segura e prevenir fraude. Estas tecnologias regem-se pela própria informação de privacidade e cookies da Stripe.",
          "Podemos adicionar ou remover prestadores de terceiros à medida que o Website evolui. Esta Política de Cookies será atualizada quando ocorram alterações materiais.",
        ],
      },
      {
        title: "7. Gestão de cookies no seu navegador",
        paragraphs: [
          "Também pode controlar ou eliminar cookies através das definições do seu navegador. Os controlos do navegador variam consoante o prestador e o dispositivo.",
          "Tenha em atenção que desativar cookies essenciais pode impedir o início de sessão, a conclusão de uma compra, a manutenção de uma sessão segura ou a utilização de outras funções essenciais do Website.",
        ],
      },
      {
        title: "8. Contacto",
        paragraphs: [
          "Se tiver questões sobre a nossa utilização de cookies ou de dados pessoais, contacte:",
        ],
        contactBlock: [
          { label: "Empresa", value: "BS Gel, Lda." },
          { label: "A operar sob a marca", value: "Bio Sculpture Portugal" },
          {
            label: "Morada da sede",
            value: "Rua José Cunha Bastos, LT 52 R/C Esq, 2650-453 Amadora",
          },
          { label: "NIF/NIPC", value: "509040810" },
          { label: "Telefone", value: "+351 935172295", href: "tel:+351935172295" },
          { label: "Email", value: "info@biosculpture.pt", href: "mailto:info@biosculpture.pt" },
        ],
      },
      {
        title: "9. Alterações a esta Política de Cookies",
        paragraphs: [
          "Podemos alterar esta Política de Cookies quando mudarmos as tecnologias utilizadas no Website, introduzirmos novos serviços de terceiros ou precisarmos de refletir alterações na lei aplicável. A versão atual estará sempre disponível no Website.",
        ],
      },
    ],
  },
};
