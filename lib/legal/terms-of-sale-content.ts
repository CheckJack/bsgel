export type TermsSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  afterBullets?: string[];
  definitionList?: { label: string; value: string; href?: string }[];
  id?: string;
};

export type TermsContent = {
  pageTitle: string;
  effectiveDateLabel: string;
  lastUpdatedLabel: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: TermsSection[];
};

export const termsOfSaleContent: Record<"en" | "pt", TermsContent> = {
  en: {
    pageTitle: "General Terms of Sale and Shipping",
    effectiveDateLabel: "Effective date",
    lastUpdatedLabel: "Last updated",
    effectiveDate: "24 September 2026",
    lastUpdated: "24 September 2026",
    sections: [
      {
        title: "1. Identification and scope",
        paragraphs: [
          "These General Terms of Sale and Shipping govern the rights and obligations of the parties in connection with sales made through the website www.biosculpture.pt (the “Website”).",
          "They describe, in particular, the conditions applicable to account creation, professional-customer validation, placing orders, payments, dispatch, delivery, returns, exchanges, and order tracking.",
          "The Website is operated by:",
        ],
        definitionList: [
          { label: "Company", value: "BS Gel, Lda." },
          {
            label: "Registered office",
            value: "Rua José Cunha Bastos, LT 52 R/C Esq, 2650-453 Amadora",
          },
          { label: "NIF/VAT number", value: "509040810" },
          { label: "Telephone", value: "+351 935172295", href: "tel:+351935172295" },
          { label: "Email", value: "info@biosculpture.pt", href: "mailto:info@biosculpture.pt" },
        ],
        afterBullets: [
          'Hereinafter referred to as “Bio Sculpture Portugal”, “BS Gel, Lda.”, “we”, “us” or the “Seller”.',
          "By creating an account, placing an order, or using the Website, the user declares that they have read, understood, and accepted these General Terms of Sale and Shipping, the Privacy Policy, the Cookie Policy, and the returns provisions set out in these Terms.",
        ],
      },
      {
        title: "2. Customers, products and territory",
        paragraphs: [
          "The Website is intended for persons aged 18 or over.",
          "Bio Sculpture Portugal makes products available for end consumers and products exclusively intended for beauty, aesthetics, and nail professionals.",
          "Some products, including gels, bases, builders, gel polishes, and other professional-use products, are reserved for professionals with an appropriate qualification.",
          "To purchase professional products, the user may need to:",
        ],
        bullets: [
          "Create a professional account",
          "Select the type of certification or qualification held",
          "Upload supporting certification documentation",
          "Wait for account validation by Bio Sculpture Portugal",
        ],
        afterBullets: [
          "Bio Sculpture Portugal reserves the right to request additional information and to approve, refuse, limit, suspend, or review access to professional products whenever necessary to verify qualifications, prevent misuse, or comply with brand distribution rules.",
          "Products are sold and delivered exclusively within national territory, that is, to addresses located in Portugal, including Mainland Portugal, Madeira, and the Azores, subject to the delivery service available at checkout.",
        ],
      },
      {
        title: "3. Orders",
        paragraphs: [
          "To place an order, the user must select the desired products, complete billing and delivery details, provide a tax identification number (NIF) when requested, choose a payment method, and confirm the order.",
          "Confirmation of the order by the customer constitutes an offer to purchase. Acceptance of the order by Bio Sculpture Portugal occurs after payment confirmation and the sending of an order or dispatch confirmation.",
          "Bio Sculpture Portugal may refuse, cancel, or limit an order in the following cases:",
        ],
        bullets: [
          "Lack of stock or product unavailability",
          "Incomplete or incorrect data, or inability to contact the customer",
          "Delivery address outside Portugal",
          "Payment not confirmed",
          "Manifest error in price, stock, description, or product configuration",
          "Lack of the certification required for professional products",
          "Suspicion of fraud, abusive use, unauthorised resale, or breach of these Terms",
        ],
        afterBullets: [
          "If a paid order is cancelled for a reason attributable to Bio Sculpture Portugal, the amount paid for the undelivered items will be refunded.",
        ],
      },
      {
        title: "4. Prices",
        paragraphs: [
          "Prices shown on the Website are expressed in euros (€).",
          "Prices include VAT at the legal rate in force.",
          "Shipping costs, where applicable, are shown before final order confirmation.",
          "Bio Sculpture Portugal may update prices at any time. The applicable price is the one shown on the Website at the time the order is submitted, except in the case of a manifest error.",
        ],
      },
      {
        title: "5. Payment methods",
        paragraphs: [
          "Orders are subject to immediate payment.",
          "Available payment methods may include:",
        ],
        bullets: [
          "Card payment via Stripe",
          "Bank transfer",
          "MB WAY",
          "Klarna",
          "Other payment methods shown at checkout, where available",
        ],
        afterBullets: [
          "For bank-transfer payments, the customer must indicate the order number as the payment reference and send proof of payment to info@biosculpture.pt if that instruction is shown on the Website or communicated by Bio Sculpture Portugal.",
          "For MB WAY payments, the customer must follow the instructions shown at checkout and indicate the order number in the description when requested.",
          "Dispatch of the order will only begin after effective confirmation of payment.",
          "If payment is not confirmed within the period communicated to the customer, Bio Sculpture Portugal may cancel the order.",
        ],
      },
      {
        title: "6. Dispatch and shipping costs",
        paragraphs: [
          "Orders are dispatched to Mainland Portugal and to other Portuguese zones covered by the delivery service available at checkout, including Madeira and the Azores.",
          "Free shipping applies to orders destined for Mainland Portugal with a value above €115 including VAT, unless otherwise stated on the Website, in promotional campaigns, or at checkout.",
          "For Madeira and the Azores, free shipping applies to orders with a value above €185 including VAT, unless otherwise stated on the Website, in promotional campaigns, or at checkout.",
          "Where the order value does not meet the free-shipping conditions, the applicable shipping costs will be shown before order confirmation.",
          "Bio Sculpture Portugal aims to dispatch orders within 4 business days after payment confirmation, except in cases of stock unavailability, promotional periods, public holidays, force majeure, or other circumstances outside our reasonable control.",
          "The dispatch timeframe does not necessarily correspond to the carrier’s delivery timeframe.",
        ],
      },
      {
        title: "7. Delivery and tracking",
        paragraphs: [
          "Deliveries are made exclusively through CTT Expresso, unless expressly stated otherwise at checkout or in a communication sent to the customer.",
          "Deliveries are normally made on business days between 09:00 and 19:00, according to the carrier’s procedures, routes, and schedules.",
          "After dispatch, the customer will receive a tracking code or another means of following the order.",
          "The customer is responsible for:",
        ],
        bullets: [
          "Tracking the order status using the tracking code",
          "Ensuring that the address, telephone number, and email provided are correct",
          "Ensuring that someone is available to receive the order when necessary",
          "Complying with collection or rescheduling deadlines defined by CTT Expresso",
        ],
        afterBullets: [
          "Bio Sculpture Portugal is not responsible for delays, failed delivery attempts, or returns caused by incorrect data, the recipient’s absence, failure to collect, insufficient instructions, or other circumstances attributable to the customer.",
        ],
      },
      {
        title: "8. Receipt and inspection of the order",
        paragraphs: [
          "Upon delivery, the customer should check:",
        ],
        bullets: [
          "The external condition of the packaging",
          "The number of packages delivered",
          "Any signs of damage, tampering, moisture, opening, or missing packages",
        ],
        afterBullets: [
          "If an anomaly is detected, the customer should, wherever possible:",
        ],
      },
      {
        title: "8.1 What to do if there is an anomaly",
        bullets: [
          "Record the anomaly on the carrier’s delivery note or device",
          "Indicate “Subject to inspection” before signing for receipt when it is not possible to fully check the order at the time",
          "Take clear photographs of the packaging, shipping label, and visible damage",
          "Contact Bio Sculpture Portugal on the same day at info@biosculpture.pt",
        ],
        afterBullets: [
          "This inspection obligation helps resolve transport incidents quickly, but does not limit the legal rights of the consumer or customer in the event of a defective, incorrect, or non-conforming product.",
        ],
      },
      {
        title: "9. Returned orders and re-shipments",
        paragraphs: [
          "If an order is returned to Bio Sculpture Portugal for a reason attributable to the customer, including an incorrect address, incomplete data, repeated absence, unjustified refusal, failure to collect, or failure to follow the carrier’s instructions, a new shipping charge may apply for re-shipment.",
          "Re-shipment will only take place after confirmation of payment of the new shipping costs, where applicable.",
          "If the customer does not want re-shipment, the order may be treated as a return request, in accordance with the returns provisions in these Terms and with applicable legal rights.",
        ],
      },
      {
        id: "returns",
        title: "10. Returns, exchanges and non-conforming products",
        paragraphs: [
          "Returns and exchanges are governed by the returns provisions set out in these Terms and made available on the Website.",
          "Consumer customers who make online purchases generally benefit from the right of withdrawal within 14 calendar days after receipt of the goods, without needing to give a reason, subject to the legally provided exceptions. Decree-Law No. 24/2014 regulates distance contracts and provides for that withdrawal period.",
          "Sealed cosmetic or hygiene products may be excluded from the right of withdrawal where they have been opened or unsealed after delivery and are not suitable for return for reasons of health or hygiene protection. This does not affect legal rights relating to defective, damaged, incorrect, or non-conforming products.",
          "To report a damaged, incorrect, or non-conforming product, the customer should contact info@biosculpture.pt as soon as possible and, preferably, on the day of receipt where transport damage is involved.",
        ],
      },
      {
        title: "11. Liability",
        paragraphs: [
          "Nothing in these Terms limits or excludes rights that cannot be limited or excluded under applicable law.",
          "Bio Sculpture Portugal is not responsible for delays or inability to deliver caused by events outside its reasonable control, including carrier delays, weather conditions, system failures, strikes, legal restrictions, force majeure, or actions attributable to the customer.",
        ],
      },
      {
        title: "12. Complaints",
        paragraphs: [
          "For questions relating to orders, payments, deliveries, exchanges, or returns, contact:",
        ],
        definitionList: [
          { label: "Company", value: "Bio Sculpture Portugal / BS Gel, Lda." },
          { label: "Email", value: "info@biosculpture.pt", href: "mailto:info@biosculpture.pt" },
          { label: "Telephone", value: "+351 935172295", href: "tel:+351935172295" },
          {
            label: "Address",
            value:
              "Rua Maria Eduarda Segura de Faria, Bloco 1, Loja 1S, 2615-354 Alverca do Ribatejo, Portugal",
          },
        ],
        afterBullets: [
          "The customer may also submit a complaint through the Electronic Complaints Book, available at livroreclamacoes.pt.",
        ],
      },
      {
        title: "13. Governing law",
        paragraphs: [
          "These General Terms of Sale and Shipping are governed by Portuguese law.",
          "Where the customer is a consumer, nothing in these Terms affects the mandatory rights conferred by applicable consumer-protection legislation.",
        ],
      },
      {
        title: "14. Updates",
        paragraphs: [
          "Bio Sculpture Portugal may update these General Terms of Sale and Shipping whenever necessary. The version applicable to each order is the one available on the Website on the date the order is submitted.",
        ],
      },
    ],
  },

  pt: {
    pageTitle: "Condições Gerais de Venda e Envio",
    effectiveDateLabel: "Em vigor desde",
    lastUpdatedLabel: "Última atualização",
    effectiveDate: "24 de setembro de 2026",
    lastUpdated: "24 de setembro de 2026",
    sections: [
      {
        title: "1. Identificação e âmbito",
        paragraphs: [
          "As presentes Condições Gerais de Venda e Envio regulam os direitos e obrigações das partes no âmbito das vendas realizadas através do website www.biosculpture.pt (o “Website”).",
          "Descrevem, nomeadamente, as condições aplicáveis à criação de conta, validação de clientes profissionais, realização de encomendas, pagamentos, expedição, entrega, devoluções, trocas e acompanhamento de encomendas.",
          "O Website é explorado por:",
        ],
        definitionList: [
          { label: "Empresa", value: "BS Gel, Lda." },
          {
            label: "Sede",
            value: "Rua José Cunha Bastos, LT 52 R/C Esq, 2650-453 Amadora",
          },
          { label: "NIF", value: "509040810" },
          { label: "Telefone", value: "+351 935172295", href: "tel:+351935172295" },
          { label: "Email", value: "info@biosculpture.pt", href: "mailto:info@biosculpture.pt" },
        ],
        afterBullets: [
          "Doravante designada por “Bio Sculpture Portugal”, “BS Gel, Lda.”, “nós”, “nos” ou “Vendedor”.",
          "Ao criar uma conta, efetuar uma encomenda ou utilizar o Website, o utilizador declara que leu, compreendeu e aceitou estas Condições Gerais de Venda e Envio, a Política de Privacidade, a Política de Cookies e as disposições de devolução constantes destas Condições.",
        ],
      },
      {
        title: "2. Clientes, produtos e território",
        paragraphs: [
          "O Website destina-se a pessoas maiores de 18 anos.",
          "A Bio Sculpture Portugal disponibiliza produtos para consumidores finais e produtos exclusivamente destinados a profissionais do setor da beleza, estética e unhas.",
          "Alguns produtos, incluindo géis, bases, builders, vernizes de gel e outros produtos de uso profissional, são reservados a profissionais com qualificação adequada.",
          "Para adquirir produtos profissionais, o utilizador poderá ter de:",
        ],
        bullets: [
          "Criar uma conta profissional",
          "Selecionar o tipo de certificação ou qualificação detida",
          "Enviar documento comprovativo da certificação",
          "Aguardar a validação da conta pela Bio Sculpture Portugal",
        ],
        afterBullets: [
          "A Bio Sculpture Portugal reserva-se o direito de solicitar informação adicional, aprovar, recusar, limitar, suspender ou rever o acesso a produtos profissionais sempre que necessário para verificar qualificações, prevenir utilização indevida ou cumprir regras de distribuição da marca.",
          "A venda e entrega de produtos é efetuada exclusivamente em território nacional, ou seja, para moradas localizadas em Portugal, incluindo Portugal Continental, Madeira e Açores, sujeitas ao serviço de entrega disponível no checkout.",
        ],
      },
      {
        title: "3. Encomendas",
        paragraphs: [
          "Para efetuar uma encomenda, o utilizador deve selecionar os produtos pretendidos, preencher os dados de faturação e entrega, indicar o NIF quando solicitado, escolher o método de pagamento e confirmar a encomenda.",
          "A confirmação da encomenda pelo cliente constitui uma proposta de compra. A aceitação da encomenda pela Bio Sculpture Portugal ocorre após confirmação do pagamento e envio da confirmação de encomenda ou expedição.",
          "A Bio Sculpture Portugal pode recusar, cancelar ou limitar uma encomenda nos seguintes casos:",
        ],
        bullets: [
          "Falta de stock ou indisponibilidade do produto",
          "Dados incompletos, incorretos ou impossibilidade de contacto com o cliente",
          "Morada de entrega fora de Portugal",
          "Pagamento não confirmado",
          "Erro manifesto de preço, stock, descrição ou configuração do produto",
          "Falta de certificação necessária para produtos profissionais",
          "Suspeita de fraude, uso abusivo, revenda não autorizada ou violação destas condições",
        ],
        afterBullets: [
          "Caso uma encomenda já paga seja cancelada por motivo imputável à Bio Sculpture Portugal, o valor pago pelos artigos não fornecidos será reembolsado.",
        ],
      },
      {
        title: "4. Preços",
        paragraphs: [
          "Os preços apresentados no Website são expressos em euros (€).",
          "Os preços incluem IVA à taxa legal em vigor.",
          "Os custos de envio, quando aplicáveis, são apresentados antes da confirmação final da encomenda.",
          "A Bio Sculpture Portugal pode atualizar os preços a qualquer momento. O preço aplicável é o indicado no Website no momento da submissão da encomenda, salvo erro manifesto.",
        ],
      },
      {
        title: "5. Modalidades de pagamento",
        paragraphs: [
          "As encomendas são sujeitas a regime de pronto pagamento.",
          "Os métodos de pagamento disponíveis podem incluir:",
        ],
        bullets: [
          "Pagamento com cartão através da Stripe",
          "Transferência bancária",
          "MB WAY",
          "Klarna",
          "Outros meios de pagamento apresentados no checkout, quando aplicáveis",
        ],
        afterBullets: [
          "Para pagamentos por transferência bancária, o cliente deverá indicar o número de encomenda como referência e enviar o comprovativo de pagamento para info@biosculpture.pt, se essa instrução for apresentada no Website ou comunicada pela Bio Sculpture Portugal.",
          "Para pagamentos por MB WAY, o cliente deverá seguir as instruções apresentadas no checkout e indicar o número de encomenda na descrição, quando tal for solicitado.",
          "A expedição da encomenda apenas será iniciada após confirmação efetiva do pagamento.",
          "Caso o pagamento não seja confirmado dentro do prazo comunicado ao cliente, a Bio Sculpture Portugal poderá cancelar a encomenda.",
        ],
      },
      {
        title: "6. Expedição e portes",
        paragraphs: [
          "As encomendas são expedidas para Portugal Continental e restantes zonas de Portugal abrangidas pelo serviço de entrega disponível no checkout, incluindo Madeira e Açores.",
          "A oferta de portes gratuitos aplica-se a encomendas destinadas a Portugal Continental, com valor superior a 115 € com IVA incluído, salvo indicação diferente no Website, em campanhas promocionais ou no checkout.",
          "Para Madeira e Açores, a oferta de portes gratuitos aplica-se a encomendas com valor superior a 185 € com IVA incluído, salvo indicação diferente no Website, em campanhas promocionais ou no checkout.",
          "Quando o valor da encomenda não cumpra as condições de portes gratuitos, os custos de envio aplicáveis serão apresentados antes da confirmação da encomenda.",
          "A Bio Sculpture Portugal procura expedir as encomendas até 4 dias úteis após a confirmação do pagamento, salvo indisponibilidade de stock, períodos promocionais, feriados, força maior ou outra circunstância fora do nosso controlo razoável.",
          "O prazo de expedição não corresponde necessariamente ao prazo de entrega pela transportadora.",
        ],
      },
      {
        title: "7. Entrega e seguimento",
        paragraphs: [
          "As entregas são efetuadas exclusivamente através de CTT Expresso, salvo indicação expressa em contrário no checkout ou comunicação enviada ao cliente.",
          "As entregas são normalmente realizadas em dias úteis, entre as 09h00 e as 19h00, de acordo com os procedimentos, rotas e horários da transportadora.",
          "Após a expedição, o cliente receberá um código de rastreio ou outro meio de acompanhamento da encomenda.",
          "O cliente é responsável por:",
        ],
        bullets: [
          "Acompanhar o estado da encomenda através do código de rastreio",
          "Garantir que a morada, contacto telefónico e email indicados estão corretos",
          "Assegurar que existe alguém disponível para receber a encomenda, quando necessário",
          "Respeitar os prazos de levantamento ou de reagendamento definidos pela CTT Expresso",
        ],
        afterBullets: [
          "A Bio Sculpture Portugal não é responsável por atrasos, tentativas de entrega falhadas ou devoluções causadas por dados incorretos, ausência do destinatário, falta de levantamento, instruções insuficientes ou outras circunstâncias imputáveis ao cliente.",
        ],
      },
      {
        title: "8. Receção e verificação da encomenda",
        paragraphs: ["No momento da entrega, o cliente deve verificar:"],
        bullets: [
          "O estado exterior da embalagem",
          "O número de volumes entregues",
          "A eventual existência de sinais de dano, violação, humidade, abertura ou falta de volumes",
        ],
        afterBullets: [
          "Se detetar uma anomalia, o cliente deverá, sempre que possível:",
        ],
      },
      {
        title: "8.1 Em caso de anomalia",
        bullets: [
          "Registar a anomalia na guia ou dispositivo de entrega da transportadora",
          "Indicar “Sujeito a conferência” antes de assinar a receção, quando não seja possível verificar totalmente a encomenda no momento",
          "Tirar fotografias claras da embalagem, etiqueta de transporte e danos visíveis",
          "Contactar a Bio Sculpture Portugal no próprio dia através de info@biosculpture.pt",
        ],
        afterBullets: [
          "Esta obrigação de verificação ajuda a resolver rapidamente incidentes de transporte, mas não limita os direitos legais do consumidor ou cliente em caso de produto defeituoso, incorreto ou não conforme.",
        ],
      },
      {
        title: "9. Encomendas devolvidas e reenvios",
        paragraphs: [
          "Se uma encomenda for devolvida à Bio Sculpture Portugal por motivo imputável ao cliente, incluindo morada incorreta, dados incompletos, ausência repetida, recusa injustificada, falta de levantamento ou incumprimento das instruções da transportadora, poderá ser cobrado um novo custo de transporte para reenvio.",
          "O reenvio só será efetuado depois de confirmado o pagamento dos novos custos de transporte, quando aplicável.",
          "Caso o cliente não pretenda o reenvio, a encomenda poderá ser tratada como pedido de devolução, de acordo com as disposições de devolução destas Condições e com os direitos legalmente aplicáveis.",
        ],
      },
      {
        id: "returns",
        title: "10. Devoluções, trocas e produtos não conformes",
        paragraphs: [
          "As devoluções e trocas são reguladas pelas disposições de devolução constantes destas Condições e disponibilizadas no Website.",
          "Os clientes consumidores que efetuem compras online beneficiam, em regra, do direito de livre resolução no prazo de 14 dias de calendário após a receção dos bens, sem necessidade de indicar motivo, sujeito às exceções legalmente previstas. O Decreto-Lei n.º 24/2014 regula os contratos celebrados à distância e prevê esse período de resolução.",
          "Produtos cosméticos ou de higiene selados podem ficar excluídos do direito de livre resolução quando tenham sido abertos ou desselados após a entrega e não sejam adequados à devolução por razões de proteção da saúde ou higiene. Isto não prejudica os direitos legais relacionados com produtos defeituosos, danificados, incorretos ou não conformes.",
          "Para comunicar um produto danificado, incorreto ou com qualquer falta de conformidade, o cliente deve contactar info@biosculpture.pt logo que possível e, preferencialmente, no próprio dia de receção quando se trate de dano de transporte.",
        ],
      },
      {
        title: "11. Responsabilidade",
        paragraphs: [
          "Nada nestas Condições limita ou exclui direitos que não possam ser limitados ou excluídos nos termos da lei aplicável.",
          "A Bio Sculpture Portugal não é responsável por atrasos ou impossibilidade de entrega causados por eventos fora do seu controlo razoável, incluindo atrasos de transportadora, condições meteorológicas, falhas de sistemas, greves, restrições legais, força maior ou ações imputáveis ao cliente.",
        ],
      },
      {
        title: "12. Reclamações",
        paragraphs: [
          "Para questões relacionadas com encomendas, pagamentos, entregas, trocas ou devoluções, contacte:",
        ],
        definitionList: [
          { label: "Empresa", value: "Bio Sculpture Portugal / BS Gel, Lda." },
          { label: "Email", value: "info@biosculpture.pt", href: "mailto:info@biosculpture.pt" },
          { label: "Telefone", value: "+351 935172295", href: "tel:+351935172295" },
          {
            label: "Morada",
            value:
              "Rua Maria Eduarda Segura de Faria, Bloco 1, Loja 1S, 2615-354 Alverca do Ribatejo, Portugal",
          },
        ],
        afterBullets: [
          "O cliente pode igualmente apresentar reclamação através do Livro de Reclamações Eletrónico, disponível em livroreclamacoes.pt.",
        ],
      },
      {
        title: "13. Lei aplicável",
        paragraphs: [
          "Estas Condições Gerais de Venda e Envio são regidas pela lei portuguesa.",
          "Quando o cliente seja consumidor, nada nestas Condições afeta os direitos imperativos que lhe sejam conferidos pela legislação de proteção do consumidor aplicável.",
        ],
      },
      {
        title: "14. Atualizações",
        paragraphs: [
          "A Bio Sculpture Portugal pode atualizar estas Condições Gerais de Venda e Envio sempre que necessário. A versão aplicável a cada encomenda é a que estiver disponível no Website na data em que a encomenda for submetida.",
        ],
      },
    ],
  },
};
