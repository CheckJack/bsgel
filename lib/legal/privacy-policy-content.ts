export type PrivacyTable = {
  headers: [string, string];
  rows: [string, string][];
};

export type PrivacyPolicyContent = {
  effectiveDateLabel: string;
  lastUpdatedLabel: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: {
    title: string;
    paragraphs?: string[];
    bullets?: string[];
    afterBullets?: string[];
    table?: PrivacyTable;
    afterTable?: string[];
    definitionList?: { label: string; value: string; href?: string; hrefType?: "tel" | "mailto" }[];
  }[];
};

export const privacyPolicyContent: Record<"en" | "pt", PrivacyPolicyContent> = {
  en: {
    effectiveDateLabel: "Effective date",
    lastUpdatedLabel: "Last updated",
    effectiveDate: "24 September 2026",
    lastUpdated: "24 September 2026",
    sections: [
      {
        title: "1. About this policy",
        paragraphs: [
          'This Privacy Policy explains how BS Gel, Lda., trading as Bio Sculpture Portugal (“Bio Sculpture Portugal”, “we”, “us” or “our”), processes personal data through the website biosculpture.pt (the “Website”), our online shop, training-booking facilities, customer-support channels, physical store, and training academy.',
          "Bio Sculpture Portugal is a Portuguese limited company. Our registered office and tax identification details are:",
        ],
        definitionList: [
          {
            label: "Registered address",
            value: "Rua José Cunha Bastos, LT 52 R/C Esq, 2650-453 Amadora",
          },
          { label: "NIF/VAT number", value: "509040810" },
          { label: "Telephone", value: "+351 935172295", href: "tel:+351935172295", hrefType: "tel" },
          {
            label: "Privacy contact email",
            value: "info@biosculpture.pt",
            href: "mailto:info@biosculpture.pt",
            hrefType: "mailto",
          },
        ],
        afterBullets: [
          'For the purposes of the General Data Protection Regulation, Regulation (EU) 2016/679 (“GDPR”), Bio Sculpture Portugal is the controller of the personal data described in this Policy.',
          "We do not currently appoint a Data Protection Officer. For any privacy-related question or request, please contact us at info@biosculpture.pt.",
        ],
      },
      {
        title: "2. Who this applies to",
        paragraphs: ["This Policy applies to personal data relating to:"],
        bullets: [
          "Visitors to the Website",
          "Consumer customers",
          "Beauty professionals and salon customers",
          "Students and applicants for training",
          "Distributors, prospective distributors, and commercial contacts",
          "People who create an account, submit an enquiry, make an order, register for training, or communicate with us through chat, WhatsApp, email, telephone, or other available channels",
        ],
        afterBullets: [
          "Our Website may be accessed internationally, but our online shop and order fulfilment are intended for customers with delivery addresses in Portugal. We do not ship online orders outside Portugal.",
          "The Website is available in Portuguese and English. If a translated version differs from this English version, the Portuguese version prevails.",
        ],
      },
      {
        title: "3. Data we collect",
        paragraphs: [
          "We collect personal data directly from you, automatically through your use of the Website, and from the systems required to process orders, payments, communications, and training registrations.",
        ],
        table: {
          headers: ["Context", "Personal data we may process"],
          rows: [
            [
              "Website visits",
              "IP address, device and browser information, operating system, pages viewed, referral source, dates and times of access, cookie preferences, and usage data where consent has been given",
            ],
            [
              "Account creation",
              "Name, email address, telephone number, account credentials, customer type, account activity, and account preferences",
            ],
            [
              "Consumer or professional status",
              "Whether you register as a consumer or beauty professional, professional status, certification type, and the outcome of account verification",
            ],
            [
              "Professional certification review",
              "Certification document, information shown on the document, qualification type, issuing organisation, date or validity information where included, and verification decision",
            ],
            [
              "Orders and payments",
              "Products ordered, order number, billing and delivery address, telephone number, email address, NIF, payment method, payment status, transaction references, invoices, refunds, and order history",
            ],
            [
              "Training bookings",
              "Name, email address, telephone number, postal/billing address, NIF, course selected, booking and attendance information, payment information, training history, and certificates issued",
            ],
            [
              "Customer support and chat",
              "Messages, attachments you send, conversation history, contact details, and records required to resolve the request",
            ],
            [
              "Marketing",
              "Newsletter subscription status, consent records, email engagement data, marketing preferences, and unsubscribe requests",
            ],
            [
              "Wishlists and loyalty programme",
              "Saved products, account activity, preferences, and loyalty-point information if and when the programme is activated",
            ],
            [
              "Physical shop, storage and academy",
              "CCTV images where you enter areas covered by CCTV, in accordance with applicable law and the notices displayed at the premises",
            ],
          ],
        },
        afterTable: [
          "We do not intentionally collect health information, allergy information, treatment history, skin-condition information, nail-condition information, or other special-category personal data through the Website.",
          "Please do not send us sensitive personal data unless we specifically request it and explain why it is needed.",
        ],
      },
      {
        title: "4. Why we use your data",
        paragraphs: [
          "We process personal data only where there is a valid legal basis under the GDPR.",
        ],
        table: {
          headers: ["Purpose", "Legal basis"],
          rows: [
            [
              "Creating and managing accounts",
              "Performance of a contract or steps taken at your request before entering into a contract",
            ],
            [
              "Identifying whether an account is consumer or professional",
              "Performance of a contract and our legitimate interests in controlling access to professional-only products",
            ],
            [
              "Reviewing professional certifications and approving or declining professional access",
              "Performance of a contract or steps taken at your request; legitimate interests in ensuring that restricted professional products are sold only to appropriately qualified customers",
            ],
            [
              "Processing orders, payments, delivery, returns, refunds, and customer service",
              "Performance of a contract; compliance with legal obligations",
            ],
            [
              "Processing training registrations, payments, attendance, and certificates",
              "Performance of a contract; compliance with legal obligations; legitimate interests in maintaining an accurate training and certification record",
            ],
            [
              "Issuing invoices and complying with tax, accounting, and legal obligations",
              "Compliance with legal obligations",
            ],
            [
              "Responding to contact-form submissions, chat messages, WhatsApp messages, emails, calls, and complaints",
              "Legitimate interests in operating customer support and managing business communications; performance of a contract where relevant",
            ],
            [
              "Sending newsletters and promotional communications",
              "Consent, where required; or another lawful basis permitted by applicable law",
            ],
            [
              "Operating, protecting, and improving the Website and internal systems",
              "Legitimate interests in security, fraud prevention, service continuity, and business improvement",
            ],
            [
              "Website analytics, advertising measurement, remarketing, and campaign optimisation",
              "Consent for non-essential cookies and similar technologies",
            ],
            [
              "Managing referrals or affiliate attribution",
              "Consent where non-essential cookies are used; legitimate interests in measuring and administering commercial referrals where permitted",
            ],
            [
              "Operating CCTV at our physical premises",
              "Legitimate interests in the security of people, premises, stock, and business assets, subject to applicable legal requirements",
            ],
            [
              "Establishing, exercising, or defending legal claims",
              "Legitimate interests and compliance with legal obligations",
            ],
          ],
        },
        afterTable: [
          "We may need certain information to create an account, process an order, verify professional access, provide training, or issue an invoice. If you do not provide required information, we may be unable to provide the relevant service.",
        ],
      },
      {
        title: "5. Professional accounts and certifications",
        paragraphs: [
          "Certain professional products are restricted based on the type of user and relevant professional qualification.",
          "When you apply for a professional account, we may ask you to provide certification information and upload supporting documentation. Our authorised staff review the information and decide whether to approve, reject, or request additional information regarding professional access.",
          "We use this data to:",
        ],
        bullets: [
          "Verify eligibility for professional-only products",
          "Manage professional pricing or product access where available",
          "Prevent unauthorised purchase or use of professional products",
          "Maintain a record of professional access decisions",
          "Support training and certification-related services",
        ],
        afterBullets: [
          "We do not use your certificate documents for unrelated marketing purposes. Access is restricted to staff who need it for account verification, customer service, training, compliance, or internal administration.",
        ],
      },
      {
        title: "6. Marketing communications",
        paragraphs: [
          "With your consent where required, we may send newsletters, product news, training opportunities, promotional campaigns, and information about Bio Sculpture Portugal by email.",
          "We may use email and WhatsApp to contact customers where necessary in relation to an order, account issue, customer-service request, payment, delivery, training booking, or other service-related matter. These service communications are distinct from marketing communications.",
          "You can opt out of promotional email at any time by using the unsubscribe link in the message or by contacting info@biosculpture.pt. Opting out of marketing will not prevent us from sending essential service communications about your account, orders, payments, training bookings, or legal notices.",
        ],
      },
      {
        title: "7. Who receives your data",
        paragraphs: [
          "We may share personal data only when necessary and with appropriate safeguards. Recipients may include:",
        ],
        bullets: [
          "Our authorised employees and contractors who need access for customer support, order fulfilment, training administration, account verification, finance, or technical administration",
          "Hostinger, which hosts the Website and related infrastructure",
          "Google Workspace, used for business email and related communications",
          "Stripe, Klarna, MB WAY and bank-transfer/payment-service providers, where required to process payments",
          "Delivery and logistics providers that deliver orders in Portugal",
          "Brevo, used to manage newsletters and marketing email communications",
          "Google, including Google Analytics, Google Tag Manager, and Google Ads, where you consent to the relevant technologies",
          "Meta, including Facebook and Instagram advertising services, where you consent to the relevant technologies",
          "Our custom-built Website, internal back-office, chat system, and custom CRM systems, including systems hosted through Lovable, where required for business operations",
          "Professional advisers, including accountants, auditors, insurers, and legal advisers",
          "Public authorities, regulators, courts, law-enforcement bodies, and tax authorities where required by law",
          "A buyer, investor, successor, or group entity in connection with a merger, sale, restructuring, or transfer of business assets, subject to appropriate safeguards",
        ],
        afterBullets: [
          "Bio Sculpture Portugal operates independently as a distributor, licensee, and franchise-related business within the Bio Sculpture group. We do not ordinarily share customer personal data with the wider Bio Sculpture group or suppliers. Where a disclosure becomes necessary, we will make it only where there is a lawful basis and appropriate safeguards.",
        ],
      },
      {
        title: "8. International transfers",
        paragraphs: [
          'Some service providers may process personal data outside the European Economic Area (“EEA”), including providers of cloud, payment, analytics, advertising, email, or technology services.',
          "Where personal data is transferred outside the EEA, we will use an appropriate safeguard under applicable data-protection law, such as:",
        ],
        bullets: [
          "A European Commission adequacy decision",
          "European Commission Standard Contractual Clauses",
          "Another legally valid transfer mechanism",
        ],
        afterBullets: [
          "You may contact us at info@biosculpture.pt for information about the safeguards relevant to a particular transfer.",
        ],
      },
      {
        title: "9. How long we retain data",
        paragraphs: [
          "We retain personal data only for as long as needed for the purposes described in this Policy, unless a longer period is required or permitted by law.",
        ],
        table: {
          headers: ["Data type", "Retention period"],
          rows: [
            ["General contact enquiries", "Up to 12 months after the enquiry is resolved"],
            [
              "Customer accounts",
              "While the account remains active; account data is deleted when an account becomes inactive, unless retention is required for an order, invoice, legal obligation, dispute, fraud-prevention purpose, or other lawful reason",
            ],
            [
              "Orders, invoices, payment and accounting records",
              "Generally retained for 10 years, or longer where required by law or needed for a legal claim",
            ],
            [
              "Professional-account applications and certifications",
              "For as long as professional access remains active and for a reasonable period afterwards; unsuccessful applications may be retained for the period needed to permit reapplication and manage verification history",
            ],
            [
              "Training registrations, attendance, and certificates",
              "Retained for as long as necessary to verify qualifications, reissue certificates, maintain training records, and meet legal or contractual obligations",
            ],
            [
              "Customer-support communications",
              "Up to 12 months after the matter is resolved, unless linked to an order, complaint, dispute, or legal obligation requiring longer retention",
            ],
            [
              "Newsletter and marketing data",
              "Until you withdraw consent or unsubscribe, subject to retaining limited suppression-list information to respect your opt-out",
            ],
            [
              "CCTV footage",
              "Retained only for the applicable legal retention period, unless required for an investigation, incident, or legal claim",
            ],
            [
              "Cookie-consent records",
              "Retained for the period necessary to demonstrate and manage your cookie preferences",
            ],
          ],
        },
        afterTable: [
          "Portuguese tax and accounting obligations may require invoices and supporting documentation to be retained for 10 years.",
        ],
      },
      {
        title: "10. Your privacy rights",
        paragraphs: [
          "Subject to the conditions and limitations of applicable law, you have the right to:",
        ],
        bullets: [
          "Request access to your personal data",
          "Request correction of inaccurate or incomplete personal data",
          "Request deletion of personal data in certain circumstances",
          "Request restriction of processing in certain circumstances",
          "Object to processing based on our legitimate interests",
          "Object at any time to direct marketing",
          "Receive the personal data you provided to us in a structured, commonly used, machine-readable format, where applicable",
          "Withdraw consent at any time, where processing is based on consent",
          "Lodge a complaint with the Portuguese data-protection authority, the Comissão Nacional de Proteção de Dados (CNPD)",
        ],
        afterBullets: [
          'To exercise your rights, email info@biosculpture.pt with the subject line “Privacy Request”. We may ask for information necessary to verify your identity before responding.',
          "The CNPD is the Portuguese supervisory authority responsible for overseeing compliance with the GDPR and Portuguese data-protection rules.",
        ],
      },
      {
        title: "11. Security",
        paragraphs: [
          "We use appropriate technical and organisational safeguards designed to protect personal data against accidental or unlawful loss, destruction, alteration, unauthorised disclosure, or access.",
          "These measures include access controls, account authentication, administrative permissions, secure hosting arrangements, encrypted connections where available, and restricted access to professional certification documents, customer records, and internal systems.",
          "No system is entirely secure. You should keep your account credentials confidential and contact us promptly if you believe your account has been accessed without permission.",
        ],
      },
      {
        title: "12. Children",
        paragraphs: [
          "Our products, professional services, training, and Website are not intended for children. We do not knowingly collect personal data from children in breach of applicable law.",
          "If you believe that a child has provided personal data to us without appropriate authorisation, contact us at info@biosculpture.pt so that we can investigate and take appropriate action.",
        ],
      },
      {
        title: "13. Changes to this policy",
        paragraphs: [
          "We may update this Privacy Policy to reflect changes in our services, systems, data-processing activities, or legal obligations. The most current version will be published on the Website with the updated effective date.",
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
        title: "1. Sobre esta política",
        paragraphs: [
          "Esta Política de Privacidade explica como a BS Gel, Lda., a operar sob a marca Bio Sculpture Portugal (“Bio Sculpture Portugal”, “nós”, “nos” ou “nosso”), trata dados pessoais através do website biosculpture.pt (o “Website”), da nossa loja online, dos meios de marcação de formações, dos canais de apoio ao cliente, da loja física e da academia de formação.",
          "A Bio Sculpture Portugal é uma sociedade limitada portuguesa. A nossa sede e os dados de identificação fiscal são:",
        ],
        definitionList: [
          {
            label: "Morada da sede",
            value: "Rua José Cunha Bastos, LT 52 R/C Esq, 2650-453 Amadora",
          },
          { label: "NIF/NIPC", value: "509040810" },
          { label: "Telefone", value: "+351 935172295", href: "tel:+351935172295", hrefType: "tel" },
          {
            label: "Email de contacto para privacidade",
            value: "info@biosculpture.pt",
            href: "mailto:info@biosculpture.pt",
            hrefType: "mailto",
          },
        ],
        afterBullets: [
          "Para efeitos do Regulamento Geral sobre a Proteção de Dados, Regulamento (UE) 2016/679 (“RGPD”), a Bio Sculpture Portugal é a responsável pelo tratamento dos dados pessoais descritos nesta Política.",
          "Atualmente não nomeamos um Encarregado de Proteção de Dados. Para qualquer questão ou pedido relacionado com privacidade, contacte-nos através de info@biosculpture.pt.",
        ],
      },
      {
        title: "2. A quem se aplica",
        paragraphs: ["Esta Política aplica-se a dados pessoais relativos a:"],
        bullets: [
          "Visitantes do Website",
          "Clientes consumidores",
          "Profissionais de beleza e clientes de salões",
          "Alunos e candidatos a formação",
          "Distribuidores, potenciais distribuidores e contactos comerciais",
          "Pessoas que criam uma conta, submetem um pedido de informação, efetuam uma encomenda, se inscrevem em formação ou comunicam connosco através de chat, WhatsApp, email, telefone ou outros canais disponíveis",
        ],
        afterBullets: [
          "O nosso Website pode ser acedido internacionalmente, mas a loja online e o cumprimento de encomendas destinam-se a clientes com morada de entrega em Portugal. Não enviamos encomendas online para fora de Portugal.",
          "O Website está disponível em português e em inglês. Em caso de divergência entre uma versão traduzida e a versão em inglês, prevalece a versão em português.",
        ],
      },
      {
        title: "3. Dados que recolhemos",
        paragraphs: [
          "Recolhemos dados pessoais diretamente junto de si, automaticamente através da utilização do Website, e a partir dos sistemas necessários para processar encomendas, pagamentos, comunicações e inscrições em formação.",
        ],
        table: {
          headers: ["Contexto", "Dados pessoais que podemos tratar"],
          rows: [
            [
              "Visitas ao Website",
              "Endereço IP, informações do dispositivo e do navegador, sistema operativo, páginas visualizadas, origem de referência, datas e horas de acesso, preferências de cookies e dados de utilização quando tenha sido prestado consentimento",
            ],
            [
              "Criação de conta",
              "Nome, endereço de email, número de telefone, credenciais de conta, tipo de cliente, atividade da conta e preferências da conta",
            ],
            [
              "Estatuto de consumidor ou profissional",
              "Se se regista como consumidor ou profissional de beleza, estatuto profissional, tipo de certificação e o resultado da verificação da conta",
            ],
            [
              "Análise de certificação profissional",
              "Documento de certificação, informação constante do documento, tipo de qualificação, entidade emitente, data ou informação de validade quando incluída, e decisão de verificação",
            ],
            [
              "Encomendas e pagamentos",
              "Produtos encomendados, número da encomenda, morada de faturação e de entrega, número de telefone, endereço de email, NIF, método de pagamento, estado do pagamento, referências de transação, faturas, reembolsos e histórico de encomendas",
            ],
            [
              "Marcações de formação",
              "Nome, endereço de email, número de telefone, morada postal/de faturação, NIF, curso selecionado, informação de marcação e de assiduidade, informação de pagamento, histórico de formação e certificados emitidos",
            ],
            [
              "Apoio ao cliente e chat",
              "Mensagens, anexos que envie, histórico de conversação, dados de contacto e registos necessários para resolver o pedido",
            ],
            [
              "Marketing",
              "Estado da subscrição da newsletter, registos de consentimento, dados de interação com emails, preferências de marketing e pedidos de cancelamento de subscrição",
            ],
            [
              "Listas de desejos e programa de fidelização",
              "Produtos guardados, atividade da conta, preferências e informação de pontos de fidelização se e quando o programa estiver ativo",
            ],
            [
              "Loja física, armazenamento e academia",
              "Imagens de videovigilância quando entrar em zonas abrangidas por CCTV, em conformidade com a lei aplicável e com os avisos afixados nas instalações",
            ],
          ],
        },
        afterTable: [
          "Não recolhemos intencionalmente informação de saúde, informação sobre alergias, histórico de tratamentos, informação sobre condições da pele, informação sobre condições das unhas ou outros dados pessoais de categorias especiais através do Website.",
          "Por favor, não nos envie dados pessoais sensíveis, salvo se solicitarmos especificamente e explicarmos a finalidade.",
        ],
      },
      {
        title: "4. Por que utilizamos os seus dados",
        paragraphs: [
          "Tratamos dados pessoais apenas quando existe uma base jurídica válida ao abrigo do RGPD.",
        ],
        table: {
          headers: ["Finalidade", "Base jurídica"],
          rows: [
            [
              "Criação e gestão de contas",
              "Execução de um contrato ou diligências pré-contratuais a seu pedido",
            ],
            [
              "Identificação se uma conta é de consumidor ou profissional",
              "Execução de um contrato e os nossos interesses legítimos em controlar o acesso a produtos exclusivos para profissionais",
            ],
            [
              "Análise de certificações profissionais e aprovação ou recusa de acesso profissional",
              "Execução de um contrato ou diligências a seu pedido; interesses legítimos em assegurar que produtos profissionais restritos são vendidos apenas a clientes devidamente qualificados",
            ],
            [
              "Processamento de encomendas, pagamentos, entregas, devoluções, reembolsos e apoio ao cliente",
              "Execução de um contrato; cumprimento de obrigações legais",
            ],
            [
              "Processamento de inscrições em formação, pagamentos, assiduidade e certificados",
              "Execução de um contrato; cumprimento de obrigações legais; interesses legítimos em manter um registo preciso de formação e certificação",
            ],
            [
              "Emissão de faturas e cumprimento de obrigações fiscais, contabilísticas e legais",
              "Cumprimento de obrigações legais",
            ],
            [
              "Resposta a formulários de contacto, mensagens de chat, mensagens de WhatsApp, emails, chamadas e reclamações",
              "Interesses legítimos na operação do apoio ao cliente e na gestão de comunicações comerciais; execução de um contrato quando aplicável",
            ],
            [
              "Envio de newsletters e comunicações promocionais",
              "Consentimento, quando exigido; ou outra base jurídica permitida pela lei aplicável",
            ],
            [
              "Operação, proteção e melhoria do Website e dos sistemas internos",
              "Interesses legítimos em segurança, prevenção de fraude, continuidade do serviço e melhoria do negócio",
            ],
            [
              "Analítica do Website, medição publicitária, remarketing e otimização de campanhas",
              "Consentimento para cookies não essenciais e tecnologias semelhantes",
            ],
            [
              "Gestão de referências ou atribuição de afiliados",
              "Consentimento quando são utilizados cookies não essenciais; interesses legítimos na medição e administração de referências comerciais quando permitido",
            ],
            [
              "Operação de CCTV nas nossas instalações físicas",
              "Interesses legítimos na segurança de pessoas, instalações, stock e ativos empresariais, sujeito aos requisitos legais aplicáveis",
            ],
            [
              "Estabelecimento, exercício ou defesa de pretensões jurídicas",
              "Interesses legítimos e cumprimento de obrigações legais",
            ],
          ],
        },
        afterTable: [
          "Podemos necessitar de determinada informação para criar uma conta, processar uma encomenda, verificar o acesso profissional, prestar formação ou emitir uma fatura. Se não fornecer a informação necessária, poderemos ficar impossibilitados de prestar o serviço em causa.",
        ],
      },
      {
        title: "5. Contas profissionais e certificações",
        paragraphs: [
          "Determinados produtos profissionais estão restringidos com base no tipo de utilizador e na qualificação profissional relevante.",
          "Quando se candidata a uma conta profissional, podemos solicitar informação de certificação e o envio de documentação de suporte. Os nossos colaboradores autorizados analisam a informação e decidem se aprovam, rejeitam ou solicitam informação adicional relativamente ao acesso profissional.",
          "Utilizamos estes dados para:",
        ],
        bullets: [
          "Verificar a elegibilidade para produtos exclusivos para profissionais",
          "Gerir preços profissionais ou acesso a produtos, quando disponível",
          "Prevenir a compra ou utilização não autorizada de produtos profissionais",
          "Manter um registo das decisões de acesso profissional",
          "Apoiar serviços relacionados com formação e certificação",
        ],
        afterBullets: [
          "Não utilizamos os seus documentos de certificação para finalidades de marketing não relacionadas. O acesso está limitado aos colaboradores que dele necessitem para verificação de contas, apoio ao cliente, formação, conformidade ou administração interna.",
        ],
      },
      {
        title: "6. Comunicações de marketing",
        paragraphs: [
          "Com o seu consentimento, quando exigido, podemos enviar newsletters, novidades de produtos, oportunidades de formação, campanhas promocionais e informação sobre a Bio Sculpture Portugal por email.",
          "Podemos utilizar email e WhatsApp para contactar clientes quando necessário relativamente a uma encomenda, questão de conta, pedido de apoio ao cliente, pagamento, entrega, marcação de formação ou outro assunto relacionado com o serviço. Estas comunicações de serviço são distintas das comunicações de marketing.",
          "Pode cancelar a qualquer momento o email promocional através da ligação de cancelamento de subscrição na mensagem ou contactando info@biosculpture.pt. O cancelamento do marketing não nos impede de enviar comunicações essenciais de serviço sobre a sua conta, encomendas, pagamentos, marcações de formação ou avisos legais.",
        ],
      },
      {
        title: "7. Quem recebe os seus dados",
        paragraphs: [
          "Podemos partilhar dados pessoais apenas quando necessário e com salvaguardas adequadas. Os destinatários podem incluir:",
        ],
        bullets: [
          "Os nossos colaboradores e prestadores autorizados que necessitem de acesso para apoio ao cliente, cumprimento de encomendas, administração de formação, verificação de contas, finanças ou administração técnica",
          "A Hostinger, que aloja o Website e a infraestrutura relacionada",
          "O Google Workspace, utilizado para email empresarial e comunicações relacionadas",
          "Stripe, Klarna, MB WAY e prestadores de serviços de transferência bancária/pagamento, quando necessário para processar pagamentos",
          "Prestadores de entrega e logística que entregam encomendas em Portugal",
          "A Brevo, utilizada para gerir newsletters e comunicações de marketing por email",
          "A Google, incluindo Google Analytics, Google Tag Manager e Google Ads, quando consente nas tecnologias relevantes",
          "A Meta, incluindo serviços de publicidade do Facebook e Instagram, quando consente nas tecnologias relevantes",
          "O nosso Website desenvolvido à medida, back-office interno, sistema de chat e sistemas CRM personalizados, incluindo sistemas alojados através da Lovable, quando necessário para as operações do negócio",
          "Consultores profissionais, incluindo contabilistas, auditores, seguradoras e consultores jurídicos",
          "Autoridades públicas, reguladores, tribunais, órgãos de aplicação da lei e autoridades fiscais quando exigido por lei",
          "Um comprador, investidor, sucessor ou entidade do grupo no âmbito de uma fusão, venda, reestruturação ou transferência de ativos empresariais, sujeito a salvaguardas adequadas",
        ],
        afterBullets: [
          "A Bio Sculpture Portugal opera de forma independente como distribuidor, licenciado e negócio relacionado com franchise no âmbito do grupo Bio Sculpture. Em regra, não partilhamos dados pessoais de clientes com o restante grupo Bio Sculpture ou com fornecedores. Quando uma divulgação se tornar necessária, fá-la-emos apenas quando existir base jurídica e salvaguardas adequadas.",
        ],
      },
      {
        title: "8. Transferências internacionais",
        paragraphs: [
          "Alguns prestadores de serviços podem tratar dados pessoais fora do Espaço Económico Europeu (“EEE”), incluindo prestadores de serviços de cloud, pagamento, analítica, publicidade, email ou tecnologia.",
          "Quando dados pessoais forem transferidos para fora do EEE, utilizaremos uma salvaguarda adequada ao abrigo da legislação de proteção de dados aplicável, como:",
        ],
        bullets: [
          "Uma decisão de adequação da Comissão Europeia",
          "Cláusulas Contratuais-Tipo da Comissão Europeia",
          "Outro mecanismo de transferência legalmente válido",
        ],
        afterBullets: [
          "Pode contactar-nos em info@biosculpture.pt para obter informação sobre as salvaguardas relevantes para uma transferência concreta.",
        ],
      },
      {
        title: "9. Por quanto tempo conservamos os dados",
        paragraphs: [
          "Conservamos dados pessoais apenas pelo tempo necessário às finalidades descritas nesta Política, salvo se um prazo mais longo for exigido ou permitido por lei.",
        ],
        table: {
          headers: ["Tipo de dados", "Prazo de conservação"],
          rows: [
            [
              "Pedidos de contacto gerais",
              "Até 12 meses após a resolução do pedido",
            ],
            [
              "Contas de cliente",
              "Enquanto a conta permanecer ativa; os dados da conta são eliminados quando a conta se tornar inativa, salvo se a conservação for necessária para uma encomenda, fatura, obrigação legal, litígio, prevenção de fraude ou outro motivo lícito",
            ],
            [
              "Encomendas, faturas, registos de pagamento e contabilísticos",
              "Em regra, conservados durante 10 anos, ou por período superior quando exigido por lei ou necessário para uma pretensão jurídica",
            ],
            [
              "Candidaturas e certificações de contas profissionais",
              "Enquanto o acesso profissional permanecer ativo e por um período razoável subsequentemente; candidaturas não bem-sucedidas podem ser conservadas pelo período necessário para permitir nova candidatura e gerir o histórico de verificação",
            ],
            [
              "Inscrições em formação, assiduidade e certificados",
              "Conservados pelo tempo necessário para verificar qualificações, reemitir certificados, manter registos de formação e cumprir obrigações legais ou contratuais",
            ],
            [
              "Comunicações de apoio ao cliente",
              "Até 12 meses após a resolução do assunto, salvo se estiverem ligadas a uma encomenda, reclamação, litígio ou obrigação legal que exija conservação por período mais longo",
            ],
            [
              "Dados de newsletter e marketing",
              "Até retirar o consentimento ou cancelar a subscrição, sujeito à conservação de informação limitada de lista de exclusão para respeitar a sua opção de saída",
            ],
            [
              "Imagens de CCTV",
              "Conservadas apenas pelo prazo legal de conservação aplicável, salvo se forem necessárias para uma investigação, incidente ou pretensão jurídica",
            ],
            [
              "Registos de consentimento de cookies",
              "Conservados pelo período necessário para demonstrar e gerir as suas preferências de cookies",
            ],
          ],
        },
        afterTable: [
          "As obrigações fiscais e contabilísticas portuguesas podem exigir que as faturas e a documentação de suporte sejam conservadas durante 10 anos.",
        ],
      },
      {
        title: "10. Os seus direitos de privacidade",
        paragraphs: [
          "Sob reserva das condições e limitações da lei aplicável, tem o direito de:",
        ],
        bullets: [
          "Solicitar o acesso aos seus dados pessoais",
          "Solicitar a retificação de dados pessoais inexatos ou incompletos",
          "Solicitar o apagamento de dados pessoais em determinadas circunstâncias",
          "Solicitar a limitação do tratamento em determinadas circunstâncias",
          "Opor-se ao tratamento baseado nos nossos interesses legítimos",
          "Opor-se a qualquer momento ao marketing direto",
          "Receber os dados pessoais que nos forneceu num formato estruturado, de uso corrente e de leitura automática, quando aplicável",
          "Retirar o consentimento a qualquer momento, quando o tratamento se baseie no consentimento",
          "Apresentar uma reclamação junto da autoridade portuguesa de proteção de dados, a Comissão Nacional de Proteção de Dados (CNPD)",
        ],
        afterBullets: [
          "Para exercer os seus direitos, envie um email para info@biosculpture.pt com o assunto “Pedido de Privacidade”. Podemos solicitar informação necessária para verificar a sua identidade antes de responder.",
          "A CNPD é a autoridade de controlo portuguesa responsável por supervisionar o cumprimento do RGPD e das regras portuguesas de proteção de dados.",
        ],
      },
      {
        title: "11. Segurança",
        paragraphs: [
          "Utilizamos salvaguardas técnicas e organizativas adequadas, concebidas para proteger os dados pessoais contra perda, destruição, alteração, divulgação ou acesso acidental ou ilícito.",
          "Estas medidas incluem controlos de acesso, autenticação de contas, permissões administrativas, arranjos de alojamento seguros, ligações encriptadas quando disponíveis, e acesso restrito a documentos de certificação profissional, registos de clientes e sistemas internos.",
          "Nenhum sistema é totalmente seguro. Deve manter as credenciais da sua conta confidenciais e contactar-nos prontamente se acreditar que a sua conta foi acedida sem autorização.",
        ],
      },
      {
        title: "12. Menores",
        paragraphs: [
          "Os nossos produtos, serviços profissionais, formação e Website não se destinam a menores. Não recolhemos conscientemente dados pessoais de menores em violação da lei aplicável.",
          "Se acreditar que um menor nos forneceu dados pessoais sem autorização adequada, contacte-nos em info@biosculpture.pt para que possamos investigar e tomar as medidas adequadas.",
        ],
      },
      {
        title: "13. Alterações a esta política",
        paragraphs: [
          "Podemos atualizar esta Política de Privacidade para refletir alterações nos nossos serviços, sistemas, atividades de tratamento de dados ou obrigações legais. A versão mais atual será publicada no Website com a data de entrada em vigor atualizada.",
        ],
      },
    ],
  },
};
