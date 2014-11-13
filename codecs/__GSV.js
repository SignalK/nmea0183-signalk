/*
GSV - Satellites in view

These sentences describe the sky position of a UPS satellite in view.
Typically they're shipped in a group of 2 or 3.

       0 1 2 3 4 5 6     n
       | | | | | | |     |
$--GSV,x,x,x,x,x,x,x,...*hh<CR><LF>

Field Number: 
0) total number of GSV messages to be transmitted in this group
1) 1-origin number of this GSV message  within current group
2) total number of satellites in view (leading zeros sent)
3) satellite PRN number (leading zeros sent)
4) elevation in degrees (00-90) (leading zeros sent)
5) azimuth in degrees to true north (000-359) (leading zeros sent)
6) SNR in dB (00-99) (leading zeros sent)
more satellite info quadruples like 4-7
n) checksum

Example:
  $GPGSV,3,1,11,03,03,111,00,04,15,270,00,06,01,010,00,13,06,292,00*74
  $GPGSV,3,2,11,14,25,170,00,16,57,208,39,18,67,296,40,19,40,246,00*74
  $GPGSV,3,3,11,22,42,067,42,24,14,311,43,27,05,244,00,,,,*4D

Some GPS receivers may emit more than 12 quadruples (more than three
GPGSV sentences), even though NMEA-0813 doesn't allow this.  (The
extras might be WAAS satellites, for example.) Receivers may also
report quads for satellites they aren't tracking, in which case the
SNR field will be null; we don't know whether this is formally allowed
or not.
*/