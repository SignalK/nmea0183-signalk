/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// VDO carries the vessel's own AIS broadcast; the payload is identical in
// shape to VDM (other-vessel AIS), so both sentence ids resolve to the same
// hook. Kept as a dedicated module so the `hooks` index stays explicit.
import VDM from './VDM'

export default VDM
module.exports = VDM
module.exports.default = VDM
