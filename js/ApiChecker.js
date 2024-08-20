// ApiChecker.js
class ApiChecker {
    constructor() {
        this.he_rpc_nodes = [
            "https://api.primersion.com",            
            "https://engine.rishipanthee.com/",
            "https://engine.beeswap.tools",
            "https://ha.herpc.dtools.dev/",            
            "https://herpc.actifit.io",
            "https://herpc.dtools.dev",
            "https://api2.hive-engine.com/rpc",
            "https://api.hive-engine.com/rpc"
        ];
    }

    async checkApi() {
        for (const url of this.he_rpc_nodes) {
            try {
                const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });                
                if (response.ok && response.status === 200) {
                    // Return the URL if the response is OK (status in the range 200-299)
                    return url;
                }
            } catch (error) {
                console.error(`Failed to fetch ${url}:`, error);
            }
        }
        // Return null if no working API was found
        return null;
    }
}
