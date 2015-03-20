/*
 * Copyright 2015 Fabian Tollenaar <fabian@starting-point.nl>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/


/*
GSA - GPS DOP and active satellites

       0 1 2                        13 14  15  16  17
       | | |                         |  |   |   |  |
$--GSA,a,a,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x.x,x.x,x.x*hh<CR><LF>

Field Number: 
0) Selection mode
       M = Manual, forced to operate in 2D or 3D
       A = Automatic, 3D/2D
1) Mode (1 = no fix, 2 = 2D fix, 3 = 3D fix)
2) ID of 1st satellite used for fix
3) ID of 2nd satellite used for fix
...
13) ID of 12th satellite used for fix
14) PDOP
15) HDOP
16) VDOP
17) checksum

Robin Darroch writes: "As I understand it, DOP is unit-less, and can
only be compared meaningfully to other DOP figures.  A DOP of 4
indicates twice the likelihood of a given position error compared with
a DOP of 2.  The DOP is calculated from the expected errors due to
current geometry of the satellites used to obtain the fix.  The
estimated position errors should show a strong correlation with DOP,
but be completely different in value as they are measured in distance
units (i.e.  metres), and they are trying to tell you "you're very
probably within x metres of this point" rather than "I'm about twice
as sure of my position as I was a couple of minutes ago".
*/

// SHOULD THIS EVEN BE IMPLEMENTED??