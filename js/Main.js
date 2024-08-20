class MainClass {
    constructor() {
        this.rpc_nodes = [
            "https://api.deathwing.me",
            "https://hive.roelandp.nl",
            "https://api.openhive.network",
            "https://rpc.ausbit.dev",
            "https://hived.emre.sh",
            "https://hive-api.arcange.eu",
            "https://api.hive.blog",
            "https://api.c0ff33a.uk",
            "https://rpc.ecency.com",
            "https://anyx.io",
            "https://techcoderx.com",
            "https://api.hive.blue",
            "https://rpc.mahdiyari.info"
        ];

        this.apiChecker = new ApiChecker();
        this.ssc = null; // Initialize SSC later
        this.engine_node = null; // Initialize engine_node later       

        this.maxToken = 0;
        this.minToken = 0;
        this.refreshInterval = null; // Store the interval ID
    }

    async init() {
        this.engine_node = await this.apiChecker.checkApi();        
        this.ssc = new SSC(this.engine_node || "https://engine.beeswap.tools");

        // Initialize event listeners
        this.initializeEventListeners();

        // Start auto-refresh of token balance
        this.startAutoRefresh();
    }

    initializeEventListeners() {
        document.getElementById('token-symbol').addEventListener('change', () => this.handleTokenSelection());
        document.getElementById('username').addEventListener('input', () => this.handleTokenSelection());
        document.getElementById('bet-amount').addEventListener('input', () => this.validateBetAmount());
        document.getElementById('refresh-balance').addEventListener('click', () => this.refreshTokenBalance());
        
        this.initializeBetButtons();
        this.checkKeychain();
        this.loadTokenInfo(document.getElementById('token-symbol').value);
    }

    async fetchTokenSettings() {
        try {
            const response = await axios.get('https://bet-json.github.io/info/info.json');            
            return response.data.token_setting;
        } catch (error) {
            console.error('Error fetching token settings:', error);
            return [];
        }
    }

    async loadTokenInfo(tokenSymbol) {
        try {
            const fetchSetting = await this.fetchTokenSettings();
            const tokenData = fetchSetting.find(token => token.includes(tokenSymbol)); 
            if (tokenData) {
                this.minToken = tokenData[1];
                this.maxToken = tokenData[2];
            } else {
                console.error('Token data not found for the selected token symbol.');                
            }
        } catch (error) {
            console.error('Error at loadTokenInfo():', error);
        }
    }

    async initializeBetButtons() {
        const highBtn = document.querySelector(".high-btn");
        const lowBtn = document.querySelector(".low-btn");
        const memoMessage = document.getElementById("memo-message");
    
        highBtn.addEventListener("click", async () => {
            memoMessage.value = "{bet_status: H}";
            await this.sendTokens();  // Trigger the sendTokens() function
        });
    
        lowBtn.addEventListener("click", async () => {
            memoMessage.value = "{bet_status: L}";
            await this.sendTokens();  // Trigger the sendTokens() function
        });
    }   

    async checkKeychain() {
        if (window.hive_keychain) {
            console.log("Hive Keychain is available");
        } else {
            console.error("Hive Keychain is not available");
        }
    }

    async getTokenBalance(account, selectedTokenSymbol) {
        try {
            const res = await this.ssc.find("tokens", "balances", { account, symbol: { "$in": [selectedTokenSymbol] } }, 1000, 0, []);
            const tokenBalance = res.find(el => el.symbol === selectedTokenSymbol);
            const balance = tokenBalance ? parseFloat(tokenBalance.balance.split(" ")[0]) : 0;
            const formattedBalance = balance.toFixed(3);
            return {
                [selectedTokenSymbol]: formattedBalance
            };
        } catch (error) {
            console.error("Error fetching token balance:", error);
            return {
                [selectedTokenSymbol]: 0
            };
        }
    }

    async handleTokenSelection() {
        const selectedTokenSymbol = document.getElementById('token-symbol').value;
        const account = document.getElementById('username').value;

        if (!account) {
            console.error("Account name is required.");
            return;
        }

        try {
            await this.loadTokenInfo(selectedTokenSymbol);
            console.log(`Selected Token: ${selectedTokenSymbol}, Min: ${this.minToken}, Max: ${this.maxToken}`);

            const balance = await this.getTokenBalance(account, selectedTokenSymbol);            

            document.getElementById('token-balance').value = balance[selectedTokenSymbol];
            this.validateBetAmount();  // Validate bet amount after token selection
        } catch (error) {
            console.error("Error handling token selection:", error);
        }
    }

    async validateBetAmount() {
        try {
            const betAmountEl = document.getElementById('bet-amount');
            const betAmountErrorEl = document.getElementById('bet-amount-error');
            const amount = parseFloat(betAmountEl.value);            
    
            if (isNaN(amount)) {
                betAmountErrorEl.style.display = 'none'; // Hide error if input is not a number
                betAmountEl.removeAttribute('readonly'); // Make bet-amount editable
                await this.setBetButtonsEnabled(false);
                return;
            }
    
            if (amount < this.minToken || amount > this.maxToken) {
                betAmountErrorEl.textContent = `* Bet amount must be between ${this.minToken} and ${this.maxToken}.`;
                betAmountErrorEl.style.display = 'block'; // Show error message
                await this.setBetButtonsEnabled(false);
            } else {
                betAmountErrorEl.style.display = 'none'; // Hide error message
                betAmountEl.removeAttribute('readonly'); // Make bet-amount editable
                await this.setBetButtonsEnabled(true);
            }        
        } catch (error) {
            console.log("Error at validateBetAmount():", error);
        }
    }
    
    async refreshTokenBalance() {
        const selectedTokenSymbol = document.getElementById('token-symbol').value;
        const account = document.getElementById('username').value;
    
        if (!account) {
            console.error("Account name is required.");
            return;
        }
    
        try {
            await this.loadTokenInfo(selectedTokenSymbol);
            const balance = await this.getTokenBalance(account, selectedTokenSymbol);
            document.getElementById('token-balance').value = balance[selectedTokenSymbol];            
        } catch (error) {
            console.error("Error refreshing token balance:", error);
        }
    }

    async setBetButtonsEnabled(enabled) {
        const highBtn = document.querySelector(".high-btn");
        const lowBtn = document.querySelector(".low-btn");

        highBtn.disabled = !enabled;
        lowBtn.disabled = !enabled;
    }

    async getDecimal(val) {
        return Math.floor(val * 1000) / 1000;
    }

    async sendTokens() {
        const username = document.getElementById('username').value;
        const tokenSymbol = document.getElementById('token-symbol').value;
        const amount = parseFloat(document.getElementById('bet-amount').value);
        const memo = document.getElementById('memo-message').value;

        if (!username || !tokenSymbol || isNaN(amount)) {
            console.error("All fields are required and amount must be a number.");
            return;
        }

        let formattedAmount = await this.getDecimal(amount);

        try {
            if (window.hive_keychain) {
                window.hive_keychain.requestSendToken(username, "asimo", formattedAmount.toFixed(3), memo, tokenSymbol, async (response) => {
                    if (response.success && response.result) {
                        let transactionId = response.result.tx_id;

                        document.getElementById('transaction-id').value = transactionId;

                        let hashBlock = await this.hashBlockAddup(transactionId);
                        if (hashBlock) {
                            document.getElementById('hash-id').value = hashBlock.hash;
                            document.getElementById('block-id').value = hashBlock.blockNumber;

                            let calcNumber = await this.calculateNumber(hashBlock.blockNumber, transactionId, hashBlock.hash);
                            if (calcNumber !== null) {
                                document.getElementById('draw-number').value = calcNumber;

                                let betMemo = await this.checkMemo(memo);
                                if (Object.keys(betMemo).length > 0 && betMemo.bet_status !== null && betMemo.bet_status !== undefined) {
                                    let betStatus = await this.statusProcessor(calcNumber, betMemo.bet_status);
                                    document.getElementById('bet-status').value = (betStatus) ? 'Win' : 'Loss';

                                    await this.handleTokenSelection();
                                }
                            }
                        }
                    } else {
                        console.error("Error sending token:", response.message);
                    }
                });
            } else {
                console.error("Hive Keychain is not available.");
            }
        } catch (error) {
            console.error("Error sending tokens:", error);
        }
    }

    async hashBlockAddup(transactionId) {
        try {
            return await this.ssc.getTransactionInfo(transactionId);
        } catch (error) {
            console.error("Error at hashBlockAddup():", error);
            return null;
        }
    }

    async calculateNumber(heBlock, heTransactionId, hash) {
        try {
            // Combine the block number, transaction ID, and hash into a single string
            const combined = `${heBlock}${heTransactionId}${hash}`;
            
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
            console.error("Error at calculateNumber():", error);
            return null;
        }
    }    

    async checkMemo(memoDetails) {
        let memoJson = {};
        try {
            let keyValuePairs = memoDetails.replace(/{|}/g, '').split(',');
            keyValuePairs.forEach(pair => {
                let [key, value] = pair.split(':');
                memoJson[key.trim()] = value.trim();
            });
            return memoJson;
        } catch (error) {
            console.error("Error parsing memoDetails:", error);
            return memoJson;
        }
    }

    async statusProcessor(winnerNumber, betStatus) {
        try {
            if (!Number.isInteger(winnerNumber) || winnerNumber < 0 || winnerNumber > 9) {
                console.error("Invalid winnerNumber:", winnerNumber);
                return null;
            }

            const set = (winnerNumber >= 0 && winnerNumber <= 4) ? 'L' : 'H';
            const isWin = set === betStatus;

            console.log(`Winner Number: ${winnerNumber}, Set: ${set}, Bet Status: ${betStatus}, Result: ${isWin ? 'Win' : 'Lose'}`);
            return isWin;
        } catch (error) {
            console.error("Error at statusProcessor():", error);
            return null;
        }
    }

    async startAutoRefresh(interval = 60000) { // Default to 60000 ms (1 minute)
        try {            
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval); // Clear any existing interval
            }
            this.refreshInterval = setInterval(() => {                
                this.refreshTokenBalance();                
            }, interval);
        } catch (error) {
            console.log("Error at startAutoRefresh():", error);    
        }        
    }

    async stopAutoRefresh() {
        try {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval); // Stop the interval
                this.refreshInterval = null;
            }    
        } catch (error) {
            console.log("Error at stopAutoRefresh():", error);    
        }        
    }
}