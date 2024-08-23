class Popup {
    constructor(sscConfig, tokenSymbol) {
        this.ssc = sscConfig;
        this.tokenSymbol = tokenSymbol;
        this.popupPanel = document.getElementById('popup-panel');
        this.initializeEvents();

        this.tokenFetcher = new TokenFetcher(); 
        this.messageViewer = new MessageViewer();       
    }

    initializeEvents() {
        // Open Pop-Up
        document.getElementById('open-popup-btn').addEventListener('click', () => {
            this.clearInputs();
            this.show();
        });
        // Close Pop-Up
        document.getElementById('close-popup').addEventListener('click', () => {
            this.hide();
        });
        // Close Pop-Up when clicking outside the content
        window.addEventListener('click', (event) => {
            if (event.target === this.popupPanel) {
                this.hide();
            }
        });
        // Clear Inputs
        document.getElementById('clear-inputs-btn').addEventListener('click', () => {
            this.clearInputs();
        });
        // Check Draw
        document.getElementById('check-draw-btn').addEventListener('click', () => {
            this.checkDraw();
        });
        // Listen for changes in the transaction ID input
        document.getElementById('input-transaction-id').addEventListener('input', () => {
            this.clearRelatedFields();
        });
    }

    async show() {
        this.popupPanel.classList.add('show-popup');
    }

    async hide() {
        this.popupPanel.classList.remove('show-popup');
    }

    async clearInputs() {
        document.getElementById('input-block-id').value = '';
        document.getElementById('input-transaction-id').value = '';
        document.getElementById('input-hash-id').value = '';
        document.getElementById('input-draw-number').value = '';
        this.resetPopupInfo();
    }

    clearRelatedFields() {
        document.getElementById('input-block-id').value = '';
        document.getElementById('input-hash-id').value = '';
        document.getElementById('input-draw-number').value = '';
        this.resetPopupInfo();
    }

    async checkDraw() {
        const transactionIdEl = document.getElementById('input-transaction-id').value;
        if (transactionIdEl) {
            await this.getTransactionInfo();
        } else {
            this.resetPopupInfo();
        }
    }

    async getTransactionInfo() {
        try {
            const transactionId = document.getElementById('input-transaction-id').value;
            const result = await this.ssc.getTransactionInfo(transactionId);

            if (result) {
                const { blockNumber, payload, hash, logs } = result;

                const parsedPayload = JSON.parse(payload);
                const parsedLogs = JSON.parse(logs);

                if (parsedLogs && !parsedLogs.errors && parsedLogs.events?.length > 0) {
                    const fetchData = await this.tokenFetcher.fetchTokenSettings();
                    if (fetchData.length > 0) {
                        const accountChecker = new AccountChecker(this.ssc, this.tokenSymbol, fetchData);
                        const accData = await accountChecker.betTokenAccount();
                        if (accData !== null) {
                            if (parsedPayload.symbol === this.tokenSymbol && parsedPayload.to === accData) {
                                const calculateNumber = new CalculateNumber();
                                const calcNumber = await calculateNumber.calcNumber(blockNumber, transactionId, hash);
                                if (calcNumber !== null) {
                                    document.getElementById('input-block-id').value = blockNumber;
                                    document.getElementById('input-hash-id').value = hash;
                                    document.getElementById('input-draw-number').value = calcNumber;
                                    this.resetPopupInfo();
                                } else {
                                    let errMsg = "Draw number generator makes error, please try again...";
                                    await this.popUpErrorInfo(errMsg);
                                }
                            } else {
                                let errMsg = "Token name or Sender name mismatch, please check again...";
                                await this.popUpErrorInfo(errMsg);
                            }
                        } else {
                            let errMsg = "Sender name generator makes error, please try again...";
                            await this.popUpErrorInfo(errMsg);
                        }
                    } else {
                        let errMsg = "Encounter an error, please try again...";
                        await this.popUpErrorInfo(errMsg);
                    }
                } else {
                    let errMsg = "Encounter an error, please try again...";
                    await this.popUpErrorInfo(errMsg);
                }
            } else {
                let errMsg = "Encounter an error, please try again...";
                await this.popUpErrorInfo(errMsg);
            }

        } catch (error) {
            console.log("Error at getTransactionInfo():", error);
            let errMsg = "Encounter an error, please try again...";
            await this.popUpErrorInfo(errMsg);
        }
    }

    async popUpErrorInfo(errMsg, errorStatus = true) {
        try {
            await this.messageViewer.showMessageWithFade('popup-process-info',
                errMsg, 'red', false, errorStatus);
        } catch (error) {
            console.log("Error at popUpErrorInfo():", error);
        }
    }

    resetPopupInfo() {
        document.getElementById('popup-process-info').style.visibility = 'hidden';
        document.getElementById('popup-process-info').style.opacity = '0';
    }
}