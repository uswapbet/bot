class AccountChecker {
    constructor(sscConfig, tokenSymbol, betConfig) {
        this.ssc = sscConfig;
        this.tokenSymbol = tokenSymbol;
        this.betConfig = betConfig;
    }

    async betTokenAccount() {
        try {            
            const tokenData = this.betConfig.find(token => token.includes(this.tokenSymbol));            
            return tokenData ? tokenData[1] : null;
        } catch (error) {
            console.log("Error at betTokenAccount():", error);
            return null;
        }
    }

    async betAccBalance() {
        try {
            const accountInfo = await this.betTokenAccount();            
            if (accountInfo !== null) {
                // Correct the query structure
                const res = await this.ssc.find(
                    "tokens", 
                    "balances", 
                    { account: accountInfo, symbol: { "$in": [this.tokenSymbol] } }, // Correctly specify the account field
                    1000, 
                    0, 
                    []
                );
                const tokenBalance = res.find(el => el.symbol === this.tokenSymbol);
                const balance = tokenBalance ? parseFloat(tokenBalance.balance) : 0;
                const formattedBalance = balance.toFixed(3);
                return { accountInfo, formattedBalance };
            }
            return null;
        } catch (error) {
            console.log("Error at betAccBalance():", error);
            return null;
        }
    }
}