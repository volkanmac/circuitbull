/**
 * Circuit Bull — seed company, partners, investments (Mongo + Neo4j)
 */
import "dotenv/config";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";

const company = {
  _id: "org:volls-global",
  type: "organization",
  legalName: "Volls Global Inc",
  brand: {
    name: "Circuitbull",
    trademark: "Circuitbull®",
    registered: true,
    madeIn: "USA",
  },
  phone: "+12766002052",
  email: "info@circuitbull.com",
  address: {
    line1: "1207 Delaware Ave #5352",
    city: "Wilmington",
    state: "DE",
    postalCode: "19806",
    country: "US",
    countryName: "United States",
  },
  roles: ["manufacturer", "systems_integrator", "investor"],
  segments: ["iot", "scada", "saas", "solar", "carbon", "thermal", "eo-ir"],
  i18n: {
    en: {
      tagline: "IoT, SCADA & carbon monitoring — Made in USA.",
      about:
        "Volls Global Inc operates Circuitbull® — a registered trademark brand. IoT, SCADA, and carbon live monitoring are Made in USA. Thermal and EO/IR cameras are sourced mission platforms integrated into the Circuitbull® stack.",
    },
    tr: {
      tagline: "IoT, SCADA ve karbon izleme — ABD üretimi.",
      about:
        "Volls Global Inc, Circuitbull® markasını işletir. IoT, SCADA ve karbon canlı izleme ABD üretimi. Termal ve EO/IR kameralar kaynaklı görev platformlarıdır; Circuitbull® yığınına entegre edilir.",
    },
  },
  updatedAt: new Date(),
};

const partners = [
  {
    _id: "partner:us-hq",
    type: "partner",
    role: "headquarters",
    name: "Volls Global Inc",
    country: "US",
    countryName: "United States",
    phone: "+12766002052",
    email: "info@circuitbull.com",
    city: "Wilmington",
    address: company.address,
    status: "active",
    labels: ["HQ", "US HQ"],
  },
  {
    _id: "partner:tr-sibernetik",
    type: "partner",
    role: "authorized_distributor",
    name: "Sibernetik Teknoloji A.Ş.",
    country: "TR",
    countryName: "Türkiye",
    city: "Ankara",
    phone: "+90 312 472 88 45",
    email: null,
    address: {
      line1: "Kızılırmak Mah. Ufuk Üniversitesi Cad., Next Level Loft Office",
      line2: "Kat: 23, No: 62",
      city: "Ankara",
      district: "Çankaya",
      country: "TR",
      countryName: "Turkey",
    },
    activities: [
      "Security systems",
      "Camera systems",
      "Alarms",
      "IT / electronic solutions",
    ],
    status: "active",
    labels: ["Authorized Distributor", "Authorized Seller"],
  },
  {
    _id: "partner:iq-erbil-volls-tech",
    type: "partner",
    role: "authorized_sales",
    name: "Volls Tech For IT Services",
    country: "IQ",
    countryName: "Iraq",
    city: "Erbil",
    phone: "+964 750 158 0509",
    email: null,
    address: {
      line1: "Wavey Avenue B 17",
      city: "Erbil",
      country: "IQ",
      countryName: "Iraq",
    },
    activities: ["IT services", "Security systems", "Electronic solutions"],
    status: "active",
    labels: ["Authorized Seller", "Erbil"],
  },
  {
    _id: "partner:iq-baghdad-volls-import",
    type: "partner",
    role: "authorized_sales",
    name: "Volls Import Export Limited Iraq Branch",
    country: "IQ",
    countryName: "Iraq",
    city: "Baghdad",
    phone: "+964 787 100 2052",
    email: null,
    address: {
      line1: "Al Yarmouk 612-8",
      city: "Baghdad",
      country: "IQ",
      countryName: "Iraq",
    },
    activities: ["Import / export", "Security systems", "Electronic solutions"],
    status: "active",
    labels: ["Authorized Seller", "Baghdad"],
  },
  {
    _id: "partner:sa-sales",
    type: "partner",
    role: "authorized_sales",
    name: "Circuitbull Middle East Sales Partner",
    country: "SA",
    countryName: "Saudi Arabia",
    city: null,
    phone: null,
    email: "me@circuitbull.com",
    status: "pipeline",
    labels: ["Authorized Sales", "Enterprise"],
  },
  {
    _id: "partner:de-distributor",
    type: "partner",
    role: "authorized_distributor",
    name: "Circuitbull EU Distributor",
    country: "DE",
    countryName: "Germany",
    city: null,
    phone: null,
    email: "eu@circuitbull.com",
    status: "pipeline",
    labels: ["Authorized Distributor"],
  },
];

const investments = [
  {
    _id: "invest:border-security-e2e",
    type: "investment",
    slug: "border-security-end-to-end",
    status: "active",
    liquidity: "small",
    customerTypes: ["government", "enterprise"],
    sectors: ["border-security", "homeland"],
    needSlugs: ["border-control"],
    ownStack: ["iot", "scada", "saas"],
    distributedStack: ["thermal", "eo-ir"],
    i18n: {
      en: {
        title: "Border Security — End-to-End Investment",
        summary:
          "Circuitbull® co-invests with government and enterprise customers using small-liquidity structures to deliver full border-control stacks: long-range thermal sensing, command SCADA, IoT edge, and live ops SaaS.",
        outcomes: [
          "Sensor-to-command pipeline",
          "Rapid quote-to-deploy BOM",
          "Joint ownership / shared upside on ops SaaS",
        ],
      },
      tr: {
        title: "Sınır Güvenliği — Uçtan Uca Yatırım",
        summary:
          "Circuitbull®, kamu ve kurumsal müşterilerle küçük likidite yapılarıyla sınır güvenliği yığınını uçtan uca finanse eder ve kurar.",
        outcomes: [
          "Sensörden komuta hattına",
          "Hızlı tekliften sahaya BOM",
          "Ops SaaS ortak değer",
        ],
      },
    },
  },
  {
    _id: "invest:solar-energy-mgmt",
    type: "investment",
    slug: "solar-energy-management",
    status: "active",
    liquidity: "small",
    customerTypes: ["enterprise", "government"],
    sectors: ["solar", "energy", "esg"],
    needSlugs: ["solar-fleet-ops"],
    ownStack: ["solar", "iot", "saas", "carbon"],
    distributedStack: [],
    i18n: {
      en: {
        title: "Solar Energy Management — Project Investment",
        summary:
          "Solar fleet management with Made-in-USA carbon live monitoring, financed with small liquidity for enterprise and public energy programs — monitoring, SCADA hooks, and ESG reporting in one Circuitbull® stack.",
        outcomes: [
          "Fleet-level solar telemetry",
          "Carbon live monitoring",
          "Gov / enterprise ESG-ready dashboards",
        ],
      },
      tr: {
        title: "Güneş Enerjisi Yönetimi — Proje Yatırımı",
        summary:
          "Güneş filosu yönetimi ve ABD üretimi karbon canlı izleme; kurumsal ve kamu enerji programları için küçük likidite ile Circuitbull® yığını.",
        outcomes: [
          "Filo seviyesi güneş telemetrisi",
          "Karbon canlı izleme",
          "Kamu / kurumsal ESG panelleri",
        ],
      },
    },
  },
];

const needs = [
  {
    slug: "solar-fleet-ops",
    solutionSlug: "solar-energy-management",
    catalog: false,
    i18n: {
      en: { title: "Solar Fleet Operations", problem: "Monitor and optimize distributed solar assets." },
      tr: { title: "Güneş Filosu Operasyonları", problem: "Dağıtık güneş varlıklarını izle ve optimize et." },
    },
  },
];

async function seedMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "circuitbull";
  if (!uri) throw new Error("MONGODB_URI missing");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection("organization").updateOne({ _id: company._id }, { $set: company }, { upsert: true });
  for (const p of partners) {
    await db.collection("partners").updateOne({ _id: p._id }, { $set: { ...p, updatedAt: new Date() } }, { upsert: true });
  }
  for (const inv of investments) {
    await db.collection("investments").updateOne({ _id: inv._id }, { $set: { ...inv, updatedAt: new Date() } }, { upsert: true });
  }
  for (const n of needs) {
    await db.collection("needs").updateOne(
      { slug: n.slug },
      { $set: { ...n, type: "need", updatedAt: new Date() } },
      { upsert: true }
    );
  }

  await db.collection("partners").createIndex({ country: 1, city: 1, role: 1 });
  await db.collection("partners").deleteOne({ _id: "partner:tr-distributor" });
  await db.collection("investments").createIndex({ slug: 1 }, { unique: true });
  await db.collection("needs").createIndex({ slug: 1 }, { unique: true });

  console.log("Mongo seed OK:", {
    organization: 1,
    partners: partners.length,
    investments: investments.length,
    needs: needs.length,
  });
  await client.close();
}

async function seedNeo4j() {
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
  );
  const session = driver.session({ database: process.env.NEO4J_DATABASE || "neo4j" });
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `
        MERGE (o:Organization {id: $id})
        SET o.legalName = $legalName,
            o.brand = $brand,
            o.phone = $phone,
            o.email = $email,
            o.madeIn = $madeIn,
            o.trademarkRegistered = true
        `,
        {
          id: company._id,
          legalName: company.legalName,
          brand: company.brand.name,
          phone: company.phone,
          email: company.email,
          madeIn: company.brand.madeIn,
        }
      );

      for (const p of partners) {
        const city = p.city || p.address?.city || "";
        const addressLine = [p.address?.line1, p.address?.line2].filter(Boolean).join(", ");
        await tx.run(
          `
          MERGE (c:Country {code: $country})
          SET c.name = $countryName
          MERGE (p:Partner {id: $id})
          SET p.name = $name,
              p.role = $role,
              p.status = $status,
              p.email = $email,
              p.phone = $phone,
              p.city = $city,
              p.address = $addressLine,
              p.activities = $activities
          MERGE (o:Organization {id: $orgId})
          MERGE (o)-[:HAS_PARTNER]->(p)
          MERGE (o)-[:AUTHORIZES {role: $role}]->(p)
          MERGE (p)-[:AUTHORIZED_SELLER_FOR]->(o)
          MERGE (p)-[:LOCATED_IN]->(c)
          MERGE (c)-[:HAS_SELLER]->(p)
          `,
          {
            id: p._id,
            name: p.name,
            role: p.role,
            status: p.status,
            email: p.email,
            phone: p.phone || null,
            city,
            addressLine: addressLine || null,
            activities: p.activities || [],
            country: p.country,
            countryName: p.countryName,
            orgId: company._id,
          }
        );
        if (city) {
          await tx.run(
            `
            MERGE (city:City {name: $city, country: $country})
            SET city.countryName = $countryName
            MERGE (c:Country {code: $country})
            MERGE (p:Partner {id: $id})
            MERGE (p)-[:IN_CITY]->(city)
            MERGE (city)-[:IN_COUNTRY]->(c)
            `,
            {
              id: p._id,
              city,
              country: p.country,
              countryName: p.countryName,
            }
          );
        }
      }
      await tx.run(`MATCH (p:Partner {id: 'partner:tr-distributor'}) DETACH DELETE p`);

      for (const inv of investments) {
        await tx.run(
          `
          MERGE (i:Investment {id: $id})
          SET i.slug = $slug, i.liquidity = $liquidity, i.status = $status
          MERGE (o:Organization {id: $orgId})
          MERGE (o)-[:INVESTS_IN]->(i)
          `,
          {
            id: inv._id,
            slug: inv.slug,
            liquidity: inv.liquidity,
            status: inv.status,
            orgId: company._id,
          }
        );
        for (const need of inv.needSlugs) {
          await tx.run(
            `
            MERGE (n:Need {slug: $need})
            MERGE (i:Investment {id: $id})
            MERGE (i)-[:TARGETS_NEED]->(n)
            MERGE (s:Solution {slug: $need})
            MERGE (n)-[:SATISFIED_BY]->(s)
            `,
            { id: inv._id, need }
          );
        }
      }

      await tx.run(
        `
        MERGE (n:Need {slug: 'border-control'})
        SET n.titleEn = 'Border Control'
        MERGE (s:Solution {slug: 'border-control'})
        MERGE (n)-[:SATISFIED_BY]->(s)
        `
      );
    });
    console.log("Neo4j seed OK");
  } finally {
    await session.close();
    await driver.close();
  }
}

await seedMongo();
await seedNeo4j();
console.log("Done.");
