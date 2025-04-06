/**
 * Converts Uint8Array instances in a JSON object into regular Arrays.
 * 
 * This utility function recursively traverses a JSON object and converts any Uint8Array
 * instances to regular JavaScript arrays for better JSON serialization. It handles nested
 * objects and arrays containing Uint8Array instances.
 *
 * @param {Object} json - The input JSON object that may contain Uint8Array instances
 * @returns {Object} A new JSON object with all Uint8Array instances converted to Arrays
 * 
 * @example
 * // Converting a simple object with Uint8Array
 * const input = { id: 1, data: new Uint8Array([1, 2, 3]) };
 * const output = convertUint8ToArray(input);
 * // output: { id: 1, data: [1, 2, 3] }
 * 
 * @example
 * // Converting nested objects with Uint8Array
 * const input = { 
 *   id: 1, 
 *   nested: { bytes: new Uint8Array([4, 5, 6]) },
 *   items: [new Uint8Array([7, 8]), { key: new Uint8Array([9]) }]
 * };
 * // Will convert all Uint8Array instances at any level of nesting
 */
function convertUint8ToArray(json) {
    const newJson = {};
    for (const key in json) {
        if (json[key] instanceof Uint8Array) {
            newJson[key] = Array.from(json[key]);
        } else if (Array.isArray(json[key])) {
            newJson[key] = json[key].map((item) => 
                item instanceof Uint8Array
                    ? Array.from(item)
                    : typeof item === 'object'
                    ? convertUint8ToArray(item)
                    : item
            );
        } else if (typeof json[key] === 'object' && json[key] !== null) {
            newJson[key] = convertUint8ToArray(json[key]);
        } else {
            newJson[key] = json[key];
        }
    }
    return newJson;
}
export { convertUint8ToArray };