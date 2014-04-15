/* 
 * Signal K
 * 
 * @description		This file contains an object with functions for every group of the specificiation. When ever an object 
 * 					is added to a group using the functions, the function should:
 * 					- check the existing objects in the group
 * 					- overwrite conflicts if timestamp is newer
 * 					- mix different values. 
 * 					- return a full object - including other groups.
 *
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 * 
 * @todo 			Add a function to compare objects and their timestamps, return the newer object
 * @todo 			function to easily merge the different groups into a signal K object
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

module.exports = signalk = {
	navigation: function(data) {
		return data;
	},

	environmental: function(data) {
		return data;
	},

	communication: function(data) {
		return data;
	}
};