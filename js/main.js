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

        this.he_rpc_nodes = [
            "https://api.primersion.com",
            "https://api2.hive-engine.com/rpc",
            "https://engine.rishipanthee.com/",
            "https://engine.beeswap.tools",
            "https://ha.herpc.dtools.dev/",
            "https://api.hive-engine.com/rpc",
            "https://herpc.actifit.io",
            "https://herpc.dtools.dev"
        ];

        this.ssc = new SSC(this.he_rpc_nodes[2]);

        // Initialize event listeners
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('token-symbol').addEventListener('change', () => this.handleTokenSelection());
        document.getElementById('username').addEventListener('input', () => this.handleTokenSelection());
        
        this.initializeBetButtons();
        this.checkKeychain();
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
            const balance = await this.getTokenBalance(account, selectedTokenSymbol);
            console.log("Token Balance:", balance);

            document.getElementById('token-balance').value = balance[selectedTokenSymbol];
        } catch (error) {
            console.error("Error handling token selection:", error);
        }
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
            const combined = `${heBlock}${heTransactionId}${hash}`;
            const digits = combined.split('').map(char => parseInt(char)).filter(Number.isInteger);
            const sum = digits.reduce((acc, digit) => acc + digit, 0);
            console.log("Sum of Digits:", sum);
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
}