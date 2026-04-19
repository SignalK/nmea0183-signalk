/**
 * Minimal ambient declaration for `ggencoder`. Only `AisDecode` is used by
 * the VDM hook; the decoded message shape is wide and loosely-typed so fields
 * are exposed as optional.
 */

declare module 'ggencoder' {
  export interface AisDecodeResult {
    valid: boolean
    mmsi?: number | string
    mmsikey?: number | string
    shipname?: string
    sog?: number
    cog?: number
    hdg?: number
    rot?: number
    length?: number
    width?: number
    draught?: number
    dimA?: number
    dimD?: number
    navstatus?: number
    destination?: string
    etaMo?: number
    etaDay?: number
    etaHr?: number
    etaMin?: number
    callsign?: string
    aistype?: number
    imo?: number | string
    aidtype?: number
    offpos?: number
    virtual?: number
    cargo?: number
    smi?: number
    dac?: number
    fid?: number
    lon?: number
    lat?: number
    avgwindspd?: number
    windgust?: number
    winddir?: number
    windgustdir?: number
    airtemp?: number
    relhumid?: number
    dewpoint?: number
    airpress?: number
    waterlevel?: number
    signwavewhgt?: number
    waveperiod?: number
    wavedir?: number
    swellhgt?: number
    swellperiod?: number
    swelldir?: number
    watertemp?: number
    salinity?: number
    surfcurrspd?: number
    surfcurrdir?: number
    ice?: number
    precipitation?: number
    seastate?: number
    waterlevelten?: number
    airpressten?: number
    horvisib?: number
    horvisibrange?: number
    utcday?: number
    utchour?: number
    utcminute?: number
    // The decoder exposes many additional fields; allow unknown lookups.
    [key: string]: unknown
  }

  export class AisDecode implements AisDecodeResult {
    constructor(sentence: string, session?: unknown)
    valid: boolean;
    [key: string]: unknown
  }
}
