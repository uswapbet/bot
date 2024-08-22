class TokenFetcher {
    constructor() {}

    async fetchTokenSettings() {
        try {
            const response = await axios.get('https://bet-json.github.io/info/info.json');            
            return response.data.token_setting;
        } catch (error) {
            console.error('Error fetching token settings:', error);
            return [];
        }
    }
}