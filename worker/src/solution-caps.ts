/** Per-mission “What we field” capability pages. URL: /{lang}/solutions/{need}/{cap} */

export type CapCopy = {
  title: string;
  lead: string;
  body: string[];
  field: string;
};

export type CapabilityDef = {
  slug: string;
  keywords: string[];
  listAll?: boolean;
  i18n: { en: CapCopy; tr: CapCopy };
};

function cap(slug: string, keywords: string[], en: CapCopy, tr: CapCopy, listAll = false): CapabilityDef {
  return { slug, keywords, listAll, i18n: { en, tr } };
}

export const SOLUTION_CAPS: Record<string, CapabilityDef[]> = {
  "seaport-airport": [
    cap(
      "runway-apron-thermal",
      ["runway", "apron", "taxiway", "airport", "fog", "ptz", "long range", "thermal", "mwir"],
      {
        title: "Runway and apron thermal coverage in fog and night",
        lead: "Airside movement areas go dark and wet. Thermal PTZ and dual-spectrum units keep the runway, taxiway, and apron readable when floodlights fail or weather closes the visual channel.",
        body: [
          "A seaport or airport perimeter is not a parking-lot CCTV job. You need stand-off detection on the movement area: people walking a taxiway, a vehicle on an unauthorized stub, a small craft sliding along a channel wall. Cooled and uncooled thermal cores see heat contrast through fog, rain, and unlit concrete — without lighting the field for everyone else.",
          "We specify platforms by detection range, housing, and PTZ load so tower and mast placements cover the real geometry of the airfield or berth, not a brochure circle. Datasheets travel with the SKU so ops and procurement argue from the same figures.",
        ],
        field: "Field cooled or uncooled thermal PTZ on masts covering runway ends, apron corners, and the last 400–800 m of approach. Cue from existing radar or fence contact when it exists.",
      },
      {
        title: "Sis ve gece pist / apron termal kapsama",
        lead: "Hava tarafı hareket alanları karanlık ve ıslaktır. Termal PTZ, projektör düştüğünde veya hava görsel kanalı kapattığında pist, taksi yolu ve apronun okunmasını sağlar.",
        body: [
          "Liman veya havalimanı perimetresi otopark kamerası işi değildir. Taksi yolundaki yaya, yetkisiz araç, rıhtım duvarına yapışan küçük tekne — durdurma mesafesinde görülmelidir. Soğutmalı ve soğutmasız termal çekirdekler sis, yağmur ve ışıksız betonda ısı kontrastını okur.",
          "Platformları tespit menzili, gövde ve PTZ yüküyle şartlarız; kule ve mast yerleşimi gerçek geometriyi kapsar. SKU ile datasheet birlikte gider.",
        ],
        field: "Pist uçları, apron köşeleri ve yaklaşmanın son 400–800 m’si için mastta termal PTZ. Radar veya çit kontağı varsa ipucu olarak bağlanır.",
      }
    ),
    cap(
      "harbor-channel-tracking",
      ["harbor", "harbour", "channel", "berth", "maritime", "coastal", "boat", "craft", "seaport"],
      {
        title: "Harbor channel and berth approach tracking",
        lead: "Small craft and work boats disappear against water and quay lights. Thermal and maritime-capable EO/IR keep the channel, turning basin, and berth pocket on the picture.",
        body: [
          "Water is a bad background for visible cameras: glare by day, empty black by night, and a thousand legitimate lights on the quay. Mid- and long-wave thermal discriminates a hull and a warm engine from the water mass, so operators see a boat that AIS never filed.",
          "We place sensors on harbor masts, breakwaters, and terminal roofs with enough zoom to identify class of craft at the approach, then hand the track to the port command room. Explosion-aware housings are quoted where the terminal zone requires them.",
        ],
        field: "Specify maritime-capable thermal / EO-IR with continuous 360° or sector PTZ, anti-salt housing, and a detection figure that matches your channel width — not a city-street camera on a pole.",
      },
      {
        title: "Liman kanalı ve rıhtım yaklaşma takibi",
        lead: "Küçük tekne ve iş botları su ve rıhtım ışıklarında kaybolur. Termal ve deniz sınıfı EO/IR kanal, dönüş havuzu ve rıhtım cebini resimde tutar.",
        body: [
          "Su, görünür kameralar için kötü bir arka plandır. Orta ve uzun dalga termal, gövde ve sıcak motoru su kütlesinden ayırır; AIS’e düşmeyen tekne görünür.",
          "Sensörler liman mastı, dalgakıran ve terminal çatısına, yaklaşmada tekne sınıfını ayırt edecek zoom ile konur; iz port komuta odasına devredilir.",
        ],
        field: "Kanal genişliğine uyan tespit rakamlı, tuz dayanımlı, sürekli PTZ’li deniz sınıfı termal / EO-IR şartlayın — sokak kamerasını direğe asmayın.",
      }
    ),
    cap(
      "perimeter-ptz-handoff",
      ["perimeter", "fence", "ptz", "radar", "handoff", "cue", "breach"],
      {
        title: "Perimeter breach alert with PTZ handoff",
        lead: "Fence contact is a start, not a picture. When the wire or radar cues, a thermal PTZ must already be on the sector and putting an identification shot on the desk.",
        body: [
          "Air and sea gates run layered detection: fence, radar, ground radar, sometimes acoustic. The camera’s job is the last meter of truth — is it a person, a vehicle, a false alarm in wind? Dual-spectrum PTZ units slew to the cue in seconds and hold the track while the patrol moves.",
          "We size the PTZ load and slew rate to the length of the sector, not to a generic “security camera” spec. Quote packages include the SKU, the cue interface expectation, and the datasheet so systems integrators do not guess.",
        ],
        field: "Pair a long-range thermal PTZ with your existing cue source. We list SKUs that accept radar / fence handoff and still identify at the far end of the sector.",
      },
      {
        title: "Perimetre ihlalinde PTZ devri",
        lead: "Çit kontağı bir başlangıçtır, resim değildir. Tel veya radar ipucu verdiğinde termal PTZ sektörde olmalı ve tanımlama karesini masaya koymalıdır.",
        body: [
          "Hava ve deniz kapıları katmanlı tespit çalıştırır. Kameranın işi son metre gerçeğidir: insan mı, araç mı, rüzgârda yanlış alarm mı? Çift spektrumlu PTZ saniyeler içinde ipucuna döner.",
          "PTZ yükü ve dönüş hızı sektör uzunluğuna göre boyutlanır. Teklif paketi SKU, ipucu arayüzü ve datasheet içerir.",
        ],
        field: "Mevcut ipucu kaynağına uzun menzilli termal PTZ bağlayın. Radar / çit devrini kabul eden ve sektörün ucunda hâlâ tanımlayan SKU’ları listeleriz.",
      }
    ),
    cap(
      "quote-ready-skus",
      ["datasheet", "sku", "range", "quote", "specification"],
      {
        title: "Quote-ready SKUs with datasheets and range figures",
        lead: "Airport and seaport programs die in the tender file when the sensor has no SKU, no range table, and no housing rating. We quote platforms you can put on a specification line.",
        body: [
          "Procurement is not a vibe. You need model numbers, detection / recognition / identification figures, power, and IP / explosion ratings that survive a technical committee. Every Circuitbull® catalog platform on this mission ships with a datasheet path and a quote CTA.",
          "Pick the SKU that matches the sector, attach the PDF, send the quantity. We do not ask you to “talk to sales for the real numbers.”",
        ],
        field: "Open a platform, download the datasheet, request a quote with mission, quantity, and timeline. That is the whole path.",
      },
      {
        title: "Teklife hazır SKU ve menzil verileri",
        lead: "Sensörün SKU’su, menzil tablosu ve gövde sınıfı yoksa havalimanı / liman programı ihale dosyasında ölür. Şartname satırına yazılacak platformları teklifleriz.",
        body: [
          "Tedarik bir his işi değildir. Model, tespit / tanıma / teşhis rakamları, güç ve IP / patlama sınıfı teknik kurulu geçmelidir. Bu görevdeki her katalog platformunun datasheet yolu ve teklif CTA’sı vardır.",
          "Sektöre uyan SKU’yu seçin, PDF’i ekleyin, adeti gönderin.",
        ],
        field: "Platformu açın, datasheet indirin, görev-adet-takvim ile teklif isteyin. Yol budur.",
      },
      true
    ),
  ],
  "water-systems": [
    cap(
      "reservoir-perimeter",
      ["reservoir", "plant", "perimeter", "fence", "water", "intake", "treatment"],
      {
        title: "Reservoir and plant perimeter watch",
        lead: "Intakes, treatment plants, and fenced reservoirs are long, dark, and rarely walked. Thermal coverage on the wire and the waterline is the first control that actually works at 02:00.",
        body: [
          "Water sites attract intrusion, theft of equipment, and people who should not be on the berm. Visible CCTV washes out under security lighting and goes blind when the lights are off. Uncooled thermal on the fence and cooled or dual-spectrum on the long fetch of the reservoir give operators a single picture of land and water edge.",
          "We recommend mast placements that see the access road, the overflow, and the plant yard as one sector rather than a scatter of indoor cameras pointed at doors.",
        ],
        field: "Specify thermal PTZ or dual-sensor units for the longest fence run and a second unit on the intake / plant yard. Quote by SKU with range figures that match the fetch.",
      },
      {
        title: "Rezervuar ve tesis perimetresi",
        lead: "Su alma, arıtma ve çitli rezervuarlar uzun, karanlık ve seyrek yürülür. Tel ve su çizgisinde termal kapsama 02:00’de gerçekten çalışan ilk kontroldür.",
        body: [
          "Su sahaları izinsiz giriş, ekipman hırsızlığı ve bermde olmaması gereken insan çeker. Görünür CCTV güvenlik ışığında solar, ışık kapalıyken kördür. Çitte soğutmasız, rezervuarın uzun fetch’inde soğutmalı veya çift spektrum tek resim verir.",
          "Erişim yolu, taşkın ve tesis avlusunu tek sektörde gören mast yerleşimi öneririz.",
        ],
        field: "En uzun çit koşusu için termal PTZ veya çift sensör; su alma / tesis avlusuna ikinci ünite. Fetch’e uyan menzil rakamıyla SKU teklifi.",
      }
    ),
    cap(
      "open-water-night-fog",
      ["fog", "night", "open water", "lake", "reservoir", "maritime", "thermal"],
      {
        title: "Night and fog imaging on open water",
        lead: "Open water kills contrast for daylight cameras. Thermal cores keep a boat, a swimmer, or a warm engine visible when the surface is fog, rain, or black glass.",
        body: [
          "Reservoirs and river intakes are weather machines. Operators need a sensor that does not wait for a light to come on. Uncooled LWIR covers the near waterline; longer-range MWIR or dual-spectrum is the right call when the fetch is measured in kilometers.",
          "We list platforms that are already specified for outdoor, continuously-on duty — not indoor cores in a box.",
        ],
        field: "Match waveband to fetch: LWIR for the near bank, MWIR / dual-spectrum for the far shore. Housing must be outdoor-rated for the plant climate.",
      },
      {
        title: "Açık suda gece / sis görüntüleme",
        lead: "Açık su, gündüz kameralarının kontrastını öldürür. Termal çekirdek sis, yağmur veya kara camda tekne, yüzücü veya sıcak motoru görünür tutar.",
        body: [
          "Rezervuar ve nehir alma yapıları hava makineleridir. Yakın su çizgisi için soğutmasız LWIR; fetch kilometre ise MWIR veya çift spektrum.",
          "Dış mekân, sürekli açık görev için şartlanmış platformları listeleriz — kutudaki iç mekân çekirdeği değil.",
        ],
        field: "Dalgaboyunu fetch’e uydurun: yakın kıyı LWIR, uzak kıyı MWIR / çift spektrum. Gövde tesis iklimine dış mekân sınıfı olmalı.",
      }
    ),
    cap(
      "pump-transformer-heat",
      ["heat", "hot", "transformer", "pump", "flame", "fire", "temperature"],
      {
        title: "Heat-event cueing at pumps and transformers",
        lead: "Pumps, switchgear, and transformers fail as heat before they fail as fire. A thermal camera on the pad is an early-warning instrument, not only a security camera.",
        body: [
          "Water utilities already run SCADA on flow and pressure. They rarely see the thermal signature of a bearing, a cabinet, or a bushing until smoke. A fixed or slow-scan thermal unit on the electrical and pump pads gives a cue that can page the same duty officer who already watches intrusion.",
          "We do not replace your protection relays. We add a picture and a temperature cue on the same mast that already watches the fence.",
        ],
        field: "Fixed thermal on pump / transformer pads, with alarm thresholds in the datasheet. Pair with Circuitbull® IoT / SCADA when you want the cue in the same live stack as the perimeter.",
      },
      {
        title: "Pompa ve transformatörde ısı uyarısı",
        lead: "Pompa, şalt ve transformatör yangından önce ısı olarak bozulur. Pad üzerindeki termal kamera yalnızca güvenlik değil, erken uyarı cihazıdır.",
        body: [
          "Su idareleri debi ve basıncı SCADA’da izler; yatak, pano veya buşingin ısısını duman çıkana kadar görmez. Elektrik ve pompa padlerinde sabit veya yavaş tarama termal, izinsiz girişe bakan aynı nöbetçiye sayfa atabilir.",
          "Koruma rölelerinin yerini almayız. Çiti zaten izleyen mastta resim ve sıcaklık ipucu ekleriz.",
        ],
        field: "Pompa / transformatör padinde sabit termal, datasheet’te alarm eşiği. İpucunu perimetre ile aynı canlı yığında istiyorsanız Circuitbull® IoT / SCADA ile eşleyin.",
      }
    ),
    cap(
      "iot-scada-live",
      ["iot", "scada", "live", "monitoring", "telemetry", "circuitbull"],
      {
        title: "Pair with Circuitbull® IoT / SCADA live monitoring",
        lead: "The camera is the eye. The Circuitbull® stack — Made in USA IoT, SCADA, and live monitoring — is how the cue reaches the plant without a dedicated video wall in every pump house.",
        body: [
          "Thermal sensors generate events: intrusion, heat, loss of scene. Those events belong in the same operational picture as flow, valve state, and generator status. Our US-built IoT and SCADA layer is the part of the offer that is actually manufactured in the United States; catalog cameras are sourced sensors quoted through Circuitbull®.",
          "Specify the camera SKU for the sector, then add the live-monitoring path so the duty officer is not staring at a dark NVR.",
        ],
        field: "Quote the sensor SKU plus Circuitbull® IoT / SCADA. One request covers both the field camera and the live cue.",
      },
      {
        title: "Circuitbull® IoT / SCADA ile canlı izleme",
        lead: "Kamera gözdür. Circuitbull® yığını — ABD üretimi IoT, SCADA ve canlı izleme — ipucunun her pompa evinde ayrı video duvarı olmadan tesise ulaşma yoludur.",
        body: [
          "Termal olaylar (izinsiz giriş, ısı, sahne kaybı) debi ve vana durumu ile aynı operasyon resmine aittir. ABD’de üretilen kısım IoT / SCADA katmanıdır; katalog kameraları Circuitbull® üzerinden teklif edilen tedarik sensörleridir.",
          "Sektör için kamera SKU’sunu seçin, nöbetçinin karanlık NVR’a bakmaması için canlı izleme yolunu ekleyin.",
        ],
        field: "Sensör SKU’su artı Circuitbull® IoT / SCADA. Tek talep hem saha kamerasını hem canlı ipucunu kapsar.",
      },
      true
    ),
  ],
  storage: [
    cap(
      "yard-dock-thermal",
      ["yard", "dock", "warehouse", "loading", "ptz", "thermal", "storage", "logistics"],
      {
        title: "Yard and dock thermal coverage",
        lead: "Loading docks and container yards are wide, poorly lit, and full of legitimate motion. Thermal PTZ separates a person on the dock from a forklift and a truck — without turning the yard into a stadium.",
        body: [
          "Storage sites lose cargo, fuel, and copper at the dock, not at the receptionist desk. Consumer CCTV on the building face cannot see the far row of trailers or the dark side of a warehouse. A thermal or dual-spectrum PTZ on a yard mast covers the apron, the dock doors, and the first fence line as one sector.",
          "We specify by detection range against your yard depth, not by “4K.” If the far fence is 280 m, the SKU must still put a human-sized target on the screen at that distance, night and weather included.",
        ],
        field: "One thermal PTZ per yard sector, mounted high enough to clear stacked containers and truck trailers. Quote the SKU whose datasheet range matches the longest dock-to-fence run.",
      },
      {
        title: "Avlu ve rampa termal kapsama",
        lead: "Yükleme rampaları ve konteyner avluları geniş, az ışıklı ve meşru hareketle doludur. Termal PTZ, avluyu stadyuma çevirmeden rampadaki insanı forklift ve kamyondan ayırır.",
        body: [
          "Depolama sahaları kargoyu, yakıtı ve bakırı resepsiyonda değil rampada kaybeder. Bina cephesindeki tüketici CCTV, treyler sırasının ucunu veya deponun karanlık yüzünü göremez. Avlu mastındaki termal veya çift spektrumlu PTZ apron, rampa kapıları ve ilk çit hattını tek sektörde tutar.",
          "Şartname “4K” değil, avlu derinliğine karşı tespit menzilidir. Uzak çit 280 m ise SKU gece ve havada insan boyutlu hedefi hâlâ ekrana koymalıdır.",
        ],
        field: "Avlu sektörü başına bir termal PTZ; istif konteyner ve treylerin üstünü görecek yükseklik. Datasheet menzili en uzun rampa–çit koşusuna uyan SKU’yu teklifleyin.",
      }
    ),
    cap(
      "stockpile-fence",
      ["stockpile", "fence", "outdoor", "coal", "ore", "perimeter", "yard"],
      {
        title: "Outdoor stockpile and fence line watch",
        lead: "Open stock — ore, coal, timber, containers — sits outside the building alarm. Fence-line thermal sees a cut, a climb, or a vehicle on the pile when the site lights are off.",
        body: [
          "Stockpiles are three-dimensional. A camera on the office wall looks at the near face and misses the far slope and the service road. Thermal on the perimeter and a second PTZ over the pile give the duty officer both the wire and the commodity.",
          "Dust, steam, and night are normal on these yards. We quote housings and wavebands that stay useful in that air, and we do not pretend a dome over the gate is coverage.",
        ],
        field: "Fence-line thermal for the wire; a longer-range PTZ for the pile and service road. Specify IP rating and, where the commodity is combustible, heat-cue options from the same catalog.",
      },
      {
        title: "Açık stok ve çit hattı izleme",
        lead: "Açık stok — cevher, kömür, kereste, konteyner — bina alarmının dışındadır. Çit hattı termali saha ışıkları kapalıyken kesik, tırmanma veya yığın üzerindeki aracı görür.",
        body: [
          "Stok yığınları üç boyutludur. Ofis duvarındaki kamera yakın yüzü görür, uzak yamacı ve servis yolunu kaçırır. Perimetrede termal ve yığın üzerinde ikinci PTZ, nöbetçiye hem teli hem emtiayı verir.",
          "Toz, buhar ve gece bu avlularda normaldir. O havada işe yarayan gövde ve dalgaboyunu teklifleriz.",
        ],
        field: "Tel için çit hattı termali; yığın ve servis yolu için daha uzun menzilli PTZ. IP sınıfı; emtia yanıcıysa aynı katalogdan ısı ipucu seçenekleri.",
      }
    ),
    cap(
      "low-light-patrol-handoff",
      ["low-light", "low light", "identification", "patrol", "eo", "zoom", "visible", "handoff"],
      {
        title: "Low-light identification for patrol handoff",
        lead: "Thermal finds the body. A daylight / low-light EO channel with real zoom is what the patrol uses to decide who they are walking toward.",
        body: [
          "A storage night shift cannot launch on every heat blob. Dual-spectrum and multi-sensor PTZ units keep an identification channel on the same payload: once thermal cues, the EO lens should already be on the sector with enough focal length for a face, a plate, or a uniform at the fence.",
          "We list platforms where the EO and thermal are boresighted — not two cameras the operator has to pan separately while the contact walks off the yard.",
        ],
        field: "Prefer dual-spectrum / multi-sensor PTZ for dock and gate sectors. Check the datasheet for EO focal length at your handoff distance, not only thermal detection range.",
      },
      {
        title: "Devriye devri için düşük ışık tanımlama",
        lead: "Termal gövdeyi bulur. Gerçek zoom’lu gündüz / düşük ışık EO kanalı, devriyenin kime yürüdüğüne karar verdiği şeydir.",
        body: [
          "Depo gece vardiyası her ısı lekesine çıkamaz. Çift spektrumlu ve çoklu-sensör PTZ aynı yükte tanımlama kanalını tutar: termal ipucu verdiğinde EO merceği sektörde, çitte yüz, plaka veya üniforma için yeterli odak uzaklığında olmalıdır.",
          "EO ve termalin aynı bakış çizgisinde olduğu platformları listeleriz — operatörün ayrı ayrı pan ettiği iki kamera değil.",
        ],
        field: "Rampa ve kapı sektörleri için çift spektrum / çoklu-sensör PTZ. Datasheet’te yalnızca termal tespit değil, devir mesafesinde EO odak uzaklığına bakın.",
      }
    ),
    cap(
      "datasheet-skus",
      ["datasheet", "sku", "specify", "quote", "specification"],
      {
        title: "Datasheet-backed SKUs ready to specify",
        lead: "Warehouse and depot tenders need a model number, a range table, and a housing rating — not a slide that says “AI camera.” Every platform in this group has a Circuitbull® SKU and a datasheet.",
        body: [
          "If you cannot put the sensor on a line item, it will not survive procurement. We keep the catalog on SKUs: detection figures, power, environment, and a PDF you can attach to the RFQ.",
          "Choose the platform for the yard sector, send quantity and timeline. The quote path is the same as the rest of the site.",
        ],
        field: "Open the SKU, download the datasheet, request a quote. Specifiers should not have to wait for a “custom datasheet.”",
      },
      {
        title: "Şartnameye hazır SKU ve datasheet",
        lead: "Depo ve antrepo ihaleleri slayt değil, model numarası, menzil tablosu ve gövde sınıfı ister. Bu gruptaki her platformun Circuitbull® SKU’su ve datasheet’i vardır.",
        body: [
          "Sensörü satır kalemine yazamıyorsanız tedarikte yaşamaz. Katalog SKU üzerinedir: tespit rakamları, güç, çevre ve RFQ’ya eklenecek PDF.",
          "Avlu sektörü için platformu seçin, adet ve takvimi gönderin.",
        ],
        field: "SKU’yu açın, datasheet indirin, teklif isteyin. Şartname yazarı “özel datasheet” beklememelidir.",
      },
      true
    ),
  ],
  "base-security": [
    cap(
      "fence-approach",
      ["fence", "approach", "road", "perimeter", "long range", "standoff", "thermal"],
      {
        title: "Fence-line and approach-road detection",
        lead: "A base is lost on the approach road, not at the badge reader. Long-range thermal on the wire and the last kilometers of road gives the TOC time to man the gate.",
        body: [
          "Military and government perimeters are measured in sectors. Each sector needs a sensor that detects a vehicle and a crawler at a published range, then tracks while the QRF moves. Cooled MWIR is the usual answer when the approach is kilometers; uncooled covers the near wire and dead ground.",
          "We quote platforms that belong on a mast or a tower, with datasheet DRI figures you can put in the OPORD annex — not indoor cores.",
        ],
        field: "Sectorize the wire. One long-range cooled or dual-spectrum PTZ per long approach; uncooled or dual-sensor on short fence runs and culverts.",
      },
      {
        title: "Çit hattı ve yaklaşma yolu tespiti",
        lead: "Üs yaka okuyucusunda değil yaklaşma yolunda kaybedilir. Telde ve yolun son kilometrelerinde uzun menzilli termal, TOC’a kapıyı dolduracak zamanı verir.",
        body: [
          "Askeri ve kamu perimetreleri sektörle ölçülür. Her sektör, yayımlanmış menzilde araç ve sürünen tespiti, QRF hareket ederken takip ister. Yaklaşma kilometre ise soğutmalı MWIR; yakın tel ve ölü zemin için soğutmasız.",
          "Mast veya kulede duran, OPORD ekine DRI rakamı yazılacak platformları teklifleriz.",
        ],
        field: "Teli sektörleyin. Uzun yaklaşmaya bir uzun menzilli soğutmalı veya çift spektrum PTZ; kısa çit ve menfezlere soğutmasız veya çift sensör.",
      }
    ),
    cap(
      "gate-pad-overwatch",
      ["gate", "pad", "entry", "overwatch", "identification", "ptz"],
      {
        title: "Gate and pad overwatch, day and night",
        lead: "Vehicle gates and aircraft or logistics pads need an identification shot, not only a tripwire. Dual-spectrum PTZ covers the queue, the search bay, and the pad edge in one payload.",
        body: [
          "The TOC already has access control. What it lacks at 03:00 is a picture of who is in the lane and what is on the pad beyond the lights. EO/IR stacks with real zoom hand the patrol a face, a plate, and a load silhouette without turning IR illuminators on the whole base.",
          "We specify rugged housings for dust and heat at desert and coastal posts, and we keep the SKU on the quote so the contracting officer is not buying a prototype.",
        ],
        field: "Dual-spectrum PTZ over each active gate and critical pad. Datasheet must show EO identification range at the search-bay distance.",
      },
      {
        title: "Kapı ve pad üst gözetimi",
        lead: "Araç kapıları ile uçak veya lojistik padleri yalnızca tetik değil, tanımlama karesi ister. Çift spektrumlu PTZ kuyruk, arama cebi ve pad kenarını tek yükte kapsar.",
        body: [
          "TOC’un erişim kontrolü vardır. 03:00’te eksik olan, şeritte kimin ve ışıkların ötesindeki padde neyin olduğunun resmi. Gerçek zoom’lu EO/IR, tüm üssü IR aydınlatıcıya boğmadan yüz, plaka ve yük silueti verir.",
          "Çöl ve kıyı karakolları için toz ve ısıya dayanıklı gövde; sözleşme subayının prototip almaması için SKU teklifte kalır.",
        ],
        field: "Her aktif kapı ve kritik pad üzerinde çift spektrum PTZ. Datasheet, arama cebi mesafesinde EO teşhis menzilini göstermelidir.",
      }
    ),
    cap(
      "rugged-housings",
      ["rugged", "dust", "salt", "heat", "ip66", "ip67", "housing", "outdoor", "explosion"],
      {
        title: "Rugged housings for dust, salt, and heat",
        lead: "Base cameras die from climate, not from lack of pixels. Housings must be outdoor-rated for the post: dust, salt fog, and high temperature are the spec, not the brochure photo.",
        body: [
          "A thermal core in a plastic dome is a warehouse camera. Posts on the coast and in the desert need sealed, sun-loaded, often nitrogen or wiper-equipped payloads that stay on 24/7. We filter the catalog for housings that publish IP and operating-temperature figures.",
          "Where the pad is a hazardous zone, explosion-rated options are listed in the same mission group rather than as a side conversation.",
        ],
        field: "Read the housing and temperature lines on the datasheet before the DRI table. If the post is coastal or desert, those lines are the buy.",
      },
      {
        title: "Toz, tuz ve ısıya dayanıklı gövde",
        lead: "Üs kameraları piksel eksikliğinden değil iklimden ölür. Gövde karakol için dış mekân sınıfı olmalıdır: toz, tuz sisi ve yüksek sıcaklık spesifikasyondur.",
        body: [
          "Plastik domdaki termal çekirdek depo kamerasıdır. Kıyı ve çöl karakolları 7/24 açık, sızdırmaz, güneş yükü altındaki yükler ister. IP ve çalışma sıcaklığı yayımlayan gövdeleri katalogda ekeriz.",
          "Pad tehlikeli bölgeyse patlama sınıfı seçenekler aynı görev grubunda listelenir.",
        ],
        field: "Datasheet’te DRI tablosundan önce gövde ve sıcaklık satırlarını okuyun. Karakol kıyı veya çölse alış satırı onlardır.",
      }
    ),
    cap(
      "mission-quote",
      ["quote", "quantity", "brief", "sku", "datasheet"],
      {
        title: "Mission brief and quantity quote in one request",
        lead: "Bases buy by quantity and annex, not by a demo login. Send the sector count, the ranges, and we return SKUs with datasheets.",
        body: [
          "A contracting package needs a brief: what is watched, how many masts, what detection range. Circuitbull® quotes the catalog platforms that fit, with the same SKU the site already published.",
          "No “authorized dealer will follow up with pricing.” The contact form is the start of the quantity path.",
        ],
        field: "Request a quote with gate/pad count, fence length, and climate. We map SKUs onto those sectors.",
      },
      {
        title: "Görev brifingi ve adetli teklif",
        lead: "Üsler demo girişi ile değil, adet ve ek ile alır. Sektör sayısını ve menzilleri gönderin; datasheet’li SKU döneriz.",
        body: [
          "Sözleşme paketi brifing ister: ne izleniyor, kaç mast, hangi tespit menzili. Circuitbull® uyan katalog platformlarını, sitede yayımlanan SKU ile teklifler.",
          "İletişim formu adet yolunun başlangıcıdır.",
        ],
        field: "Kapı/pad sayısı, çit uzunluğu ve iklim ile teklif isteyin. SKU’ları o sektörlere yerleştiririz.",
      },
      true
    ),
  ],
  "oilfield-depot": [
    cap(
      "tank-farm-perimeter",
      ["tank", "well", "pad", "depot", "oil", "perimeter", "farm"],
      {
        title: "Tank farm and well-pad perimeter watch",
        lead: "Tank farms and well pads are long berms, dirt roads, and heat. Thermal on the perimeter sees a vehicle or a person on the berm without walking the dike at night.",
        body: [
          "Oil sites mix legitimate truck traffic with a fence that is rarely closed. Operators need stand-off eyes on the tank wall, the manifold, and the lease road. Thermal PTZ from a high mast covers the ring and the approach without putting a guard on every stair.",
          "We quote by sector length and by whether the camera sits inside a classified zone. The catalog includes both ordinary outdoor housings and explosion-rated payloads.",
        ],
        field: "One long-range thermal PTZ per tank-farm quadrant or well-pad cluster. Match detection range to the berm-to-road distance on the plot plan.",
      },
      {
        title: "Tank çiftliği ve kuyu pad perimetresi",
        lead: "Tank çiftlikleri ve kuyu padleri uzun berm, toprak yol ve ısıdır. Perimetredeki termal, gece seti yürümeden bermdeki araç veya insanı görür.",
        body: [
          "Petrol sahaları meşru kamyon trafiği ile nadiren kapanan çiti karıştırır. Operatör tank duvarı, manifold ve lease yolunda durdurma mesafeli göz ister. Yüksek masttan termal PTZ halkayı ve yaklaşmayı kapsar.",
          "Sektör uzunluğu ve kameranın sınıflı bölgede durup durmadığına göre teklifleriz.",
        ],
        field: "Tank-çiftliği kadranı veya kuyu-pad kümesi başına bir uzun menzilli termal PTZ. Tespit menzilini plot plandaki berm–yol mesafesine uydurun.",
      }
    ),
    cap(
      "explosion-proof",
      ["explosion", "ex ", "atex", "hazardous", "flameproof", "classified", "zone"],
      {
        title: "Explosion-proof housings where the zone requires it",
        lead: "If the plot plan says Zone 1 or Class I, a standard PTZ is the wrong buy. We list explosion-rated thermal and EO/IR payloads for the classified side of the fence.",
        body: [
          "Depot and refinery cameras often sit on the safe side of the dike and look in. Sometimes they must sit in the zone. Those SKUs are a different housing, a different certification line, and a different quote — not a sticker on a city camera.",
          "Tell us the zone and the gas group. We will not recommend a non-rated core into a classified area to win a price.",
        ],
        field: "State the hazardous-area rating in the quote request. Only explosion-rated SKUs will be shortlisted for in-zone masts.",
      },
      {
        title: "Bölge gerektiriyorsa patlamaya dayanıklı gövde",
        lead: "Plot plan Zone 1 veya Class I diyorsa standart PTZ yanlış alıştır. Çitin sınıflı tarafı için patlama sınıfı termal ve EO/IR yüklerini listeleriz.",
        body: [
          "Depo ve rafineri kameraları çoğu zaman setin güvenli tarafında durup içeri bakar. Bazen bölgede durmak zorundadır. O SKU’lar farklı gövde, farklı sertifika satırı, farklı tekliftir.",
          "Bölgeyi ve gaz grubunu söyleyin. Fiyat için sınıflı alana sertifikasız çekirdek önermeyiz.",
        ],
        field: "Teklif talebinde tehlikeli bölge sınıfını yazın. Bölge içi mastlar için yalnızca patlama sınıfı SKU kısa listeye girer.",
      }
    ),
    cap(
      "heat-flame-cueing",
      ["flame", "fire", "heat", "hot", "flare", "stack", "temperature"],
      {
        title: "Heat and flame cueing for early warning",
        lead: "A tank farm already has fire and gas. Thermal adds a picture of a hot face, a flare upset, or a pooling event while the crew can still isolate.",
        body: [
          "Security thermal and fire thermal are cousins. The same cooled or uncooled core that watches the berm can flag an abnormal temperature on a tank shell or a manifold. We do not replace your F&G system; we give the control room a camera that can both patrol and cue heat.",
          "Specify alarm intent on the quote: intrusion only, or intrusion plus heat. The SKU list changes.",
        ],
        field: "For heat cueing, pick platforms with published temperature or hot-spot modes. Pair with Circuitbull® live monitoring if the cue must leave the local DCS island.",
      },
      {
        title: "Erken uyarı için ısı ve alev ipucu",
        lead: "Tank çiftliğinin yangın ve gazı vardır. Termal, ekip henüz izole edebilecekken sıcak yüzey, flare bozulması veya birikme olayının resmini ekler.",
        body: [
          "Güvenlik termali ile yangın termali kuzenlerdir. Bermı izleyen aynı çekirdek tank kabuğu veya manifoldda anormal sıcaklığı işaretleyebilir. F&G’nin yerini almayız; kontrol odasına hem devriye hem ısı ipucu verebilen kamera veririz.",
          "Teklifte alarm niyetini yazın: yalnızca izinsiz giriş, veya giriş artı ısı. SKU listesi değişir.",
        ],
        field: "Isı ipucu için yayımlanmış sıcaklık veya sıcak nokta modu olan platformları seçin. İpucu yerel DCS adasından çıkacaksa Circuitbull® canlı izleme ile eşleyin.",
      }
    ),
    cap(
      "sku-range-rating",
      ["sku", "range", "rating", "datasheet", "quote", "atex"],
      {
        title: "Specify by SKU, range, and rating — then quote",
        lead: "Oil procurement runs on data sheets. Range, housing rating, and zone certificate belong on the same line as the model number.",
        body: [
          "If the integrator cannot attach a PDF, the package will stall in technical bid. Every platform we show on this mission has a Circuitbull® SKU and a datasheet path.",
          "Send plot-plan distances and zone notes. We return the short list, not a generic “oil and gas camera.”",
        ],
        field: "Request a quote with sector lengths and hazardous-area notes. SKUs come back with datasheets attached in the conversation.",
      },
      {
        title: "SKU, menzil ve sınıf ile şartname → teklif",
        lead: "Petrol tedariki veri sayfasıyla yürür. Menzil, gövde sınıfı ve bölge sertifikası model numarasıyla aynı satırda olmalıdır.",
        body: [
          "Entegratör PDF ekleyemiyorsa paket teknik teklifte takılır. Bu görevde gösterdiğimiz her platformun Circuitbull® SKU’su ve datasheet yolu vardır.",
          "Plot plan mesafelerini ve bölge notlarını gönderin. Jenerik “petrol kamerası” değil, kısa liste döner.",
        ],
        field: "Sektör uzunlukları ve tehlikeli bölge notlarıyla teklif isteyin. SKU’lar konuşmada datasheet ile gelir.",
      },
      true
    ),
  ],
  "fire-prevention": [
    cap(
      "hotspot-standoff",
      ["hot", "spot", "fire", "heat", "forest", "temperature", "detection"],
      {
        title: "Hot-spot detection at stand-off range",
        lead: "A fire starts as a pixel of heat. Thermal at stand-off range is how you get an alarm while a crew can still walk to it with a tool, not a tanker.",
        body: [
          "Forest edge, scrap yards, and charging fields do not wait for a flame detector that needs a fireball. Uncooled thermal with a hot-spot or temperature mode scans a sector and flags a delta against the background. Cooled cores stretch that sector when the belt is kilometers wide.",
          "We quote cameras whose datasheets publish detection range for a small heat source — not only “human at 2 km.” That number is the buy for this mission.",
        ],
        field: "Tell us the sector width and the smallest fire you must catch. We shortlist SKUs whose hot-spot figures match, then quote quantity for the tower line.",
      },
      {
        title: "Durdurma mesafesinde sıcak nokta tespiti",
        lead: "Yangın bir ısı pikseli olarak başlar. Durdurma mesafesindeki termal, ekibin tanker değil aletle yürüyebileceği anda alarmdır.",
        body: [
          "Orman kenarı, hurda sahası ve şarj alanları ateş topu bekleyen alev detektörünü beklemez. Sıcak nokta veya sıcaklık modlu soğutmasız termal sektör tarar; soğutmalı çekirdek kuşak kilometre ise sektörü uzatır.",
          "Küçük ısı kaynağı için tespit menzili yayımlayan kameraları teklifleriz — yalnızca “2 km’de insan” değil.",
        ],
        field: "Sektör genişliğini ve yakalamanız gereken en küçük yangını söyleyin. Sıcak nokta rakamı uyan SKU’ları kısa listeler, kule hattı için adet teklifleriz.",
      }
    ),
    cap(
      "forest-industrial-yard",
      ["forest", "yard", "industrial", "wildland", "belt", "charging"],
      {
        title: "Forest edge and industrial yard coverage",
        lead: "The same catalog covers a timber belt and a recycling yard — the geometry changes, the waveband does not. We place masts so the scan actually sees the fuel, not the office roof.",
        body: [
          "Wildland-urban edge and industrial yards share a problem: large outdoor fuel, few people at night, and a long walk to the first heat. PTZ thermal with a programmed tour is the usual pattern; fixed cameras fill the dead ground next to a charger row or a chip pile.",
          "Circuitbull® lists the SKUs, not a mystery “AI fire tower.” You will know the model on the mast.",
        ],
        field: "Map fuel beds and charger rows. We assign PTZ tours to the long axis and fixed thermal to the tight hazards.",
      },
      {
        title: "Orman kenarı ve sanayi sahası kapsama",
        lead: "Aynı katalog kereste kuşağını ve geri dönüşüm avlusunu kapsar — geometri değişir, dalgaboyu değişmez. Mastlar yakıtı görsün diye konur, ofis çatısını değil.",
        body: [
          "Yaban-kent kenarı ve sanayi avluları aynı sorunu paylaşır: büyük açık yakıt, gece az insan, ilk ısıya uzun yürüyüş. Programlı turlu PTZ termal olağan kalıptır; şarj sırası veya yonga yığını yanındaki ölü zemini sabit kameralar doldurur.",
        ],
        field: "Yakıt yataklarını ve şarj sıralarını haritalayın. Uzun eksene PTZ turu, sıkı tehlikelere sabit termal atarız.",
      }
    ),
    cap(
      "no-floodlight",
      ["night", "floodlight", "uncooled", "thermal", "dark"],
      {
        title: "Day/night imaging that does not need floodlight",
        lead: "Lighting a forest belt or a tank farm to feed a CCTV is a fire and a glare problem. Thermal does not ask for light.",
        body: [
          "White light and IR illuminators announce the site and still fail in fog. Thermal is passive. That is why it is the right sensor for prevention, not only for security.",
          "We still offer dual-spectrum when you need an identification shot after the alarm. The detection layer itself should be thermal.",
        ],
        field: "Do not spec illuminators as the detection plan. Spec thermal first; add EO only for the handoff shot.",
      },
      {
        title: "Projektör gerektirmeyen gece/gündüz görüntü",
        lead: "CCTV beslemek için orman kuşağını veya tank sahasını aydınlatmak yangın ve kamaşma sorunudur. Termal ışık istemez.",
        body: [
          "Beyaz ışık ve IR aydınlatıcı sahayı ilan eder, siste yine düşer. Termal pasiftir. Bu yüzden yalnızca güvenlik değil, önleme sensörüdür.",
          "Alarmdan sonra tanımlama karesi için hâlâ çift spektrum sunarız. Tespit katmanı termal olmalıdır.",
        ],
        field: "Tespit planı olarak aydınlatıcı şartlamayın. Önce termal; yalnızca devir karesi için EO ekleyin.",
      }
    ),
    cap(
      "live-monitoring-alerts",
      ["iot", "scada", "alert", "live", "monitoring"],
      {
        title: "Pair alerts with Circuitbull® live monitoring",
        lead: "A hot-spot on a local NVR that nobody is watching is not prevention. Made-in-USA IoT / SCADA live monitoring is how the cue pages the duty officer.",
        body: [
          "Catalog cameras are sourced sensors. The Circuitbull® live layer is the US-built piece: events, audit, and a path into the same ops room that already runs the rest of the site.",
          "Quote camera SKUs and the monitoring path together so the tower is not an orphan.",
        ],
        field: "Add Circuitbull® live monitoring to the same quote as the thermal SKUs. One brief, one quantity path.",
      },
      {
        title: "Circuitbull® canlı izleme ile alarm",
        lead: "Kimsenin bakmadığı yerel NVR’daki sıcak nokta önleme değildir. ABD üretimi IoT / SCADA canlı izleme, ipucunun nöbetçiye sayfa atma yoludur.",
        body: [
          "Katalog kameraları tedarik sensörleridir. Circuitbull® canlı katmanı ABD’de üretilen parçadır: olay, denetim ve sahanın geri kalanını zaten işleten ops odasına yol.",
          "Kamera SKU’larını ve izleme yolunu birlikte teklifleyin; kule yetim kalmasın.",
        ],
        field: "Termal SKU’larla aynı teklife Circuitbull® canlı izlemeyi ekleyin. Tek brifing, tek adet yolu.",
      },
      true
    ),
  ],
  ecological: [
    cap(
      "low-impact-night",
      ["night", "wildlife", "low-impact", "thermal", "dark", "habitat"],
      {
        title: "Low-impact night imaging",
        lead: "Protected land cannot be lit like a depot. Thermal watches corridors and water at night without a floodlight grid that stresses habitat and announces the site.",
        body: [
          "Rangers and environmental officers need counts and deterrence, not a light dome. Uncooled thermal on a low mast or a hide sees warm bodies at the waterline and on the trail. Dual-spectrum is reserved for the rare identification shot.",
          "We quote outdoor, quiet payloads — no IR lamp as the default plan.",
        ],
        field: "Thermal-first on trails and water. Leave illuminators off the bill of materials unless a specific ID task requires them.",
      },
      {
        title: "Düşük etkili gece görüntüleme",
        lead: "Korunan arazi depo gibi aydınlatılamaz. Termal, habitatı strese sokan ve sahayı ilan eden projektör ızgarası olmadan gece koridor ve suyu izler.",
        body: [
          "Korucular sayım ve caydırma ister, ışık kubbesi değil. Alçak mast veya gizlemedeki soğutmasız termal su çizgisinde ve patikada sıcak gövdeleri görür.",
          "Dış mekân, sessiz yükleri teklifleriz — varsayılan plan IR lamba değildir.",
        ],
        field: "Patika ve suda önce termal. Belirli bir ID görevi yoksa aydınlatıcıyı malzeme listesinden çıkarın.",
      }
    ),
    cap(
      "wetland-corridor",
      ["wetland", "corridor", "river", "marsh", "trail", "wildlife"],
      {
        title: "Wetland and corridor coverage",
        lead: "Wetlands and migration corridors are linear and wet. A few well-placed thermal PTZ units beat a hundred trail cameras that die in humidity.",
        body: [
          "The geometry is a belt, not a parking lot. Place sensors at bottlenecks: bridges, dikes, fence gaps, and the mouth of a creek. PTZ tours cover the long axis; fixed units watch a nest or a den if that is the scientific task.",
          "Housings must survive humidity and flood splash. We filter the catalog for outdoor ratings rather than indoor cores in a weather box.",
        ],
        field: "Bottleneck masts first. Send a sketch of water and fence; we map SKUs onto those chokepoints.",
      },
      {
        title: "Sulak alan ve koridor kapsama",
        lead: "Sulak alan ve göç koridorları doğrusal ve ıslaktır. İyi yerleştirilmiş birkaç termal PTZ, nemde ölen yüzlerce patika kamerasını yener.",
        body: [
          "Geometri otopark değil kuşaktır. Sensörleri darboğazlara koyun: köprü, set, çit boşluğu, dere ağzı. PTZ turları uzun ekseni, sabit üniteler yuva görevini kapsar.",
          "Gövde nem ve taşkın sıçramasına dayanmalıdır.",
        ],
        field: "Önce darboğaz mastları. Su ve çit krokisini gönderin; SKU’ları o boğazlara yerleştiririz.",
      }
    ),
    cap(
      "long-range-observation",
      ["long range", "observation", "standoff", "cooled", "mwir"],
      {
        title: "Long-range observation without patrol density",
        lead: "You cannot staff a wilderness edge like a base. Cooled or long-range uncooled thermal gives a ranger one screen for kilometers of belt.",
        body: [
          "Patrol density is the cost that kills environmental programs. A single high mast with a real detection range replaces a rotation of trucks. That is the economic case, not only the ecological one.",
          "DRI figures on the datasheet must match the belt width. We will not sell a 400 m camera for a 4 km marsh.",
        ],
        field: "Measure the belt. Choose cooled MWIR or long-range uncooled from the catalog whose published human/vehicle figures cover that width.",
      },
      {
        title: "Yoğun devriye olmadan uzun menzil",
        lead: "Yaban kenarını üs gibi kadrolayamazsınız. Soğutmalı veya uzun menzilli soğutmasız termal, korucuya kilometrelik kuşak için tek ekran verir.",
        body: [
          "Devriye yoğunluğu çevresel programları öldüren maliyettir. Gerçek tespit menzilli tek yüksek mast, kamyon rotasyonunun yerini alır.",
          "Datasheet’teki DRI rakamları kuşak genişliğine uymalıdır. 4 km bataklık için 400 m kamera satmayız.",
        ],
        field: "Kuşağı ölçün. Yayımlanmış insan/araç rakamı o genişliği kapsayan soğutmalı MWIR veya uzun menzilli soğutmasızı katalogdan seçin.",
      }
    ),
    cap(
      "detection-figures",
      ["datasheet", "sku", "detection", "range", "dri"],
      {
        title: "Catalog SKUs with clear detection figures",
        lead: "Grant and agency files need numbers. Every platform here carries a Circuitbull® SKU and a datasheet with detection figures you can paste into the annex.",
        body: [
          "Environmental procurement is still procurement. Model, range, power, and housing belong in the file. We do not hide those behind a demo.",
        ],
        field: "Download the datasheet with the SKU. Request a quote with belt length and mast count.",
      },
      {
        title: "Net tespit rakamlı katalog SKU",
        lead: "Hibe ve kurum dosyaları sayı ister. Buradaki her platformun Circuitbull® SKU’su ve eke yapıştırılacak tespit rakamlı datasheet’i vardır.",
        body: [
          "Çevre tedariki yine tedariktır. Model, menzil, güç ve gövde dosyada olmalıdır.",
        ],
        field: "SKU ile datasheet indirin. Kuşak uzunluğu ve mast sayısı ile teklif isteyin.",
      },
      true
    ),
  ],
  "border-control": [
    cap(
      "multi-km-detection",
      ["border", "kilometer", "long range", "mwir", "cooled", "vehicle", "human", "standoff"],
      {
        title: "Vehicle and human detection at multi-kilometer range",
        lead: "Borders are not fence cameras. Cooled MWIR and long-range dual-spectrum platforms detect vehicles and people at stand-off ranges measured in kilometers, then keep the track.",
        body: [
          "A land border sector that is 8–15 km deep cannot be closed with uncooled cores meant for a parking lot. Dewar-cooled mid-wave thermal, often with a continuous zoom EO channel, is the tool that sees a truck and a walker before they reach the wire. That is the Circuitbull® border stack we quote: military-class sensors, datasheet DRI, mast geometry.",
          "We will not pretend a 1 km camera is a 10 km camera. The SKU list on this page is ranked for long-range detection language in the catalog — PTZ load, range, and thermal class.",
        ],
        field: "Give us sector depth and the target set (walker, vehicle, both). We shortlist cooled / long-range SKUs whose published DRI matches that depth.",
      },
      {
        title: "Çok kilometrelik araç ve insan tespiti",
        lead: "Sınır çit kamerası değildir. Soğutmalı MWIR ve uzun menzilli çift spektrum, araç ve insanı kilometre ile ölçülen durdurma mesafesinde tespit eder ve izi tutar.",
        body: [
          "8–15 km derinliğindeki kara sınır sektörü otopark soğutmasızı ile kapanmaz. Sürekli zoom EO kanallı Dewar soğutmalı orta dalga termal, tır ve yayayı tele gelmeden görür.",
          "1 km kameranın 10 km olduğunu iddia etmeyiz. Bu sayfadaki SKU listesi uzun menzil tespit diline göre sıralanır.",
        ],
        field: "Sektör derinliğini ve hedef setini (yaya, araç, ikisi) verin. Yayımlanmış DRI’si o derinliğe uyan soğutmalı / uzun menzil SKU’ları kısa listeleriz.",
      }
    ),
    cap(
      "coastal-craft",
      ["coastal", "shore", "craft", "boat", "maritime", "harbor", "sea"],
      {
        title: "Coastal craft and shoreline tracking",
        lead: "A coastline is a moving border. Thermal and maritime EO/IR pick up small craft, beaching, and shoreline walkers against water and spray.",
        body: [
          "Visible cameras lose small boats in glitter and in black water. Thermal sees the engine and the crew. Combined with a coastal mast height, a dual-spectrum PTZ holds a track from first detection to the beach or the cut.",
          "Salt, wind, and continuous duty are the housing spec. We quote marine-capable payloads, not city domes on a cliff.",
        ],
        field: "Match detection range to the traffic scheme: inshore small craft vs. a shipping lane. Housing must be salt-rated.",
      },
      {
        title: "Kıyı tekne ve sahil takibi",
        lead: "Kıyı çizgisi hareketli bir sınırdır. Termal ve deniz EO/IR, su ve spreye karşı küçük tekne, karaya çıkma ve sahil yayalarını alır.",
        body: [
          "Görünür kameralar küçük tekneleri parıltıda ve kara suda kaybeder. Termal motoru ve mürettebatı görür. Kıyı mast yüksekliği ile çift spektrum PTZ, ilk tespitten plaja veya kesiğe kadar izi tutar.",
          "Tuz, rüzgâr ve sürekli görev gövde spesifikasyonudur.",
        ],
        field: "Tespit menzilini trafik schemasına uydurun: kıyı küçük tekne veya deniz yolu. Gövde tuz sınıfı olmalı.",
      }
    ),
    cap(
      "radar-ptz-handoff",
      ["radar", "ptz", "handoff", "cue", "slew", "track"],
      {
        title: "PTZ handoff from radar or cue",
        lead: "Radar finds; the camera confirms. A border PTZ that cannot slew to a cue is a tourist telescope.",
        body: [
          "Ground and coastal radars already sit on many frontiers. The missing piece is a thermal / EO payload with enough zoom and slew to put an identification picture on the same track file. We list platforms intended for cue-to-slew, not operator-joystick toys.",
          "Tell us the cue source (radar, fence, RF). The quote includes the expectation that the camera will be integrated, not dumped on an NVR.",
        ],
        field: "Specify cue interface and sector width. We select PTZ SKUs with the slew and zoom to finish the radar track.",
      },
      {
        title: "Radar veya ipucundan PTZ devri",
        lead: "Radar bulur; kamera doğrular. İpucuna dönemeyen sınır PTZ’si turist teleskobudur.",
        body: [
          "Kara ve kıyı radarları birçok sınırda durur. Eksik parça, aynı iz dosyasına tanımlama resmi koyacak zoom ve dönüşe sahip termal / EO yüküdür.",
          "İpucu kaynağını söyleyin (radar, çit, RF). Teklif, kameranın NVR’a atılmayıp entegre edileceği beklentisini içerir.",
        ],
        field: "İpucu arayüzünü ve sektör genişliğini şartlayın. Radar izini bitirecek dönüş ve zoom’lu PTZ SKU seçeriz.",
      }
    ),
    cap(
      "iot-scada-layer",
      ["iot", "scada", "usa", "made", "live", "command"],
      {
        title: "Made-in-USA IoT / SCADA layer on the same mission",
        lead: "Sensors are the catalog. The command fabric — IoT, SCADA, live monitoring — is what Circuitbull® manufactures in the United States and hangs on the same border mission.",
        body: [
          "Thermal and EO/IR cameras on this site are catalog sensors, sourced and quoted, not claimed as USA-made optics. The US-built layer is the Circuitbull® IoT / SCADA / live-monitoring stack that turns cues into a duty-officer picture.",
          "Border programs that need G2G or EPC+F financing should treat the sensor SKUs and the command layer as one envelope. That is the invest path on this site.",
        ],
        field: "Quote cameras and the Circuitbull® command stack together. For financing, use the Invest / EPC+F path.",
      },
      {
        title: "Aynı görevde ABD üretimi IoT / SCADA katmanı",
        lead: "Sensörler katalogdur. Komuta dokusu — IoT, SCADA, canlı izleme — Circuitbull®’un ABD’de ürettiği ve aynı sınır görevine astığı katmandır.",
        body: [
          "Bu sitedeki termal ve EO/IR kameralar katalog sensörleridir; ABD yapımı optik iddiası yoktur. ABD’de üretilen katman, ipuçlarını nöbetçi resmine çeviren IoT / SCADA / canlı izleme yığınıdır.",
          "G2G veya EPC+F isteyen sınır programları sensör SKU’ları ile komuta katmanını tek zarf saymalıdır.",
        ],
        field: "Kameraları ve Circuitbull® komuta yığınını birlikte teklifleyin. Finansman için Invest / EPC+F yolunu kullanın.",
      },
      true
    ),
  ],
  "urban-anti-uav": [
    cap(
      "small-uav-cueing",
      ["uav", "drone", "anti-uav", "c-uas", "air", "thermal", "small"],
      {
        title: "Small UAV thermal / daylight cueing",
        lead: "Cheap quadcopters are small, fast, and cold at range. Multi-sensor heads with a thermal channel still give city sites a cue that radar or RF can hand off to.",
        body: [
          "Urban C-UAS fails when the camera cannot see a small air target against a bright sky or a dark rooftop. Dual-spectrum and dedicated air-watch payloads with enough frame rate and zoom are the optical half of the stack. We do not sell a complete jammer suite; we sell the sensors that sit in it.",
          "Ranked platforms on this page carry UAV, drone, or multi-sensor language in the catalog. Pair them with your radar / RF cue — do not expect a PTZ alone to search the whole sky.",
        ],
        field: "State the air picture: hobby quad, larger UAV, or both. We shortlist optical SKUs meant to be cued, not to replace radar.",
      },
      {
        title: "Küçük İHA termal / gündüz ipucu",
        lead: "Ucuz quadcopter’lar küçük, hızlı ve menzilde soğuktur. Termal kanallı çoklu-sensör kafalar, radar veya RF’nin devredebileceği bir ipucu verir.",
        body: [
          "Kentsel C-UAS, kamera parlak gökyüzüne veya karanlık çatıya karşı küçük hava hedefini göremezse düşer. Yeterli kare hızı ve zoom’lu çift spektrum ve hava izleme yükleri yığının optik yarısıdır. Tam bir karıştırıcı süiti satmayız; içine oturan sensörleri satarız.",
        ],
        field: "Hava resmini belirtin: hobi quad, daha büyük İHA veya ikisi. Radar’ın yerini almayan, ipucu alan optik SKU’ları kısa listeleriz.",
      }
    ),
    cap(
      "street-plaza",
      ["street", "plaza", "urban", "crowd", "rooftop", "city"],
      {
        title: "Street and plaza overwatch",
        lead: "The same mast that watches the air still has to cover the street. Thermal / EO PTZ on a rooftop sees the plaza, the approach, and the crowd edge after dark.",
        body: [
          "City programs buy one pole and expect two jobs. We specify payloads that can take an air cue and still do ground identification at the distances of a square or a station forecourt.",
          "Housings must be urban-weather rated. IR illuminators are optional; thermal should do the night work.",
        ],
        field: "Rooftop or tower PTZ with dual-spectrum for ground ID, plus enough elevation for a short air search. Quote by plaza width.",
      },
      {
        title: "Sokak ve meydan üst gözetimi",
        lead: "Havayı izleyen aynı mast sokağı da kapsamalıdır. Çatıdaki termal / EO PTZ karanlıkta meydanı, yaklaşmayı ve kalabalık kenarını görür.",
        body: [
          "Kent programları bir direk alır, iki iş bekler. Hava ipucu alıp meydan veya istasyon önü mesafesinde yer tanımlaması da yapan yükleri şartlarız.",
        ],
        field: "Yer ID için çift spektrumlu çatı veya kule PTZ, kısa hava araması için yeterli yükseklik. Meydan genişliğiyle teklif.",
      }
    ),
    cap(
      "radar-eoir",
      ["radar", "eo", "ir", "cue", "multi-sensor", "ptz"],
      {
        title: "EO/IR stacks that pair with radar cue",
        lead: "Radar without an identification camera is a blip. EO/IR without radar is a searchlight. Urban programs need both; we catalog the optical stack.",
        body: [
          "Tell the integrator the camera will be slaved. Slew rate, zoom, and boresight between EO and IR are the lines that matter. We list multi-sensor PTZ units built for that job.",
        ],
        field: "Include radar or RF cue in the quote notes. We will not shortlist joystick-only domes for a C-UAS overlay.",
      },
      {
        title: "Radar ipucu ile EO/IR yığını",
        lead: "Tanımlama kamerası olmayan radar bir noktadır. Radarsız EO/IR bir projektördür. Kent programları ikisini ister; biz optik yığını kataloglarız.",
        body: [
          "Entegratöre kameranın köle edileceğini söyleyin. Dönüş hızı, zoom ve EO–IR bakış çizgisi önemli satırlardır.",
        ],
        field: "Teklif notuna radar veya RF ipucunu yazın. C-UAS katmanı için yalnızca joystick dom kısa listeye girmez.",
      }
    ),
    cap(
      "city-venue-skus",
      ["sku", "quote", "city", "venue", "datasheet"],
      {
        title: "Quote by SKU for city and venue programs",
        lead: "Municipal and venue buyers need a model on a line. SKU, datasheet, quantity — not a concept video.",
        body: [
          "City procurement will reject a nameless “AI drone camera.” Circuitbull® publishes the SKU and the PDF. Request a quote with site count and whether air, ground, or both are in scope.",
        ],
        field: "Send venue or district count. We return SKUs with datasheets.",
      },
      {
        title: "Kent ve mekân programları için SKU teklifi",
        lead: "Belediye ve mekân alıcıları satırda model ister. SKU, datasheet, adet — konsept video değil.",
        body: [
          "Kent tedariki isimsiz “AI drone kamerası”nı reddeder. Circuitbull® SKU ve PDF yayımlar.",
        ],
        field: "Mekân veya semt sayısını gönderin. Datasheet’li SKU döneriz.",
      },
      true
    ),
  ],
  "highway-railway": [
    cap(
      "right-of-way",
      ["right-of-way", "shoulder", "track", "highway", "corridor", "intrusion"],
      {
        title: "Right-of-way and shoulder coverage",
        lead: "Corridors are linear: a walker on the ballast, a stopped vehicle on the shoulder, a cut fence at kilometer 41. Thermal PTZ on existing masts sees the ribbon without lighting the countryside.",
        body: [
          "Highways and railways already own poles. The sensor must match the span between them. Uncooled thermal covers the near shoulder; longer-range units sit at cuts, bridges, and yards where the geometry opens.",
          "We quote by span length, not by a generic ITS camera. If the next mast is 800 m, the SKU has to work at 800 m.",
        ],
        field: "Send typical mast spacing and the intrusion target (person, vehicle). We map SKUs onto that spacing.",
      },
      {
        title: "Güzergâh ve banket kapsama",
        lead: "Koridorlar doğrusaldır: balastta yaya, bankette duran araç, 41. kilometrede kesik çit. Mevcut mastlardaki termal PTZ, kırsalı aydınlatmadan şeridi görür.",
        body: [
          "Otoyol ve demiryolu direklere zaten sahiptir. Sensör aralığa uymalıdır. Soğutmasız termal yakın banketi; kesik, köprü ve sahalarda daha uzun menzil.",
          "Jenerik ITS kamerası değil, açıklık uzunluğuyla teklifleriz.",
        ],
        field: "Tipik mast aralığını ve izinsiz giriş hedefini (kişi, araç) gönderin. SKU’ları o aralığa yerleştiririz.",
      }
    ),
    cap(
      "station-yard",
      ["station", "yard", "depot", "platform", "railway", "ptz"],
      {
        title: "Station and yard overwatch",
        lead: "Passenger stations and rolling-stock yards need identification at the platform edge and the dark side of the consist. Dual-spectrum PTZ is the usual payload.",
        body: [
          "Crowds, night, and a lot of metal. Thermal finds the person in the four-foot; EO identifies for the response team. We specify platforms that handle weather on an open platform and still zoom to a face at the far end of the island.",
        ],
        field: "One dual-spectrum PTZ per platform island or yard lead, plus thermal on the perimeter fence of the depot.",
      },
      {
        title: "İstasyon ve saha üst gözetimi",
        lead: "Yolcu istasyonları ve araç sahaları peron kenarında ve dizinin karanlık yüzünde tanımlama ister. Çift spektrumlu PTZ olağan yüktür.",
        body: [
          "Kalabalık, gece ve bol metal. Termal dört ayaktaki kişiyi bulur; EO müdahale ekibi için tanımlar.",
        ],
        field: "Peron adası veya saha girişine bir çift spektrum PTZ; depo çitine termal.",
      }
    ),
    cap(
      "night-no-lighting",
      ["night", "lighting", "thermal", "dark", "uncooled"],
      {
        title: "Night imaging without continuous lighting",
        lead: "Lighting a right-of-way is expensive and a glare hazard. Thermal does the night job passively.",
        body: [
          "ITS programs often try to solve detection with more LEDs. That fails in fog and annoys the corridor. Uncooled thermal on the same pole as the existing cabinet is the cleaner spec.",
        ],
        field: "Do not make illuminators the detection plan. Spec thermal; keep lighting for the identification shot only if required.",
      },
      {
        title: "Sürekli aydınlatmasız gece görüntü",
        lead: "Güzergâhı aydınlatmak pahalı ve kamaşma tehlikesidir. Termal gece işini pasif yapar.",
        body: [
          "ITS programları tespiti daha fazla LED ile çözmeye çalışır. Siste düşer, koridoru rahatsız eder. Mevcut kabinle aynı direkte soğutmasız termal daha temiz şartnamedir.",
        ],
        field: "Aydınlatıcıyı tespit planı yapmayın. Termal şartlayın; aydınlatmayı yalnızca gerekliyse tanımlama karesi için tutun.",
      }
    ),
    cap(
      "datasheet-ptz",
      ["datasheet", "ptz", "range", "sku", "load"],
      {
        title: "Specify range and PTZ load from the datasheet",
        lead: "Corridor buyers live in data sheets. Pan/tilt load, detection range, and power at the cabinet are the lines that matter.",
        body: [
          "Every platform in this group has a Circuitbull® SKU and a datasheet. Attach the PDF to the ITS or rail package and request a quantity quote.",
        ],
        field: "Open the SKU, read PTZ load and range, request a quote with mast count.",
      },
      {
        title: "Datasheet’ten menzil ve PTZ yükü",
        lead: "Koridor alıcıları veri sayfasında yaşar. Pan/tilt yükü, tespit menzili ve kabindeki güç önemli satırlardır.",
        body: [
          "Bu gruptaki her platformun Circuitbull® SKU’su ve datasheet’i vardır. PDF’i ITS veya demiryolu paketine ekleyin, adet teklifi isteyin.",
        ],
        field: "SKU’yu açın, PTZ yükü ve menzili okuyun, mast sayısıyla teklif isteyin.",
      },
      true
    ),
  ],
  "city-safety": [
    cap(
      "tower-rooftop",
      ["tower", "rooftop", "long range", "city", "ptz", "thermal"],
      {
        title: "Tower and rooftop long-range watch",
        lead: "Safe-city work that matters sits on towers and roofs, not on a shop-front dome. Long-range thermal / EO PTZ covers a district from one high point.",
        body: [
          "Municipal programs waste budget on dense short-range CCTV and still miss the park edge at night. One correctly specified mast with published DRI figures outperforms a dozen indoor domes in weather.",
          "We quote military-grade catalog sensors for that mast — the same class we field on other missions — not consumer cameras with an “AI” sticker.",
        ],
        field: "Give district radius and mounting height. We shortlist SKUs whose detection range matches that radius at night.",
      },
      {
        title: "Kule ve çatı uzun menzil izleme",
        lead: "Önemli güvenli kent işi vitrin domunda değil kule ve çatıdadır. Uzun menzilli termal / EO PTZ bir yüksek noktadan semti kapsar.",
        body: [
          "Belediye programları bütçeyi sıkı kısa menzil CCTV’ye harcar, gece park kenarını yine kaçırır. Yayımlanmış DRI’li doğru mast, havada düzine iç mekân domunu yener.",
        ],
        field: "Semt yarıçapını ve montaj yüksekliğini verin. Gece o yarıçapa uyan tespit menzilli SKU’ları kısa listeleriz.",
      }
    ),
    cap(
      "municipal-weather",
      ["weather", "fog", "rain", "ip66", "outdoor", "municipal"],
      {
        title: "Weather-capable imaging for municipal ops",
        lead: "City cameras die in the first winter if the housing is a lie. Outdoor rating, wiper, and thermal waveband are the municipal spec.",
        body: [
          "Fog, rain, and heat haze are the operating environment, not edge cases. Thermal keeps the picture when visible CCTV is a grey smear. We filter for published IP and temperature ranges.",
        ],
        field: "Read housing and temperature on the datasheet. If those lines are missing, the SKU is not a city camera.",
      },
      {
        title: "Belediye operasyonu için hava dayanımı",
        lead: "Gövde yalan ise kent kameraları ilk kışta ölür. Dış mekân sınıfı, silecek ve termal dalgaboyu belediye spesifikasyonudur.",
        body: [
          "Sis, yağmur ve sıcak pus işletme ortamıdır. Termal, görünür CCTV gri lekeyken resmi tutar.",
        ],
        field: "Datasheet’te gövde ve sıcaklığı okuyun. O satırlar yoksa SKU kent kamerası değildir.",
      }
    ),
    cap(
      "tender-sku-specs",
      ["tender", "sku", "specification", "datasheet", "procurement"],
      {
        title: "SKU-level specs for tender packages",
        lead: "A municipal tender that says “AI camera” will be filled with junk. Put a Circuitbull® SKU, a range table, and a housing rating in the annex.",
        body: [
          "We publish datasheets so the technical offer can be scored. Download the PDF, paste the figures, request a quantity quote for the tower count.",
        ],
        field: "Build the annex from the datasheet, not from marketing copy. Then send the tower count on the contact form.",
      },
      {
        title: "İhale dosyası için SKU şartnamesi",
        lead: "“AI kamera” diyen belediye ihalesi çöple dolar. Eke Circuitbull® SKU’su, menzil tablosu ve gövde sınıfı koyun.",
        body: [
          "Teknik teklifin puanlanması için datasheet yayımlarız. PDF’i indirin, rakamları yapıştırın, kule adedi için teklif isteyin.",
        ],
        field: "Eki pazarlama metninden değil datasheet’ten kurun. Sonra iletişim formuna kule sayısını yazın.",
      },
      true
    ),
    cap(
      "quote-support",
      ["quote", "support", "circuitbull", "contact"],
      {
        title: "Support and quote through Circuitbull®",
        lead: "City programs need a vendor of record. Circuitbull® quotes the SKU, holds the datasheet, and answers the technical note.",
        body: [
          "Volls Global Inc, Wilmington, DE. The contact form is the official path — mission, quantity, timeline. We do not send you to an unnamed distributor to finish the spec.",
        ],
        field: "Request a quote with district or tower count. The same form used on every other mission.",
      },
      {
        title: "Circuitbull® üzerinden teklif ve destek",
        lead: "Kent programları kayıtlı tedarikçi ister. Circuitbull® SKU’yu teklifler, datasheet’i tutar, teknik nota cevap verir.",
        body: [
          "Volls Global Inc, Wilmington, DE. İletişim formu resmi yoldur — görev, adet, takvim.",
        ],
        field: "Semt veya kule sayısıyla teklif isteyin. Diğer görevlerle aynı form.",
      },
      true
    ),
  ],
  "stadium-plaza": [
    cap(
      "approach-parking",
      ["parking", "approach", "venue", "lot", "ptz"],
      {
        title: "Approach and parking overwatch",
        lead: "The event is lost in the lot and the last 400 m of approach, not in the bowl. Thermal / EO PTZ on a high corner covers inbound vehicles and the pedestrian funnel.",
        body: [
          "Venue security that only watches seats is late. Operators need a picture of the queue, the bus lane, and the dark corner of the garage. Dual-spectrum PTZ does night without turning the lot into daylight for the neighborhood.",
        ],
        field: "One PTZ per major approach and one for the largest lot. Match detection range to the far curb, not the near gate.",
      },
      {
        title: "Yaklaşım ve otopark üst gözetimi",
        lead: "Etkinlik tribünde değil otoparkta ve yaklaşmanın son 400 m’sinde kaybedilir. Yüksek köşedeki termal / EO PTZ gelen araçları ve yaya hunisini kapsar.",
        body: [
          "Yalnızca koltuk izleyen mekân güvenliği geç kalır. Operatör kuyruk, otobüs şeridi ve garajın karanlık köşesinin resmini ister.",
        ],
        field: "Ana yaklaşım başına bir PTZ, en büyük otoparka bir. Tespit menzilini yakın kapıya değil uzak kaldırıma uydurun.",
      }
    ),
    cap(
      "crowd-edge",
      ["crowd", "perimeter", "plaza", "fence", "edge"],
      {
        title: "Crowd-edge and perimeter coverage",
        lead: "The dangerous line is the edge of the crowd and the outer fence, not the jumbotron. Thermal sees a climb or a runner in the dark band beyond the lights.",
        body: [
          "Plazas and scenic sites have a bright center and a black rim. Put sensors on that rim. We specify PTZ units that identify at the fence while still holding a wide tour of the open ground.",
        ],
        field: "Fence-line thermal plus a PTZ that can both tour the plaza and snap to a cue at the gate.",
      },
      {
        title: "Kalabalık kenarı ve perimetre",
        lead: "Tehlikeli çizgi jumbotron değil kalabalığın kenarı ve dış çittir. Termal, ışıkların ötesindeki karanlık bantta tırmanma veya koşucuyu görür.",
        body: [
          "Meydan ve gezi alanlarının parlak merkezi ve kara kenarı vardır. Sensörleri o kenara koyun.",
        ],
        field: "Çit hattı termali artı meydanı tur edip kapıdaki ipucuna sıçrayabilen PTZ.",
      }
    ),
    cap(
      "day-night-id",
      ["identification", "zoom", "eo", "low-light", "ptz"],
      {
        title: "Day/night PTZ for identification",
        lead: "A heat blob is not a case file. Dual-spectrum PTZ keeps an identification lens on the same payload for the handoff to police or venue security.",
        body: [
          "EO focal length at the gate distance is the spec that matters after detection. We list multi-sensor units where thermal and visible are boresighted so the operator does not lose the contact while switching cameras.",
        ],
        field: "Check EO identification range at your farthest gate. Thermal-only is not enough for this task.",
      },
      {
        title: "Tanımlama için gece/gündüz PTZ",
        lead: "Isı lekesi dosya değildir. Çift spektrumlu PTZ, polis veya mekân güvenliğine devir için aynı yükte tanımlama merceğini tutar.",
        body: [
          "Tespitten sonra kapı mesafesindeki EO odak uzaklığı önemli spesifikasyondur. Termal ve görünürün aynı bakış çizgisinde olduğu çoklu-sensörleri listeleriz.",
        ],
        field: "En uzak kapınızda EO teşhis menziline bakın. Bu görev için yalnızca termal yetmez.",
      }
    ),
    cap(
      "event-quote",
      ["event", "quote", "sku", "venue", "datasheet"],
      {
        title: "Fast quote for event and venue programs",
        lead: "Event calendars do not wait on a 90-day RFP. SKU, quantity, datasheet, quote — the same path as every other Circuitbull® mission.",
        body: [
          "Tell us how many approaches and whether the kit is permanent or seasonal. We return catalog platforms with PDFs attached to the conversation.",
        ],
        field: "Request a quote with venue count and event window. Use the contact form.",
      },
      {
        title: "Etkinlik ve mekân programları için hızlı teklif",
        lead: "Etkinlik takvimi 90 günlük RFP beklemez. SKU, adet, datasheet, teklif — diğer Circuitbull® görevleriyle aynı yol.",
        body: [
          "Kaç yaklaşma ve kitin kalıcı mı mevsimlik mi olduğunu söyleyin. Konuşmaya PDF ekli katalog platformları döneriz.",
        ],
        field: "Mekân sayısı ve etkinlik penceresiyle teklif isteyin. İletişim formunu kullanın.",
      },
      true
    ),
  ],
  "lake-river": [
    cap(
      "channel-bank",
      ["channel", "bank", "river", "lake", "thermal", "boat"],
      {
        title: "Channel and bank thermal coverage",
        lead: "Inland water hides small craft and bank walkers. Thermal on a bridge, a lock, or a high bank sees the channel without lighting the water for everyone else.",
        body: [
          "Lakes and rivers are dark, reflective, and long. A few masts at bends, bridges, and landings beat a scatter of visible cameras. Uncooled thermal covers the near bank; longer-range dual-spectrum holds the far shore or a wide reach.",
        ],
        field: "Place masts at bends and landings. Match waveband to the width of the water.",
      },
      {
        title: "Kanal ve kıyı termal kapsama",
        lead: "İç su küçük tekne ve kıyı yayasını gizler. Köprü, kilit veya yüksek kıyıdaki termal, suyu herkes için aydınlatmadan kanalı görür.",
        body: [
          "Göl ve nehir karanlık, yansıtıcı ve uzundur. Dirsek, köprü ve iskelelerde birkaç mast, görünür kamera serpintisini yener.",
        ],
        field: "Mastları dirsek ve iskelelere koyun. Dalgaboyunu su genişliğine uydurun.",
      }
    ),
    cap(
      "bridge-collision",
      ["bridge", "collision", "pier", "allision", "maritime"],
      {
        title: "Bridge and collision-prevention watch",
        lead: "Piers and low bridges take hits from craft that “did not see” the structure. Thermal / EO on the fender line gives the operator a picture before steel meets concrete.",
        body: [
          "This is not a highway ITS camera on its side. You need a payload that sees a dark hull on dark water, with enough zoom to judge closing. We quote maritime-capable thermal PTZ for the bridge and the approach reach.",
        ],
        field: "One unit looking upstream, one downstream if the reach is long. Salt and humidity rated housings.",
      },
      {
        title: "Köprü ve çarpışma önleme izleme",
        lead: "Ayaklar ve alçak köprüler yapıyı “görmeyen” teknelerden darbe alır. Defne hattındaki termal / EO, çelik betona gelmeden operatöre resim verir.",
        body: [
          "Bu, yan yatırılmış otoyol ITS kamerası değildir. Karanlık suda karanlık gövdeyi gören, kapanmayı yargılayacak zoom’lu yük gerekir.",
        ],
        field: "Akıntı üstüne bir, reach uzunsa akıntı altına bir ünite. Tuz ve nem sınıfı gövde.",
      }
    ),
    cap(
      "aquaculture",
      ["aquaculture", "fishery", "fish", "farm", "cage"],
      {
        title: "Aquaculture and fishery overwatch",
        lead: "Cages and landing stages lose stock and fuel at night. Thermal overwatch on the farm perimeter sees a boat that should not be there.",
        body: [
          "Aquaculture sites are wet, remote, and tempting. A dual-spectrum PTZ on the service barge or the shore mast covers the cage lines and the fuel dock. Pair with live monitoring so the cue is not trapped on a local recorder.",
        ],
        field: "Shore or barge mast with thermal PTZ over the cages. Quote with farm diameter and whether the site is manned at night.",
      },
      {
        title: "Su ürünleri ve balıkçılık üst gözetimi",
        lead: "Kafes ve iskeleler gece stok ve yakıt kaybeder. Çiftlik perimetresindeki termal üst gözetim, orada olmaması gereken tekneyi görür.",
        body: [
          "Su ürünleri sahaları ıslak, uzak ve caziptir. Hizmet mavnası veya kıyı mastındaki çift spektrum PTZ kafes hatlarını ve yakıt iskelesini kapsar.",
        ],
        field: "Kafesler üzerinde termal PTZ’li kıyı veya mavna mastı. Çiftlik çapı ve gecenin kadrolu olup olmadığıyla teklif.",
      }
    ),
    cap(
      "live-monitoring",
      ["iot", "scada", "live", "monitoring", "circuitbull"],
      {
        title: "Pair sensors with Circuitbull® live monitoring",
        lead: "A lake camera nobody is watching is decoration. Made-in-USA IoT / SCADA live monitoring pages the duty officer when the thermal cue fires.",
        body: [
          "Catalog sensors are sourced. The US-built Circuitbull® layer is the live path. Quote both so the mast is in the ops picture, not only on a forgotten NVR.",
        ],
        field: "Add Circuitbull® live monitoring to the same quote as the water-side SKUs.",
      },
      {
        title: "Circuitbull® canlı izleme ile eşleme",
        lead: "Kimsenin bakmadığı göl kamerası süslemedir. ABD üretimi IoT / SCADA canlı izleme, termal ipucu ateşlenince nöbetçiye sayfa atar.",
        body: [
          "Katalog sensörleri tedarik edilir. ABD’de üretilen Circuitbull® katmanı canlı yoldur. Mast ops resminde olsun diye ikisini birlikte teklifleyin.",
        ],
        field: "Su tarafı SKU’larla aynı teklife Circuitbull® canlı izlemeyi ekleyin.",
      },
      true
    ),
  ],
};

export function listCapabilities(needSlug: string): CapabilityDef[] {
  return SOLUTION_CAPS[needSlug] || [];
}

export function findCapability(needSlug: string, capSlug: string): CapabilityDef | null {
  const slug = String(capSlug || "").trim();
  const list = listCapabilities(needSlug);
  return list.find((c) => c.slug === slug) || null;
}

export function capabilityCopy(def: CapabilityDef, lang: string): CapCopy {
  return lang === "tr" ? def.i18n.tr : def.i18n.en;
}

export function capPageUi(lang: string) {
  if (lang === "tr") {
    return {
      kicker: "Sahaya sürdüklerimiz",
      crumbSolutions: "Çözümler",
      fieldNote: "Saha notu",
      platformsKicker: "Bu görev grubu",
      platformsTitle: "Bu kapsamdaki platformlar",
      platformsLead: "Bu alt görev için önerdiğimiz askeri sınıf kameralar ve sensörler. SKU seçin, teklif isteyin.",
      alsoKicker: "Aynı görev",
      alsoTitle: "Bu misyonda ayrıca sahada",
      otherKicker: "Bu misyonda",
      otherTitle: "Diğer saha notları",
      quote: "Teklif iste",
      mission: "Görev sayfasına dön",
      more: "Saha notu",
    };
  }
  return {
    kicker: "What we field",
    crumbSolutions: "Solutions",
    fieldNote: "Field note",
    platformsKicker: "This task group",
    platformsTitle: "Platforms in this group",
    platformsLead: "Military-grade cameras and sensors we field for this job. Pick a SKU, then request a quote.",
    alsoKicker: "Same mission",
    alsoTitle: "Also fielded on this mission",
    otherKicker: "On this mission",
    otherTitle: "More field notes",
    quote: "Request quote",
    mission: "Back to mission",
    more: "Field notes",
  };
}

function haystack(p: any, lang: string) {
  const block = p?.i18n?.[lang] || p?.i18n?.en || {};
  const facts = (p.facts || [])
    .map((f: any) => [f.propertyKey, f.value, f.label, f.groupKey].filter(Boolean).join(" "))
    .join(" ");
  return [
    p.slug,
    p.model,
    p.sku,
    p.smartId,
    p.name,
    block.name,
    block.summary,
    block.description,
    ...(block.applications || []),
    ...(p.applications || []),
    facts,
  ]
    .join(" ")
    .toLowerCase();
}

export function rankProductsForCapability(products: any[], def: CapabilityDef, lang: string) {
  const kws = (def.keywords || []).map((k) => k.toLowerCase());
  const scored = (products || []).map((p) => {
    const h = haystack(p, lang);
    let score = 0;
    for (const k of kws) {
      if (!k) continue;
      if (h.includes(k)) score += k.length >= 6 ? 3 : 2;
    }
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score || String(a.p.slug).localeCompare(String(b.p.slug)));
  const matched = scored.filter((x) => x.score > 0).map((x) => x.p);
  const rest = scored.filter((x) => x.score === 0).map((x) => x.p);
  if (def.listAll || matched.length < 3) {
    return { primary: scored.map((x) => x.p), rest: [] as any[] };
  }
  return { primary: matched, rest };
}
