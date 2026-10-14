# Simulation parameters B1: methionine cycle, folate cycle, transsulfuration

Data: `src/sim/data/parameters-b1.js` (default export `{ convention, parameters, species, reactionLaws, references }`). New article entities: `src/knowledge/data/articles-sim-1.js` (31 entities, not yet wired into `data/index.js`). Everything below was reproduced from the cited papers, not copied; where only an abstract could be read this is said.

## Conventions

- Concentrations in uM (umol per litre of liver cell water); rates in uM/h; time in hours. This is the convention of the Reed/Nijhout models.
- Korendyaseva 2008 reports rates in mmol/h per litre of cells = mM/h, so multiply by 1000 to get uM/h (2.2 mmol/h/l cells = 2200 uM/h).
- Whole-body human fluxes (Storch 1988) are in umol/kg/h. Conversion used for scale only: 5.8 umol/kg/h x 70 kg (assumed body mass) = 406 umol/h = 9.7 mmol/day fasting; daily total transmethylation 238 umol/kg x 70 = 16.7 mmol/day. Spread over an assumed 1.5 L liver this would be up to ~270 uM/h if the liver did everything, so the Reed 2015 cycle flux of 100 uM/h is a fraction of whole-body flux. Liver mass and the liver share are assumptions, not sourced.
- Tissue nmol/g to uM: roughly 1:1 if 1 g tissue ~ 1 mL; true cell-water concentration is higher by about 1.4x. Not corrected anywhere.
- Plasma SAM and SAH are in nM in the literature; stored in uM (71-168 nM = 0.071-0.168 uM).
- Extra fields on each parameter beyond the requested ones: `rangeBasis` (`literature`, `cross-model`, `sensitivity-10pct`, `point`), `variant` (`base`, or the source set an alternate belongs to: `reed2008`, `sadre2018`, `korendyaseva2008`, `enzymology`) and `kind` (`kinetic`, `constant-concentration`, `input`, `reference-flux`, `reference-ratio`). Ids of alternates carry `@variant`. An assembler wanting one consistent set should take `variant === 'base'` and `kind !== 'reference-*'`.
- `sensitivity-10pct` ranges (value +/- 10%) are the perturbation Reed 2015 used for its own sensitivity checks. They are NOT literature ranges; Vmax values in these models are tuned to enzyme level and have no measured range.
- `confidence`: `measured` also covers literature values that I could only see second-hand through a model paper (the note says "secondhand"); `fitted-in-model` = chosen or adjusted by the model authors; `estimated` = back-calculated by this project; `assumed` = stated assumption.

## What was actually read

| Source | Access |
| --- | --- |
| Korendyaseva 2008 PLoS CB | full text; supplementary Word files (Tables S1-S3, Text S1) decoded, see below |
| Reed 2008 (glutathione, TBMM) | full text + supplementary PDF |
| Reed 2015 (competing methyltransferases) | full text + supplementary PDF |
| Sadre-Marandi 2018 | full text + supplementary PDF |
| Duncan 2013 (two papers) | full text |
| Luka 2009 (existing article) | full text |
| Yamada 2001 | full text (supplementary figures with the Ki not read) |
| Martinov 2000, Reed 2004, Nijhout 2004, Reed 2006, Nijhout 2006 | abstract only (paywalled). Martinov's laws are restated in Korendyaseva 2008; Nijhout 2004 folate constants reappear in the Reed 2008/2015 tables |
| All enzymology (Ogawa, Sullivan, Millian, Garrow, Evande, Chen, Yamada 1999, Jencks, Luka 2003/2008, Yeo), human flux and concentration papers (Storch, Mudd-Poole, Stabler, Guttormsen, Mosharov), Finkelstein 1982/1984/1986 | abstract only; any number marked "abstract" comes from the PubMed abstract |

The reference list of the Reed 2008 and 2015 supplements was not resolved to primary papers; literature ranges in their tables are therefore second-hand.

The "Reed 2008 J Theor Biol folate cycle" and "Reed 2008 folate and methionine cycles in liver" papers named in the brief do not exist under those titles. The relevant ones are Reed 2004 (J Theor Biol, methionine cycle), Nijhout 2004 (J Biol Chem, folate cycle), Reed 2008 (Theor Biol Med Model, liver one-carbon + transsulfuration + glutathione) and Reed 2015 / Sadre-Marandi 2018 (liver folate and methionine cycles). Korendyaseva 2008 is the PLoS Comput Biol paper from the Martinov/Ataullakhanov group.

### Recovering the Korendyaseva supplement

The rate equations and Table S1 live in Word `.doc` files whose symbols are MathType objects. I read the OLE equation streams to recover the variable names and the linear text of the equations, and the table values from the document text. The parameter-to-value mapping inside the table was partly inferred from equation order. Checks: with the decoded MAT-I, MAT-III, protein-turnover, MS and BHMT constants, the methionine balance at the paper steady state (Met 50, SAM 60, SAH 35, Hcy 3.5, 5-MTHF 1.7 uM) gives a net methionine influx of 761 uM/h, against 0.76 mmol/h/l cells printed in the Fig. 6 legend. The GNMT, functional-methylase and CBS serine terms could NOT be assigned unambiguously, and SAM balance does not close with any reading I tried. Those entries are marked as uncertain in their notes. Treat the Korendyaseva set as a structural template (substrate switch) with numbers valid only for the first group.

## Rate laws (base variant = Reed 2015 supplement)

All V in uM/h, S in uM. "ref" values normalise a regression factor to 1 at the reference state.

- MAT-I (MAT1A tetramer): `V = Vmax*Met/(Km+Met) * (0.23 + 0.8*exp(-0.0026*SAM))`, Vmax 260, Km 41 (Sullivan & Hoffman 1983).
- MAT-III (MAT1A dimer): `V = Vmax*Met^n/(K+Met^n) * (1 + 7.2*SAM^2/(360^2+SAM^2))`, Vmax 220, n 1.21, K 300 (units uM^1.21; S0.5 = 111 uM). Measured rat MAT-III S0.5 215 uM, Hill 1.8.
- GNMT: `V = kcat*(G + 0.5*GF) * SAM^2/((100*(1+SAH/35))^2+SAM^2) * Gly/(Km_gly+Gly)` with kcat 4000 uM/h per uM enzyme and total enzyme E = G+GF+GFF (back-calculated 2.14 uM). Binding: `5mTHF + G <-> GF` (on 2*k1=2*50 per uM per h, off k2=1 per h) and `5mTHF + GF <-> GFF` (k3 = 1, k4 = 1.6). Equilibrium fractions G : GF : GFF = 1 : 2*k1*m/k2 : (k3/k4)*m*2*k1*m/k2, m = free 5-MTHF. At m = 5.35 uM only 11.5% of the enzyme-equivalent activity remains.
- PEMT: `Vmax*SAM/((18.2+SAM)(1+SAH/3.8)) * PE/(5000+PE)`, Vmax 49100 (effective 98 at PE = 10 uM).
- GAMT: `210*SAM*GAA/((49(1+SAH/16)+SAM)(13.3+GAA))`, GAA = 10 uM.
- DNMT: `2.5*SAM/(1.4(1+SAH/1.4)+SAM)`; AS3MT: `28*SAM/(50(1+SAH/10)+SAM)*iAs/(4.6+iAs)` (omit unless modelling arsenic).
- AHCY: `Vf*SAH/(6.5+SAH) - Vr*Hcy/(150+Hcy)`, Vf 320, Vr 1310 (back-calculated). Alternative: equilibrium Hcy = 1.4*SAH/Ado.
- MTR (MS): `244*5mTHF*Hcy/((25+5mTHF)(1+Hcy))`. B12 deficiency: scale Vmax. MTRR is lumped into it.
- BHMT: `502*Hcy*Bet/((12+Hcy)(100+Bet)) * exp(-0.0021*(SAM+SAH))/exp(-0.0021*28)`, betaine 50 uM.
- CBS: `117000*Hcy*Ser/((1000+Hcy)(2000+Ser)) * a(SAM+SAH)/a(28)`, a(X) = 1.2*X^2/(30^2+X^2), serine 468 uM.
- CTH (from Reed 2008): `1500*Cysta/(500+Cysta)`.
- MTHFR: `5300*CH2THF*NADPH/((50+CH2THF)(16+NADPH)) * 3*10/(10+SAM-SAH)`, NADPH 50 uM. Clamp SAM-SAH at 0.
- Folate cycle (SHMT, MTHFD1 steps, FTS, FTD, PGT, AICART, DHFR, TS, NE): Michaelis-Menten forms with the constants in the data file. The forms (single substrate, random-order two-substrate, reversible two-term for SHMT/MTD/MTCH) are inferred from the "generic forms" paragraph of the supplements; verify against author code if exactness matters.

## Reproduction against published steady states

Using the values in the data file with the Table 1 concentrations of Reed 2015 (Met 17.97, SAM 23.97, SAH 3.89, Hcy 2.27 uM):

| Velocity (uM/h) | Reproduced | Reported |
| --- | --- | --- |
| MAT-I + MAT-III | 100.25 | 100.25 |
| BHMT | 26.63 | 26.60 |
| CBS | 49.98 | 50 (= methionine input) |
| PEMT | 27.53 | 27.53 |
| GAMT | 25.45 | 25.42 |
| DNMT (Vmax 2.5) | 2.05 | 2.05 |
| AS3MT | 1.28 | 1.28 |
| SAHH net | 100.28 | 100.25 |
| GNMT (E 2.14, Km_gly 12.2) | 43.7 | 43.97 |

Reed 2008 (Table 2): MAT-I 124.5 vs 125, MAT-III 80.3 vs 80.5, BHMT 61.8 vs 61.9, MS 40.3 vs 40.2, DNMT 143.7 vs 144, SAHH 205.2 vs 205, CTH 103.1 vs 103, TS 133.6 vs 133, MTHFR 40.5 vs 40.3 (all agree). Sadre-Marandi: BHMT Vmax 1999 and CBS Vmax 22262 were back-calculated from the paper's own steady state.

## Discrepancies found (honest list)

1. Reed 2015, DNMT: prints Vmax 12.5; its Table 1 flux (2.05) needs 2.5 (Sadre-Marandi prints 2.5).
2. Reed 2015, GAMT: main text says Vmax 100, supplement 210; 210 reproduces the table.
3. Reed 2015, 5-MTHF: Table 1 gives 5.35 uM (quoted from an earlier model) but V_MS = 23.65 requires 4.06 uM with the printed MS constants.
4. Reed 2015, GNMT: total enzyme concentration is never stated; Km_gly = 12.2 uM has a broken citation. Reed 2008 uses 130 uM, Ogawa & Fujioka 1982 measured 130 uM for rat liver, Luka 2009 says 2-20 mM.
5. Reed 2015, SAHH: reverse Vmax not printed; with Reed 2008's 4530 the net flux would be 52 instead of 100.
6. Reed 2008: the printed CBS law (Vmax 700000) gives 171 uM/h vs the reported 103; the printed GNMT 5-MTHF factor gives 74 vs 61.6.
7. BHMT betaine Km: 23 uM (pig), 100 (Reed), 2000 (Sadre-Marandi, citing Jiracek 2006), 2200 (human recombinant). Vmax changes to compensate; this alone changes the betaine response from saturated to linear.
8. PEMT: Reed 2015 effective Vmax 98 uM/h vs Sadre-Marandi 4.9 uM/h (a 20x gap) while both claim PEMT is comparable to GNMT and GAMT.
9. CH2-THF: Reed models settle at 0.3-0.5 uM; Korendyaseva fixes it at 20% of the pool (4.7 uM).
10. Scale: Korendyaseva (isolated mouse hepatocytes) has 5-10x the capacity per volume of the human-scale Reed models: mouse hepatocytes consume 860 uM/h of methionine at 40 uM external Met against Reed's 50-103 uM/h input.
11. Human flux sources disagree on the remethylation:transsulfuration ratio: Storch 1988 postabsorptive 0.45 (1.8:4.0) and fed 0.69; Finkelstein & Martin 1984 in vitro 1.17; Mudd & Poole 1975 at least 1.9 cycles per cystathionine; Reed models 1.0.
12. Tissue SAM, Met and SAH values span 24-85, 18-100 and 3.9-35 uM across the models; no human liver measurement was found (only rodent, and plasma values in humans).
13. MAT-III cooperativity: Hill 1.21 in Reed versus 1.8 measured; Korendyaseva uses a different two-site form with an inhibitory arm at high SAM that makes the substrate switch possible.

## Reference data (kind = reference-*)

- Human whole-body methionine kinetics (Storch 1988, 4+4 men): postabsorptive transmethylation 5.8, remethylation 1.8, transsulfuration 4.0 umol/kg/h; fed 14, 5.7, 8.3. Transsulfuration share of transmethylation 0.69 fasting, 0.59 fed.
- Human hepatoma cells (Mosharov 2000): cystathionine production 82 +/- 7 umol/h/l cells.
- Rat in vitro reconstitution (Finkelstein & Martin 1984): MS 27%, BHMT 27%, CBS 46% of homocysteine.
- SAM:SAH in rat tissues ~6 (Finkelstein 1982). Human serum SAM 71-168 nM, SAH 8-26 nM (Stabler & Allen 2004, n = 48), so ratios span ~3-20.
- Human plasma tHcy: NHANES geometric means 7.0-7.3 uM (Duncan 2013 Table 1); older donor range 7-22 uM. Cystathionine 0.12 uM fasting (0.10-0.16).
- GNMT share of SAM use: Reed 2015 model 44% (PEMT 27%, GAMT 25%, DNMT 2%); Reed 2008 30% with a lumped sink. Experimental statements are qualitative: creatine, phosphatidylcholine and sarcosine syntheses dominate (Mudd 2007), creatine less than the old >70% (Stead 2006).
- GNMT loss: GNMT-null mouse liver SAM 37 -> 1334 nmol/g (36x), SAM:SAH up ~100x; human GNMT deficiency raises plasma Met and SAM (Mudd 2001, Martinez-Chantar 2008). Use as a directional test.
- Substrate switch (Korendyaseva): mouse hepatocyte SAM 79 +/- 37 uM at 40 uM Met rising to 590-930 uM at 200-400 uM Met; consumption 0.86 -> 6.0 mmol/h/l cells.

## Notes for the model assembler

1. Use one variant consistently. `base` reproduces Reed 2015 and sits at SAM 24 uM, Met 18 uM, SAH 3.9 uM (SAM:SAH 6.2). The Korendyaseva set sits at SAM 60 but its numbers are partly unresolved. Do not mix Km_Bet or Vmax across variants.
2. GNMT glycine dependence is the pivotal choice for glycine-load questions. With Km_gly 130 uM and liver glycine ~1-2 mM GNMT is ~93% saturated with glycine and doubling glycine from 1.85 to 3.7 mM raises GNMT flux by only ~3%, so the SAM-lowering effect will come from the other regulators (5-MTHF binding, SAH). With Km 2-20 mM the effect is near proportional. Run both (`GNMT.Km_gly` and `GNMT.Km_gly@luka2009`) and show the ensemble.
3. Glycine, serine, betaine, formate, NADPH, PE, GAA are constants in the source models. Making glycine variable also needs SHMT, GCS and glycine cleavage; those belong to B2 and SHMT constants here are inconsistent across papers (Vf 5200 vs 40000).
4. Betaine and BHMT: if betaine is made variable use Km_Bet 100 with the 2015 Vmax, or Km 2000-2200 with Vmax ~15x higher (about 7500 at betaine 50 uM; Sadre-Marandi back-calculates 2000 at betaine 315). Betaine supplementation has no effect at Km 100 beyond saturation.
5. CTH/cystathionine exists only in Reed 2008. With the 2015 CBS flux (50 uM/h) the implied cystathionine is 17 uM. There is no sarcosine/DMG sink in the 2015 model; sarcosine accumulates unless a sink (SARDH) is added (Reed 2008 has one with Km 320 uM; not extracted here).
6. B6 deficiency, riboflavin/B12 and MTHFR variants are Vmax multipliers (C677T x0.3, A1298C x0.68, from Sadre-Marandi; B12 deficiency lowers MS Vmax, Nijhout 2004). No quantitative CBS/CTH PLP-dependence is given in these sources.
7. Oxidative-stress terms of Reed 2008 (H2O2 on CBS, BHMT, MS, MAT) and glutathione are deliberately left out.
8. DHFR, DNMT, AS3MT, FTD, PGT/AICART and NE have no ontology enzyme/reaction (`ontologyId` null in the laws). The generic MT sink for other methylation is the DNMT law with Vmax 180 (Reed 2008); it is a modelling device, not a measurement.
9. Time scale: the folate-cycle reactions with Vmax of 10^5-10^7 uM/h are stiff; use a stiff or adaptive integrator.

## What is assumed

Mass of person (70 kg) and liver volume (1.5 L) in the scale illustration; unit equivalence of nmol/g and uM; the SHMT/MTD/MTCH/PGT/AICART directional forms; the placement of beta in the Korendyaseva MAT-III equation and the interpretation of its Ki values for BHMT as uM; the value of GNMT.E_total and AHCY.Vr (back-calculated); all +/-10% Vmax ranges; that Reed's literature-column ranges are representative of the primary papers.
