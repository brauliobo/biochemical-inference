# Coverage checklist: base conversation -> knowledge entities

Source: `tmp/base-talk.txt` (Portuguese, 532 lines, five model turns). Every distinct substance, enzyme, reaction, pathway, state/disease, symptom/outcome, intervention, system, mechanism/claim, numeric claim, product listing and study that the conversation mentions was extracted and mapped to an entity id. `Search` is the short query a reader would type; `Rank` is where the entity appears in `find(query)` (1 = top). Regenerate the check with `tests/unit/knowledge-data.test.js` (table `CONVERSATION_TERMS`).

- Checklist items: **315** (distinct entities referenced: **292**)
- Mapped to entities that already existed at the start of the audit: **280**
- Mapped to entities created during this audit: **35** (32 distinct new ids: `compound:thymol`, `compound:elastin`, `pathway:nucleotide-synthesis`, `compound:tannins-flavonoids`, `enzyme:carns1`, `enzyme:tyms`, `reaction:carns1-carnosine-synthesis`, `reaction:tyms-thymidylate-synthesis`, `pathway:migrating-motor-complex`, `pathway:histamine-receptor-signalling`, `pathway:muscarinic-m2-vagal-brake`, `pathway:5-ht4-prokinetic-signalling`, `state:duodenogastric-reflux`, `disease:gastritis`, `disease:esophagitis`, `outcome:flatulence`, `outcome:transient-les-relaxations`, `claim:choline-400-1000-mg-supportive-range`, `system:gastric-parietal-cells`, `system:gastric-g-cells`, `system:colon`, `system:ileum`, `claim:espinheira-santa-prostaglandin-mucus`, `claim:beta-alanine-carnosine-tissue-protection`, `claim:oregano-phenols-burn-inflamed-mucosa`, `claim:magnesium-threonate-brain-selective-gaba`, `claim:glycine-with-meals-reduces-gastric-irritation`, `claim:glycine-powder-low-dose-belching-reports`, `claim:dgl-no-effect-on-aldosterone-bp`, `claim:artichoke-stimulates-bile-flow-and-emptying`, `claim:glutamine-fuels-enterocytes-and-repairs-epithelium`, `claim:alpha-gpc-pc-absorbed-without-acid`)
- Items whose search term finds the entity in the top 3 results: **315** of 315

## substance (96)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L1 | glicina em pó (várias marcas) | glicina em pó | `intervention:glycine-powder` | 1 | existing |
| L1 | glicina | glicina | `compound:glycine` | 1 | existing |
| L1 | colágeno tipo 2 em pó | colágeno tipo 2 | `intervention:type-ii-collagen` | 2 | existing |
| L1 | colágeno tipo 2 (composição) | UC-II | `compound:collagen-type-ii` | 1 | existing |
| L127 | colágeno | colágeno | `compound:collagen` | 1 | existing |
| L13 | SAMe / S-adenosilmetionina | SAMe | `compound:sam` | 1 | existing |
| L12 | S-adenosil-homocisteína (SAH) | SAH | `compound:sah` | 1 | existing |
| L12 | sarcosina | sarcosina | `compound:sarcosine` | 1 | existing |
| L21 | fosfatidilcolina | fosfatidilcolina | `compound:phosphatidylcholine` | 1 | existing |
| L21 | fosfatidiletanolamina | fosfatidiletanolamina | `compound:phosphatidylethanolamine` | 1 | existing |
| L22 | colina | colina | `compound:choline` | 1 | existing |
| L22 | acetilcolina | acetilcolina | `compound:acetylcholine` | 1 | existing |
| L38 | gastrina | gastrina | `compound:gastrin` | 1 | existing |
| L38 | ácido clorídrico (HCl) | ácido clorídrico | `compound:hydrochloric-acid` | 1 | existing |
| L53 | bicarbonato (pancreático e biliar) | bicarbonato | `compound:bicarbonate` | 1 | existing |
| L57 | ácido carbônico H2CO3 | ácido carbônico | `compound:carbonic-acid` | 1 | existing |
| L92 | gás carbônico / dióxido de carbono (CO2) | gás carbônico | `compound:carbon-dioxide` | 1 | existing |
| L106 | glicina zwitterion, anfótera, tamponante | zwitterion | `compound:glycine` | 1 | existing |
| L110 | amônia (NH3) | amônia | `compound:ammonia` | 1 | existing |
| L128 | prolina | prolina | `compound:proline` | 1 | existing |
| L128 | hidroxiprolina | hidroxiprolina | `compound:hydroxyproline` | 1 | existing |
| L131 | vitamina B6 ativa (P5P) | P5P | `compound:plp` | 1 | existing |
| L131 | piridoxal-5-fosfato | piridoxal-5-fosfato | `compound:plp` | 1 | existing |
| L135 | tetraidrofolato (THF) | tetraidrofolato | `compound:thf` | 1 | existing |
| L135 | 5,10-metilenotetraidrofolato | metilenotetraidrofolato | `compound:5-10-methylene-thf` | 1 | existing |
| L134 | folato / B9 | folato | `compound:folate` | 1 | existing |
| L134 | B12 | B12 | `compound:vitamin-b12` | 1 | existing |
| L136 | taurina | taurina | `compound:taurine` | 1 | existing |
| L136 | ácidos biliares | ácidos biliares | `compound:bile-acids` | 1 | existing |
| L154 | TMG / betaína | TMG | `compound:betaine` | 1 | existing |
| L154 | trimetilglicina | trimetilglicina | `compound:betaine` | 1 | existing |
| L154 | metilfolato | metilfolato | `compound:5-mthf` | 2 | existing |
| L154 | metilcobalamina | metilcobalamina | `compound:methylcobalamin` | 1 | existing |
| L154 | niacina (drena metil) | niacina | `compound:niacin` | 2 | existing |
| L166 | glutamato | glutamato | `compound:glutamate` | 1 | existing |
| L166 | GABA | GABA | `compound:gaba` | 1 | existing |
| L166 | piridoxina (B6 convencional) | piridoxina | `compound:pyridoxine` | 1 | existing |
| L169 | histamina | histamina | `compound:histamine` | 1 | existing |
| L169 | homocisteína | homocisteína | `compound:homocysteine` | 1 | existing |
| L169 | metionina | metionina | `compound:methionine` | 1 | existing |
| L178 | Betaína HCl (cloridrato) | betaína HCl | `intervention:betaine-hcl` | 1 | existing |
| L239 | omeprazol, pantoprazol (IBPs) | omeprazol | `intervention:ppi-therapy` | 1 | existing |
| L267 | zinco carnosina (PepZin GI) | zinco carnosina | `intervention:zinc-carnosine` | 1 | existing |
| L267 | PepZin GI | PepZin | `intervention:zinc-carnosine` | 1 | existing |
| L268 | DGL (alcaçuz desglicirrizinado) | DGL | `intervention:dgl-licorice` | 1 | existing |
| L269 | L-glutamina | glutamina | `compound:glutamine` | 1 | existing |
| L280 | berberina | berberina | `compound:berberine` | 1 | existing |
| L280 | óleo de orégano | óleo de orégano | `intervention:oregano-oil` | 1 | existing |
| L395 | carvacrol | carvacrol | `compound:carvacrol` | 1 | existing |
| L395 | timol | timol | `compound:thymol` | 1 | created |
| L283 | Alpha-GPC | alfa-GPC | `compound:glycerophosphocholine` | 1 | existing |
| L283 | fosfatidilcolina líquida | fosfatidilcolina líquida | `intervention:phosphatidylcholine-supplement` | 1 | existing |
| L284 | ácido fólico sintético | ácido fólico | `compound:folic-acid` | 2 | existing |
| L284 | ácido folínico | ácido folínico | `compound:folinic-acid` | 2 | existing |
| L300 | citicolina | citicolina | `compound:cdp-choline` | 1 | existing |
| L304 | betaína aldeído | betaína aldeído | `compound:betaine-aldehyde` | 1 | existing |
| L355 | dimetilglicina (DMG) | dimetilglicina | `compound:dimethylglycine` | 1 | existing |
| L357 | monometilglicina | monometilglicina | `compound:sarcosine` | 1 | existing |
| L383 | glutationa | glutationa | `compound:glutathione` | 1 | existing |
| L383 | creatina | creatina | `compound:creatine` | 1 | existing |
| L417 | elastina | elastina | `compound:elastin` | 1 | created |
| L393 | secretina | secretina | `compound:secretin` | 1 | existing |
| L393 | motilina | motilina | `compound:motilin` | 1 | existing |
| L397 | prostaglandinas | prostaglandinas | `compound:prostaglandin-e2` | 1 | existing |
| L397 | filme de muco | muco gástrico | `compound:gastric-mucus` | 1 | existing |
| L398 | beta-alanina | beta-alanina | `compound:beta-alanine` | 1 | existing |
| L398 | carnosina | carnosina | `compound:carnosine` | 1 | existing |
| L398 | histidina | histidina | `compound:histidine` | 1 | existing |
| L403 | pepsina | pepsina | `compound:pepsin` | 1 | existing |
| L403 | alginato de sódio | alginato | `compound:alginate` | 2 | existing |
| L403 | pitada de bicarbonato (água alcalina) | bicarbonato de sódio | `compound:bicarbonate` | 1 | existing |
| L449 | trimetilamina (TMA) | trimetilamina | `compound:trimethylamine` | 1 | existing |
| L456 | TMAO | TMAO | `compound:tmao` | 1 | existing |
| L451 | bitartarato de colina | bitartarato de colina | `intervention:choline-bitartrate` | 1 | existing |
| L482 | gengibre padronizado | gengibre | `intervention:ginger-extract` | 1 | existing |
| L482 | gingeróis e shogaóis | gingeróis | `compound:gingerols` | 1 | existing |
| L483 | alcachofra (folha) | alcachofra | `intervention:artichoke-leaf-extract` | 1 | existing |
| L483 | cinarina | cinarina | `compound:cynarin` | 1 | existing |
| L485 | betaína anidra (TMG puro) | betaína anidra | `intervention:betaine-anhydrous` | 2 | existing |
| L492 | adenosilcobalamina | adenosilcobalamina | `compound:adenosylcobalamin` | 1 | existing |
| L494 | magnésio | magnésio | `compound:magnesium` | 1 | existing |
| L494 | treonato de magnésio | treonato de magnésio | `intervention:magnesium-l-threonate` | 1 | existing |
| L494 | malato de magnésio | malato de magnésio | `intervention:magnesium-malate` | 1 | existing |
| L493 | dopamina | dopamina | `compound:dopamine` | 1 | existing |
| L493 | serotonina | serotonina | `compound:serotonin` | 1 | existing |
| L357 | purinas / DNA | purinas | `pathway:nucleotide-synthesis` | 1 | created |
| L357 | pirimidinas | pirimidinas | `pathway:nucleotide-synthesis` | 1 | created |
| L497 | gelatina natural | gelatina | `intervention:dietary-glycine-sources` | 1 | existing |
| L128 | serina | serina | `compound:serine` | 1 | existing |
| L398 | taninos e flavonoides | taninos | `compound:tannins-flavonoids` | 1 | created |
| L468 | lecitina de girassol | lecitina de girassol | `intervention:phosphatidylcholine-supplement` | 1 | existing |
| L463 | Extreme Suplementos colina bitartarato | Extreme Suplementos | `intervention:choline-bitartrate` | 1 | existing |
| L462 | BulkSupplements bitartarato de colina | BulkSupplements | `intervention:choline-bitartrate` | 1 | existing |
| L465 | Citicolina Elysx gotas | Elysx | `intervention:citicoline-supplement` | 1 | existing |
| L466 | Citicolina lipossomal Cognizin (iHerb) | Cognizin | `intervention:citicoline-supplement` | 1 | existing |
| L468 | BodyBio PC (iHerb) | BodyBio | `intervention:phosphatidylcholine-supplement` | 1 | existing |

## enzyme (25)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L12 | GNMT | GNMT | `enzyme:gnmt` | 1 | existing |
| L21 | PEMT | PEMT | `enzyme:pemt` | 1 | existing |
| L132 | SHMT | SHMT | `enzyme:shmt` | 2 | existing |
| L135 | Sistema de Clivagem da Glicina (GCS) | sistema de clivagem da glicina | `enzyme:glycine-cleavage-system` | 2 | existing |
| L109 | glicina descarboxilase | glicina descarboxilase | `enzyme:gldc` | 1 | existing |
| L169 | HNMT | HNMT | `enzyme:hnmt` | 1 | existing |
| L169 | BHMT | BHMT | `enzyme:bhmt` | 1 | existing |
| L166 | GAD (glutamato descarboxilase) | glutamato descarboxilase | `enzyme:gad` | 1 | existing |
| L302 | colina desidrogenase | colina desidrogenase | `enzyme:chdh` | 1 | existing |
| L313 | BADH | BADH | `enzyme:aldh7a1` | 2 | existing |
| L356 | dimetilglicina desidrogenase | dimetilglicina desidrogenase | `enzyme:dmgdh` | 1 | existing |
| L359 | sarcosina desidrogenase | sarcosina desidrogenase | `enzyme:sardh` | 1 | existing |
| L495 | MAT (metionina adenosiltransferase) | metionina adenosiltransferase | `enzyme:mat` | 1 | existing |
| L492 | metionina sintase | metionina sintase | `enzyme:mtr` | 1 | existing |
| L105 | anidrase carbônica | anidrase carbônica | `enzyme:carbonic-anhydrase` | 2 | existing |
| L271 | urease do H. pylori | urease | `enzyme:h-pylori-urease` | 1 | existing |
| L166 | fosforilação da B6 no fígado (piridoxal quinase) | piridoxal quinase | `enzyme:pdxk` | 1 | existing |
| L239 | bomba de prótons (IBP) | bomba de prótons | `enzyme:h-k-atpase` | 2 | existing |
| L34 | colina acetiltransferase | colina acetiltransferase | `enzyme:chat` | 1 | existing |
| L449 | bactérias que fazem TMA (TMA liase) | TMA liase | `enzyme:cutc` | 1 | existing |
| L456 | FMO3 | FMO3 | `enzyme:fmo3` | 1 | existing |
| L135 | MTHFR / ciclo do folato | MTHFR | `enzyme:mthfr` | 1 | existing |
| L109 | glicina redutase / Stickland | Stickland | `enzyme:bacterial-glycine-reductase` | 1 | existing |
| L398 | carnosina sintase | carnosina sintase | `enzyme:carns1` | 1 | created |
| L357 | timidilato sintase (purinas e pirimidinas) | timidilato sintase | `enzyme:tyms` | 1 | created |

## reaction (29)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L12 | SAMe + glicina -> SAH + sarcosina (GNMT) | GNMT | `reaction:gnmt-glycine-methylation` | 3 | existing |
| L21 | PE + 3 SAMe -> PC (PEMT) | PEMT | `reaction:pemt-pe-to-pc` | 2 | existing |
| L53 | H+ + HCO3- -> H2CO3 -> H2O + CO2 | carbonic-acid-dehydration | `reaction:carbonic-acid-dehydration` | 1 | existing |
| L53 | ácido + bicarbonato -> CO2 | neutralização do ácido | `reaction:hcl-bicarbonate-neutralisation` | 2 | existing |
| L132 | glicina em serina (SHMT) | serina hidroximetiltransferase | `reaction:shmt-serine-glycine-interconversion` | 2 | existing |
| L135 | glicina -> metileno-THF (GCS) | clivagem da glicina | `reaction:glycine-cleavage-system` | 1 | existing |
| L169 | betaína + homocisteína -> DMG + metionina (BHMT) | remetilação por betaína | `reaction:bhmt-betaine-homocysteine` | 2 | existing |
| L169 | histamina + SAMe -> metil-histamina (HNMT) | inativação da histamina | `reaction:hnmt-histamine-methylation` | 1 | existing |
| L166 | glutamato -> GABA (GAD) | descarboxilação do glutamato | `reaction:gad-glutamate-decarboxylation` | 1 | existing |
| L303 | colina -> betaína aldeído | oxidação da colina | `reaction:chdh-choline-oxidation` | 3 | existing |
| L313 | betaína aldeído -> betaína | betaína aldeído | `reaction:badh-betaine-aldehyde-oxidation` | 2 | existing |
| L357 | DMG -> sarcosina (DMGDH) | demetilação da dimetilglicina | `reaction:dmgdh-dimethylglycine-demethylation` | 1 | existing |
| L359 | sarcosina -> glicina (SARDH) | demetilação da sarcosina | `reaction:sardh-sarcosine-demethylation` | 1 | existing |
| L271 | ureia -> amônia + CO2 (urease) | hidrólise da ureia | `reaction:urease-urea-hydrolysis` | 1 | existing |
| L136 | conjugação do ácido biliar com glicina | glicoconjugação | `reaction:baat-glycine-conjugation` | 2 | existing |
| L136 | conjugação com taurina | tauroconjugação | `reaction:baat-taurine-conjugation` | 2 | existing |
| L109 | redução de Stickland da glicina | glicina redutase | `reaction:bacterial-glycine-reductase` | 2 | existing |
| L109 | descarboxilação bacteriana da glicina | descarboxilação bacteriana | `reaction:bacterial-glycine-cleavage` | 1 | existing |
| L35 | colina + acetil-CoA -> acetilcolina | síntese de acetilcolina | `reaction:chat-acetylcholine-synthesis` | 3 | existing |
| L449 | colina -> trimetilamina (TMA) | formação bacteriana de TMA | `reaction:choline-tma-lyase` | 1 | existing |
| L456 | TMA -> TMAO (FMO3) | N-oxidação | `reaction:fmo3-tma-n-oxidation` | 2 | existing |
| L494 | metionina + ATP -> SAMe (MAT, magnésio) | síntese de S-adenosilmetionina | `reaction:mat-sam-synthesis` | 1 | existing |
| L398 | beta-alanina + histidina -> carnosina | síntese de carnosina | `reaction:carns1-carnosine-synthesis` | 1 | created |
| L357 | dUMP -> dTMP (timidilato) | síntese de timidilato | `reaction:tyms-thymidylate-synthesis` | 2 | created |
| L383 | glicina na síntese de glutationa | síntese de glutationa | `reaction:gss-glutathione-synthesis` | 3 | existing |
| L383 | glicina na síntese de creatina | AGAT arginina glicina | `reaction:agat-guanidinoacetate-synthesis` | 1 | existing |
| L128 | montagem do colágeno Gly-X-Y | montagem da cadeia de colágeno | `reaction:collagen-chain-assembly` | 1 | existing |
| L128 | hidroxilação da prolina | hidroxilação da prolina | `reaction:p4h-prolyl-hydroxylation` | 1 | existing |
| L38 | secreção de HCl pela célula parietal | secreção de HCl | `reaction:gastric-hcl-secretion` | 1 | existing |

## pathway (27)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L9 | ciclo de metilação | ciclo de metilação | `pathway:methionine-cycle` | 1 | existing |
| L135 | ciclo do folato | ciclo do folato | `pathway:folate-cycle` | 1 | existing |
| L293 | rota colina -> TMG -> glicina | oxidação da colina | `pathway:choline-oxidation` | 2 | existing |
| L447 | via de Kennedy (> 50% da colina) | via de Kennedy | `pathway:kennedy-pathway` | 1 | existing |
| L22 | síntese de fosfatidilcolina de novo (PEMT) | via PEMT | `pathway:pemt-pc-synthesis` | 2 | existing |
| L34 | síntese de acetilcolina | síntese de acetilcolina | `pathway:acetylcholine-synthesis` | 2 | existing |
| L166 | eixo glutamato/GABA | derivação do GABA | `pathway:gaba-shunt` | 1 | existing |
| L169 | degradação da histamina | degradação da histamina | `pathway:histamine-degradation` | 1 | existing |
| L131 | ativação da B6 | ativação da vitamina B6 | `pathway:vitamin-b6-activation` | 1 | existing |
| L137 | conjugação de ácidos biliares | conjugação de ácidos biliares | `pathway:bile-acid-conjugation` | 1 | existing |
| L38 | secreção ácida gástrica | secreção ácida | `pathway:gastric-acid-secretion` | 1 | existing |
| L53 | neutralização do ácido por bicarbonato | neutralização do ácido | `pathway:acid-bicarbonate-neutralisation` | 1 | existing |
| L109 | fermentação da glicina no trato alto | fermentação bacteriana da glicina | `pathway:gut-bacterial-glycine-fates` | 1 | existing |
| L393 | complexo motor migratório (MMC) | complexo motor migratório | `pathway:migrating-motor-complex` | 1 | created |
| L383 | síntese de glutationa | síntese de glutationa | `pathway:glutathione-synthesis` | 1 | existing |
| L383 | síntese de colágeno | síntese de colágeno | `pathway:collagen-synthesis` | 1 | existing |
| L383 | síntese de creatina | síntese de creatina | `pathway:creatine-synthesis` | 1 | existing |
| L417 | síntese endógena de glicina | síntese endógena de glicina | `pathway:glycine-serine-route` | 1 | existing |
| L449 | colina -> TMA -> TMAO | eixo colina TMA TMAO | `pathway:tma-tmao-axis` | 1 | existing |
| L13 | dreno de metil | dreno de metil | `pathway:methyl-budget` | 2 | existing |
| L357 | síntese de purinas e pirimidinas para o DNA | síntese de purinas | `pathway:nucleotide-synthesis` | 1 | created |
| L155 | homocisteína -> cisteína (transsulfuração) | transsulfuração | `pathway:transsulfuration` | 3 | existing |
| L173 | receptores H1 e H2 cardíacos | receptor de histamina H1 | `pathway:histamine-receptor-signalling` | 1 | created |
| L173 | receptores muscarínicos M2 no nó sinoatrial | receptor muscarínico M2 | `pathway:muscarinic-m2-vagal-brake` | 1 | created |
| L482 | receptores 5-HT4 gástricos | receptor 5-HT4 | `pathway:5-ht4-prokinetic-signalling` | 1 | created |
| L271 | urease -> amônia + CO2 | urease do H. pylori | `pathway:h-pylori-urease-activity` | 1 | existing |
| L22 | síntese e metabolismo do glicogênio? (n/a) vagal | tônus vagal colinérgico | `pathway:acetylcholine-synthesis` | 1 | existing |

## state (14)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L9 | submetilação | submetilação | `state:undermethylation` | 1 | existing |
| L12 | hipermetilação | hipermetilação | `state:overmethylation` | 1 | existing |
| L101 | hipocloridria funcional | hipocloridria | `state:hypochlorhydria` | 1 | existing |
| L133 | deficiência funcional de B6 | deficiência funcional de B6 | `state:b6-functional-deficiency` | 1 | existing |
| L27 | gastroparesia leve / funcional | gastroparesia funcional | `state:gastric-dysmotility` | 1 | existing |
| L27 | disfunção vagal subclínica | disfunção vagal | `claim:undermethylation-causes-subclinical-vagal-dysfunction` | 1 | existing |
| L239 | supressão ácida prolongada | supressão ácida | `state:acid-suppression` | 1 | existing |
| L178 | mucosa pós-úlcera | pós-úlcera | `state:post-ulcer-mucosal-recovery` | 1 | existing |
| L135 | ciclo do folato bloqueado (armadilha do folato) | armadilha do folato | `state:folate-trap` | 1 | existing |
| L457 | ultrapassar 3,5 g de colina | excesso de colina | `state:choline-excess` | 1 | existing |
| L169 | excesso de histamina | excesso de histamina | `state:histamine-excess` | 1 | existing |
| L417 | déficit/insuficiência de glicina | insuficiência de glicina | `state:glycine-insufficiency` | 1 | existing |
| L13 | drenagem dos grupos metil | depleção de doadores de metil | `state:methyl-donor-depletion` | 1 | existing |
| L137 | refluxo duodeno-gástrico alcalino / biliar | refluxo duodenogástrico | `state:duodenogastric-reflux` | 1 | created |

## disease (20)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L133 | pirolúria / KPU | pirolúria | `disease:pyroluria-kpu` | 1 | existing |
| L160 | úlceras gástricas e duodenais | úlcera | `disease:peptic-ulcer` | 1 | existing |
| L271 | Helicobacter pylori | H. pylori | `disease:h-pylori-infection` | 1 | existing |
| L107 | SIBO | SIBO | `disease:sibo` | 1 | existing |
| L386 | refluxo laringofaríngeo (LPR) | refluxo laringofaríngeo | `disease:lpr` | 1 | existing |
| L386 | refluxo silencioso | refluxo silencioso | `disease:lpr` | 1 | existing |
| L180 | gastrite erosiva | gastrite | `disease:gastritis` | 1 | created |
| L180 | duodenite residual | duodenite | `disease:gastritis` | 1 | created |
| L395 | esofagite | esofagite | `disease:esophagitis` | 1 | created |
| L27 | refluxo gastroesofágico | refluxo | `disease:gerd` | 3 | existing |
| L166 | ansiedade | ansiedade | `disease:anxiety-disorder` | 2 | existing |
| L455 | síndrome do odor de peixe (trimetilaminúria) | trimetilaminúria | `disease:trimethylaminuria` | 1 | existing |
| L456 | risco cardiovascular aterosclerótico | doença cardiovascular | `disease:cardiovascular-disease` | 1 | existing |
| L27 | gastroparesia | gastroparesia | `disease:gastroparesis` | 1 | existing |
| L169 | intolerância à histamina | intolerância à histamina | `disease:histamine-intolerance` | 1 | existing |
| L130 | deficiência de B6 | deficiência de vitamina B6 | `disease:vitamin-b6-deficiency` | 1 | existing |
| L417 | colágeno / articulações | osteoartrite | `disease:osteoarthritis` | 1 | existing |
| L239 | uso de IBP e gastrite atrófica | gastrite atrófica | `disease:atrophic-gastritis` | 1 | existing |
| L152 | peso gástrico / eructação tardia | dispepsia funcional | `disease:functional-dyspepsia` | 1 | existing |
| L27 | arrotos excessivos / aerofagia | aerofagia | `disease:aerophagia-belching-disorders` | 1 | existing |

## outcome (32)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L1 | arroto (não flatulência) | arroto | `outcome:belching` | 1 | existing |
| L1 | eructação | eructação | `outcome:belching` | 1 | existing |
| L1 | flatulência | flatulência | `outcome:flatulence` | 1 | created |
| L1 | intolerância à glicina (gases) | intolerância à glicina | `outcome:glycine-intolerance` | 1 | existing |
| L27 | esvaziamento gástrico lentificado | esvaziamento gástrico | `outcome:delayed-gastric-emptying` | 2 | existing |
| L27 | relaxamentos transitórios do EEI | relaxamentos transitórios | `outcome:transient-les-relaxations` | 1 | created |
| L27 | ar engolido | ar engolido | `claim:belching-mostly-swallowed-air` | 1 | existing |
| L100 | distensão gástrica por CO2 | distensão gástrica | `outcome:co2-gastric-distension` | 1 | existing |
| L106 | pH gástrico elevado | pH gástrico | `outcome:elevated-gastric-ph` | 1 | existing |
| L126 | gás em 15 a 45 minutos | gás SIBO | `claim:sibo-gas-appears-in-15-45-min-as-belching` | 1 | existing |
| L166 | névoa mental | névoa mental | `outcome:brain-fog` | 1 | existing |
| L166 | ansiedade e hiperatividade mental | desequilíbrio glutamato | `outcome:glutamate-gaba-imbalance` | 1 | existing |
| L167 | despertar às 2-3h | despertar às 2-3h | `outcome:night-waking` | 1 | existing |
| L167 | taquicardia | taquicardia | `outcome:tachycardia` | 1 | existing |
| L172 | rubor / calor | rubor | `outcome:flushing` | 1 | existing |
| L178 | queimação com betaína | queimação | `outcome:heartburn` | 1 | existing |
| L385 | queimação na garganta | queimação na garganta | `outcome:throat-burning` | 1 | existing |
| L389 | pigarro / globus | pigarro | `outcome:throat-burning` | 1 | existing |
| L153 | teste respiratório de hidrogênio e metano | teste respiratório | `outcome:breath-hydrogen-methane` | 1 | existing |
| L456 | TMAO elevado | TMAO elevado | `outcome:elevated-tmao` | 1 | existing |
| L455 | odor de peixe no suor e hálito | odor de peixe | `outcome:fishy-odor` | 1 | existing |
| L457 | sudorese, cólicas, diarreia (crise colinérgica) | sintomas colinérgicos | `outcome:cholinergic-excess-symptoms` | 1 | existing |
| L417 | déficit de ~10 g/dia de glicina | déficit de glicina | `outcome:glycine-deficit-estimate` | 1 | existing |
| L389 | pepsina na laringe | pepsina salivar | `outcome:salivary-pepsin` | 1 | existing |
| L397 | reepitelização / cicatrização da úlcera | cicatrização da úlcera | `outcome:ulcer-healing` | 1 | existing |
| L38 | aumento da secreção ácida | aumento da secreção ácida | `outcome:increased-gastric-acid-output` | 1 | existing |
| L38 | gastrina estimulada | gastrina elevada | `outcome:elevated-gastrin` | 1 | existing |
| L417 | síntese de colágeno suficiente | adequação da síntese de colágeno | `outcome:collagen-synthesis-adequacy` | 1 | existing |
| L21 | redução de SAMe e metilação | razão SAM/SAH | `outcome:low-sam-sah-ratio` | 2 | existing |
| L169 | histamina elevada | histamina sanguínea | `outcome:blood-histamine-level` | 1 | existing |
| L271 | H. pylori erradicado? teste | teste de H. pylori | `outcome:h-pylori-test-result` | 1 | existing |
| L387 | refluxo silencioso: episódios de refluxo | episódios de refluxo | `outcome:reflux-episodes` | 1 | existing |

## intervention (24)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L154 | suporte aos doadores de metil | doadores de metil | `state:methyl-donor-depletion` | 1 | existing |
| L264 | suspender betaína HCl | betaína HCl contraindicada | `claim:betaine-hcl-contraindicated-post-ulcer` | 1 | existing |
| L265 | suspender glicina livre e colágeno em pó | reintrodução em fases | `intervention:phased-reintroduction-protocol` | 1 | existing |
| L261 | fases 1-3 (curar mucosa, sanear, otimizar) | protocolo em fases | `intervention:phased-reintroduction-protocol` | 1 | existing |
| L285 | glicina diluída em refeições sólidas | glicina com as refeições | `intervention:amino-acids-with-meals` | 1 | existing |
| L403 | bochechos com água alcalina | bochecho com bicarbonato | `intervention:bicarbonate-rinse` | 1 | existing |
| L239 | antibióticos para H. pylori | erradicação do H. pylori | `intervention:h-pylori-eradication-therapy` | 1 | existing |
| L271 | checagem de H. pylori | teste do H. pylori | `intervention:h-pylori-testing` | 1 | existing |
| L153 | rastreamento de SIBO | teste respiratório de hidrogênio | `intervention:sibo-breath-test` | 2 | existing |
| L393 | espinheira santa | espinheira santa | `intervention:espinheira-santa` | 1 | existing |
| L458 | colina 400-1000 mg | colina 400 a 1000 | `claim:choline-400-1000-mg-supportive-range` | 1 | created |
| L497 | carnes de cozimento lento, peixes, gelatina | caldo de ossos | `intervention:dietary-glycine-sources` | 1 | existing |
| L153 | avaliação da hipocloridria | desafio de betaína | `intervention:hcl-challenge-test` | 1 | existing |
| L284 | ácido fólico sintético vs metilfolato | ácido fólico sintético | `intervention:folic-acid-supplement` | 1 | existing |
| L492 | metilcobalamina | suplemento de metilcobalamina | `intervention:methylcobalamin-supplement` | 1 | existing |
| L243 | aumentar a colina para tolerar glicina | colina glicina silenciosa | `claim:choline-derived-glycine-silent` | 1 | existing |
| L482 | extrato de gengibre procinético | procinético | `intervention:prokinetic-drugs` | 2 | existing |
| L403 | alginato de sódio após refeições | alginato de sódio | `intervention:sodium-alginate` | 1 | existing |
| L266 | L-glutamina doses baixas | suplemento de glutamina | `intervention:l-glutamine-supplement` | 1 | existing |
| L398 | beta-alanina | suplemento de beta-alanina | `intervention:beta-alanine-supplement` | 1 | existing |
| L494 | magnésio glicinato | glicinato de magnésio | `intervention:magnesium-glycinate` | 1 | existing |
| L166 | P5P direto | suplemento de P5P | `intervention:p5p-supplement` | 1 | existing |
| L239 | IBPs | IBP | `intervention:ppi-therapy` | 1 | existing |
| L397 | DGL mastigável | alcaçuz | `intervention:dgl-licorice` | 1 | existing |

## system (20)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L23 | nervo vago / tônus vagal | tônus vagal | `system:vagal-tone` | 1 | existing |
| L24 | esfíncter esofágico inferior (EEI) | esfíncter esofágico inferior | `system:lower-esophageal-sphincter` | 1 | existing |
| L25 | células parietais | células parietais | `system:gastric-parietal-cells` | 1 | created |
| L38 | células G antrais | células G | `system:gastric-g-cells` | 1 | created |
| L53 | bulbo duodenal / duodeno | duodeno | `system:duodenum` | 1 | existing |
| L106 | piloro | piloro | `system:pylorus` | 1 | existing |
| L107 | microbiota alta | microbiota intestinal | `system:gut-microbiota` | 1 | existing |
| L137 | bile | bile | `system:bile` | 1 | existing |
| L173 | nó sinoatrial / controle cardíaco vagal | nó sinoatrial | `system:cardiac-autonomic-control` | 1 | existing |
| L180 | barreira de muco | barreira de muco | `system:mucosal-barrier` | 1 | existing |
| L383 | hepatócitos / fígado | fígado | `system:liver` | 1 | existing |
| L387 | laringe e faringe | laringe | `system:larynx-pharynx` | 1 | existing |
| L166 | cérebro: glutamato / GABA | GABA cerebral | `system:brain-gaba-glutamate` | 1 | existing |
| L417 | tecido conjuntivo | tecido conjuntivo | `system:connective-tissue` | 1 | existing |
| L451 | rim / betaína | rim | `system:kidney` | 1 | existing |
| L110 | sistema nervoso entérico | sistema nervoso entérico | `system:enteric-nervous-system` | 1 | existing |
| L7 | fermentação colônica clássica | fermentação colônica | `system:colon` | 1 | created |
| L391 | bicarbonato pancreático | bicarbonato pancreático | `system:pancreas-bicarbonate` | 1 | existing |
| L393 | bactérias sobem do íleo | íleo | `system:ileum` | 1 | created |
| L23 | estômago / fundo gástrico | estômago | `system:gastric-physiology` | 1 | existing |

## article (4)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L416 | Meléndez-Hevia et al. (2009) | Meléndez-Hevia | `article:melendez-hevia-2009-glycine-weak-link` | 2 | existing |
| L453 | IOM: UL de colina 3.500 mg | IOM colina | `article:iom-1998-choline-dri` | 1 | existing |
| L453 | EFSA: colina | EFSA colina | `article:efsa-2016-choline-dri` | 1 | existing |
| L456 | TMAO e risco cardiovascular | TMAO cardiovascular | `article:tang-2013-phosphatidylcholine-cardiovascular-risk` | 1 | existing |

## claim (24)

| Line | In the conversation | Search | Entity | Rank | Status |
| --- | --- | --- | --- | ---: | --- |
| L416 | síntese endógena ~3 g/dia e déficit ~10 g/dia | déficit de glicina 10 g | `claim:glycine-deficit-10g` | 2 | existing |
| L450 | 28-35 g de colina e 70-85 g de bitartarato por dia | 28 a 35 g de colina | `claim:choline-28-35g-for-10g-glycine` | 1 | existing |
| L128 | colágeno tipo 2: ~33% de glicina (Gly-X-Y) | colágeno 33% glicina | `claim:collagen-ii-33-percent-glycine` | 1 | existing |
| L387 | laringe 50-100x mais sensível | 50 a 100 vezes | `claim:larynx-50-100x-more-sensitive` | 1 | existing |
| L453 | UL 3,5 g de colina (IOM e EFSA) | limite superior de colina | `claim:choline-ul-3-5g-iom-efsa` | 1 | existing |
| L169 | pico de histamina às 2-4h | pico de histamina | `claim:histamine-peaks-2-4am` | 1 | existing |
| L12 | GNMT como válvula de escape do excesso de SAMe | válvula de escape | `claim:gnmt-methyl-sink-valve` | 1 | existing |
| L13 | glicina como esponja de metil em submetilados | esponja de metil | `claim:glycine-gnmt-depletes-sam-in-undermethylated` | 1 | existing |
| L21 | PEMT usa 3 grupos metil do SAMe | três grupos metil | `claim:pemt-consumes-three-sam` | 1 | existing |
| L38 | glicina estimula gastrina | glicina gastrina | `claim:free-glycine-stimulates-gastrin` | 1 | existing |
| L106 | pH alto atrasa o EEI e o piloro | pH alto | `claim:higher-ph-delays-les-closure-and-pylorus` | 1 | existing |
| L137 | bile glicoconjugada e refluxo alcalino | razão glicina taurina | `claim:glycine-overload-shifts-bile-conjugation-and-reflux` | 1 | existing |
| L271 | urease de H. pylori causa arrotos | H. pylori arrotos | `claim:h-pylori-causes-belching` | 1 | existing |
| L393 | IBPs deixam o estômago preguiçoso | IBPs motilidade | `claim:ppis-slow-gastric-emptying` | 1 | existing |
| L397 | espinheira santa estimula muco via prostaglandinas | espinheira santa muco | `claim:espinheira-santa-prostaglandin-mucus` | 1 | created |
| L398 | beta-alanina forma carnosina antioxidante | beta-alanina carnosina | `claim:beta-alanine-carnosine-tissue-protection` | 2 | created |
| L395 | óleo de orégano arde (carvacrol/timol) | orégano arde | `claim:oregano-phenols-burn-inflamed-mucosa` | 1 | created |
| L495 | treonato de magnésio e GABA | treonato barreira hematoencefálica | `claim:magnesium-threonate-brain-selective-gaba` | 1 | created |
| L285 | glicina diluída em refeições sólidas | glicina refeições sólidas | `claim:glycine-with-meals-reduces-gastric-irritation` | 1 | created |
| L1 | gases com 2-3 g e outras pessoas relataram | relatos de arrotos | `claim:glycine-powder-low-dose-belching-reports` | 1 | created |
| L480 | DGL sem glicirrizina não altera pressão | DGL pressão arterial | `claim:dgl-no-effect-on-aldosterone-bp` | 1 | created |
| L483 | alcachofra estimula a bile | alcachofra bile | `claim:artichoke-stimulates-bile-flow-and-emptying` | 1 | created |
| L269 | glutamina como combustível dos enterócitos | glutamina enterócitos | `claim:glutamine-fuels-enterocytes-and-repairs-epithelium` | 1 | created |
| L283 | Alpha-GPC não depende de ácido | alfa-GPC ácido gástrico | `claim:alpha-gpc-pc-absorbed-without-acid` | 1 | created |

