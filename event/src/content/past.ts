import type { StaticImageData } from "next/image";

// ESENet 2025 (Synapse, 7th edition), taken from esenet-tn.com: the
// exhibitors and partners wall and the speakers of the three panels.

import apna from "@/assets/exhibitors/apna.png";
import aneti from "@/assets/exhibitors/aneti.png";
import atb from "@/assets/exhibitors/atb.png";
import atodd from "@/assets/exhibitors/atodd.png";
import beeCoders from "@/assets/exhibitors/bee-coders.png";
import bi4you from "@/assets/exhibitors/bi4you.png";
import bte from "@/assets/exhibitors/bte.png";
import cnfce from "@/assets/exhibitors/cnfce.png";
import darBlockchain from "@/assets/exhibitors/dar-blockchain.png";
import enda from "@/assets/exhibitors/enda.png";
import epicValorX from "@/assets/exhibitors/epic-valor-x.png";
import ey from "@/assets/exhibitors/ey.png";
import facilis from "@/assets/exhibitors/facilis.png";
import fourIna from "@/assets/exhibitors/4ina.png";
import headsapp from "@/assets/exhibitors/headsapp.png";
import iinovate from "@/assets/exhibitors/iinovate.png";
import intech from "@/assets/exhibitors/intech.png";
import jet from "@/assets/exhibitors/jet.png";
import laPoste from "@/assets/exhibitors/la-poste.png";
import medianet from "@/assets/exhibitors/medianet.png";
import mep from "@/assets/exhibitors/mep.png";
import mesrs from "@/assets/exhibitors/mesrs.png";
import mtc from "@/assets/exhibitors/mtc.png";
import netcom from "@/assets/exhibitors/netcom.png";
import nety from "@/assets/exhibitors/nety.png";
import opuslab from "@/assets/exhibitors/opuslab.png";
import pwc from "@/assets/exhibitors/pwc.png";
import qualipro from "@/assets/exhibitors/qualipro.png";
import s2t from "@/assets/exhibitors/s2t.png";
import slayton from "@/assets/exhibitors/slayton.png";
import sodino from "@/assets/exhibitors/sodino.png";
import startupVillage from "@/assets/exhibitors/startup-village.png";
import stb from "@/assets/exhibitors/stb.png";
import symatique from "@/assets/exhibitors/symatique.png";
import ticdce from "@/assets/exhibitors/ticdce.png";
import uma from "@/assets/exhibitors/uma.png";
import umaPee from "@/assets/exhibitors/uma-pee.png";
import virtualdev from "@/assets/exhibitors/virtualdev.png";
import wikiStartup from "@/assets/exhibitors/wiki-startup.png";

import amer from "@/assets/speakers-2025/amer.png";
import amineChouaieb from "@/assets/speakers-2025/amine_chouaieb.png";
import aymen from "@/assets/speakers-2025/aymen.png";
import bassem from "@/assets/speakers-2025/bassem.png";
import abdelkerimRezgui from "@/assets/speakers-2025/abdelkerim_rezgui.png";
import chirazArfaoui from "@/assets/speakers-2025/chiraz_arfaoui.png";
import hemissi from "@/assets/speakers-2025/hemissi.png";
import hichemBesbes from "@/assets/speakers-2025/hichem_besbes.png";
import kamel from "@/assets/speakers-2025/kamel.png";
import karimAhres from "@/assets/speakers-2025/karim_ahres.png";
import maherLahmer from "@/assets/speakers-2025/maher_lahmer.png";
import mhamed from "@/assets/speakers-2025/mhamed.png";
import mondherKebiri from "@/assets/speakers-2025/mondher_kebiri.png";
import samihaSelmani from "@/assets/speakers-2025/samiha_selmani.png";
import seghaier from "@/assets/speakers-2025/seghaier.png";
import sendaBoukef from "@/assets/speakers-2025/senda_boukef.png";
import walaTurki from "@/assets/speakers-2025/wala_turki.png";
import youssoufMaiga from "@/assets/speakers-2025/youssouf_maiga.png";

// `dark`: the logo has white lettering and needs a navy tile.
export type Exhibitor = { name: string; logo: StaticImageData; dark?: boolean };

export const EXHIBITORS_2025: Exhibitor[] = [
  { name: "EY", logo: ey },
  { name: "PwC", logo: pwc },
  { name: "ATB", logo: atb },
  { name: "STB Bank", logo: stb },
  { name: "BTE — Banque de Tunisie et des Emirats", logo: bte },
  { name: "La Poste Tunisienne", logo: laPoste },
  { name: "Qualipro", logo: qualipro },
  { name: "Facilis", logo: facilis },
  { name: "Netcom Tunisia", logo: netcom, dark: true },
  { name: "Nety", logo: nety },
  { name: "BI4YOU", logo: bi4you },
  { name: "VirtualDev", logo: virtualdev },
  { name: "Dar Blockchain", logo: darBlockchain, dark: true },
  { name: "Slayton", logo: slayton },
  { name: "Sodino SICAR", logo: sodino },
  { name: "Wiki Startup", logo: wikiStartup },
  { name: "Startup Village", logo: startupVillage },
  { name: "Medianet", logo: medianet },
  { name: "HeadsApp", logo: headsapp },
  { name: "InTech", logo: intech },
  { name: "ATODD", logo: atodd },
  { name: "4InA Technologies", logo: fourIna },
  { name: "Bee Coders", logo: beeCoders },
  { name: "OpusLab", logo: opuslab, dark: true },
  { name: "Epic Valor X", logo: epicValorX },
  { name: "Symatique", logo: symatique },
  { name: "TICDCE", logo: ticdce },
  { name: "ANETI", logo: aneti },
  { name: "CNFCE", logo: cnfce },
  { name: "ENDA", logo: enda },
  { name: "APNA", logo: apna },
  { name: "IINOVATE", logo: iinovate },
  { name: "Junior Enterprises Tunisia", logo: jet },
  { name: "S2T — Smart Tunisian Technoparks", logo: s2t },
  { name: "Université de la Manouba", logo: uma },
  { name: "UMA PEE — Pôle de l’Étudiant Entrepreneur", logo: umaPee },
  { name: "Ministère des Technologies de la Communication", logo: mtc },
  { name: "Ministère de l’Enseignement Supérieur et de la Recherche Scientifique", logo: mesrs },
  { name: "Ministère de l’Économie et de la Planification", logo: mep },
];

export type PastSpeaker = {
  name: string;
  photo: StaticImageData;
  role: { en: string; fr: string };
  org: string;
};

export const SPEAKERS_2025: PastSpeaker[] = [
  {
    name: "Sofiene Hemissi",
    photo: hemissi,
    role: { en: "Minister of Communication Technologies", fr: "Ministre des Technologies de la Communication" },
    org: "",
  },
  {
    name: "Ameur Cherif",
    photo: amer,
    role: { en: "President", fr: "Président" },
    org: "Université de la Manouba",
  },
  {
    name: "Wala Turki",
    photo: walaTurki,
    role: { en: "Adviser to the Minister", fr: "Conseillère auprès du Ministre" },
    org: "Ministère des Technologies de la Communication",
  },
  {
    name: "M’hamed Ben Abid",
    photo: mhamed,
    role: { en: "Director General, Business Climate Cooperation", fr: "Directeur Général Coopération du Climat des Affaires" },
    org: "Ministère de l’Économie et de la Planification",
  },
  { name: "Maher Lahmer", photo: maherLahmer, role: { en: "CTO, ex-Google & IBM", fr: "CTO, ex-Google & IBM" }, org: "Facilis.ai" },
  {
    name: "Senda Boukef",
    photo: sendaBoukef,
    role: { en: "Director, Technology Strategy & Transformation", fr: "Directrice Stratégie Technologique et Transformation" },
    org: "EY",
  },
  {
    name: "Hichem Besbes",
    photo: hichemBesbes,
    role: { en: "Professor · UNESCO lead national expert", fr: "Professeur · Expert national principal UNESCO" },
    org: "Sup’Com",
  },
  { name: "Samiha Selmani", photo: samihaSelmani, role: { en: "CEO", fr: "CEO" }, org: "Sodino SICAR" },
  { name: "Karim Ahres", photo: karimAhres, role: { en: "CEO", fr: "CEO" }, org: "Netcom Tunisia" },
  { name: "Aymen Chakhari", photo: aymen, role: { en: "Co-founder", fr: "Co-fondateur" }, org: "SKILLIA" },
  { name: "Abdelkerim Rezgui", photo: abdelkerimRezgui, role: { en: "CEO", fr: "CEO" }, org: "BI4YOU" },
  { name: "Chiraz Arfaoui", photo: chirazArfaoui, role: { en: "CEO", fr: "CEO" }, org: "Wiki Start Up" },
  { name: "Amine Chouaieb", photo: amineChouaieb, role: { en: "CEO", fr: "CEO" }, org: "Nety" },
  {
    name: "Mondher Kebiri",
    photo: mondherKebiri,
    role: { en: "Business Development Manager", fr: "Business Development Manager" },
    org: "Slayton Solutions",
  },
  { name: "Bassem Thabti", photo: bassem, role: { en: "CEO", fr: "CEO" }, org: "VirtualDev" },
  { name: "Kamel Gazeh", photo: kamel, role: { en: "CTO", fr: "CTO" }, org: "Qualipro" },
  { name: "Youssef Seghaier", photo: seghaier, role: { en: "Technical Lead", fr: "Technical Lead" }, org: "Dar Blockchain" },
  {
    name: "Youssouf Maiga",
    photo: youssoufMaiga,
    role: { en: "President, APNA France · DevOps consultant", fr: "Président APNA France · Consultant DevOps" },
    org: "",
  },
];
