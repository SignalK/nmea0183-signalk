/**
 * Registry of per-sentence hook functions keyed by NMEA sentence id.
 *
 * When adding a new NMEA sentence:
 *   1. Create `./<SENTENCE>.ts` exporting a default HookFn.
 *   2. Add the import and the key below.
 *   3. Add tests under `test/<SENTENCE>.ts`.
 */

import type { HookFn } from '../types'

import ALK from './ALK'
import APB from './APB'
import DBT from './DBT'
import DBK from './DBK'
import DBS from './DBS'
import DPT from './DPT'
import DSC from './DSC'
import GNS from './GNS'
import GGA from './GGA'
import GLL from './GLL'
import GSV from './GSV'
import HDG from './HDG'
import HDM from './HDM'
import HDT from './HDT'
import PBVE from './proprietary/PBVE'
import PNKEP from './proprietary/PNKEP'
import PSMDST from './proprietary/PSMDST'
import MDA from './MDA'
import MTA from './MTA'
import MTW from './MTW'
import MWD from './MWD'
import MWV from './MWV'
import RMB from './RMB'
import RMC from './RMC'
import ROT from './ROT'
import RPM from './RPM'
import RSA from './RSA'
import VDM from './VDM'
import VDO from './VDO'
import VDR from './VDR'
import VHW from './VHW'
import VLW from './VLW'
import VPW from './VPW'
import VTG from './VTG'
import VWR from './VWR'
import VWT from './VWT'
import ZDA from './ZDA'
import XTE from './XTE'
import BOD from './BOD'
import BWC from './BWC'
import BWR from './BWR'
import HSC from './HSC'

const hooks: Record<string, HookFn> = {
  ALK,
  APB,
  DBT,
  DBK,
  DBS,
  DPT,
  DSC,
  GNS,
  GGA,
  GLL,
  GSV,
  HDG,
  HDM,
  HDT,
  PBVE,
  PNKEP,
  PSMDST,
  MDA,
  MTA,
  MTW,
  MWD,
  MWV,
  RMB,
  RMC,
  ROT,
  RPM,
  RSA,
  VDM,
  VDO,
  VDR,
  VHW,
  VLW,
  VPW,
  VTG,
  VWR,
  VWT,
  ZDA,
  XTE,
  BOD,
  BWC,
  BWR,
  HSC
}

export default hooks
module.exports = hooks
module.exports.default = hooks
