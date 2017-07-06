/*
 * index.js
 *
 * @description 	Reads codec directory and adds the codecs to an object.
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 *
 *
 *
 * Copyright 2014, Fabian Tollenaar
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
 *
 */

var codecs = {
  APB: require('./APB'),
  DBT: require('./DBT'),
  DSC: require('./DSC'),
  GGA: require('./GGA'),
  GLL: require('./GLL'),
  HDM: require('./HDM'),
  HDG: require('./HDG'),
  HDT: require('./HDT'),
  MTW: require('./MTW'),
  MWV: require('./MWV'),
  RMC: require('./RMC'),
  VDM: require('./VDM'),
  VDO: require('./VDO'),
  VHW: require('./VHW'),
  VPW: require('./VPW'),
  VTG: require('./VTG'),
  RPM: require('./RPM'),
  ROT: require('./ROT'),
  VDR: require('./VDR'),
  VPW: require('./VPW'),
  VWR: require('./VWR'),
  ZDA: require('./ZDA'),
  STALK: require('./STALK'),
};

module.exports = codecs;
