const rpc_nodes = [
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

const he_rpc_nodes = [
    "https://api.primersion.com",	
    "https://api2.hive-engine.com/rpc",	
    "https://engine.rishipanthee.com/",
    "https://engine.beeswap.tools",				
    "https://ha.herpc.dtools.dev/",			 
    "https://api.hive-engine.com/rpc",
    "https://herpc.actifit.io",
    "https://herpc.dtools.dev"
]; 

const ssc = new SSC(he_rpc_nodes[0]);

$(window).bind("load", function () {
    async function initializeBetButtons() {
        const highBtn = document.querySelector(".high-btn");
        const lowBtn = document.querySelector(".low-btn");
        const memoMessage = document.getElementById("memo-message");

        highBtn.addEventListener("click", function () {
            memoMessage.value = "{bet_status: H}";
        });

        lowBtn.addEventListener("click", function () {
            memoMessage.value = "{bet_status: L}";
        });
    }

    async function checkKeychain() {
        if (window.hive_keychain) {
            console.log("Hive Keychain is available");
        } else {
            console.error("Hive Keychain is not available");
        }
    }

    async function getTokenBalance(account, selectedTokenSymbol) {
        try {
            const res = await ssc.find("tokens", "balances", { account, symbol: { "$in": [selectedTokenSymbol] } }, 1000, 0, []);
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

    async function handleTokenSelection() {
        const selectedTokenSymbol = document.getElementById('token-symbol').value;
        const account = document.getElementById('username').value; // Get the account name from the input field
        
        if (!account) {
            console.error("Account name is required.");
            return;
        }
        
        try {
            const balance = await getTokenBalance(account, selectedTokenSymbol);
            console.log("Token Balance:", balance);
            
            // Update the token balance display
            document.getElementById('token-balance').value = balance[selectedTokenSymbol];
        } catch (error) {
            console.error("Error handling token selection:", error);
        }
    } 
    
    async function getDecimal(val) {
        return Math.floor(val * 1000) / 1000;
    };

    async function sendTokens() {
        const username = document.getElementById('username').value;
        const tokenSymbol = document.getElementById('token-symbol').value;
        const amount = parseFloat(document.getElementById('bet-amount').value);
        const memo = document.getElementById('memo-message').value;

        if (!username || !tokenSymbol || isNaN(amount)) {
            console.error("All fields are required and amount must be a number.");
            return;
        }

        let formattedAmount = await getDecimal(amount); // Format amount with 3 decimal places        
        
        try {
            if (window.hive_keychain) {
                window.hive_keychain.requestSendToken(username, "asimo", formattedAmount.toFixed(3), memo, tokenSymbol, async function (response) {
                    if (response.success && response.result) {
                        let transactionId = response.result.tx_id;
                        
                        // Update the transaction ID input field with the transaction ID from the response
                        const transactionIdField = document.getElementById('transaction-id');
                        transactionIdField.value = transactionId;

                        let hashBlock = await hashBlockAddup(transactionId);
                        if(hashBlock) {
                            const hashIdField = document.getElementById('hash-id');
                            hashIdField.value = hashBlock.hash;

                            const blockIdField = document.getElementById('block-id');
                            blockIdField.value = hashBlock.blockNumber;

                            const calcNumber = await calculateNumber(hashBlock.blockNumber, transactionId, hashBlock.hash);
                            if(calcNumber !== null) {
                                const drawNumberField = document.getElementById('draw-number');
                                drawNumberField.value = calcNumber;

                                let betMemo = await checkMemo(memo);                                
                                if (Object.keys(betMemo).length > 0 
                                                && betMemo.bet_status !== null 
                                                && betMemo.bet_status !== undefined) {
                                    let betStatus = await statusProcessor(calcNumber, betMemo.bet_status);
                                    const betStatusField = document.getElementById('bet-status');
                                    betStatusField.value = (betStatus) ? 'Win' : 'Loss';

                                    await handleTokenSelection();
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

    async function hashBlockAddup(transactionId) {
        try {
            return await ssc.getTransactionInfo(transactionId);                     
        } catch (error) {
            console.error("Error at hashBlockAddup():", error);
            return null;
        }
    }

    async function calculateNumber(heBlock, heTransactionId, hash) {
        try {
            // Combine all parameters into a single string
            const combined = `${heBlock}${heTransactionId}${hash}`;
                        
            // Extract digits from the combined string and convert them to an array of numbers
            const digits = combined.split('').map(char => parseInt(char)).filter(Number.isInteger);
                        
            // Sum all the digits
            const sum = digits.reduce((acc, digit) => acc + digit, 0);
            console.log("Sum of Digits:", sum); // Debug: Check the sum of digits
            
            // Calculate sum % 10
            const result = sum % 10;
            
            return result;
        } catch (error) {
            console.error("Error at calculateNumber():", error);
            return null;
        }
    }

    async function checkMemo(memoDetails) {
        let memoJson = {};
        try {
            // Remove the curly braces and split the string by comma
            let keyValuePairs = memoDetails.replace(/{|}/g, '').split(',');

            // Iterate over each key-value pair and add it to the memoJson object
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

    async function statusProcessor(winnerNumber, betStatus) {
        try {
            // Validate that winnerNumber is an integer between 0 and 9
            if (!Number.isInteger(winnerNumber) || winnerNumber < 0 || winnerNumber > 9) {
                console.error("Invalid winnerNumber:", winnerNumber);
                return null;
            }

            // Determine the set based on the winnerNumber
            const set = (winnerNumber >= 0 && winnerNumber <= 4) ? 'L' : 'H';

            // Check if the betStatus matches the determined set
            const isWin = set === betStatus;

            // Log the result
            console.log(`Winner Number: ${winnerNumber}, Set: ${set}, Bet Status: ${betStatus}, Result: ${isWin ? 'Win' : 'Lose'}`);

            // Return true if the bet is won, otherwise return false
            return isWin;
        } catch (error) {
            console.error("Error at statusProcessor():", error);
            return null;
        }
    }

    document.getElementById('token-symbol').addEventListener('change', handleTokenSelection);
    document.getElementById('username').addEventListener('input', handleTokenSelection);
    document.querySelector('.submit-btn').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent form submission if it's a form element
        sendTokens();
    });

    initializeBetButtons();
    checkKeychain();
});