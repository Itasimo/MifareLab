/**
 * Parses a MIFARE card dump into a structured JSON representation.
 *
 * @param {string} dump - The hexadecimal string representation of the MIFARE card dump.
 *                         Each byte is represented by two hexadecimal characters.
 *                         Whitespace is ignored and the string is case-insensitive.
 * @returns {Object|null} A JSON object representing the parsed MIFARE card dump, or `null` if the input is invalid.
 * 
 * @property {Object} manifacturer - Information about the card manufacturer.
 * @property {Uint8Array} manifacturer.uid - The Unique Identifier (UID) of the card (4, 7, or 10 bytes).
 * @property {Uint8Array} manifacturer.nuid - The Non-Unique Identifier (NUID) of the card (always 4 bytes).
 * @property {number|null} manifacturer.bcc - The Block Check Character (BCC) for error detection (1 byte).
 * @property {number|null} manifacturer.sak - The Select Acknowledge (SAK) indicating card type (1 byte).
 * @property {Uint8Array|null} manifacturer.ataq - The Answer to Request (ATQA) used during card initialization (2 bytes).
 * @property {Uint8Array} manifacturer.data - Remaining manufacturer data (variable length).
 * 
 * @property {Array<Object>} sectors - An array of parsed data for each sector.
 * @property {Array<Uint8Array>} sectors[].dataValues - An array of data blocks for the sector (excluding the sector trailer).
 * @property {Array<string>} sectors[].dataTypes - An array of data types for each block in the sector.
 * @property {Object} sectors[].sectorTrailer - The sector trailer containing authentication keys and access conditions.
 * @property {Uint8Array} sectors[].sectorTrailer.keyA - Key A used for authentication (6 bytes).
 * @property {Uint8Array} sectors[].sectorTrailer.keyB - Key B used for authentication (6 bytes).
 * @property {Uint8Array} sectors[].sectorTrailer.userdata - User data byte in the sector trailer (1 byte).
 * @property {Object} sectors[].sectorTrailer.accessConditions - Access conditions for the sector.
 * @property {Uint8Array} sectors[].sectorTrailer.accessConditions.unParsed - Raw access condition bytes (3 bytes).
 * @property {Array<string>} sectors[].sectorTrailer.accessConditions.parsed - Parsed access conditions for each block.
 * 
 * @throws {Error} If the input dump is not a string or does not match the expected structure of a MIFARE card.
 */
function DumpToJson(dump) {
    // Ensure the input is a string; if not, return null.
    // This is a basic validation to ensure the function is called with the correct input type.
    if (typeof dump !== 'string') return null;

    // Constants defining the structure of the MIFARE dump.
    const SECTOR_SIZE = 64; // Each sector in a MIFARE card contains 64 bytes of data.
    const BLOCK_SIZE = 16; // Each block within a sector contains 16 bytes of data.
    const SECTOR_COUNT = 16; // A standard MIFARE card has 16 sectors.
    const BLOCK_COUNT = 4; // Each sector contains 4 blocks.

    // Initialize the JSON structure to store the parsed dump.
    const FileJSON = {
        manifacturer: {
            uid: new Uint8Array(10), // Unique Identifier (UID) of the card. Can be 4, 7, or 10 bytes.
            nuid: new Uint8Array(4), // Non-Unique Identifier (NUID) of the card (always 4 bytes).
            bcc: null, // Block Check Character (BCC), used for error detection (1 byte).
            sak: null, // Select Acknowledge (SAK), indicates card type (1 byte).
            ataq: null, // Answer to Request (ATQA), used during card initialization (2 bytes).
            data: new Uint8Array(0) // Remaining manufacturer data (variable length).
        },
        sectors: [], // Array to store parsed data for each sector.
    };

    // Remove all whitespace from the input dump and convert it to uppercase.
    // This ensures the input is in a consistent format for parsing.
    const HexString = dump.replace(/\s/g, '').toUpperCase();

    // Split the dump into sectors, each containing SECTOR_SIZE * 2 hex characters.
    // Each byte is represented by 2 hex characters, so we multiply by 2.
    const Sectors = HexString.match(new RegExp(`.{1,${SECTOR_SIZE * 2}}`, 'g')) || [];

    // Don't check for the number of sectors beacuse some sectors may have the access conditions set to 7 (111) witch prevents reading the data.

    // Iterate over each sector in the dump.
    Sectors.forEach((sector, i) => {
        // Initialize the structure to store data for the current sector.
        const Sector = {
            dataValues: [], // Array to store data for each block in the sector.
            dataTypes: [], // Array to store data types for each block in the sector.
            sectorTrailer: {
                keyA: new Uint8Array(6), // Key A, used for authentication (6 bytes).
                keyB: new Uint8Array(6), // Key B, used for authentication (6 bytes).
                userdata: new Uint8Array(1), // User data byte in the sector trailer (1 byte).
                accessConditions: {
                    unParsed: new Uint8Array(3), // Raw access condition bytes (3 bytes).
                    parsed: [] // Parsed access conditions for each block in the sector.
                }
            }
        };

        // Split the sector into blocks, each containing BLOCK_SIZE * 2 hex characters.
        // Each block is 16 bytes, represented by 32 hex characters.
        const Blocks = sector.match(new RegExp(`.{1,${BLOCK_SIZE * 2}}`, 'g')) || [];

        // Iterate over each block in the sector.
        Blocks.forEach((block, j) => {
            // If this is the last block in the sector, it is the sector trailer.
            if (j == BLOCK_COUNT - 1) {
                // Extract the components of the sector trailer.
                // The structure is:
                // Key A (6 bytes) | Access Conditions (3 bytes) | User Data (1 byte) | Key B (6 bytes).
                const SectorTrailer = block.match(/^([A-F0-9]{12})([A-F0-9]{6})([A-F0-9]{2})([A-F0-9]{12})$/).slice(1);

                // Parse and store Key A as a Uint8Array.
                Sector.sectorTrailer.keyA = new Uint8Array(SectorTrailer[0].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

                // Parse and store Key B as a Uint8Array.
                Sector.sectorTrailer.keyB = new Uint8Array(SectorTrailer[3].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

                // Parse and store User Data as a Uint8Array.
                Sector.sectorTrailer.userdata = new Uint8Array(SectorTrailer[2].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

                // Parse and store Access Conditions as a Uint8Array.
                Sector.sectorTrailer.accessConditions.unParsed = new Uint8Array(SectorTrailer[1].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

                // Convert Access Conditions bytes to binary strings for easier parsing.
                const AccessConditions = SectorTrailer[1].match(/.{1,2}/g).map(hex2bin);

                // Parse the access conditions for each block in the sector.
                for (let k = BLOCK_COUNT - 1; k >= 0; k--) {
                    // The access condition bits are defined in the MIFARE documentation and follow a specific format.
                    // Here is an image to explain it better: https://i.sstatic.net/JpwkSuJ2.png

                    // Extract the access condition bits for the current block:
                    const C1 = AccessConditions[1].charAt(k); // C1 is the k-th bit of the second byte.
                    const C2 = AccessConditions[0].charAt(k) ^ 1; // C2 is the k-th bit of the first byte, flipped (XOR with 1).
                    const C3 = AccessConditions[2].charAt(k); // C3 is the k-th bit of the third byte.

                    // Combine the bits into a string and store them in the parsed access conditions.
                    Sector.sectorTrailer.accessConditions.parsed.push([C1, C2, C3].join(''));
                }
            } else if (i == 0 && j == 0) {
                // Manufacturer data is stored in the first block of the first sector.

                // Parse the block into an array of bytes.
                const ManifacturerData = block.match(/.{1,2}/g).map(byte => parseInt(byte, 16));

                const is4bytes = (ManifacturerData[5] == 0x08 || ManifacturerData[5] == 0x88) && ManifacturerData[6] == 0x04 && ManifacturerData[7] == 0x00;
                const is7bytes = (ManifacturerData[7] == 0x18 || ManifacturerData[7] == 0x98) && ManifacturerData[8] == 0x44 && ManifacturerData[9] == 0x00;

                const SAK = is4bytes ? ManifacturerData[5] : is7bytes ? ManifacturerData[7] : null;
                const ATQA = is4bytes ? ManifacturerData.slice(6, 8) : is7bytes ? ManifacturerData.slice(8, 10) : null;

                const uidSize = guessUidSize(SAK, ATQA);

                // Parse and store the UID as a Uint8Array.
                FileJSON.manifacturer.uid = new Uint8Array(ManifacturerData.slice(0, uidSize));

                // Parse and store the NUID as a Uint8Array.
                FileJSON.manifacturer.nuid = new Uint8Array(ManifacturerData.slice(0, 4));

                // Parse and store the BCC as a number.
                FileJSON.manifacturer.bcc = uidSize == 4 ? new Uint8Array([ManifacturerData[4]]) : null;

                // Parse and store the SAK as a number.
                FileJSON.manifacturer.sak = new Uint8Array([SAK]);

                // Parse and store the ATQA as a Uint8Array.
                FileJSON.manifacturer.ataq = new Uint8Array(ATQA);

                // Parse and store the remaining manufacturer data as a Uint8Array.
                const dataStart = uidSize + (FileJSON.manifacturer.bcc ? 1 : 0) + (SAK ? 1 : 0) + (ATQA ? 2 : 0);
                FileJSON.manifacturer.data = new Uint8Array(ManifacturerData.slice(dataStart));
            } else {
                // Check if the block is a Read/Write block or a Value block by analyzing its format.
                // The value block format is defined as:
                // AA AA AA AA !AA !AA !AA !AA AA AA AA AA BB !BB BB !BB
                // Where:
                // - A represents the value data (4 bytes, repeated 3 times).
                // - !A represents the inverted value data (4 bytes, repeated 3 times).
                // - B represents the address bytes (1 byte, repeated 4 times).
                // - !B represents the inverted address bytes (1 byte, repeated 4 times).
                // The exclamation mark (!) indicates the bitwise inversion of the corresponding data.

                // Attempt to match the block against the expected value block format using a regular expression.
                // The regex captures the following groups:
                // - Group 0: The first 4 bytes of value data (AA AA AA AA).
                // - Group 1: The next 4 bytes of inverted value data (!AA !AA !AA !AA).
                // - Group 2: The repeated 4 bytes of value data (AA AA AA AA).
                // - Group 3: The first address byte (BB).
                // - Group 4: The inverted address byte (!BB).
                // - Group 5: The repeated address byte (BB).
                // - Group 6: The repeated inverted address byte (!BB).
                const ValueBlock = block.match(/^([A-F0-9]{8})([A-F0-9]{8})([A-F0-9]{8})([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})$/).slice(1);

                // Invert the value data (Group 1) to check if it matches the inverted value data.
                // Convert the hexadecimal string to binary, perform a bitwise XOR with 0xFF to invert the bits,
                // and then convert the result back to a hexadecimal string.
                ValueBlock[1] = ValueBlock[1]
                    .match(/.{1,2}/g) // Split the string into an array of 2-character hex bytes.
                    .map(hex2bin) // Convert each hex byte to an 8-bit binary string.
                    .map(byte => parseInt(byte, 2) ^ 0xFF) // Perform a bitwise XOR with 0xFF to invert the bits.
                    .map(byte => byte.toString(16).padStart(2, '0')) // Convert the result back to a 2-character hex string.
                    .join('') // Join the array back into a single string.
                    .toUpperCase(); // Convert the string to uppercase for consistency.

                // Flip the address bytes (Groups 4 and 6) to check if they match the inverted address bytes.
                // Perform a bitwise XOR with 0xFF to invert the bits and convert the result back to a hexadecimal string.
                ValueBlock[4] = (parseInt(ValueBlock[4], 16) ^ 0xFF).toString(16).padStart(2, '0').toUpperCase();
                ValueBlock[6] = (parseInt(ValueBlock[6], 16) ^ 0xFF).toString(16).padStart(2, '0').toUpperCase();

                // Check if the block matches the value block format by comparing the groups:
                // - Groups 0, 1, and 2 should all be identical (value data and its repetitions).
                // - Groups 3, 4, 5, and 6 should all be identical (address data and its repetitions).
                const IsValueBlock = ValueBlock[0] === ValueBlock[1] && ValueBlock[1] === ValueBlock[2] && // Value data matches.
                                     ValueBlock[3] === ValueBlock[4] && ValueBlock[4] === ValueBlock[5] && ValueBlock[5] === ValueBlock[6]; // Address data matches.

                // If the block matches the value block format, classify it as a "Value" block (type "V").
                // Otherwise, classify it as a "Data" block (type "D").
                Sector.dataTypes.push(IsValueBlock ? "V" : "D");

                // Parse the block data into a Uint8Array for storage.
                // Split the block into an array of 2-character hex bytes, convert each byte to an integer,
                // and create a Uint8Array from the resulting array.
                Sector.dataValues.push(new Uint8Array(block.match(/.{1,2}/g).map(byte => parseInt(byte, 16))));
            }
        });

        // Add the parsed sector to the FileJSON structure.
        FileJSON.sectors.push(Sector);
    });

    // Return the fully parsed JSON representation of the dump.
    return FileJSON;
}

/**
 * Converts a hexadecimal string to an 8-bit binary string.
 *
 * @param {string} hex - The hexadecimal string to convert.
 * @returns {string} The binary string representation of the input, padded to 8 bits.
 *
 * @see https://stackoverflow.com/a/45054052 - Credit to the original author.
 */
function hex2bin(hex) {
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

/**
 * Guesses the UID size based on SAK and ATQA values.
 *
 * @param {number|null} sak - The Select Acknowledge (SAK) value.
 * @param {Uint8Array|null} atqa - The Answer to Request (ATQA) value.
 * @returns {number|string} The guessed UID size (4, 7, or 10 bytes) or "unknown" if it cannot be determined.
 */
function guessUidSize(sak, atqa) {
    // First, check SAK value.
    if (sak === 0x08) {
        return 4; // Likely a 4-byte UID.
    } else if (sak === 0x18) {
        return 7; // Likely a 7-byte UID.
    } else {
        // SAK is ambiguous; use ATQA to help decide.
        // Assume atqa is a 2-byte array, and we use the LSByte (atqa[0]).
        // Extract bits 5-7 from the LSByte (bits are numbered 1-8 with bit1 as LSB).
        // For clarity, shift right by 4 to bring bits 5-7 to the lower bits and mask with 0x07.
        const uidIndicator = (atqa[0] >> 4) & 0x07;

        // Define expected patterns (these patterns are based on ISO/IEC 14443-3):
        const SINGLE_SIZE_PATTERN = 0b000; // (example: 4-byte UID).
        const DOUBLE_SIZE_PATTERN = 0b001; // (example: 7-byte UID).
        const TRIPLE_SIZE_PATTERN = 0b010; // (example: 10-byte UID).

        if (uidIndicator === SINGLE_SIZE_PATTERN) {
            return 4;
        } else if (uidIndicator === DOUBLE_SIZE_PATTERN) {
            return 7;
        } else if (uidIndicator === TRIPLE_SIZE_PATTERN) {
            return 10;
        } else {
            // Pattern does not match any known UID size indication.
            return "unknown";
        }
    }
}

export { DumpToJson };