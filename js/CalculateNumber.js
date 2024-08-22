class CalculateNumber {
    constructor() {}

    async calcNumber(heBlock, heTransactionId, hash) {
        try {
            console.log("heBlock:", heBlock);
            console.log("heTransactionId:", heTransactionId);
            console.log("hash:", hash);
            // Combine the block number, transaction ID, and hash into a single string
            const combined = `${heTransactionId}${hash}`;
            
            // Map each character in the string to a digit or letter value
            const digits = combined.split('').map(char => {
                if (/[a-zA-Z]/.test(char)) {
                    // Convert letters to their corresponding number (a=1, b=2, ..., z=26)
                    return char.toLowerCase().charCodeAt(0) - 96;
                } else if (/[0-9]/.test(char)) {
                    // Convert digits to integers directly
                    return parseInt(char, 10);
                } else {
                    // Ignore non-alphanumeric characters
                    return 0;
                }
            });
    
            // Filter out any invalid or zero values
            const validDigits = digits.filter(digit => digit > 0);
    
            // Sum up all valid digit values
            const sum = validDigits.reduce((acc, digit) => acc + digit, 0);
            console.log("Sum of Digits:", sum);
    
            // Return the final number as sum % 10
            return sum % 10;
        } catch (error) {
            console.error("Error at calcNumber():", error);
            return null;
        }
    }
}