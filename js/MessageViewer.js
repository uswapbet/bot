class MessageViewer {
    constructor() {}

    async showMessageWithFade(elementId, message, color = 'rgb(3, 184, 48)', timeOutStatus = true, displayStatus = true, duration = 3000, fadeOutDuration = 1000) {
        try {
            const messageEl = document.getElementById(elementId);
            messageEl.textContent = message; 
            messageEl.style.color = color; // Set the font color
            messageEl.style.height = 'auto'; // Ensure height is auto to display content
            
            if(timeOutStatus && displayStatus) {
                messageEl.style.opacity = '1'; // Show the message with fade-in effect
                messageEl.style.visibility = 'visible';
                // Start fading out the message after the specified duration
                setTimeout(() => {
                    messageEl.style.opacity = '0'; // Fade out the message
                }, duration);
            
                // Hide the message completely after the fadeOutDuration
                setTimeout(() => {
                    messageEl.style.visibility = 'hidden';
                }, duration + fadeOutDuration);
            } else if (!timeOutStatus && displayStatus) {
                messageEl.style.opacity = '1'; // Show the message with fade-in effect
                messageEl.style.visibility = 'visible';
            } else if(!timeOutStatus && !displayStatus) {
                messageEl.style.opacity = '0';
                messageEl.style.visibility = 'hidden';
            } else {
                messageEl.style.visibility = 'hidden';
            }           
        } catch (error) {
            console.log("Error at showMessageWithFade():", error);    
        }        
    } 
}