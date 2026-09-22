import { DEFAULT_LANG, LEGAL_SLUGS, legalPath, normalizeLang, type LegalSlug } from "./i18n/locales";

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  seoTitle: string;
  seoDescription: string;
  lead: string;
  updated: string;
  sections: LegalSection[];
};

export type LegalNavItem = { slug: LegalSlug; href: string; label: string };

type LegalPack = {
  nav: Record<LegalSlug, string>;
  updated: string;
  kicker: string;
  docs: Record<LegalSlug, Omit<LegalDoc, "slug" | "updated">>;
};

const EN: LegalPack = {
  nav: {
    terms: "Terms",
    gdpr: "GDPR",
    "data-policy": "Privacy policy",
    "code-of-conduct": "Code of conduct",
  },
  updated: "22 September 2026",
  kicker: "Legal",
  docs: {
    terms: {
      title: "Terms of use",
      seoTitle: "Terms of use | Circuitbull®",
      seoDescription:
        "Terms of use for circuitbull.com — catalog, quotes, intellectual property, export compliance, and Delaware governing law.",
      lead: "These terms govern your use of circuitbull.com, the Circuitbull® catalog, and any quote or briefing you request from Volls Global Inc. Browsing this site is not a consumer purchase.",
      sections: [
        {
          heading: "Who we are",
          paragraphs: [
            "The site is operated by Volls Global Inc, a Delaware corporation, trading as Circuitbull® (trademark registered). Registered office: 1207 Delaware Ave #5352, Wilmington, DE 19806, United States. Contact: info@circuitbull.com · +1 276 600 2052.",
            "Circuitbull® fields Made in USA IoT, SCADA, and carbon live monitoring. Thermal and EO/IR cameras listed in the catalog are sourced sensors. We do not claim those cameras are manufactured in the United States.",
          ],
        },
        {
          heading: "Catalog and quotes",
          paragraphs: [
            "Datasheets, ranges, images, and specifications are published to help you specify a mission. They may change without notice. A page on this site is not an offer, a stock commitment, or a binding price.",
            "A quote, protocol, or G2G briefing starts only when we confirm it in writing after you submit a request. Until then, nothing on the site creates a sale, a financing commitment, or an authorized-seller appointment.",
          ],
        },
        {
          heading: "Acceptable use",
          paragraphs: [
            "You may use the site to review platforms, request a brief, and evaluate a mission. You may not scrape the catalog in a way that degrades the service, misrepresent affiliation with Circuitbull®, or use the materials to bid as if you were Volls Global Inc.",
            "Export, sanctions, and end-use rules apply to many platforms in this catalog. You are responsible for lawful use in your jurisdiction. We may refuse a request that we cannot support under US or applicable local law.",
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "Circuitbull®, the bull mark, site copy, and original graphics are owned by Volls Global Inc. Catalog photographs, datasheets, and third-party marks remain the property of their owners. You may not copy the catalog wholesale or remove trademarks.",
            "Stock photography used on solution pages is licensed for this site (including Pexels images credited on the page). It is not a depiction of a specific customer installation unless we say so.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "The site is provided as-is for professional buyers, ministries, and integrators. To the fullest extent permitted by law, Volls Global Inc is not liable for indirect, incidental, or consequential loss arising from use of the site or from relying on a catalog figure that has not been confirmed in a written quote.",
            "Nothing in these terms limits liability that cannot be limited under Delaware or other mandatory law, including fraud.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law rules. Exclusive venue is the state or federal courts in Wilmington, Delaware, except where a mandatory consumer or public-procurement forum applies.",
            "If a provision is unenforceable, the rest remains in force. We may update these terms; the date above is the current version. Continued use of the site after an update constitutes acceptance.",
          ],
        },
      ],
    },
    gdpr: {
      title: "GDPR notice",
      seoTitle: "GDPR | Circuitbull®",
      seoDescription:
        "GDPR notice for EEA and UK visitors to circuitbull.com — controller, lawful bases, rights, transfers, and how to contact Volls Global Inc.",
      lead: "If you are in the European Economic Area or the United Kingdom, this notice explains how Volls Global Inc processes personal data when you use circuitbull.com or request a quote.",
      sections: [
        {
          heading: "Controller",
          paragraphs: [
            "The controller is Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, United States. Email: info@circuitbull.com. Telephone: +1 276 600 2052.",
            "We have no establishment in the EEA. We have not appointed an Article 27 representative unless a later version of this notice names one. You may still exercise GDPR rights by writing to the controller.",
          ],
        },
        {
          heading: "What we process and why",
          paragraphs: [
            "When you send a brief we process name, email, phone, company, country, mission interest, and message. Lawful bases: steps at your request before a contract (Art. 6(1)(b)) and our legitimate interest in answering a professional inquiry (Art. 6(1)(f)).",
            "We store locale cookies (cb_lang, cb_country) so the site stays in the language and market you chose. That is a strictly necessary preference, not advertising. Server logs (IP, user-agent, path) are processed for security and abuse prevention (Art. 6(1)(f)).",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You may request access, rectification, erasure, restriction, portability, and objection. You may withdraw consent where processing was based on consent. You may lodge a complaint with your local supervisory authority (for example the ICO in the UK, or the authority in your EU member state).",
            "We respond without undue delay and within one month, extendable as GDPR allows for complex requests. Write to info@circuitbull.com with the subject “GDPR”. We may need to verify identity before acting.",
          ],
        },
        {
          heading: "Transfers outside the EEA",
          paragraphs: [
            "Volls Global Inc is in the United States. Hosting and delivery run on Cloudflare. Transactional email uses Amazon SES in eu-central-1. Catalog search embeddings may be stored in Qdrant in the EU. WhatsApp Business messages, if you ask us to ping a number, are processed by Meta.",
            "Where GDPR requires a transfer tool, we rely on the European Commission’s standard contractual clauses with our processors, plus the UK IDTA / Addendum where UK GDPR applies. We do not sell personal data.",
          ],
        },
        {
          heading: "Retention and children",
          paragraphs: [
            "Quote records are kept for as long as needed to complete the inquiry and for a reasonable audit window (typically up to 24 months unless a contract, export file, or legal hold requires longer). Locale cookies last up to 12 months.",
            "This site is for professional and governmental buyers. We do not knowingly collect data from children.",
          ],
        },
      ],
    },
    "data-policy": {
      title: "Privacy policy",
      seoTitle: "Privacy policy | Circuitbull®",
      seoDescription:
        "Privacy policy for circuitbull.com and the Circuitbull app — what Volls Global Inc collects, processors, cookies, CCPA, KVKK, and how to request your data.",
      lead: "This privacy policy describes how Volls Global Inc handles personal data on circuitbull.com and in the Circuitbull application: quotes, locale preferences, security logs, and the vendors that help us run the catalog.",
      sections: [
        {
          heading: "Scope",
          paragraphs: [
            "It covers the public site, contact and partner forms, WhatsApp “ping me” requests, and related email. It does not replace a data-processing agreement for a fielded IoT/SCADA deployment — that is written into the program contract.",
            "Related pages: GDPR notice (EEA/UK rights), Terms of use, and Code of conduct. California residents also have CCPA/CPRA rights described below. Visitors in Türkiye may also rely on KVKK.",
          ],
        },
        {
          heading: "Data we collect",
          paragraphs: [
            "You provide: name, email, telephone, company, country, product or mission interest, and free-text message. If you leave a WhatsApp number, we use it only to send the requested seller or HQ ping.",
            "We collect automatically: pages viewed, approximate country from CDN, browser language, and the locale cookies you set (cb_lang, cb_country). We do not run advertising pixels or sell lists.",
          ],
        },
        {
          heading: "How we use it",
          paragraphs: [
            "To answer a quote, route you to an appointed seller where one exists, send transactional email, keep the site in your language, improve catalog search, and protect the service against abuse.",
            "We do not use your brief to train public generative models. Internal retrieval for “similar platforms” uses catalog text and embeddings, not your private message history as a public dataset.",
          ],
        },
        {
          heading: "Processors",
          paragraphs: [
            "Cloudflare (Workers, KV, R2, CDN) hosts the site. Amazon SES (eu-central-1) sends notification mail. Redis may cache search and filter copy. Qdrant may store catalog embeddings. MongoDB Atlas holds catalog records. Meta processes WhatsApp Cloud API messages when you opt in to a ping.",
            "These vendors process data on our instructions. We do not authorize them to use Circuitbull inquiry data for their own marketing.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "cb_lang and cb_country remember country and language. They are first-party, SameSite=Lax, and last up to one year. The site does not set tracking cookies for ads.",
            "You can delete cookies in your browser. If you do, the language selector may ask again. Strictly necessary cookies do not require a marketing opt-in under ePrivacy when they only store a locale choice you made.",
          ],
        },
        {
          heading: "US, California, and Türkiye",
          paragraphs: [
            "We do not sell or share personal information as those terms are defined in the CCPA/CPRA. California residents may request know, delete, and correct. We will not discriminate for exercising those rights. Email info@circuitbull.com with the subject “Privacy”.",
            "For KVKK: Volls Global Inc is the data controller for site inquiries. You may apply to us for KVKK Art. 11 rights at the same address. We process inquiry data to respond to your request and to take pre-contractual steps.",
          ],
        },
        {
          heading: "Security and requests",
          paragraphs: [
            "Transport is HTTPS. Access to lead records is limited to Circuitbull operations. No method is perfect; notify us promptly at info@circuitbull.com if you believe an account or message was exposed.",
            "To access or delete inquiry data, email the address you used on the form. We may refuse a request that is unfounded, excessive, or blocked by law (for example an export-control file we must retain).",
          ],
        },
      ],
    },
    "code-of-conduct": {
      title: "Code of conduct",
      seoTitle: "Code of conduct | Circuitbull®",
      seoDescription:
        "Circuitbull® code of conduct — integrity, anti-bribery, export control, fair dealing, and how to report a concern to Volls Global Inc.",
      lead: "Volls Global Inc holds Circuitbull® to a single standard: honest catalog, lawful export, no bribes, and fair dealing with ministries, partners, and suppliers.",
      sections: [
        {
          heading: "Integrity of the catalog",
          paragraphs: [
            "We do not claim cameras are Made in USA. IoT, SCADA, and carbon live monitoring that we design are. Datasheet numbers must match the file we publish. If we cannot support a spec, we say so before a quote is confirmed.",
            "Marketing may be direct. It may not be false. Appointed sellers may not rebadge Circuitbull® copy as their manufacture without our written consent.",
          ],
        },
        {
          heading: "Anti-bribery and public officials",
          paragraphs: [
            "We prohibit bribes, kickbacks, and facilitation payments, including through partners, family members, or “consultants” with no genuine service. This includes the US Foreign Corrupt Practices Act and equivalent local laws.",
            "Gifts, travel, and hospitality to public officials require prior written approval from Volls Global Inc and must be modest, legal, and recorded. Cash and cash-equivalents are never acceptable.",
          ],
        },
        {
          heading: "Sanctions and export",
          paragraphs: [
            "Thermal, EO/IR, and related platforms can be export-controlled. We do not support dealings that violate US sanctions, embargoes, or denied-party lists, or that disguise end-use or end-user.",
            "Partners and buyers must give accurate end-use information. We will stop a process if the file is incomplete or the destination is prohibited.",
          ],
        },
        {
          heading: "Partners and competition",
          paragraphs: [
            "Appointed sellers are selected and listed by us. They must not pay for a listing with anything other than the published partner process. We do not tolerate bid-rigging, cover quotes, or defamation of competitors.",
            "Confidential briefing material stays confidential. We expect the same from ministries, primes, and distributors who receive a Circuitbull® protocol.",
          ],
        },
        {
          heading: "People and reporting",
          paragraphs: [
            "Harassment, discrimination, and retaliation are not tolerated in Circuitbull work, events, or partner channels. We expect professional conduct on customer sites.",
            "Report a concern to info@circuitbull.com with the subject “Conduct”. Good-faith reports are protected from retaliation. We investigate and keep records as the matter requires. This code does not create a third-party employment contract.",
          ],
        },
      ],
    },
  },
};

const TR: LegalPack = {
  nav: {
    terms: "Şartlar",
    gdpr: "GDPR",
    "data-policy": "Veri politikası",
    "code-of-conduct": "Davranış kuralları",
  },
  updated: "22 Eylül 2026",
  kicker: "Hukuki",
  docs: {
    terms: {
      title: "Kullanım şartları",
      seoTitle: "Kullanım şartları | Circuitbull®",
      seoDescription:
        "circuitbull.com kullanım şartları — katalog, teklif, fikri mülkiyet, ihracat uyumu ve Delaware hukuku.",
      lead: "Bu şartlar circuitbull.com’u, Circuitbull® kataloğunu ve Volls Global Inc’ten talep ettiğiniz teklif veya brifingi kapsar. Siteyi gezmek tüketici satışı değildir.",
      sections: [
        {
          heading: "Kimiz",
          paragraphs: [
            "Siteyi Delaware şirketi Volls Global Inc işletir; ticari marka Circuitbull® tescillidir. Adres: 1207 Delaware Ave #5352, Wilmington, DE 19806, ABD. İletişim: info@circuitbull.com · +1 276 600 2052.",
            "Circuitbull® Made in USA IoT, SCADA ve canlı karbon izleme sahaya sürer. Katalogdaki termal ve EO/IR kameralar tedarik edilen sensörlerdir. Bu kameraların ABD’de üretildiğini iddia etmeyiz.",
          ],
        },
        {
          heading: "Katalog ve teklif",
          paragraphs: [
            "Datasheet, menzil, görsel ve teknik değerler görevi speklemeniz içindir; önceden haber vermeden değişebilir. Bir sayfa teklif, stok taahhüdü veya bağlayıcı fiyat değildir.",
            "Teklif, protokol veya G2G brifing ancak talep sonrası yazılı teyidimizle başlar. O ana kadar sitedeki hiçbir şey satış, finansman taahhüdü veya yetkili satıcı ataması doğurmaz.",
          ],
        },
        {
          heading: "Kabul edilebilir kullanım",
          paragraphs: [
            "Siteyi platform incelemek, brifing istemek ve görev değerlendirmek için kullanabilirsiniz. Katalogu hizmeti bozacak şekilde taramayın, Circuitbull® ile bağınızı yanlış göstermeyin, malzemeyi Volls Global Inc imişsiniz gibi teklife çevirmeyin.",
            "Birçok platform ihracat, yaptırım ve son kullanım kurallarına tabidir. Kendi yargı alanınızdaki hukuka siz sorumlusunuz. ABD veya uygulanabilir yerel hukuka aykırı talebi reddedebiliriz.",
          ],
        },
        {
          heading: "Fikri mülkiyet",
          paragraphs: [
            "Circuitbull®, boğa markası, site metni ve özgün grafikler Volls Global Inc’e aittir. Katalog fotoğrafları, datasheet’ler ve üçüncü taraf markalar sahiplerinde kalır. Kataloğu toptan kopyalayamaz, markaları silemezsiniz.",
            "Çözüm sayfalarındaki stok fotoğraflar (Pexels dahil, sayfada belirtilir) bu site için lisanslıdır. Aksi yazılmadıkça belirli bir müşteri sahasını göstermez.",
          ],
        },
        {
          heading: "Sorumluluk",
          paragraphs: [
            "Site profesyonel alıcı, bakanlık ve entegratörler içindir. Yasaların izin verdiği ölçüde Volls Global Inc, siteden veya yazılı teklifle teyit edilmemiş katalog değerine dayanmadan doğan dolaylı zarardan sorumlu değildir.",
            "Delaware veya diğer emredici hukukun sınırlanamayacağı sorumluluk (dolandırıcılık dahil) bu metinle kaldırılmaz.",
          ],
        },
        {
          heading: "Uygulanacak hukuk",
          paragraphs: [
            "Bu şartlara ABD Delaware Eyaleti hukuku uygulanır. Yetkili yargı yeri, emredici tüketici veya kamu alımı forumu yoksa Wilmington, Delaware mahkemeleridir.",
            "Bir madde geçersizse diğeri yürürlükte kalır. Şartları güncelleyebiliriz; yukarıdaki tarih güncel sürümdür. Güncellemeden sonra siteyi kullanmak kabul sayılır.",
          ],
        },
      ],
    },
    gdpr: {
      title: "GDPR bildirimi",
      seoTitle: "GDPR | Circuitbull®",
      seoDescription:
        "circuitbull.com AEA ve Birleşik Krallık ziyaretçileri için GDPR bildirimi — veri sorumlusu, hukuki sebepler, haklar ve aktarımlar.",
      lead: "Avrupa Ekonomik Alanı veya Birleşik Krallık’taysanız, bu bildirim circuitbull.com’u kullanırken veya teklif isterken Volls Global Inc’in kişisel veriyi nasıl işlediğini açıklar.",
      sections: [
        {
          heading: "Veri sorumlusu",
          paragraphs: [
            "Sorumlu: Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, ABD. E-posta: info@circuitbull.com. Telefon: +1 276 600 2052.",
            "AEA’da kuruluşumuz yoktur. Bu bildirimin sonraki bir sürümü adını yazmadıkça Madde 27 temsilcisi atanmamıştır. GDPR haklarınızı yine sorumluza yazarak kullanabilirsiniz.",
          ],
        },
        {
          heading: "Ne işliyoruz ve neden",
          paragraphs: [
            "Brifing gönderdiğinizde ad, e-posta, telefon, şirket, ülke, görev ilgisi ve mesajı işleriz. Hukuki sebepler: sözleşme öncesi sizin talebiniz (m. 6(1)(b)) ve mesleki soruyu yanıtlama meşru menfaatimiz (m. 6(1)(f)).",
            "cb_lang ve cb_country çerezleri seçtiğiniz dil ve pazarı tutar; reklam değildir, zorunlu tercihtir. Sunucu günlükleri (IP, tarayıcı, yol) güvenlik ve kötüye kullanım için işlenir (m. 6(1)(f)).",
          ],
        },
        {
          heading: "Haklarınız",
          paragraphs: [
            "Erişim, düzeltme, silme, kısıtlama, taşınabilirlik ve itiraz talep edebilirsiniz. Rızaya dayalı işlemde rızayı geri çekebilirsiniz. Yerel denetim otoritesine (ör. İngiltere ICO veya AB üye devletiniz) şikayet edebilirsiniz.",
            "Gereksiz gecikme olmaksızın, kural olarak bir ay içinde yanıtlarız. Konu satırına “GDPR” yazıp info@circuitbull.com adresine e-posta atın. İşlemden önce kimlik teyidi isteyebiliriz.",
          ],
        },
        {
          heading: "AEA dışına aktarım",
          paragraphs: [
            "Volls Global Inc ABD’dedir. Barındırma Cloudflare üzerindedir. İş e-postası Amazon SES eu-central-1 kullanır. Katalog gömme vektörleri AB’de Qdrant’ta tutulabilir. WhatsApp ping’i istediğinizde Meta işler.",
            "GDPR aktarım aracı gerektiğinde işlemcilerimizle Komisyon standart sözleşmeleri ve UK GDPR için IDTA / ek kullanılır. Kişisel veriyi satmayız.",
          ],
        },
        {
          heading: "Saklama ve çocuklar",
          paragraphs: [
            "Teklif kayıtları sorguyu bitirmek ve makul denetim için (sözleşme, ihracat dosyası veya yasal tutma yoksa kural olarak 24 aya kadar) saklanır. Dil çerezleri en fazla 12 aydır.",
            "Site profesyonel ve kamu alıcıları içindir. Çocuklardan bilerek veri toplamayız.",
          ],
        },
      ],
    },
    "data-policy": {
      title: "Veri politikası",
      seoTitle: "Veri politikası | Circuitbull®",
      seoDescription:
        "Circuitbull® veri ve gizlilik politikası — toplanan veri, işlemciler, çerezler, CCPA, KVKK ve talep hakkı.",
      lead: "Bu politika Volls Global Inc’in circuitbull.com’da kişisel veriyi nasıl işlediğini anlatır: teklif, dil tercihi, güvenlik günlükleri ve kataloğu çalıştıran tedarikçiler.",
      sections: [
        {
          heading: "Kapsam",
          paragraphs: [
            "Kamuya açık site, iletişim ve iş ortağı formları, WhatsApp “yazın” talepleri ve ilgili e-postayı kapsar. Sahaya sürülen IoT/SCADA için ayrı bir veri işleme sözleşmesinin yerini tutmaz; o program sözleşmesine yazılır.",
            "İlgili sayfalar: GDPR bildirimi, kullanım şartları, davranış kuralları. Kaliforniya sakinleri için CCPA/CPRA; Türkiye’deki ziyaretçiler için KVKK da geçerlidir.",
          ],
        },
        {
          heading: "Topladığımız veri",
          paragraphs: [
            "Sizin verdiğiniz: ad, e-posta, telefon, şirket, ülke, ürün veya görev ilgisi, serbest metin. WhatsApp numarası bırakırsanız yalnızca istediğiniz satıcı veya merkez ping’i için kullanılır.",
            "Otomatik: görülen sayfalar, CDN ülke tahmini, tarayıcı dili, cb_lang ve cb_country. Reklam pikseli çalıştırmayız, liste satmayız.",
          ],
        },
        {
          heading: "Nasıl kullanırız",
          paragraphs: [
            "Teklifi yanıtlamak, varsa atanan satıcıya yönlendirmek, iş e-postası göndermek, siteyi dilinizde tutmak, katalog aramasını iyileştirmek ve kötüye kullanıma karşı korumak.",
            "Brifinginizi kamuya açık üretici modelleri eğitmek için kullanmayız. “Benzer platform” araması katalog metni ve gömmeleriyledir; özel mesaj geçmişiniz açık veri seti değildir.",
          ],
        },
        {
          heading: "İşlemciler",
          paragraphs: [
            "Cloudflare (Workers, KV, R2, CDN) siteyi barındırır. Amazon SES (eu-central-1) bildirim postası gönderir. Redis arama/filtre kopyasını önbellekleyebilir. Qdrant katalog gömmelerini tutabilir. MongoDB Atlas katalog kayıtlarını tutar. Ping’e izin verdiğinizde Meta WhatsApp Cloud API’yi işler.",
            "Bu tedarikçiler talimatımızla işler. Circuitbull sorgu verisini kendi pazarlamalarında kullanma yetkisi vermeyiz.",
          ],
        },
        {
          heading: "Çerezler",
          paragraphs: [
            "cb_lang ve cb_country ülke ve dili hatırlar. Birinci taraf, SameSite=Lax, en fazla bir yıl. Reklam takip çerezi yoktur.",
            "Tarayıcıdan silebilirsiniz; dil seçici yeniden sorabilir. Yalnızca sizin yaptığınız dil tercihini tutan zorunlu çerezler için pazarlama onayı gerekmez.",
          ],
        },
        {
          heading: "ABD, Kaliforniya ve Türkiye",
          paragraphs: [
            "CCPA/CPRA anlamında kişisel bilgi satmaz veya paylaşmayız. Kaliforniya sakinleri bilme, silme ve düzeltme isteyebilir. Hak kullanımı nedeniyle ayrımcılık yapmayız. Konu: “Privacy”, info@circuitbull.com.",
            "KVKK: Site sorguları için veri sorumlusu Volls Global Inc’tir. m. 11 hakları için aynı adrese başvurabilirsiniz. Sorgu verisini talebinize cevap ve sözleşme öncesi adımlar için işleriz.",
          ],
        },
        {
          heading: "Güvenlik ve talepler",
          paragraphs: [
            "İletim HTTPS’tir. Teklif kayıtlarına erişim Circuitbull operasyonuyla sınırlıdır. Yöntem kusursuz değildir; mesajın sızdığını düşünüyorsanız info@circuitbull.com yazın.",
            "Sorgu verisine erişmek veya silmek için formdaki e-postadan yazın. Temelsiz, aşırı veya kanunen tutulması gereken (ör. ihracat dosyası) talebi reddedebiliriz.",
          ],
        },
      ],
    },
    "code-of-conduct": {
      title: "Davranış kuralları",
      seoTitle: "Davranış kuralları | Circuitbull®",
      seoDescription:
        "Circuitbull® davranış kuralları — dürüstlük, rüşvet yasağı, ihracat, adil ticaret ve bildirim.",
      lead: "Volls Global Inc, Circuitbull® için tek standart tutar: dürüst katalog, yasal ihracat, rüşvet yok, bakanlık, iş ortağı ve tedarikçiyle adil ilişki.",
      sections: [
        {
          heading: "Katalog dürüstlüğü",
          paragraphs: [
            "Kameraların Made in USA olduğunu iddia etmeyiz. Tasarladığımız IoT, SCADA ve canlı karbon izleme öyledir. Datasheet rakamı yayımladığımız dosyayla örtüşmelidir. Speki destekleyemiyorsak teklif teyidinden önce söyleriz.",
            "Pazarlama doğrudan olabilir, yanlış olamaz. Atanan satıcılar Circuitbull® metnini yazılı iznimiz olmadan kendi imalatı gibi sunamaz.",
          ],
        },
        {
          heading: "Rüşvet ve kamu görevlileri",
          paragraphs: [
            "Rüşvet, komisyon ve kolaylaştırıcı ödemeler — iş ortağı, aile veya sahte “danışman” yoluyla dahil — yasaktır. ABD FCPA ve eşdeğer yerel yasalar dahildir.",
            "Kamu görevlisine hediye, seyahat ve ağırlama önceden yazılı Volls Global Inc onayı ister; mütevazı, yasal ve kayıtlı olmalıdır. Nakit ve nakit benzeri asla kabul edilmez.",
          ],
        },
        {
          heading: "Yaptırım ve ihracat",
          paragraphs: [
            "Termal, EO/IR ve ilgili platformlar ihracat kontrolüne tabi olabilir. ABD yaptırımı, ambargo veya yasaklı taraf listesini ihlal eden, son kullanım veya kullanıcıyı gizleyen işe destek vermeyiz.",
            "İş ortakları ve alıcılar doğru son kullanım bilgisi vermelidir. Dosya eksikse veya varış yasaklıysa süreci durdururuz.",
          ],
        },
        {
          heading: "İş ortakları ve rekabet",
          paragraphs: [
            "Atanan satıcıları biz seçer ve listeleriz. Yayınlanmış ortaklık süreci dışında liste için ödeme alınmaz. İhale manipülasyonu, örtü teklif ve rakip karalama kabul edilmez.",
            "Gizli brifing gizli kalır. Circuitbull® protokolü alan bakanlık, ana yüklenici ve dağıtıcıdan aynı özeni bekleriz.",
          ],
        },
        {
          heading: "İnsanlar ve bildirim",
          paragraphs: [
            "Circuitbull işi, etkinlik ve iş ortağı kanallarında taciz, ayrımcılık ve misilleme yoktur. Müşteri sahasında profesyonel davranış bekleriz.",
            "Endişeyi konu “Conduct” ile info@circuitbull.com adresine yazın. İyi niyetli bildirim misillemeden korunur. Bu metin üçüncü kişi iş sözleşmesi doğurmaz.",
          ],
        },
      ],
    },
  },
};

function overlay(
  base: LegalPack,
  nav: LegalPack["nav"],
  kicker: string,
  updated: string,
  docs: LegalPack["docs"]
): LegalPack {
  return { nav, kicker, updated, docs: { ...base.docs, ...docs } };
}

const PACKS: Record<string, LegalPack> = {
  en: EN,
  tr: TR,
  ar: overlay(EN, {
    terms: "الشروط",
    gdpr: "GDPR",
    "data-policy": "سياسة البيانات",
    "code-of-conduct": "مدونة السلوك",
  }, "قانوني", "22 سبتمبر 2026", {
    terms: {
      title: "شروط الاستخدام",
      seoTitle: "شروط الاستخدام | Circuitbull®",
      seoDescription: "شروط استخدام circuitbull.com — الكتالوج والعروض والملكية الفكرية والامتثال للتصدير وقانون ديلاوير.",
      lead: "تحكم هذه الشروط استخدامك لـ circuitbull.com وكتالوج Circuitbull® وأي عرض أو إحاطة تطلبها من Volls Global Inc. تصفح الموقع ليس شراءً استهلاكياً.",
      sections: EN.docs.terms.sections.map((s, i) => ({
        heading: ["من نحن", "الكتالوج والعروض", "الاستخدام المقبول", "الملكية الفكرية", "المسؤولية", "القانون الواجب"][i],
        paragraphs: [
          [
            "يشغّل الموقع Volls Global Inc، شركة في ديلاوير، بالعلامة التجارية المسجلة Circuitbull®. المقر: 1207 Delaware Ave #5352, Wilmington, DE 19806, الولايات المتحدة. info@circuitbull.com · +1 276 600 2052.",
            "Circuitbull® ينشر إنترنت الأشياء وSCADA ومراقبة الكربون المصنوعة في الولايات المتحدة. كاميرات الحراري وEO/IR في الكتالوج مستشعرات مورَّدة. لا ندّعي تصنيع تلك الكاميرات في الولايات المتحدة.",
          ],
          [
            "تُنشر ورقة البيانات والمدى والصور للمساعدة في تحديد المهمة. قد تتغير دون إشعار. الصفحة ليست عرضاً أو التزام مخزون أو سعراً ملزماً.",
            "يبدأ العرض أو البروتوكول أو إحاطة الحكومة بعد تأكيدنا الخطي فقط. حتى ذلك الحين لا ينشئ الموقع بيعاً أو تمويلاً أو تعيين موزّع.",
          ],
          [
            "يجوز استخدام الموقع لمراجعة المنصات وطلب إحاطة. يُحظر كشط الكتالوج بما يضر الخدمة أو انتحال صفة Circuitbull®.",
            "تسري قواعد التصدير والعقوبات والاستخدام النهائي على كثير من المنصات. أنت مسؤول عن الشرعية في ولايتك. قد نرفض طلباً لا يمكننا دعمه بموجب القانون الأمريكي أو المحلي.",
          ],
          [
            "Circuitbull® والعلامة والنصوص الأصلية ملك Volls Global Inc. صور الكتالوج وعلامات الغير تبقى لأصحابها.",
            "صور المخزون في صفحات الحلول مرخَّصة لهذا الموقع (بما فيها Pexels عند ذكر المصدر) وليست بالضرورة موقعاً لعميل معيّن.",
          ],
          [
            "يُقدَّم الموقع كما هو للمشترين المحترفين والوزارات. في أقصى حد يسمح به القانون لا تُسأل Volls Global Inc عن خسارة غير مباشرة من الاعتماد على رقم كتالوج غير مؤكد كتابياً.",
            "لا تحد هذه الشروط مسؤولية لا يجوز الحد منها، بما في ذلك الاحتيال.",
          ],
          [
            "يسري قانون ولاية ديلاوير، الولايات المتحدة. الاختصاص لمحاكم ويلمنغتون إلا حيث يفرض منتدى إلزامي.",
            "إذا بطل بند يبقى الباقي. قد نحدّث الشروط؛ التاريخ أعلاه هو النسخة الحالية.",
          ],
        ][i],
      })),
    },
    gdpr: {
      title: "إشعار GDPR",
      seoTitle: "GDPR | Circuitbull®",
      seoDescription: "إشعار GDPR لزوار المنطقة الاقتصادية الأوروبية والمملكة المتحدة — المتحكم والأسس القانونية والحقوق والنقل.",
      lead: "إذا كنت في المنطقة الاقتصادية الأوروبية أو المملكة المتحدة، يوضح هذا الإشعار كيف تعالج Volls Global Inc البيانات الشخصية عند استخدام circuitbull.com أو طلب عرض.",
      sections: EN.docs.gdpr.sections.map((s, i) => ({
        heading: ["المتحكم", "ما نعالجه ولماذا", "حقوقك", "النقل خارج المنطقة", "الاحتفاظ والأطفال"][i],
        paragraphs: [
          [
            "المتحكم: Volls Global Inc، 1207 Delaware Ave #5352, Wilmington, DE 19806, الولايات المتحدة. info@circuitbull.com · +1 276 600 2052.",
            "ليس لنا منشأة في المنطقة الاقتصادية الأوروبية. لم نعيّن ممثلاً بموجب المادة 27 ما لم تذكر نسخة لاحقة ذلك. يمكنك ممارسة حقوق GDPR بالكتابة إلى المتحكم.",
          ],
          [
            "عند إرسال إحاطة نعالج الاسم والبريد والهاتف والشركة والبلد والاهتمام والرسالة. الأسس: خطوات قبل عقد بطلبك (6(1)(b)) ومصلحتنا المشروعة في الرد (6(1)(f)).",
            "ملفات cb_lang وcb_country تحفظ اللغة والسوق وهي ضرورية وليست إعلاناً. سجلات الخادم للأمن (6(1)(f)).",
          ],
          [
            "لك حق الوصول والتصحيح والمحو والتقييد والنقل والاعتراض والشكوى لدى سلطتك الإشرافية.",
            "نرد خلال شهر كقاعدة. راسل info@circuitbull.com بعنوان GDPR. قد نتحقق من الهوية.",
          ],
          [
            "الشركة في الولايات المتحدة. الاستضافة Cloudflare. البريد Amazon SES في eu-central-1. قد تُحفظ تضمينات الكتالوج في Qdrant بالاتحاد الأوروبي. واتساب عبر ميتا إذا طلبت إشعاراً.",
            "حيث يلزم أداة نقل نعتمد البنود التعاقدية القياسية. لا نبيع البيانات الشخصية.",
          ],
          [
            "تُحفظ ملفات العروض عادة حتى 24 شهراً ما لم يوجب العقد أو التصدير أطول. ملفات اللغة حتى 12 شهراً.",
            "الموقع للمشترين المحترفين والحكوميين. لا نجمع بيانات الأطفال عن علم.",
          ],
        ][i],
      })),
    },
    "data-policy": {
      title: "سياسة البيانات",
      seoTitle: "سياسة البيانات | Circuitbull®",
      seoDescription: "سياسة بيانات وخصوصية Circuitbull® — الجمع والمعالجون وملفات الارتباط وCCPA وKVKK.",
      lead: "تصف هذه السياسة كيف تتعامل Volls Global Inc مع البيانات الشخصية على circuitbull.com: العروض وتفضيل اللغة وسجلات الأمن والمورّدون.",
      sections: EN.docs["data-policy"].sections.map((s, i) => ({
        heading: ["النطاق", "البيانات التي نجمعها", "كيف نستخدمها", "المعالجون", "ملفات الارتباط", "أمريكا وكاليفورنيا وتركيا", "الأمن والطلبات"][i],
        paragraphs: [
          [
            "يشمل الموقع العام ونماذج الاتصال والشركاء وطلبات واتساب والبريد المرتبط. لا يحل محل اتفاقية معالجة لنشر IoT/SCADA ميداني.",
            "صفحات ذات صلة: إشعار GDPR والشروط ومدونة السلوك. لسكان كاليفورنيا CCPA/CPRA. لزوار تركيا KVKK.",
          ],
          [
            "تقدم أنت: الاسم والبريد والهاتف والشركة والبلد والاهتمام والرسالة. رقم واتساب يُستخدم فقط للطلب الذي اخترته.",
            "نجمع تلقائياً الصفحات والدولة التقريبية ولغة المتصفح وcb_lang وcb_country. لا بكسل إعلان ولا بيع قوائم.",
          ],
          [
            "للرد على العرض وتوجيهك لبائع معيّن إن وُجد وإبقاء الموقع بلغتك وحماية الخدمة.",
            "لا نستخدم إحاطتك لتدريب نماذج توليدية عامة.",
          ],
          [
            "Cloudflare يستضيف. Amazon SES (eu-central-1) يرسل البريد. Redis قد يخزّن البحث. Qdrant قد يخزّن التضمينات. MongoDB Atlas للكتالوج. ميتا لواتساب عند الموافقة.",
            "يعمل هؤلاء بموجب تعليماتنا وليس لتسويقهم الخاص.",
          ],
          [
            "cb_lang وcb_country طرف أول، SameSite=Lax، حتى سنة. لا ملفات تتبع إعلاني.",
            "يمكنك حذفها من المتصفح. اختيار اللغة الذي اخترته لا يحتاج موافقة تسويق.",
          ],
          [
            "لا نبيع أو نشارك المعلومات الشخصية بمعاني CCPA/CPRA. لسكان كاليفورنيا طلب المعرفة والحذف والتصحيح: info@circuitbull.com موضوع Privacy.",
            "لـ KVKK: المسؤول Volls Global Inc. يمكنك طلب حقوق المادة 11 على العنوان نفسه.",
          ],
          [
            "النقل عبر HTTPS. الوصول لسجلات العروض محدود. أبلغ info@circuitbull.com إن شككت في تسريب.",
            "لطلب الوصول أو الحذف راسل من البريد المستخدم في النموذج. قد نرفض طلباً بلا أساس أو يمنعه القانون.",
          ],
        ][i],
      })),
    },
    "code-of-conduct": {
      title: "مدونة السلوك",
      seoTitle: "مدونة السلوك | Circuitbull®",
      seoDescription: "مدونة سلوك Circuitbull® — النزاهة ومكافحة الرشوة والتصدير والإبلاغ.",
      lead: "تُلزم Volls Global Inc علامة Circuitbull® بمعيار واحد: كتالوج صادق وتصدير قانوني ولا رشوة وتعامل عادل.",
      sections: EN.docs["code-of-conduct"].sections.map((s, i) => ({
        heading: ["نزاهة الكتالوج", "مكافحة الرشوة", "العقوبات والتصدير", "الشركاء والمنافسة", "الأشخاص والإبلاغ"][i],
        paragraphs: [
          [
            "لا ندّعي أن الكاميرات مصنوعة في الولايات المتحدة. أنظمة IoT وSCADA والكربون التي نصممها كذلك. يجب أن تطابق أرقام ورقة البيانات الملف المنشور.",
            "يجوز أن يكون التسويق مباشراً لا كاذباً. لا يعيد الموزّع المعتمد صياغة نسختنا كتصنيعه دون موافقة خطية.",
          ],
          [
            "نحظّر الرشوة والعمولات والمدفوعات التيسيرية بما فيها عبر الشركاء. يشمل ذلك FCPA والقوانين المحلية المماثلة.",
            "الهدايا والسفر والضيافة للمسؤولين تتطلب موافقة خطية مسبقة من Volls Global Inc وتكون متواضعة وقانونية ومسجلة. النقد مرفوض دائماً.",
          ],
          [
            "قد تخضع المنصات الحرارية وEO/IR لرقابة التصدير. لا ندعم ما ينتهك العقوبات الأمريكية أو يخفي المستخدم النهائي.",
            "يجب تقديم استخدام نهائي دقيق. نوقف العملية إن نقص الملف أو حُظر المقصد.",
          ],
          [
            "نختار البائعين المعيّنين. لا يُدفع مقابل الإدراج خارج عملية الشراكة المنشورة. لا تواطؤ في العطاءات.",
            "تبقى مادة الإحاطة السرية سرية.",
          ],
          [
            "لا تسامح مع التحرش أو التمييز أو الانتقام. ننتظر سلوكاً مهنياً في مواقع العملاء.",
            "أبلغ info@circuitbull.com بعنوان Conduct. البلاغ بحسن نية محمي من الانتقام. هذه المدونة ليست عقد عمل لطرف ثالث.",
          ],
        ][i],
      })),
    },
  }),
};

function translatePack(
  _lang: string,
  nav: LegalPack["nav"],
  kicker: string,
  updated: string,
  t: (slug: LegalSlug) => {
    title: string;
    seoTitle: string;
    seoDescription: string;
    lead: string;
    headings: string[];
    bodies?: string[][];
  }
): LegalPack {
  const docs = {} as LegalPack["docs"];
  for (const slug of LEGAL_SLUGS) {
    const meta = t(slug);
    const src = EN.docs[slug];
    docs[slug] = {
      title: meta.title,
      seoTitle: meta.seoTitle,
      seoDescription: meta.seoDescription,
      lead: meta.lead,
      sections: src.sections.map((sec, i) => ({
        heading: meta.headings[i] || sec.heading,
        paragraphs: meta.bodies?.[i] || BODIES[_lang]?.[slug]?.[i] || sec.paragraphs,
      })),
    };
  }
  return { nav, kicker, updated, docs };
}

const BODIES: Partial<Record<string, Partial<Record<LegalSlug, string[][]>>>> = {
  es: {
    terms: [
      ["El sitio lo opera Volls Global Inc, sociedad de Delaware, bajo la marca registrada Circuitbull®. Domicilio: 1207 Delaware Ave #5352, Wilmington, DE 19806, Estados Unidos. Contacto: info@circuitbull.com · +1 276 600 2052.", "Circuitbull® despliega IoT, SCADA y monitorización de carbono Made in USA. Las cámaras térmicas y EO/IR del catálogo son sensores suministrados. No afirmamos que esas cámaras se fabriquen en Estados Unidos."],
      ["Hojas de datos, alcances e imágenes sirven para especificar una misión y pueden cambiar sin aviso. Una página no es oferta, compromiso de stock ni precio vinculante.", "Un presupuesto, protocolo o briefing G2G empieza solo cuando lo confirmamos por escrito. Hasta entonces el sitio no crea venta, financiación ni nombramiento de vendedor."],
      ["Puede usar el sitio para revisar plataformas y pedir un briefing. No raspe el catálogo de forma que degrade el servicio ni se haga pasar por Circuitbull®.", "Exportación, sanciones y uso final aplican a muchas plataformas. Usted responde de la legalidad en su jurisdicción. Podemos rechazar una solicitud que no podamos apoyar."],
      ["Circuitbull®, la marca y los textos originales pertenecen a Volls Global Inc. Fotografías de catálogo y marcas de terceros siguen siendo de sus titulares.", "Las fotos de stock en páginas de soluciones (incluido Pexels, acreditado en la página) están licenciadas para este sitio y no muestran una instalación concreta salvo que lo indiquemos."],
      ["El sitio se ofrece tal cual a compradores profesionales y ministerios. En la máxima medida legal, Volls Global Inc no responde de daños indirectos por confiar en una cifra de catálogo no confirmada por escrito.", "Nada limita la responsabilidad que la ley de Delaware no permita limitar, incluido el fraude."],
      ["Rige el derecho del Estado de Delaware, Estados Unidos. Fuero exclusivo: tribunales de Wilmington, salvo foro obligatorio de consumo o contratación pública.", "Si una cláusula es inaplicable, el resto sigue vigente. Podemos actualizar estos términos; la fecha anterior es la versión actual."],
    ],
    gdpr: [
      ["El responsable es Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, Estados Unidos. info@circuitbull.com · +1 276 600 2052.", "No tenemos establecimiento en el EEE. No hemos nombrado representante del art. 27 salvo que una versión posterior lo indique. Puede ejercer derechos GDPR escribiendo al responsable."],
      ["Al enviar un briefing tratamos nombre, correo, teléfono, empresa, país, interés y mensaje. Bases: medidas precontractuales a petición suya (art. 6(1)(b)) e interés legítimo en responder (art. 6(1)(f)).", "Las cookies cb_lang y cb_country guardan idioma y mercado; son necesarias, no publicidad. Los registros del servidor se tratan por seguridad (art. 6(1)(f))."],
      ["Puede solicitar acceso, rectificación, supresión, limitación, portabilidad y oposición, y reclamar ante su autoridad de control.", "Respondemos en un mes como regla. Escriba a info@circuitbull.com con asunto GDPR. Podemos verificar la identidad."],
      ["Volls Global Inc está en Estados Unidos. El alojamiento es Cloudflare. El correo transaccional usa Amazon SES en eu-central-1. Los embeddings del catálogo pueden estar en Qdrant en la UE. WhatsApp lo trata Meta si pide un aviso.", "Cuando GDPR exige una herramienta de transferencia usamos cláusulas contractuales tipo. No vendemos datos personales."],
      ["Los expedientes de cotización se conservan en general hasta 24 meses salvo contrato, archivo de exportación o bloqueo legal. Las cookies de idioma duran hasta 12 meses.", "El sitio es para compradores profesionales y públicos. No recabamos datos de menores a sabiendas."],
    ],
    "data-policy": [
      ["Cubre el sitio público, formularios de contacto y socios, pings de WhatsApp y el correo asociado. No sustituye un acuerdo de encargo para un despliegue IoT/SCADA.", "Páginas relacionadas: aviso GDPR, términos y código de conducta. Residentes de California: CCPA/CPRA. Visitantes en Türkiye: KVKK."],
      ["Usted aporta nombre, correo, teléfono, empresa, país, interés y mensaje. Un número de WhatsApp solo se usa para el aviso que pidió.", "Recogemos páginas vistas, país aproximado, idioma del navegador y cookies cb_lang y cb_country. No hay píxeles publicitarios ni venta de listas."],
      ["Para responder un presupuesto, dirigirle a un vendedor nombrado si existe, enviar correo transaccional, mantener el idioma y proteger el servicio.", "No usamos su briefing para entrenar modelos generativos públicos."],
      ["Cloudflare aloja el sitio. Amazon SES (eu-central-1) envía correo. Redis puede cachear búsqueda. Qdrant puede guardar embeddings. MongoDB Atlas guarda el catálogo. Meta trata WhatsApp si opta por el ping.", "Estos encargados actúan según nuestras instrucciones, no para su marketing."],
      ["cb_lang y cb_country son de primer partido, SameSite=Lax, hasta un año. No hay cookies de seguimiento publicitario.", "Puede borrarlas en el navegador. Una cookie estrictamente necesaria que solo guarda el idioma que eligió no requiere opt-in de marketing."],
      ["No vendemos ni compartimos información personal en el sentido CCPA/CPRA. Residentes de California: derecho a conocer, borrar y corregir en info@circuitbull.com, asunto Privacy.", "KVKK: el responsable de consultas del sitio es Volls Global Inc. Puede ejercer el art. 11 en la misma dirección."],
      ["El transporte es HTTPS. El acceso a leads está limitado a operaciones Circuitbull. Avise a info@circuitbull.com si cree que un mensaje se expuso.", "Para acceder o borrar datos de una consulta, escriba desde el correo del formulario. Podemos rechazar solicitudes infundadas o que la ley obligue a conservar."],
    ],
    "code-of-conduct": [
      ["No afirmamos que las cámaras sean Made in USA. El IoT, SCADA y carbono que diseñamos sí. Las cifras de la hoja de datos deben coincidir con el archivo publicado.", "El marketing puede ser directo, no falso. Un vendedor nombrado no puede reetiquetar nuestra copia como su fabricación sin consentimiento escrito."],
      ["Prohibimos sobornos, comisiones y pagos de facilitación, también a través de socios. Incluye la FCPA estadounidense y leyes locales equivalentes.", "Regalos, viajes y hospitalidad a funcionarios requieren aprobación previa por escrito de Volls Global Inc, y deben ser modestos, legales y registrados. El efectivo nunca es aceptable."],
      ["Las plataformas térmicas y EO/IR pueden estar sujetas a control de exportación. No apoyamos operaciones que violen sanciones estadounidenses o disfracen el usuario final.", "Compradores y socios deben dar un uso final veraz. Detendremos el proceso si el expediente está incompleto o el destino está prohibido."],
      ["Los vendedores nombrados los seleccionamos y listamos nosotros. No se paga un listado fuera del proceso de partners publicado. No toleramos concierto de ofertas.", "El material confidencial de briefing permanece confidencial."],
      ["No se toleran acoso, discriminación ni represalias. Esperamos conducta profesional en sedes del cliente.", "Comunique a info@circuitbull.com con asunto Conduct. Un informe de buena fe está protegido. Este código no crea un contrato laboral con terceros."],
    ],
  },
  de: {
    terms: [
      ["Die Website betreibt Volls Global Inc, eine Delaware-Gesellschaft, unter der eingetragenen Marke Circuitbull®. Sitz: 1207 Delaware Ave #5352, Wilmington, DE 19806, USA. Kontakt: info@circuitbull.com · +1 276 600 2052.", "Circuitbull® liefert Made in USA IoT, SCADA und Carbon-Live-Monitoring. Thermal- und EO/IR-Kameras im Katalog sind bezogene Sensoren. Wir behaupten nicht, dass diese Kameras in den USA gefertigt werden."],
      ["Datenblätter, Reichweiten und Bilder helfen bei der Spezifikation und können sich ändern. Eine Seite ist kein Angebot, keine Lagerzusage und kein bindender Preis.", "Angebot, Protokoll oder G2G-Briefing beginnen erst mit unserer schriftlichen Bestätigung. Bis dahin entsteht kein Kauf, keine Finanzierung und keine Händlerbestellung."],
      ["Sie dürfen Plattformen prüfen und ein Briefing anfordern. Scraping, das den Dienst belastet, und das Vorgeben, Circuitbull® zu sein, sind untersagt.", "Export, Sanktionen und Endverwendung gelten für viele Plattformen. Sie tragen die Rechtmäßigkeit in Ihrer Rechtsordnung. Wir können Anfragen ablehnen, die wir nicht unterstützen dürfen."],
      ["Circuitbull®, das Zeichen und die Originaltexte gehören Volls Global Inc. Katalogfotos und Drittmarken bleiben bei ihren Inhabern.", "Stockfotos auf Lösungsseiten (einschließlich Pexels mit Quellenangabe) sind für diese Site lizenziert und zeigen keine konkrete Kundenanlage, außer wir sagen es."],
      ["Die Site wird für professionelle Käufer und Ministerien bereitgestellt. Soweit gesetzlich zulässig haftet Volls Global Inc nicht für mittelbare Schäden aus nicht schriftlich bestätigten Katalogwerten.", "Nichts beschränkt Haftung, die nach Delaware-Recht nicht beschränkt werden darf, einschließlich Betrug."],
      ["Es gilt das Recht des Staates Delaware, USA. Gerichtsstand Wilmington, soweit kein zwingendes Verbraucher- oder Vergabeforum greift.", "Ist eine Klausel unwirksam, bleibt der Rest in Kraft. Wir können die Bedingungen aktualisieren; das Datum oben ist die aktuelle Fassung."],
    ],
    gdpr: [
      ["Verantwortlicher ist Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, USA. info@circuitbull.com · +1 276 600 2052.", "Wir haben keine Niederlassung im EWR. Ein Vertreter nach Art. 27 ist nicht bestellt, sofern eine spätere Fassung keinen nennt. GDPR-Rechte können Sie beim Verantwortlichen geltend machen."],
      ["Bei einem Briefing verarbeiten wir Name, E-Mail, Telefon, Firma, Land, Interesse und Nachricht. Grundlagen: vorvertragliche Schritte auf Ihre Anfrage (Art. 6 Abs. 1 lit. b) und berechtigtes Interesse an der Beantwortung (lit. f).", "Cookies cb_lang und cb_country speichern Sprache und Markt; sie sind erforderlich, keine Werbung. Serverlogs dienen der Sicherheit (Art. 6 Abs. 1 lit. f)."],
      ["Sie haben Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie Beschwerde bei Ihrer Aufsichtsbehörde.", "Wir antworten in der Regel binnen eines Monats. Schreiben Sie an info@circuitbull.com mit Betreff GDPR. Wir können die Identität prüfen."],
      ["Volls Global Inc sitzt in den USA. Hosting über Cloudflare. Transaktionsmails über Amazon SES in eu-central-1. Katalog-Embeddings können in der EU bei Qdrant liegen. WhatsApp verarbeitet Meta, wenn Sie einen Ping wünschen.", "Wo die DSGVO ein Transferinstrument verlangt, nutzen wir Standardvertragsklauseln. Wir verkaufen keine personenbezogenen Daten."],
      ["Angebotsakten werden in der Regel bis 24 Monate aufbewahrt, sofern Vertrag, Exportdatei oder gesetzliche Aufbewahrung nicht länger verlangen. Sprachcookies bis 12 Monate.", "Die Site richtet sich an professionelle und öffentliche Beschaffer. Wir erheben wissentlich keine Daten von Kindern."],
    ],
    "data-policy": [
      ["Sie gilt für die öffentliche Site, Kontakt- und Partnerformulare, WhatsApp-Pings und zugehörige E-Mails. Sie ersetzt keinen Auftragsverarbeitungsvertrag für ein Feld-IoT/SCADA.", "Verwandte Seiten: DSGVO-Hinweis, Nutzungsbedingungen, Verhaltenskodex. Kalifornien: CCPA/CPRA. Türkiye: KVKK."],
      ["Sie geben Name, E-Mail, Telefon, Firma, Land, Interesse und Nachricht an. Eine WhatsApp-Nummer dient nur dem angeforderten Ping.", "Automatisch: aufgerufene Seiten, ungefähres Land, Browsersprache, cb_lang und cb_country. Keine Werbe-Pixel, kein Listenverkauf."],
      ["Um ein Angebot zu beantworten, Sie an einen benannten Verkäufer zu leiten, Transaktionsmails zu senden, die Sprache zu halten und den Dienst zu schützen.", "Wir nutzen Ihr Briefing nicht zum Training öffentlicher generativer Modelle."],
      ["Cloudflare hostet. Amazon SES (eu-central-1) sendet Mail. Redis kann Suche cachen. Qdrant kann Embeddings speichern. MongoDB Atlas hält Katalogdaten. Meta verarbeitet WhatsApp bei Opt-in.", "Diese Auftragsverarbeiter handeln nach unserer Weisung, nicht für eigenes Marketing."],
      ["cb_lang und cb_country sind First-Party, SameSite=Lax, bis ein Jahr. Keine Tracking-Cookies für Werbung.", "Sie können Cookies im Browser löschen. Eine unbedingt erforderliche Cookie nur für Ihre Sprachwahl braucht kein Marketing-Opt-in."],
      ["Wir verkaufen oder teilen keine personenbezogenen Informationen im Sinne von CCPA/CPRA. Kalifornier: Auskunft, Löschung, Berichtigung an info@circuitbull.com, Betreff Privacy.", "KVKK: Verantwortlicher für Site-Anfragen ist Volls Global Inc. Art.-11-Rechte an dieselbe Adresse."],
      ["Transport per HTTPS. Zugriff auf Leads ist auf Circuitbull-Betrieb beschränkt. Melden Sie vermutete Offenlegung an info@circuitbull.com.", "Zugang oder Löschung: schreiben Sie von der Formular-Adresse. Unbegründete oder gesetzlich aufzubewahrende Anfragen können wir ablehnen."],
    ],
    "code-of-conduct": [
      ["Wir behaupten nicht, Kameras seien Made in USA. Von uns entworfenes IoT, SCADA und Carbon schon. Datenblattzahlen müssen zur veröffentlichten Datei passen.", "Marketing darf direkt sein, nicht falsch. Benannte Verkäufer dürfen unseren Text ohne schriftliche Zustimmung nicht als eigene Fertigung ausgeben."],
      ["Bestechung, Kickbacks und Beschleunigungszahlungen sind verboten, auch über Partner. Einschließlich FCPA und gleichwertiger lokaler Gesetze.", "Geschenke, Reisen und Bewirtung gegenüber Amtsträgern brauchen vorherige schriftliche Freigabe von Volls Global Inc und müssen bescheiden, legal und dokumentiert sein. Bargeld ist nie zulässig."],
      ["Thermal- und EO/IR-Plattformen können exportkontrolliert sein. Wir unterstützen keine Geschäfte, die US-Sanktionen verletzen oder Endverwender verschleiern.", "Käufer und Partner müssen wahrheitsgemäße Endverwendung angeben. Unvollständige Akten oder verbotene Ziele stoppen wir."],
      ["Benannte Verkäufer wählen und listen wir. Listing wird nicht außerhalb des veröffentlichten Partnerprozesses bezahlt. Absprachen bei Angeboten dulden wir nicht.", "Vertrauliches Briefing bleibt vertraulich."],
      ["Belästigung, Diskriminierung und Vergeltung werden nicht geduldet. Wir erwarten professionelles Verhalten auf Kundengelände.", "Melden Sie an info@circuitbull.com, Betreff Conduct. Gutgläubige Meldungen sind vor Vergeltung geschützt. Dieser Kodex begründet keinen Arbeitsvertrag Dritter."],
    ],
  },
  fr: {
    terms: [
      ["Le site est exploité par Volls Global Inc, société du Delaware, sous la marque déposée Circuitbull®. Siège : 1207 Delaware Ave #5352, Wilmington, DE 19806, États-Unis. Contact : info@circuitbull.com · +1 276 600 2052.", "Circuitbull® déploie l’IoT, le SCADA et le suivi carbone Made in USA. Les caméras thermiques et EO/IR du catalogue sont des capteurs fournis. Nous n’affirmons pas qu’elles sont fabriquées aux États-Unis."],
      ["Fiches techniques, portées et images aident à spécifier une mission et peuvent changer. Une page n’est pas une offre, un stock ni un prix liant.", "Un devis, protocole ou briefing G2G ne commence qu’après notre confirmation écrite. Jusque-là le site ne crée ni vente, ni financement, ni nomination de vendeur."],
      ["Vous pouvez consulter les plateformes et demander un briefing. Ne moissonnez pas le catalogue au détriment du service et ne vous faites pas passer pour Circuitbull®.", "Export, sanctions et usage final s’appliquent à de nombreuses plateformes. Vous êtes responsable de la légalité dans votre juridiction. Nous pouvons refuser une demande que nous ne pouvons pas soutenir."],
      ["Circuitbull®, la marque et les textes originaux appartiennent à Volls Global Inc. Photos de catalogue et marques tierces restent à leurs titulaires.", "Les photos de stock des pages solutions (Pexels crédité le cas échéant) sont licenciées pour ce site et ne montrent pas une installation client précise sauf mention contraire."],
      ["Le site est fourni en l’état aux acheteurs professionnels et ministères. Dans la mesure permise par la loi, Volls Global Inc n’est pas responsable des pertes indirectes liées à un chiffre de catalogue non confirmé par écrit.", "Rien n’exclut une responsabilité que le droit du Delaware n’autorise pas à limiter, y compris la fraude."],
      ["Le droit de l’État du Delaware, États-Unis, s’applique. For exclusif : tribunaux de Wilmington, sauf forum impératif de consommation ou de marchés publics.", "Si une clause est inapplicable, le reste demeure. Nous pouvons actualiser ces conditions ; la date ci-dessus est la version en vigueur."],
    ],
    gdpr: [
      ["Le responsable est Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, États-Unis. info@circuitbull.com · +1 276 600 2052.", "Nous n’avons pas d’établissement dans l’EEE. Aucun représentant art. 27 n’est nommé sauf version ultérieure. Vous pouvez exercer vos droits RGPD auprès du responsable."],
      ["Lors d’un briefing nous traitons nom, e-mail, téléphone, société, pays, intérêt et message. Bases : mesures précontractuelles à votre demande (art. 6(1)(b)) et intérêt légitime à répondre (art. 6(1)(f)).", "Les cookies cb_lang et cb_country retiennent langue et marché ; ils sont nécessaires, pas publicitaires. Les journaux serveur servent à la sécurité (art. 6(1)(f))."],
      ["Vous pouvez demander accès, rectification, effacement, limitation, portabilité et opposition, et saisir votre autorité de contrôle.", "Nous répondons en principe sous un mois. Écrivez à info@circuitbull.com objet GDPR. Nous pouvons vérifier l’identité."],
      ["Volls Global Inc est aux États-Unis. Hébergement Cloudflare. E-mail transactionnel Amazon SES eu-central-1. Les embeddings catalogue peuvent être chez Qdrant dans l’UE. WhatsApp est traité par Meta si vous demandez un ping.", "Lorsque le RGPD exige un outil de transfert, nous utilisons les clauses contractuelles types. Nous ne vendons pas de données personnelles."],
      ["Les dossiers de devis sont conservés en général jusqu’à 24 mois sauf contrat, dossier d’export ou obligation légale plus longue. Cookies de langue jusqu’à 12 mois.", "Le site s’adresse aux acheteurs professionnels et publics. Nous ne collectons pas sciemment de données d’enfants."],
    ],
    "data-policy": [
      ["Couvre le site public, les formulaires contact et partenaires, les pings WhatsApp et les e-mails liés. Ne remplace pas un accord de sous-traitance pour un déploiement IoT/SCADA.", "Pages liées : avis RGPD, conditions, code de conduite. Californie : CCPA/CPRA. Türkiye : KVKK."],
      ["Vous fournissez nom, e-mail, téléphone, société, pays, intérêt et message. Un numéro WhatsApp ne sert qu’au ping demandé.", "Nous collectons pages vues, pays approximatif, langue du navigateur, cb_lang et cb_country. Pas de pixel pub ni vente de fichiers."],
      ["Pour répondre à un devis, vous orienter vers un vendeur nommé s’il existe, envoyer l’e-mail transactionnel, garder la langue et protéger le service.", "Nous n’utilisons pas votre briefing pour entraîner des modèles génératifs publics."],
      ["Cloudflare héberge. Amazon SES (eu-central-1) envoie le mail. Redis peut cacher la recherche. Qdrant peut stocker les embeddings. MongoDB Atlas tient le catalogue. Meta traite WhatsApp en cas d’opt-in.", "Ces sous-traitants agissent sur nos instructions, pas pour leur marketing."],
      ["cb_lang et cb_country sont first-party, SameSite=Lax, jusqu’à un an. Pas de cookies de suivi publicitaire.", "Vous pouvez les supprimer dans le navigateur. Un cookie strictement nécessaire qui ne retient que la langue choisie n’exige pas d’opt-in marketing."],
      ["Nous ne vendons ni ne partageons d’informations personnelles au sens CCPA/CPRA. Résidents californiens : connaître, supprimer, corriger via info@circuitbull.com, objet Privacy.", "KVKK : le responsable des demandes du site est Volls Global Inc. Droits art. 11 à la même adresse."],
      ["Transport HTTPS. L’accès aux leads est limité aux opérations Circuitbull. Signalez une exposition à info@circuitbull.com.", "Pour accéder ou supprimer les données d’une demande, écrivez depuis l’e-mail du formulaire. Nous pouvons refuser une demande infondée ou que la loi impose de conserver."],
    ],
    "code-of-conduct": [
      ["Nous n’affirmons pas que les caméras sont Made in USA. L’IoT, le SCADA et le carbone que nous concevons le sont. Les chiffres de fiche doivent correspondre au fichier publié.", "Le marketing peut être direct, pas faux. Un vendeur nommé ne peut pas relabeliser notre copie comme sa fabrication sans accord écrit."],
      ["Pots-de-vin, rétrocommissions et paiements de facilitation sont interdits, y compris via des partenaires. Inclut le FCPA et les lois locales équivalentes.", "Cadeaux, voyages et hospitalité envers des agents publics exigent l’accord écrit préalable de Volls Global Inc, modestes, légaux et enregistrés. L’espèces n’est jamais acceptable."],
      ["Les plateformes thermiques et EO/IR peuvent être contrôlées à l’export. Nous ne soutenons pas ce qui viole les sanctions américaines ou dissimule l’utilisateur final.", "Acheteurs et partenaires doivent donner un usage final exact. Un dossier incomplet ou une destination interdite arrête le processus."],
      ["Les vendeurs nommés sont choisis et listés par nous. Aucun paiement de listing hors du processus partenaires publié. Pas d’entente sur les offres.", "Le briefing confidentiel reste confidentiel."],
      ["Harcèlement, discrimination et représailles ne sont pas tolérés. Nous attendons une conduite professionnelle sur les sites clients.", "Signalez à info@circuitbull.com objet Conduct. Un signalement de bonne foi est protégé. Ce code ne crée pas de contrat de travail avec un tiers."],
    ],
  },
  it: {
    terms: [
      ["Il sito è gestito da Volls Global Inc, società del Delaware, con il marchio registrato Circuitbull®. Sede: 1207 Delaware Ave #5352, Wilmington, DE 19806, Stati Uniti. info@circuitbull.com · +1 276 600 2052.", "Circuitbull® mette in campo IoT, SCADA e monitoraggio carbonio Made in USA. Le telecamere termiche ed EO/IR in catalogo sono sensori forniti. Non diciamo che siano fabbricate negli Stati Uniti."],
      ["Schede, portate e immagini aiutano a specificare una missione e possono cambiare. Una pagina non è offerta, scorta o prezzo vincolante.", "Preventivo, protocollo o briefing G2G iniziano solo con la nostra conferma scritta. Fino ad allora il sito non crea vendita, finanziamento o nomina di venditore."],
      ["Potete consultare le piattaforme e chiedere un briefing. Non rastrellate il catalogo in modo da degradare il servizio né spacciatevi per Circuitbull®.", "Export, sanzioni e uso finale riguardano molte piattaforme. Siete responsabili della liceità nella vostra giurisdizione. Possiamo rifiutare una richiesta che non possiamo sostenere."],
      ["Circuitbull®, il marchio e i testi originali appartengono a Volls Global Inc. Foto di catalogo e marchi terzi restano dei titolari.", "Le foto stock delle pagine soluzione (Pexels accreditato in pagina) sono concesse in licenza per questo sito e non mostrano un impianto cliente preciso salvo diversa indicazione."],
      ["Il sito è fornito così com’è ad acquirenti professionali e ministeri. Nei limiti di legge Volls Global Inc non risponde di perdite indirette da una cifra di catalogo non confermata per iscritto.", "Nulla limita responsabilità che il diritto del Delaware non consente di limitare, inclusa la frode."],
      ["Si applica il diritto dello Stato del Delaware, Stati Uniti. Foro esclusivo: tribunali di Wilmington, salvo foro obbligatorio di consumo o appalti.", "Se una clausola è inapplicabile, il resto resta in vigore. Possiamo aggiornare i termini; la data sopra è la versione corrente."],
    ],
    gdpr: [
      ["Il titolare è Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, Stati Uniti. info@circuitbull.com · +1 276 600 2052.", "Non abbiamo uno stabilimento nel SEE. Non abbiamo nominato un rappresentante art. 27 salvo una versione successiva. Potete esercitare i diritti GDPR scrivendo al titolare."],
      ["Con un briefing trattiamo nome, e-mail, telefono, azienda, Paese, interesse e messaggio. Basi: misure precontrattuali su vostra richiesta (art. 6(1)(b)) e legittimo interesse a rispondere (art. 6(1)(f)).", "I cookie cb_lang e cb_country memorizzano lingua e mercato; sono necessari, non pubblicitari. I log del server servono alla sicurezza (art. 6(1)(f))."],
      ["Potete chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione e reclamare presso l’autorità di controllo.", "Rispondiamo di regola entro un mese. Scrivete a info@circuitbull.com oggetto GDPR. Possiamo verificare l’identità."],
      ["Volls Global Inc è negli Stati Uniti. Hosting Cloudflare. E-mail transazionale Amazon SES eu-central-1. Gli embedding del catalogo possono stare in Qdrant in UE. WhatsApp è trattato da Meta se chiedete un ping.", "Ove il GDPR richieda uno strumento di trasferimento usiamo le clausole contrattuali tipo. Non vendiamo dati personali."],
      ["I fascicoli di preventivo si conservano in genere fino a 24 mesi salvo contratto, file di export o obbligo di legge più lungo. Cookie di lingua fino a 12 mesi.", "Il sito è per acquirenti professionali e pubblici. Non raccogliamo consapevolmente dati di minori."],
    ],
    "data-policy": [
      ["Copre il sito pubblico, i moduli contatto e partner, i ping WhatsApp e le e-mail collegate. Non sostituisce un accordo di trattamento per un dispiegamento IoT/SCADA.", "Pagine collegate: informativa GDPR, termini, codice di condotta. California: CCPA/CPRA. Türkiye: KVKK."],
      ["Fornite nome, e-mail, telefono, azienda, Paese, interesse e messaggio. Un numero WhatsApp serve solo al ping richiesto.", "Raccogliamo pagine viste, Paese approssimativo, lingua del browser, cb_lang e cb_country. Niente pixel pubblicitari né vendita di liste."],
      ["Per rispondere a un preventivo, orientarvi a un venditore nominato se esiste, inviare e-mail transazionale, mantenere la lingua e proteggere il servizio.", "Non usiamo il briefing per addestrare modelli generativi pubblici."],
      ["Cloudflare ospita. Amazon SES (eu-central-1) invia la posta. Redis può mettere in cache la ricerca. Qdrant può conservare gli embedding. MongoDB Atlas tiene il catalogo. Meta tratta WhatsApp in caso di opt-in.", "Questi responsabili agiscono su nostre istruzioni, non per il loro marketing."],
      ["cb_lang e cb_country sono first-party, SameSite=Lax, fino a un anno. Niente cookie di tracciamento pubblicitario.", "Potete cancellarli nel browser. Un cookie strettamente necessario che memorizza solo la lingua scelta non richiede opt-in di marketing."],
      ["Non vendiamo né condividiamo informazioni personali ai sensi CCPA/CPRA. Residenti in California: conoscere, cancellare, correggere a info@circuitbull.com, oggetto Privacy.", "KVKK: il titolare delle richieste del sito è Volls Global Inc. Diritti art. 11 allo stesso indirizzo."],
      ["Trasporto HTTPS. L’accesso ai lead è limitato alle operazioni Circuitbull. Segnalate un’esposizione a info@circuitbull.com.", "Per accedere o cancellare i dati di una richiesta, scrivete dall’e-mail del modulo. Possiamo rifiutare richieste infondate o che la legge obbliga a conservare."],
    ],
    "code-of-conduct": [
      ["Non affermiamo che le telecamere siano Made in USA. IoT, SCADA e carbonio che progettiamo sì. I numeri della scheda devono coincidere con il file pubblicato.", "Il marketing può essere diretto, non falso. Un venditore nominato non può rietichettare il nostro testo come propria fabbricazione senza consenso scritto."],
      ["Vietiamo tangenti, kickback e pagamenti di facilitazione, anche tramite partner. Include FCPA e leggi locali equivalenti.", "Omaggi, viaggi e ospitalità a pubblici ufficiali richiedono approvazione scritta preventiva di Volls Global Inc, modestia, legalità e registrazione. Il contante non è mai accettabile."],
      ["Le piattaforme termiche ed EO/IR possono essere soggette a controllo export. Non sosteniamo affari che violino sanzioni USA o mascherino l’utente finale.", "Acquirenti e partner devono dare un uso finale veritiero. Un fascicolo incompleto o una destinazione vietata fermano il processo."],
      ["I venditori nominati li scegliamo e elenchiamo noi. Nessun pagamento per il listing fuori dal processo partner pubblicato. Non tolleriamo concertazione di offerte.", "Il briefing riservato resta riservato."],
      ["Molestie, discriminazione e ritorsioni non sono tollerate. Ci aspettiamo condotta professionale presso i siti del cliente.", "Segnalate a info@circuitbull.com oggetto Conduct. Una segnalazione in buona fede è protetta. Questo codice non crea un contratto di lavoro con terzi."],
    ],
  },
  ru: {
    terms: [
      ["Сайт ведёт Volls Global Inc, корпорация Делавэра, под зарегистрированным знаком Circuitbull®. Адрес: 1207 Delaware Ave #5352, Wilmington, DE 19806, США. info@circuitbull.com · +1 276 600 2052.", "Circuitbull® поставляет IoT, SCADA и мониторинг углерода Made in USA. Тепловизионные и EO/IR камеры в каталоге — закупаемые сенсоры. Мы не утверждаем, что они произведены в США."],
      ["Даташиты, дальности и изображения помогают специфицировать задачу и могут меняться. Страница — не оферта, не склад и не обязательная цена.", "Котировка, протокол или G2G-брифинг начинаются только с нашего письменного подтверждения."],
      ["Можно изучать платформы и запрашивать брифинг. Нельзя скрейпить каталог во вред сервису и выдавать себя за Circuitbull®.", "Экспорт, санкции и конечное использование применяются ко многим платформам. Мы можем отклонить запрос, который не вправе поддержать."],
      ["Circuitbull®, знак и оригинальные тексты принадлежат Volls Global Inc.", "Стоковые фото на страницах решений (включая Pexels с указанием) лицензированы для сайта и не показывают конкретный объект заказчика, если не сказано иное."],
      ["Сайт предоставляется как есть профессиональным покупателям. В пределах закона Volls Global Inc не отвечает за косвенный ущерб из-за неподтверждённой письменно цифры каталога.", "Ничто не ограничивает ответственность, которую нельзя ограничить по праву Делавэра, включая мошенничество."],
      ["Применяется право штата Делавэр, США. Исключительная подсудность — суды Уилмингтона, если нет обязательного иного форума.", "Если положение недействительно, остальные остаются. Дата выше — текущая редакция."],
    ],
    gdpr: [
      ["Контролёр: Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, США. info@circuitbull.com · +1 276 600 2052.", "У нас нет учреждения в ЕЭЗ. Представитель по ст. 27 не назначен, пока следующая версия не укажет иное. Права GDPR можно заявить контролёру."],
      ["При брифинге обрабатываем имя, e-mail, телефон, компанию, страну, интерес и сообщение. Основания: преддоговорные шаги по вашей просьбе (ст. 6(1)(b)) и законный интерес ответить (ст. 6(1)(f)).", "Файлы cb_lang и cb_country хранят язык и рынок; они необходимы, не рекламные. Журналы сервера — для безопасности."],
      ["Можно требовать доступ, исправление, удаление, ограничение, переносимость и возражение, а также жалобу в надзорный орган.", "Отвечаем, как правило, в течение месяца. Пишите на info@circuitbull.com с темой GDPR."],
      ["Volls Global Inc в США. Хостинг Cloudflare. Почта Amazon SES eu-central-1. Эмбеддинги каталога могут храниться в Qdrant в ЕС. WhatsApp обрабатывает Meta, если вы просите пинг.", "Где GDPR требует инструмент передачи, используем стандартные договорные условия. Персональные данные не продаём."],
      ["Файлы котировок обычно хранятся до 24 месяцев, если договор или экспорт не требуют дольше. Языковые cookie — до 12 месяцев.", "Сайт для профессиональных и государственных покупателей. Данные детей сознательно не собираем."],
    ],
    "data-policy": [
      ["Охватывает публичный сайт, формы контакта и партнёров, WhatsApp-пинги и связанную почту.", "Связанные страницы: GDPR, условия, кодекс. Калифорния: CCPA/CPRA. Türkiye: KVKK."],
      ["Вы сообщаете имя, e-mail, телефон, компанию, страну, интерес и текст. Номер WhatsApp — только для запрошенного пинга.", "Автоматически: просмотренные страницы, приблизительная страна, язык браузера, cb_lang и cb_country. Рекламных пикселей нет."],
      ["Чтобы ответить на котировку, направить к назначенному продавцу, сохранить язык и защитить сервис.", "Брифинг не используем для обучения публичных генеративных моделей."],
      ["Cloudflare размещает сайт. Amazon SES (eu-central-1) шлёт почту. Redis может кэшировать поиск. Qdrant — эмбеддинги. MongoDB Atlas — каталог. Meta — WhatsApp при согласии.", "Обработчики действуют по нашим поручениям, не для своего маркетинга."],
      ["cb_lang и cb_country — собственные, SameSite=Lax, до года. Рекламных трекинг-cookie нет.", "Их можно удалить в браузере. Строго необходимый cookie только для выбранного языка не требует маркетингового согласия."],
      ["Не продаём и не «делимся» персональной информацией в смысле CCPA/CPRA. Жители Калифорнии: знать, удалить, исправить — info@circuitbull.com, тема Privacy.", "KVKK: контролёр запросов сайта — Volls Global Inc. Права ст. 11 на тот же адрес."],
      ["Транспорт HTTPS. Доступ к лидам ограничен операциями Circuitbull.", "Для доступа или удаления напишите с адреса формы. Можем отказать в необоснованном запросе или если закон требует хранить файл."],
    ],
    "code-of-conduct": [
      ["Не утверждаем, что камеры Made in USA. IoT, SCADA и углерод, которые мы проектируем, — да. Цифры даташита должны совпадать с опубликованным файлом.", "Маркетинг может быть прямым, не ложным. Назначенный продавец не вправе выдавать наш текст за своё производство без письменного согласия."],
      ["Взятки, откаты и «ускоряющие» платежи запрещены, в том числе через партнёров. Включая FCPA и аналоги.", "Подарки, поездки и гостеприимство должностным лицам требуют предварительного письменного согласия Volls Global Inc. Наличные недопустимы."],
      ["Тепловизионные и EO/IR платформы могут подпадать под экспортный контроль. Не поддерживаем сделки, нарушающие санкции США или скрывающие конечного пользователя.", "Покупатели и партнёры обязаны давать точное конечное использование. Неполный файл или запрещённый пункт назначения останавливают процесс."],
      ["Назначенных продавцов выбираем и публикуем мы. Оплата листинга вне опубликованного партнёрского процесса не принимается.", "Конфиденциальный брифинг остаётся конфиденциальным."],
      ["Домогательства, дискриминация и месть недопустимы.", "Сообщайте на info@circuitbull.com с темой Conduct. Добросовестное сообщение защищено от мести. Кодекс не создаёт трудовой договор с третьими лицами."],
    ],
  },
  "zh-Hant": {
    terms: [
      ["本站由德拉瓦州公司 Volls Global Inc 營運，註冊商標為 Circuitbull®。地址：1207 Delaware Ave #5352, Wilmington, DE 19806, 美國。info@circuitbull.com · +1 276 600 2052。", "Circuitbull® 部署 Made in USA 的物聯網、SCADA 與碳監測。型錄中的熱成像與 EO/IR 相機為外購感測器。我們不稱那些相機在美國製造。"],
      ["規格書、距離與圖片用於任務規格，可能變更。頁面不是要約、庫存承諾或拘束性價格。", "報價、議定書或 G2G 簡報僅在我們書面確認後開始。在此之前本站不構成買賣、融資或授權經銷任命。"],
      ["您可用本站檢視平台並請求簡報。不得以損害服務的方式抓取型錄，亦不得冒充 Circuitbull®。", "許多平台受出口、制裁與最終用途規範。我們可拒絕無法依法支援的請求。"],
      ["Circuitbull®、標誌與原創文案屬 Volls Global Inc。型錄照片與第三方商標仍屬其權利人。", "解決方案頁的圖庫照片（含頁面標示的 Pexels）僅授權本站使用，除非另有說明，並非特定客戶現場。"],
      ["本站按現狀提供予專業買家與部會。在法律允許範圍內，Volls Global Inc 不就未經書面確認的型錄數字所生之間接損失負責。", "本條款不排除德拉瓦州法律不得限制的責任，包括詐欺。"],
      ["適用美國德拉瓦州法律。專屬管轄為威明頓法院，但強制消費或採購法庭除外。", "部分條款無效時其餘仍有效。我們可更新條款；上列日期為現行版本。"],
    ],
    gdpr: [
      ["控管者為 Volls Global Inc，1207 Delaware Ave #5352, Wilmington, DE 19806, 美國。info@circuitbull.com · +1 276 600 2052。", "我們在歐洲經濟區無據點。除後續版本另載外，未依第 27 條指定代表。您仍可向控管者行使 GDPR 權利。"],
      ["送出簡報時我們處理姓名、電子郵件、電話、公司、國家、興趣與訊息。依據：應您請求的締約前步驟（第 6(1)(b) 條）以及回覆詢問的正當利益（第 6(1)(f) 條）。", "cb_lang、cb_country cookie 記住語系與市場，屬必要而非廣告。伺服器紀錄用於安全。"],
      ["您可請求近用、更正、刪除、限制、可攜與反對，並向監管機關申訴。", "原則上一個月內回覆。請寄 info@circuitbull.com，主旨 GDPR。我們可能核對身分。"],
      ["Volls Global Inc 位於美國。主機為 Cloudflare。交易郵件使用 Amazon SES eu-central-1。型錄向量可能存放於歐盟 Qdrant。若您要求 ping，WhatsApp 由 Meta 處理。", "GDPR 要求傳輸工具時，我們使用標準契約條款。我們不出售個人資料。"],
      ["報價紀錄通常保存最長 24 個月，契約、出口檔或法定保存除外。語系 cookie 最長 12 個月。", "本站供專業與政府買家使用。我們不會在知情下蒐集兒童資料。"],
    ],
    "data-policy": [
      ["涵蓋公開網站、聯絡與夥伴表單、WhatsApp ping 及相關郵件。不能取代現場 IoT/SCADA 的處理協議。", "相關頁：GDPR、條款、行為準則。加州：CCPA/CPRA。土耳其：KVKK。"],
      ["您提供姓名、電子郵件、電話、公司、國家、興趣與訊息。WhatsApp 號碼僅用於您要求的 ping。", "自動蒐集瀏覽頁面、約略國家、瀏覽器語言、cb_lang 與 cb_country。無廣告像素、不出售名單。"],
      ["用於回覆報價、轉介指定經銷（如有）、寄送交易郵件、維持語系並保護服務。", "不以您的簡報訓練公開生成式模型。"],
      ["Cloudflare 託管。Amazon SES（eu-central-1）寄信。Redis 可能快取搜尋。Qdrant 可能存放向量。MongoDB Atlas 保存型錄。您選擇 ping 時 Meta 處理 WhatsApp。", "這些處理者依我們指示作業，不得用於其自身行銷。"],
      ["cb_lang 與 cb_country 為第一方、SameSite=Lax、最長一年。無廣告追蹤 cookie。", "可在瀏覽器刪除。僅記錄您所選語系的必要 cookie 不需行銷同意。"],
      ["我們不依 CCPA/CPRA 意義出售或分享個人資訊。加州居民可請求知悉、刪除、更正：info@circuitbull.com，主旨 Privacy。", "KVKK：網站詢問的控管者為 Volls Global Inc。第 11 條權利寄同一地址。"],
      ["傳輸為 HTTPS。潛在客戶紀錄僅限 Circuitbull 營運存取。若懷疑外洩請寄 info@circuitbull.com。", "近用或刪除請用表單上的電子郵件來信。我們可拒絕無理或依法必須保存的請求。"],
    ],
    "code-of-conduct": [
      ["我們不宣稱相機為 Made in USA。我們設計的物聯網、SCADA 與碳監測才是。規格數字須與已發布檔案一致。", "行銷可以直接，不可虛假。指定經銷未經書面同意不得將我們文案當成其自行製造。"],
      ["禁止賄賂、回扣與疏通費，含透過夥伴。包括美國 FCPA 與相當地方法。", "對公職人員的贈禮、差旅與招待須事先取得 Volls Global Inc 書面核准，且須適度、合法並留存紀錄。現金一律不可。"],
      ["熱成像與 EO/IR 平台可能受出口管制。我們不支援違反美國制裁或隱瞞最終使用者的交易。", "買方與夥伴須提供真實最終用途。檔案不全或目的地受禁即停止流程。"],
      ["指定經銷由我們遴選並列出。不得在已公布的夥伴流程之外付費上架。不容許圍標。", "機密簡報維持機密。"],
      ["不容忍騷擾、歧視與報復。在客戶現場應保持專業。", "請寄 info@circuitbull.com，主旨 Conduct。善意舉報受保護。本準則不構成與第三人的勞動契約。"],
    ],
  },
  ko: {
    terms: [
      ["본 사이트는 델라웨어 법인 Volls Global Inc가 등록 상표 Circuitbull®로 운영합니다. 주소: 1207 Delaware Ave #5352, Wilmington, DE 19806, 미국. info@circuitbull.com · +1 276 600 2052.", "Circuitbull®는 Made in USA IoT, SCADA, 탄소 모니터링을 현장에 둡니다. 카탈로그의 열상·EO/IR 카메라는 조달 센서입니다. 해당 카메라가 미국에서 제조된다고 주장하지 않습니다."],
      ["데이터시트, 거리, 이미지는 임무 사양을 돕기 위한 것이며 예고 없이 바뀔 수 있습니다. 페이지는 청약, 재고 약속, 구속력 있는 가격이 아닙니다.", "견적, 프로토콜, G2G 브리핑은 서면 확인 후에만 시작됩니다. 그 전까지 사이트는 매매, 금융, 지정 판매자 임명을 만들지 않습니다."],
      ["플랫폼 검토와 브리핑 요청에 사이트를 사용할 수 있습니다. 서비스를 저해하는 스크래핑과 Circuitbull® 사칭은 금지됩니다.", "많은 플랫폼에 수출·제재·최종용도 규칙이 적용됩니다. 지원할 수 없는 요청은 거절할 수 있습니다."],
      ["Circuitbull®, 마크, 원문 카피는 Volls Global Inc 소유입니다. 카탈로그 사진과 제3자 상표는 권리자에게 남습니다.", "솔루션 페이지의 스톡 사진(페이지에 표시된 Pexels 포함)은 본 사이트용으로 라이선스되며, 달리 적지 않는 한 특정 고객 현장이 아닙니다."],
      ["사이트는 전문 구매자와 부처에 있는 그대로 제공됩니다. 법이 허용하는 한 Volls Global Inc는 서면 미확인 카탈로그 수치에 따른 간접 손실에 책임지지 않습니다.", "델라웨어법이 제한을 금지하는 책임(사기 포함)은 본 약관으로 배제되지 않습니다."],
      ["미국 델라웨어주 법이 적용됩니다. 전속 관할은 윌밍턴 법원입니다. 강제 소비자·공공조달 법정이 있는 경우는 예외입니다.", "일부 조항이 무효여도 나머지는 유효합니다. 위 날짜가 현행 버전입니다."],
    ],
    gdpr: [
      ["컨트롤러는 Volls Global Inc, 1207 Delaware Ave #5352, Wilmington, DE 19806, 미국입니다. info@circuitbull.com · +1 276 600 2052.", "EEA에 사업장이 없습니다. 이후 버전에 적히지 않는 한 제27조 대표는 지정하지 않았습니다. GDPR 권리는 컨트롤러에게 행사할 수 있습니다."],
      ["브리핑 제출 시 이름, 이메일, 전화, 회사, 국가, 관심, 메시지를 처리합니다. 근거: 요청에 따른 계약 전 조치(제6(1)(b)조)와 회신의 정당한 이익(제6(1)(f)조).", "cb_lang, cb_country 쿠키는 언어와 시장을 기억하며 필수이지 광고가 아닙니다. 서버 로그는 보안용입니다."],
      ["열람, 정정, 삭제, 제한, 이동, 반대를 요청하고 감독기관에 민원할 수 있습니다.", "원칙적으로 한 달 내 회신합니다. 제목 GDPR로 info@circuitbull.com에 보내십시오. 신원을 확인할 수 있습니다."],
      ["Volls Global Inc는 미국에 있습니다. 호스팅은 Cloudflare. 거래 메일은 Amazon SES eu-central-1. 카탈로그 임베딩은 EU Qdrant에 있을 수 있습니다. ping을 요청하면 WhatsApp은 Meta가 처리합니다.", "GDPR이 이전 수단을 요구하면 표준계약조항을 사용합니다. 개인정보를 판매하지 않습니다."],
      ["견적 기록은 계약·수출·법정 보관이 더 길지 않으면 보통 최대 24개월 보관합니다. 언어 쿠키는 최대 12개월입니다.", "사이트는 전문·공공 구매자용입니다. 아동 정보를 고의로 수집하지 않습니다."],
    ],
    "data-policy": [
      ["공개 사이트, 문의·파트너 양식, WhatsApp ping, 관련 이메일을 다룹니다. 현장 IoT/SCADA 처리 계약을 대체하지 않습니다.", "관련 페이지: GDPR, 약관, 행동강령. 캘리포니아: CCPA/CPRA. 튀르키예: KVKK."],
      ["이름, 이메일, 전화, 회사, 국가, 관심, 메시지를 제공합니다. WhatsApp 번호는 요청한 ping에만 사용합니다.", "열람 페이지, 대략적 국가, 브라우저 언어, cb_lang, cb_country를 자동 수집합니다. 광고 픽셀·명단 판매 없음."],
      ["견적 회신, 지정 판매자 안내, 거래 메일, 언어 유지, 서비스 보호에 사용합니다.", "브리핑을 공개 생성 모델 학습에 쓰지 않습니다."],
      ["Cloudflare가 호스팅합니다. Amazon SES(eu-central-1)가 메일을 보냅니다. Redis는 검색을 캐시할 수 있습니다. Qdrant는 임베딩을, MongoDB Atlas는 카탈로그를 보관합니다. ping에 동의하면 Meta가 WhatsApp을 처리합니다.", "수탁자는 우리 지시로만 처리하며 자체 마케팅에 쓰지 않습니다."],
      ["cb_lang, cb_country는 자사, SameSite=Lax, 최장 1년입니다. 광고 추적 쿠키 없음.", "브라우저에서 삭제할 수 있습니다. 선택한 언어만 저장하는 필수 쿠키는 마케팅 동의 대상이 아닙니다."],
      ["CCPA/CPRA 의미의 개인정보 판매·공유를 하지 않습니다. 캘리포니아 주민은 열람·삭제·정정을 info@circuitbull.com, 제목 Privacy로 요청할 수 있습니다.", "KVKK: 사이트 문의의 컨트롤러는 Volls Global Inc입니다. 제11조 권리는 같은 주소로 행사하십시오."],
      ["전송은 HTTPS입니다. 리드 접근은 Circuitbull 운영으로 제한됩니다. 유출이 의심되면 info@circuitbull.com로 알리십시오.", "열람·삭제는 양식에 쓴 이메일로 요청하십시오. 근거 없거나 법이 보관을 명하는 요청은 거절할 수 있습니다."],
    ],
    "code-of-conduct": [
      ["카메라가 Made in USA라고 주장하지 않습니다. 우리가 설계한 IoT, SCADA, 탄소는 그렇습니다. 데이터시트 숫자는 게시 파일과 일치해야 합니다.", "마케팅은 직설적일 수 있으나 거짓일 수 없습니다. 지정 판매자는 서면 동의 없이 우리 카피를 자사 제조로 재표시할 수 없습니다."],
      ["뇌물, 리베이트, 급행료는 파트너를 통한 경우에도 금지됩니다. 미국 FCPA와 동등 현지법을 포함합니다.", "공직자에 대한 선물·출장·접대는 Volls Global Inc의 사전 서면 승인이 필요하며 검소하고 적법하며 기록되어야 합니다. 현금은 절대 불가합니다."],
      ["열상·EO/IR 플랫폼은 수출통제 대상일 수 있습니다. 미국 제재를 어기거나 최종사용자를 숨기는 거래는 지원하지 않습니다.", "구매자와 파트너는 정확한 최종용도를 제공해야 합니다. 파일이 불완전하거나 목적지가 금지되면 절차를 중단합니다."],
      ["지정 판매자는 우리가 선정·게시합니다. 공개된 파트너 절차 밖의 리스팅 대가는 받지 않습니다. 담합 견적은 용납하지 않습니다.", "기밀 브리핑은 기밀로 남습니다."],
      ["괴롭힘, 차별, 보복은 용납하지 않습니다. 고객 현장에서는 전문적 태도를 기대합니다.", "제목 Conduct로 info@circuitbull.com에 제보하십시오. 선의의 제보는 보복으로부터 보호됩니다. 본 강령은 제3자 근로계약을 만들지 않습니다."],
    ],
  },
};

PACKS.es = translatePack(
  "es",
  { terms: "Términos", gdpr: "GDPR", "data-policy": "Política de datos", "code-of-conduct": "Código de conducta" },
  "Legal",
  "22 de septiembre de 2026",
  (slug) =>
    ({
      terms: {
        title: "Términos de uso",
        seoTitle: "Términos de uso | Circuitbull®",
        seoDescription: "Términos de circuitbull.com — catálogo, cotizaciones, propiedad intelectual, exportación y derecho de Delaware.",
        lead: "Estos términos rigen el uso de circuitbull.com, el catálogo Circuitbull® y cualquier cotización o briefing que solicite a Volls Global Inc. Navegar el sitio no es una compra de consumidor.",
        headings: ["Quiénes somos", "Catálogo y cotizaciones", "Uso aceptable", "Propiedad intelectual", "Responsabilidad", "Ley aplicable"],
      },
      gdpr: {
        title: "Aviso GDPR",
        seoTitle: "GDPR | Circuitbull®",
        seoDescription: "Aviso GDPR para visitantes del EEE y el Reino Unido — responsable, bases jurídicas, derechos y transferencias.",
        lead: "Si está en el Espacio Económico Europeo o el Reino Unido, este aviso explica cómo Volls Global Inc trata datos personales al usar circuitbull.com o pedir una cotización.",
        headings: ["Responsable", "Qué tratamos y por qué", "Sus derechos", "Transferencias fuera del EEE", "Conservación y menores"],
      },
      "data-policy": {
        title: "Política de datos",
        seoTitle: "Política de datos | Circuitbull®",
        seoDescription: "Política de datos y privacidad de Circuitbull® — recogida, encargados, cookies, CCPA y KVKK.",
        lead: "Esta política describe cómo Volls Global Inc trata datos personales en circuitbull.com: cotizaciones, idioma, registros de seguridad y proveedores.",
        headings: ["Ámbito", "Datos que recogemos", "Cómo los usamos", "Encargados", "Cookies", "EE. UU., California y Türkiye", "Seguridad y solicitudes"],
      },
      "code-of-conduct": {
        title: "Código de conducta",
        seoTitle: "Código de conducta | Circuitbull®",
        seoDescription: "Código de conducta Circuitbull® — integridad, soborno, exportación y denuncia.",
        lead: "Volls Global Inc exige a Circuitbull® un único estándar: catálogo honesto, exportación lícita, cero sobornos y trato justo.",
        headings: ["Integridad del catálogo", "Antisoborno", "Sanciones y exportación", "Socios y competencia", "Personas y denuncia"],
      },
    })[slug]
);

PACKS.de = translatePack(
  "de",
  { terms: "Nutzungsbedingungen", gdpr: "DSGVO", "data-policy": "Datenrichtlinie", "code-of-conduct": "Verhaltenskodex" },
  "Rechtliches",
  "22. September 2026",
  (slug) =>
    ({
      terms: {
        title: "Nutzungsbedingungen",
        seoTitle: "Nutzungsbedingungen | Circuitbull®",
        seoDescription: "Nutzungsbedingungen für circuitbull.com — Katalog, Angebote, Schutzrechte, Export und Delaware-Recht.",
        lead: "Diese Bedingungen gelten für circuitbull.com, den Circuitbull®-Katalog und jedes Angebot oder Briefing, das Sie bei Volls Global Inc anfordern. Das Surfen ist kein Verbraucherkauf.",
        headings: ["Wer wir sind", "Katalog und Angebote", "Zulässige Nutzung", "Schutzrechte", "Haftung", "Anwendbares Recht"],
      },
      gdpr: {
        title: "DSGVO-Hinweis",
        seoTitle: "DSGVO | Circuitbull®",
        seoDescription: "DSGVO-Hinweis für Besucher im EWR und Vereinigten Königreich — Verantwortlicher, Rechtsgrundlagen, Rechte, Übermittlungen.",
        lead: "Wenn Sie im EWR oder im Vereinigten Königreich sind, erklärt dieser Hinweis, wie Volls Global Inc personenbezogene Daten verarbeitet, wenn Sie circuitbull.com nutzen oder ein Angebot anfordern.",
        headings: ["Verantwortlicher", "Was wir verarbeiten und warum", "Ihre Rechte", "Übermittlungen außerhalb des EWR", "Speicherung und Kinder"],
      },
      "data-policy": {
        title: "Datenrichtlinie",
        seoTitle: "Datenrichtlinie | Circuitbull®",
        seoDescription: "Daten- und Datenschutzrichtlinie von Circuitbull® — Erhebung, Auftragsverarbeiter, Cookies, CCPA, KVKK.",
        lead: "Diese Richtlinie beschreibt, wie Volls Global Inc personenbezogene Daten auf circuitbull.com verarbeitet: Angebote, Sprache, Sicherheitsprotokolle und Dienstleister.",
        headings: ["Geltungsbereich", "Welche Daten wir erheben", "Wie wir sie nutzen", "Auftragsverarbeiter", "Cookies", "USA, Kalifornien und Türkiye", "Sicherheit und Anfragen"],
      },
      "code-of-conduct": {
        title: "Verhaltenskodex",
        seoTitle: "Verhaltenskodex | Circuitbull®",
        seoDescription: "Circuitbull®-Verhaltenskodex — Integrität, Antikorruption, Export und Meldung.",
        lead: "Volls Global Inc verpflichtet Circuitbull® auf einen Standard: ehrlicher Katalog, rechtmäßiger Export, keine Bestechung, fairer Umgang.",
        headings: ["Integrität des Katalogs", "Antikorruption", "Sanktionen und Export", "Partner und Wettbewerb", "Menschen und Meldung"],
      },
    })[slug]
);

PACKS.fr = translatePack(
  "fr",
  { terms: "Conditions", gdpr: "RGPD", "data-policy": "Politique des données", "code-of-conduct": "Code de conduite" },
  "Mentions",
  "22 septembre 2026",
  (slug) =>
    ({
      terms: {
        title: "Conditions d’utilisation",
        seoTitle: "Conditions d’utilisation | Circuitbull®",
        seoDescription: "Conditions de circuitbull.com — catalogue, devis, propriété intellectuelle, export et droit du Delaware.",
        lead: "Ces conditions régissent l’usage de circuitbull.com, du catalogue Circuitbull® et de tout devis ou briefing demandé à Volls Global Inc. Consulter le site n’est pas un achat consommateur.",
        headings: ["Qui nous sommes", "Catalogue et devis", "Usage acceptable", "Propriété intellectuelle", "Responsabilité", "Droit applicable"],
      },
      gdpr: {
        title: "Avis RGPD",
        seoTitle: "RGPD | Circuitbull®",
        seoDescription: "Avis RGPD pour les visiteurs de l’EEE et du Royaume-Uni — responsable, bases juridiques, droits et transferts.",
        lead: "Si vous êtes dans l’Espace économique européen ou au Royaume-Uni, cet avis explique comment Volls Global Inc traite les données personnelles lorsque vous utilisez circuitbull.com ou demandez un devis.",
        headings: ["Responsable", "Ce que nous traitons et pourquoi", "Vos droits", "Transferts hors EEE", "Conservation et enfants"],
      },
      "data-policy": {
        title: "Politique des données",
        seoTitle: "Politique des données | Circuitbull®",
        seoDescription: "Politique de données et de confidentialité Circuitbull® — collecte, sous-traitants, cookies, CCPA, KVKK.",
        lead: "Cette politique décrit comment Volls Global Inc traite les données personnelles sur circuitbull.com : devis, langue, journaux de sécurité et prestataires.",
        headings: ["Périmètre", "Données collectées", "Utilisation", "Sous-traitants", "Cookies", "États-Unis, Californie et Türkiye", "Sécurité et demandes"],
      },
      "code-of-conduct": {
        title: "Code de conduite",
        seoTitle: "Code de conduite | Circuitbull®",
        seoDescription: "Code de conduite Circuitbull® — intégrité, anti-corruption, export et signalement.",
        lead: "Volls Global Inc tient Circuitbull® à une seule norme : catalogue honnête, export licite, zéro pot-de-vin, relations équitables.",
        headings: ["Intégrité du catalogue", "Anti-corruption", "Sanctions et export", "Partenaires et concurrence", "Personnes et signalement"],
      },
    })[slug]
);

PACKS.ru = translatePack(
  "ru",
  { terms: "Условия", gdpr: "GDPR", "data-policy": "Политика данных", "code-of-conduct": "Кодекс поведения" },
  "Правовая информация",
  "22 сентября 2026",
  (slug) =>
    ({
      terms: {
        title: "Условия использования",
        seoTitle: "Условия использования | Circuitbull®",
        seoDescription: "Условия circuitbull.com — каталог, котировки, ИС, экспорт и право Делавэра.",
        lead: "Эти условия регулируют использование circuitbull.com, каталога Circuitbull® и любого запроса котировки или брифинга в Volls Global Inc. Просмотр сайта не является потребительской покупкой.",
        headings: ["Кто мы", "Каталог и котировки", "Допустимое использование", "Интеллектуальная собственность", "Ответственность", "Применимое право"],
      },
      gdpr: {
        title: "Уведомление GDPR",
        seoTitle: "GDPR | Circuitbull®",
        seoDescription: "Уведомление GDPR для посетителей ЕЭЗ и Великобритании — оператор, основания, права и передачи.",
        lead: "Если вы в Европейской экономической зоне или Великобритании, это уведомление объясняет, как Volls Global Inc обрабатывает персональные данные при использовании circuitbull.com или запросе котировки.",
        headings: ["Оператор", "Что обрабатываем и зачем", "Ваши права", "Передачи за пределы ЕЭЗ", "Срок хранения и дети"],
      },
      "data-policy": {
        title: "Политика данных",
        seoTitle: "Политика данных | Circuitbull®",
        seoDescription: "Политика данных и конфиденциальности Circuitbull® — сбор, обработчики, cookie, CCPA, KVKK.",
        lead: "Политика описывает, как Volls Global Inc обрабатывает персональные данные на circuitbull.com: котировки, язык, журналы безопасности и подрядчики.",
        headings: ["Область", "Какие данные собираем", "Как используем", "Обработчики", "Cookie", "США, Калифорния и Türkiye", "Безопасность и запросы"],
      },
      "code-of-conduct": {
        title: "Кодекс поведения",
        seoTitle: "Кодекс поведения | Circuitbull®",
        seoDescription: "Кодекс Circuitbull® — честность, антикоррупция, экспорт и сообщения.",
        lead: "Volls Global Inc держит Circuitbull® одним стандартом: честный каталог, законный экспорт, без взяток, честные отношения.",
        headings: ["Честность каталога", "Антикоррупция", "Санкции и экспорт", "Партнёры и конкуренция", "Люди и сообщения"],
      },
    })[slug]
);

PACKS["zh-Hant"] = translatePack(
  "zh-Hant",
  { terms: "條款", gdpr: "GDPR", "data-policy": "資料政策", "code-of-conduct": "行為準則" },
  "法律資訊",
  "2026年9月22日",
  (slug) =>
    ({
      terms: {
        title: "使用條款",
        seoTitle: "使用條款 | Circuitbull®",
        seoDescription: "circuitbull.com 使用條款 — 型錄、報價、智慧財產、出口遵循與德拉瓦州法律。",
        lead: "本條款規範您使用 circuitbull.com、Circuitbull® 型錄，以及向 Volls Global Inc 提出的報價或簡報。瀏覽本站並非消費性購買。",
        headings: ["我們是誰", "型錄與報價", "可接受的使用", "智慧財產", "責任", "準據法"],
      },
      gdpr: {
        title: "GDPR 告知",
        seoTitle: "GDPR | Circuitbull®",
        seoDescription: "適用於歐洲經濟區與英國訪客的 GDPR 告知 — 控管者、合法基礎、權利與傳輸。",
        lead: "若您位於歐洲經濟區或英國，本告知說明 Volls Global Inc 在您使用 circuitbull.com 或提出報價時如何處理個人資料。",
        headings: ["控管者", "處理內容與目的", "您的權利", "傳輸至歐洲經濟區以外", "保存與未成年人"],
      },
      "data-policy": {
        title: "資料政策",
        seoTitle: "資料政策 | Circuitbull®",
        seoDescription: "Circuitbull® 資料與隱私政策 — 蒐集、處理者、Cookie、CCPA、KVKK。",
        lead: "本政策說明 Volls Global Inc 如何在 circuitbull.com 處理個人資料：報價、語系、安全紀錄與供應商。",
        headings: ["範圍", "我們蒐集的資料", "如何使用", "處理者", "Cookie", "美國、加州與土耳其", "安全與請求"],
      },
      "code-of-conduct": {
        title: "行為準則",
        seoTitle: "行為準則 | Circuitbull®",
        seoDescription: "Circuitbull® 行為準則 — 誠信、反賄賂、出口與舉報。",
        lead: "Volls Global Inc 以單一標準要求 Circuitbull®：誠實型錄、合法出口、禁止賄賂、公平往來。",
        headings: ["型錄誠信", "反賄賂", "制裁與出口", "夥伴與競爭", "人員與舉報"],
      },
    })[slug]
);

PACKS.it = translatePack(
  "it",
  { terms: "Termini", gdpr: "GDPR", "data-policy": "Politica sui dati", "code-of-conduct": "Codice di condotta" },
  "Legale",
  "22 settembre 2026",
  (slug) =>
    ({
      terms: {
        title: "Termini di utilizzo",
        seoTitle: "Termini di utilizzo | Circuitbull®",
        seoDescription: "Termini di circuitbull.com — catalogo, preventivi, proprietà intellettuale, export e diritto del Delaware.",
        lead: "Questi termini regolano l’uso di circuitbull.com, del catalogo Circuitbull® e di qualsiasi preventivo o briefing richiesto a Volls Global Inc. Navigare il sito non è un acquisto del consumatore.",
        headings: ["Chi siamo", "Catalogo e preventivi", "Uso consentito", "Proprietà intellettuale", "Responsabilità", "Legge applicabile"],
      },
      gdpr: {
        title: "Informativa GDPR",
        seoTitle: "GDPR | Circuitbull®",
        seoDescription: "Informativa GDPR per visitatori SEE e Regno Unito — titolare, basi giuridiche, diritti e trasferimenti.",
        lead: "Se sei nello Spazio economico europeo o nel Regno Unito, questa informativa spiega come Volls Global Inc tratta i dati personali quando usi circuitbull.com o chiedi un preventivo.",
        headings: ["Titolare", "Cosa trattiamo e perché", "I tuoi diritti", "Trasferimenti fuori dal SEE", "Conservazione e minori"],
      },
      "data-policy": {
        title: "Politica sui dati",
        seoTitle: "Politica sui dati | Circuitbull®",
        seoDescription: "Politica dati e privacy Circuitbull® — raccolta, responsabili, cookie, CCPA, KVKK.",
        lead: "Questa politica descrive come Volls Global Inc tratta i dati personali su circuitbull.com: preventivi, lingua, log di sicurezza e fornitori.",
        headings: ["Ambito", "Dati che raccogliamo", "Come li usiamo", "Responsabili del trattamento", "Cookie", "USA, California e Türkiye", "Sicurezza e richieste"],
      },
      "code-of-conduct": {
        title: "Codice di condotta",
        seoTitle: "Codice di condotta | Circuitbull®",
        seoDescription: "Codice di condotta Circuitbull® — integrità, anticorruzione, export e segnalazioni.",
        lead: "Volls Global Inc tiene Circuitbull® a un solo standard: catalogo onesto, export lecito, zero tangenti, rapporti corretti.",
        headings: ["Integrità del catalogo", "Anticorruzione", "Sanzioni ed export", "Partner e concorrenza", "Persone e segnalazioni"],
      },
    })[slug]
);

PACKS.ko = translatePack(
  "ko",
  { terms: "이용약관", gdpr: "GDPR", "data-policy": "데이터 정책", "code-of-conduct": "행동강령" },
  "법률",
  "2026년 9월 22일",
  (slug) =>
    ({
      terms: {
        title: "이용약관",
        seoTitle: "이용약관 | Circuitbull®",
        seoDescription: "circuitbull.com 이용약관 — 카탈로그, 견적, 지식재산, 수출 준수, 델라웨어 준거법.",
        lead: "본 약관은 circuitbull.com, Circuitbull® 카탈로그, Volls Global Inc에 요청하는 견적·브리핑에 적용됩니다. 사이트 열람은 소비자 구매가 아닙니다.",
        headings: ["회사", "카탈로그와 견적", "허용되는 이용", "지식재산", "책임", "준거법"],
      },
      gdpr: {
        title: "GDPR 고지",
        seoTitle: "GDPR | Circuitbull®",
        seoDescription: "EEA 및 영국 방문자를 위한 GDPR 고지 — 컨트롤러, 법적 근거, 권리, 이전.",
        lead: "유럽경제지역 또는 영국에 계신 경우, 본 고지는 circuitbull.com 이용 또는 견적 요청 시 Volls Global Inc의 개인정보 처리를 설명합니다.",
        headings: ["컨트롤러", "처리 항목과 목적", "권리", "EEA 역외 이전", "보관과 아동"],
      },
      "data-policy": {
        title: "데이터 정책",
        seoTitle: "데이터 정책 | Circuitbull®",
        seoDescription: "Circuitbull® 데이터·개인정보 정책 — 수집, 수탁자, 쿠키, CCPA, KVKK.",
        lead: "본 정책은 Volls Global Inc가 circuitbull.com에서 개인정보를 다루는 방식입니다. 견적, 언어, 보안 로그, 공급업체.",
        headings: ["범위", "수집 항목", "이용 목적", "수탁자", "쿠키", "미국·캘리포니아·튀르키예", "보안과 요청"],
      },
      "code-of-conduct": {
        title: "행동강령",
        seoTitle: "행동강령 | Circuitbull®",
        seoDescription: "Circuitbull® 행동강령 — 정직, 반부패, 수출, 신고.",
        lead: "Volls Global Inc는 Circuitbull®에 하나의 기준을 적용합니다. 정직한 카탈로그, 적법한 수출, 뇌물 금지, 공정한 거래.",
        headings: ["카탈로그 정직성", "반부패", "제재와 수출", "파트너와 경쟁", "사람과 신고"],
      },
    })[slug]
);

function pack(lang: string): LegalPack {
  const l = normalizeLang(lang);
  return PACKS[l] || PACKS[DEFAULT_LANG];
}

export function legalNav(lang: string): LegalNavItem[] {
  const p = pack(lang);
  return LEGAL_SLUGS.map((slug) => ({
    slug,
    href: legalPath(lang, slug),
    label: p.nav[slug],
  }));
}

export function legalDoc(slug: string, lang: string): LegalDoc | null {
  if (!LEGAL_SLUGS.includes(slug as LegalSlug)) return null;
  const s = slug as LegalSlug;
  const p = pack(lang);
  const doc = p.docs[s];
  return {
    slug: s,
    title: doc.title,
    seoTitle: doc.seoTitle,
    seoDescription: doc.seoDescription,
    lead: doc.lead,
    updated: p.updated,
    sections: doc.sections,
  };
}

export function legalKicker(lang: string) {
  return pack(lang).kicker;
}
